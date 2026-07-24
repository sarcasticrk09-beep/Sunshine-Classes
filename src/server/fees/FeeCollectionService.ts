import { collection, doc, getDoc, getDocs, setDoc } from '../shared/db';
import { TransactionManager } from '../shared/TransactionManager';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { PaymentProviderFactory } from './PaymentProvider';
import { FeePayment, PaymentVerification, FeeReceipt } from '../../types';
import { ReceiptService } from './ReceiptService';
import { ReminderService } from '../reminders/ReminderService';

export class FeeCollectionService {
  /**
   * Generates a sequential unique receipt number: RCP-YYYY-XXXXXX
   */
  private static async generateReceiptNumber(db: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `RCP-${currentYear}-`;
    try {
      const snap = await getDocs(collection(db, 'fee_receipts'));
      let maxSeq = 0;
      snap.docs.forEach((d: any) => {
        const id = d.id;
        if (id.startsWith(prefix)) {
          const seqStr = id.substring(prefix.length);
          const seq = parseInt(seqStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        } else if (id.startsWith('REC-')) {
          // Backward compatibility
          const parts = id.split('-');
          const lastPart = parts[parts.length - 1];
          const seq = parseInt(lastPart, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      });
      const nextSeq = maxSeq + 1;
      return `${prefix}${String(nextSeq).padStart(6, '0')}`;
    } catch (e) {
      return `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
    }
  }

  /**
   * Helper to fetch student monthly fee records, sorted by monthVal ascending.
   */
  public static async getOutstandingFeeRecords(studentId: string, db: any): Promise<any[]> {
    const snap = await getDocs(collection(db, 'student_monthly_fees'));
    return snap.docs
      .map((d: any) => d.data())
      .filter((f: any) => f.studentId === studentId && f.status !== 'PAID')
      .sort((a: any, b: any) => a.monthVal - b.monthVal);
  }

  /**
   * Checks for duplicate transaction ID in both fee_payments and non-rejected payment_verifications.
   */
  public static async checkDuplicateTransactionId(transactionId: string, db: any): Promise<boolean> {
    if (!transactionId) return false;
    const cleanTxId = transactionId.trim().toUpperCase();

    // 1. Check payments
    const paymentsSnap = await getDocs(collection(db, 'fee_payments'));
    const paymentDup = paymentsSnap.docs.some((d: any) => {
      const p = d.data();
      return p.transactionId && p.transactionId.trim().toUpperCase() === cleanTxId && p.status === 'SUCCESS';
    });
    if (paymentDup) return true;

    // 2. Check verifications (excluding REJECTED ones)
    const verificationsSnap = await getDocs(collection(db, 'payment_verifications'));
    const verificationDup = verificationsSnap.docs.some((d: any) => {
      const v = d.data();
      return v.transactionId && v.transactionId.trim().toUpperCase() === cleanTxId && v.status !== 'REJECTED';
    });
    return verificationDup;
  }

  /**
   * Collects payment in CASH immediately (Instant processing, FIFO-enforced, No Partial Payment, Transactional)
   */
  public static async collectCashPayment(
    studentId: string,
    feeRecordIds: string[],
    amount: number,
    remarks: string,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ) {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';
    const userRole = currentUser?.role || 'ADMIN';
    const nowIso = new Date().toISOString();

    if (!feeRecordIds || feeRecordIds.length === 0) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'No monthly fee records specified for payment.' };
    }

    return await TransactionManager.run(db, 'COLLECT_CASH_PAYMENT', async (transaction) => {
      const receiptNumber = await ReceiptService.generateReceiptNumber(transaction, db);

      // 1. Fetch student to verify existence
      const studentDoc = await transaction.get(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        throw new Error('Student record not found.');
      }
      const studentData = studentDoc.data();

      // 2. Fetch outstanding fee records to verify FIFO and amounts
      const outstanding = await this.getOutstandingFeeRecords(studentId, db);
      if (outstanding.length === 0) {
        throw new Error('No outstanding fees found for this student.');
      }

      // Enforce FIFO: the requested feeRecordIds must match the exact oldest sequential outstanding records
      for (let i = 0; i < feeRecordIds.length; i++) {
        if (!outstanding[i] || outstanding[i].id !== feeRecordIds[i]) {
          throw new Error('FIFO violation: You must pay the oldest outstanding monthly fees first.');
        }
      }

      // Enforce No Partial Payment: sum of pendingFee must match requested amount exactly
      let calculatedSum = 0;
      const breakdown: any[] = [];
      const recordsToUpdate: any[] = [];

      for (const recordId of feeRecordIds) {
        const record = outstanding.find(r => r.id === recordId);
        if (!record) {
          throw new Error(`Fee record ${recordId} not found among student's outstanding fees.`);
        }
        calculatedSum += record.pendingFee;
        breakdown.push({
          month: record.month,
          baseFee: record.baseFee,
          discountApplied: record.discountApplied || 0,
          amountPaid: record.pendingFee
        });
        recordsToUpdate.push(record);
      }

      if (amount !== calculatedSum) {
        throw new Error(`Amount mismatch: Expected ₹${calculatedSum} for specified month(s) but received ₹${amount}. Partial payments are not allowed.`);
      }

      const paymentId = `pmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 3. Update the monthly fee records to PAID status in transaction
      for (const record of recordsToUpdate) {
        const recordRef = doc(db, 'student_monthly_fees', record.id);
        const updatedRecord = {
          ...record,
          paidFee: record.totalFee,
          pendingFee: 0,
          status: 'PAID',
          updatedAt: nowIso
        };
        transaction.set(recordRef, updatedRecord);
      }

      // 4. Create FeePayment record
      const paymentRecord: FeePayment = {
        id: paymentId,
        studentId,
        studentName: studentData.name,
        rollNo: studentData.rollNo || '',
        class: studentData.class || '',
        preferredBatch: studentData.preferredBatch || '',
        paymentMode: 'CASH',
        provider: 'MANUAL',
        amountPaid: amount,
        monthsPaid: recordsToUpdate.map(r => r.month),
        feeRecordIds,
        receiptNumber,
        status: 'SUCCESS',
        remarks: remarks || 'Collected in cash.',
        collectedBy: username,
        collectedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      transaction.set(doc(db, 'fee_payments', paymentId), paymentRecord);

      // Derive FM-004 specific fields
      const receiptId = receiptNumber;
      const months = recordsToUpdate.map(r => r.month);
      const billingMonth = months.join(', ') || 'N/A';
      let billingYear = String(new Date().getFullYear());
      if (months.length > 0) {
        const match = months[0].match(/\d{4}/);
        if (match) billingYear = match[0];
      }
      const verificationHash = ReceiptService.generateVerificationHash(receiptId, paymentId);

      // 5. Create FeeReceipt record with all detailed and FM-004 fields
      const receiptRecord: FeeReceipt = {
        id: receiptNumber,
        receiptId,
        receiptNumber,
        paymentId,
        studentId,
        studentName: studentData.name,
        rollNo: studentData.rollNo || '',
        rollNumber: studentData.rollNo || '',
        class: studentData.class || '',
        className: studentData.class || '',
        preferredBatch: studentData.preferredBatch || '',
        paymentMode: 'CASH',
        paymentMethod: 'CASH',
        amount,
        amountPaid: amount,
        monthsCovered: months,
        breakdown,
        generatedBy: username,
        generatedAt: nowIso,
        createdAt: nowIso,
        billingMonth,
        billingYear,
        issuedBy: username,
        issuedAt: nowIso,
        verificationHash,
        status: 'VALID'
      };
      transaction.set(doc(db, 'fee_receipts', receiptNumber), receiptRecord);

      // 6. Record transaction-bound Audit and Timeline entries
      AuditService.logInTransaction(
        transaction,
        db,
        userId,
        username,
        'FEE_COLLECTED_CASH',
        `Collected cash payment of ₹${amount} from student ${studentData.name} (${studentData.rollNo}) for ${paymentRecord.monthsPaid.join(', ')}.`,
        ip,
        device
      );

      TimelineService.recordInTransaction(
        transaction,
        db,
        studentId,
        'FEE_COLLECTED_CASH',
        '💳 Fee Paid (Cash)',
        `Fee of ₹${amount} paid fully in cash. Receipt generated: ${receiptNumber}.`,
        username,
        userRole
      );

      // 7. Publish Domain Events in Transaction
      EventPublisher.publishInTransaction(transaction, db, 'PaymentSubmitted', {
        studentId,
        amount,
        paymentMode: 'CASH',
        months: paymentRecord.monthsPaid,
        submittedBy: username
      });

      EventPublisher.publishInTransaction(transaction, db, 'PaymentApproved', {
        studentId,
        amount,
        paymentMode: 'CASH',
        months: paymentRecord.monthsPaid,
        approvedBy: username
      });

      EventPublisher.publishInTransaction(transaction, db, 'FeeCollected', {
        studentId,
        amount,
        paymentMode: 'CASH',
        monthsPaid: paymentRecord.monthsPaid,
        receiptNumber
      });

      EventPublisher.publishInTransaction(transaction, db, 'ReceiptGenerated', {
        studentId,
        receiptNumber,
        amount,
        monthsCovered: paymentRecord.monthsPaid
      });

      const result = {
        success: true,
        message: 'Cash payment collected and receipt generated successfully.',
        data: {
          payment: paymentRecord,
          receipt: receiptRecord
        }
      };

      // Cancel pending fee reminders for paid fees
      for (const feeId of feeRecordIds) {
        ReminderService.cancelPendingRemindersForFee(db, feeId).catch(err => {
          console.error(`[FeeCollectionService] Non-blocking error cancelling reminders for fee ${feeId}:`, err);
        });
      }

      return result;
    });
  }

  /**
   * Submits a non-cash payment (UPI, Bank Transfer, Cheque) to the Admin Verification Queue.
   * Enforces FIFO, No Partial Payment, and Duplicate Transaction ID checks.
   */
  public static async submitPaymentVerification(
    studentId: string,
    feeRecordIds: string[],
    amount: number,
    paymentMode: 'UPI' | 'BANK_TRANSFER' | 'CHEQUE',
    transactionId: string,
    proofUrl: string | undefined,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ) {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';
    const userRole = currentUser?.role || 'ADMIN';
    const nowIso = new Date().toISOString();

    if (!feeRecordIds || feeRecordIds.length === 0) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'No monthly fee records specified for payment.' };
    }

    if (!transactionId || transactionId.trim() === '') {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'Transaction ID / Reference Number is required for non-cash payments.' };
    }

    // Duplicate transaction ID prevention
    const isDup = await this.checkDuplicateTransactionId(transactionId, db);
    if (isDup) {
      return { success: false, statusCode: 400, code: 'DUPLICATE_TRANSACTION', message: 'This transaction reference number has already been submitted or approved.' };
    }

    // Fetch student to verify existence
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
    }
    const studentData = studentDoc.data();

    // Fetch outstanding fee records to verify FIFO and amounts
    const outstanding = await this.getOutstandingFeeRecords(studentId, db);
    if (outstanding.length === 0) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'No outstanding fees found for this student.' };
    }

    // Enforce FIFO: the requested feeRecordIds must match the exact oldest sequential outstanding records
    for (let i = 0; i < feeRecordIds.length; i++) {
      if (!outstanding[i] || outstanding[i].id !== feeRecordIds[i]) {
        return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'FIFO violation: You must pay the oldest outstanding monthly fees first.' };
      }
    }

    // Enforce No Partial Payment: sum of pendingFee must match requested amount exactly
    let calculatedSum = 0;
    const monthsToPay: string[] = [];
    for (const recordId of feeRecordIds) {
      const record = outstanding.find(r => r.id === recordId);
      if (!record) {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: `Fee record ${recordId} not found among student's outstanding fees.` };
      }
      calculatedSum += record.pendingFee;
      monthsToPay.push(record.month);
    }

    if (amount !== calculatedSum) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: `Amount mismatch: Expected ₹${calculatedSum} for specified month(s) but received ₹${amount}. Partial payments are not allowed.` };
    }

    // Initiate provider flow
    const provider = PaymentProviderFactory.getProvider('MANUAL');
    const initiationResult = await provider.initiatePayment(amount, {
      studentId,
      studentName: studentData.name,
      month: monthsToPay.join(', ')
    });

    const verificationId = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const verificationRecord: PaymentVerification = {
      id: verificationId,
      studentId,
      studentName: studentData.name,
      rollNo: studentData.rollNo || '',
      class: studentData.class || '',
      preferredBatch: studentData.preferredBatch || '',
      paymentMode,
      provider: provider.name,
      amount,
      monthsToPay,
      feeRecordIds,
      transactionId: transactionId.trim().toUpperCase(),
      proofUrl,
      status: 'PENDING',
      submittedBy: username,
      submittedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(doc(db, 'payment_verifications', verificationId), verificationRecord);

    // Record non-transactional audit and timeline log
    await AuditService.log(
      db,
      userId,
      username,
      'PAYMENT_SUBMITTED',
      `Submitted ${paymentMode} payment of ₹${amount} for student ${studentData.name} (${studentData.rollNo}) for ${monthsToPay.join(', ')}. Tx: ${transactionId}.`,
      ip,
      device
    );

    await TimelineService.record(
      db,
      studentId,
      'PAYMENT_SUBMITTED',
      `💳 Payment Submitted (${paymentMode})`,
      `Submitted ₹${amount} via ${paymentMode} with Tx: ${transactionId}. Awaiting verification.`,
      username,
      userRole
    );

    await EventPublisher.publish(db, 'PaymentSubmitted', {
      studentId,
      amount,
      paymentMode,
      months: monthsToPay,
      transactionId,
      submittedBy: username
    });

    return {
      success: true,
      message: `${paymentMode} payment submitted successfully and is awaiting administrator verification.`,
      data: {
        verification: verificationRecord,
        initiation: initiationResult
      }
    };
  }

  /**
   * Approves a pending payment verification from the queue.
   * Executes inside a transaction, processes fees, creates payment and receipt records.
   */
  public static async approveVerification(verificationId: string, currentUser: any, db: any, ip?: string, device?: string) {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';
    const userRole = currentUser?.role || 'ADMIN';
    const nowIso = new Date().toISOString();

    return await TransactionManager.run(db, 'APPROVE_PAYMENT_VERIFICATION', async (transaction) => {
      const receiptNumber = await ReceiptService.generateReceiptNumber(transaction, db);

      // 1. Fetch the verification record
      const verRef = doc(db, 'payment_verifications', verificationId);
      const verSnap = await transaction.get(verRef);
      if (!verSnap.exists()) {
        throw new Error('Payment verification record not found.');
      }
      const verData = verSnap.data();

      if (verData.status !== 'PENDING') {
        throw new Error(`Payment verification is already ${verData.status}.`);
      }

      const { studentId, feeRecordIds, amount, paymentMode, provider, transactionId, proofUrl, monthsToPay } = verData;

      // 2. Fetch student to verify existence
      const studentDoc = await transaction.get(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        throw new Error('Student record not found.');
      }
      const studentData = studentDoc.data();

      // 3. Re-verify FIFO to guarantee state consistency inside transaction
      const outstanding = await this.getOutstandingFeeRecords(studentId, db);
      if (outstanding.length === 0) {
        throw new Error('No outstanding fees found for this student. They may have been settled since submission.');
      }

      // Enforce FIFO inside transaction
      for (let i = 0; i < feeRecordIds.length; i++) {
        if (!outstanding[i] || outstanding[i].id !== feeRecordIds[i]) {
          throw new Error('FIFO violation: Outstanding fees state has changed. Approving this payment is no longer valid.');
        }
      }

      // Enforce No Partial Payment inside transaction
      let calculatedSum = 0;
      const breakdown: any[] = [];
      const recordsToUpdate: any[] = [];

      for (const recordId of feeRecordIds) {
        const record = outstanding.find(r => r.id === recordId);
        if (!record) {
          throw new Error(`Fee record ${recordId} not found among student's outstanding fees.`);
        }
        calculatedSum += record.pendingFee;
        breakdown.push({
          month: record.month,
          baseFee: record.baseFee,
          discountApplied: record.discountApplied || 0,
          amountPaid: record.pendingFee
        });
        recordsToUpdate.push(record);
      }

      if (amount !== calculatedSum) {
        throw new Error(`Amount mismatch inside transaction: Outstanding fees sum of ₹${calculatedSum} does not match verified payment of ₹${amount}.`);
      }

      // Ensure transaction ID is unique
      const cleanTxId = transactionId.trim().toUpperCase();
      const paymentsSnap = await getDocs(collection(db, 'fee_payments'));
      const paymentDup = paymentsSnap.docs.some((d: any) => {
        const p = d.data();
        return p.transactionId && p.transactionId.trim().toUpperCase() === cleanTxId && p.status === 'SUCCESS';
      });
      if (paymentDup) {
        throw new Error('Transaction ID / reference number is already used in a completed payment.');
      }

      const paymentId = `pmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 4. Update the monthly fee records to PAID
      for (const record of recordsToUpdate) {
        const recordRef = doc(db, 'student_monthly_fees', record.id);
        const updatedRecord = {
          ...record,
          paidFee: record.totalFee,
          pendingFee: 0,
          status: 'PAID',
          updatedAt: nowIso
        };
        transaction.set(recordRef, updatedRecord);
      }

      // 5. Update verification record status to APPROVED
      const updatedVer = {
        ...verData,
        status: 'APPROVED',
        verifiedBy: username,
        verifiedAt: nowIso,
        updatedAt: nowIso
      };
      transaction.set(verRef, updatedVer);

      // 6. Create FeePayment record
      const paymentRecord: FeePayment = {
        id: paymentId,
        studentId,
        studentName: studentData.name,
        rollNo: studentData.rollNo || '',
        class: studentData.class || '',
        preferredBatch: studentData.preferredBatch || '',
        paymentMode,
        provider,
        amountPaid: amount,
        monthsPaid: monthsToPay,
        feeRecordIds,
        transactionId,
        proofUrl,
        verificationId,
        receiptNumber,
        status: 'SUCCESS',
        remarks: `Approved by admin: ${username}`,
        collectedBy: username,
        collectedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      transaction.set(doc(db, 'fee_payments', paymentId), paymentRecord);

      // Derive FM-004 specific fields
      const receiptId = receiptNumber;
      const months = monthsToPay || [];
      const billingMonth = months.join(', ') || 'N/A';
      let billingYear = String(new Date().getFullYear());
      if (months.length > 0) {
        const match = months[0].match(/\d{4}/);
        if (match) billingYear = match[0];
      }
      const verificationHash = ReceiptService.generateVerificationHash(receiptId, paymentId);

      // 7. Create FeeReceipt record with all detailed and FM-004 fields
      const receiptRecord: FeeReceipt = {
        id: receiptNumber,
        receiptId,
        receiptNumber,
        paymentId,
        studentId,
        studentName: studentData.name,
        rollNo: studentData.rollNo || '',
        rollNumber: studentData.rollNo || '',
        class: studentData.class || '',
        className: studentData.class || '',
        preferredBatch: studentData.preferredBatch || '',
        paymentMode,
        paymentMethod: paymentMode,
        amount,
        amountPaid: amount,
        monthsCovered: months,
        breakdown,
        transactionId,
        generatedBy: username,
        generatedAt: nowIso,
        createdAt: nowIso,
        billingMonth,
        billingYear,
        issuedBy: username,
        issuedAt: nowIso,
        verificationHash,
        status: 'VALID'
      };
      transaction.set(doc(db, 'fee_receipts', receiptNumber), receiptRecord);

      // 8. Record audit and timeline in transaction
      AuditService.logInTransaction(
        transaction,
        db,
        userId,
        username,
        'PAYMENT_APPROVED',
        `Approved payment verification of ₹${amount} for student ${studentData.name} (${studentData.rollNo}). Tx: ${transactionId}.`,
        ip,
        device
      );

      TimelineService.recordInTransaction(
        transaction,
        db,
        studentId,
        'PAYMENT_APPROVED',
        `💳 Payment Approved (${paymentMode})`,
        `Payment of ₹${amount} approved by ${username}. Receipt generated: ${receiptNumber}.`,
        username,
        userRole
      );

      // 9. Publish Domain Events in Transaction
      EventPublisher.publishInTransaction(transaction, db, 'PaymentApproved', {
        studentId,
        amount,
        paymentMode,
        months: monthsToPay,
        approvedBy: username,
        verificationId
      });

      EventPublisher.publishInTransaction(transaction, db, 'FeeCollected', {
        studentId,
        amount,
        paymentMode,
        monthsPaid: monthsToPay,
        receiptNumber
      });

      EventPublisher.publishInTransaction(transaction, db, 'ReceiptGenerated', {
        studentId,
        receiptNumber,
        amount,
        monthsCovered: monthsToPay
      });

      const result = {
        success: true,
        message: 'Payment verification approved successfully. Receipt and payment logs generated.',
        data: {
          verification: updatedVer,
          payment: paymentRecord,
          receipt: receiptRecord
        }
      };

      // Cancel pending fee reminders for approved fees
      if (feeRecordIds && Array.isArray(feeRecordIds)) {
        for (const feeId of feeRecordIds) {
          ReminderService.cancelPendingRemindersForFee(db, feeId).catch(err => {
            console.error(`[FeeCollectionService] Non-blocking error cancelling reminders for fee ${feeId}:`, err);
          });
        }
      }

      return result;
    });
  }

  /**
   * Rejects a pending payment verification.
   */
  public static async rejectVerification(verificationId: string, reason: string, currentUser: any, db: any, ip?: string, device?: string) {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';
    const userRole = currentUser?.role || 'ADMIN';
    const nowIso = new Date().toISOString();

    if (!reason || reason.trim() === '') {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'Rejection reason is required.' };
    }

    const verRef = doc(db, 'payment_verifications', verificationId);
    const verSnap = await getDoc(verRef);
    if (!verSnap.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Payment verification record not found.' };
    }
    const verData = verSnap.data();

    if (verData.status !== 'PENDING') {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: `Payment verification is already ${verData.status}.` };
    }

    const updatedVer = {
      ...verData,
      status: 'REJECTED',
      rejectionReason: reason,
      verifiedBy: username,
      verifiedAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(verRef, updatedVer);

    // Record audit and timeline log
    await AuditService.log(
      db,
      userId,
      username,
      'PAYMENT_REJECTED',
      `Rejected payment verification of ₹${verData.amount} for student ${verData.studentName} (${verData.rollNo}). Reason: ${reason}`,
      ip,
      device
    );

    await TimelineService.record(
      db,
      verData.studentId,
      'PAYMENT_REJECTED',
      `❌ Payment Rejected (${verData.paymentMode})`,
      `Payment of ₹${verData.amount} was rejected by ${username}. Reason: ${reason}.`,
      username,
      userRole
    );

    await EventPublisher.publish(db, 'PaymentRejected', {
      studentId: verData.studentId,
      amount: verData.amount,
      paymentMode: verData.paymentMode,
      months: verData.monthsToPay,
      rejectedBy: username,
      reason,
      verificationId
    });

    return {
      success: true,
      message: 'Payment verification rejected successfully.',
      data: updatedVer
    };
  }

  /**
   * Lists completed payments with support for pagination, sorting, and in-memory filters.
   */
  public static async listPayments(filters: any, db: any) {
    const snap = await getDocs(collection(db, 'fee_payments'));
    let payments = snap.docs.map((d: any) => d.data());

    if (filters.studentId) {
      payments = payments.filter((p: any) => p.studentId === filters.studentId);
    }
    if (filters.paymentMode) {
      payments = payments.filter((p: any) => p.paymentMode === filters.paymentMode);
    }
    if (filters.class) {
      payments = payments.filter((p: any) => (p.class || '').toLowerCase() === filters.class.toLowerCase());
    }

    // Sort by collectedAt descending (newest first)
    payments.sort((a: any, b: any) => b.collectedAt.localeCompare(a.collectedAt));

    // Simple pagination simulation
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = payments.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginated,
      meta: {
        total: payments.length,
        page,
        limit,
        pages: Math.ceil(payments.length / limit)
      }
    };
  }

  /**
   * Lists the verification queue.
   */
  public static async listVerifications(filters: any, db: any) {
    const snap = await getDocs(collection(db, 'payment_verifications'));
    let list = snap.docs.map((d: any) => d.data());

    if (filters.status) {
      list = list.filter((v: any) => v.status === filters.status);
    }
    if (filters.studentId) {
      list = list.filter((v: any) => v.studentId === filters.studentId);
    }

    // Sort by submittedAt descending (newest first)
    list.sort((a: any, b: any) => b.submittedAt.localeCompare(a.submittedAt));

    return { success: true, data: list };
  }

  /**
   * Fetches a receipt by unique receipt number.
   */
  public static async getReceipt(receiptNumber: string, db: any) {
    const snap = await getDoc(doc(db, 'fee_receipts', receiptNumber));
    if (!snap.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Receipt not found.' };
    }
    return { success: true, data: snap.data() };
  }
}
