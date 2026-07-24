import { doc, collection, getDoc, getDocs, setDoc, runTransaction } from '../shared/db';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { FeeReceipt } from '../../types';
import crypto from 'crypto';

export class ReceiptService {
  /**
   * Generates a secure verification hash: SHA256 of receiptId + paymentId + secretKey
   */
  public static generateVerificationHash(receiptId: string, paymentId: string): string {
    const secretKey = process.env.RECEIPT_SECRET_KEY || 'sunshine-classes-secret-key-123456';
    return crypto
      .createHmac('sha256', secretKey)
      .update(`${receiptId}:${paymentId}`)
      .digest('hex');
  }

  /**
   * Generates a sequential receipt number inside a transaction safely: RCP-YYYY-XXXXXX
   * Includes self-healing/initialization if the counter doesn't exist yet.
   */
  public static async generateReceiptNumber(transaction: any, db: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `RCP-${currentYear}-`;
    const counterRef = doc(db, 'counters', 'fee_receipts');
    
    // Get current counter
    const counterDoc = await transaction.get(counterRef);
    let nextSeq = 1;

    if (counterDoc.exists()) {
      nextSeq = (counterDoc.data().currentSequence || 0) + 1;
    } else {
      // Initialize the counter based on existing receipts to prevent duplicate numbers
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
          const parts = id.split('-');
          const lastPart = parts[parts.length - 1];
          const seq = parseInt(lastPart, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      });
      nextSeq = maxSeq + 1;
    }

    // Set/update sequence in counter document
    transaction.set(counterRef, { currentSequence: nextSeq }, { merge: true });
    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }

  /**
   * Generates a receipt for a verified payment.
   */
  public static async generateReceipt(
    paymentId: string,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ): Promise<{ success: boolean; data?: FeeReceipt; message?: string; statusCode?: number }> {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';
    const userRole = currentUser?.role || 'ADMIN';

    try {
      // 1. Fetch payment to verify existence and success state
      const paymentRef = doc(db, 'fee_payments', paymentId);
      const paymentDoc = await getDoc(paymentRef);

      if (!paymentDoc.exists()) {
        return { success: false, message: 'Payment record not found.', statusCode: 404 };
      }

      const paymentData = paymentDoc.data();

      // Rule: Receipt can only be generated when Payment Status = SUCCESS/VERIFIED
      if (paymentData.status !== 'SUCCESS') {
        return {
          success: false,
          message: `Cannot generate receipt. Payment status is ${paymentData.status}. Only successful verified payments can have receipts.`,
          statusCode: 400
        };
      }

      // Rule: Duplicate receipts are never allowed. One Payment -> One Receipt.
      const receiptsSnap = await getDocs(collection(db, 'fee_receipts'));
      const existingReceipt = receiptsSnap.docs.find((d: any) => d.data().paymentId === paymentId);

      if (existingReceipt) {
        return {
          success: true, // Idempotent success returning existing receipt
          data: existingReceipt.data() as FeeReceipt,
          message: 'Receipt already exists for this payment.'
        };
      }

      // 2. Generate Receipt in transaction
      const finalReceipt = await runTransaction(db, async (transaction) => {
        const receiptNumber = await this.generateReceiptNumber(transaction, db);
        const nowIso = new Date().toISOString();

        // Parse billing month and year
        const months = paymentData.monthsPaid || [];
        const billingMonth = months.join(', ') || 'N/A';
        let billingYear = String(new Date().getFullYear());
        if (months.length > 0) {
          const match = months[0].match(/\d{4}/);
          if (match) billingYear = match[0];
        }

        const receiptId = receiptNumber;
        const verificationHash = this.generateVerificationHash(receiptId, paymentId);

        const receiptDoc: FeeReceipt = {
          id: receiptId,
          receiptId,
          receiptNumber,
          paymentId,
          studentId: paymentData.studentId,
          studentName: paymentData.studentName,
          rollNo: paymentData.rollNo || '',
          rollNumber: paymentData.rollNo || '',
          class: paymentData.class || '',
          className: paymentData.class || '',
          preferredBatch: paymentData.preferredBatch || '',
          billingMonth,
          billingYear,
          amount: paymentData.amountPaid,
          amountPaid: paymentData.amountPaid,
          paymentMode: paymentData.paymentMode,
          paymentMethod: paymentData.paymentMode,
          transactionId: paymentData.transactionId || '',
          issuedBy: username,
          generatedBy: username,
          issuedAt: nowIso,
          generatedAt: nowIso,
          createdAt: nowIso,
          verificationHash,
          status: 'VALID',
          monthsCovered: months,
          breakdown: paymentData.breakdown || []
        };

        // Write the receipt
        transaction.set(doc(db, 'fee_receipts', receiptId), receiptDoc);

        // Update the payment record with receiptNumber if it doesn't already have one
        if (!paymentData.receiptNumber) {
          transaction.set(paymentRef, { ...paymentData, receiptNumber }, { merge: true });
        }

        // Record transaction-bound audit log
        AuditService.logInTransaction(
          transaction,
          db,
          userId,
          username,
          'RECEIPT_GENERATED',
          `Generated receipt ${receiptNumber} for payment of ₹${paymentData.amountPaid} by student ${paymentData.studentName} (${paymentData.rollNo}).`,
          ip,
          device
        );

        // Record transaction-bound timeline log
        TimelineService.recordInTransaction(
          transaction,
          db,
          paymentData.studentId,
          'RECEIPT_GENERATED',
          '🧾 Receipt Issued',
          `Receipt ${receiptNumber} has been generated for ₹${paymentData.amountPaid}.`,
          username,
          userRole
        );

        // Publish transaction-bound event
        EventPublisher.publishInTransaction(transaction, db, 'ReceiptGenerated', {
          receiptNumber,
          paymentId,
          studentId: paymentData.studentId,
          amount: paymentData.amountPaid,
          generatedBy: username
        });

        return receiptDoc;
      });

      return { success: true, data: finalReceipt };
    } catch (error: any) {
      console.error('[ReceiptService] Error generating receipt:', error);
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }

  /**
   * Retrieves a receipt by ID. Logs "Receipt Viewed" audit event.
   */
  public static async getReceiptById(
    receiptId: string,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ): Promise<{ success: boolean; data?: FeeReceipt; message?: string; statusCode?: number }> {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';

    try {
      const receiptRef = doc(db, 'fee_receipts', receiptId);
      const receiptDoc = await getDoc(receiptRef);

      if (!receiptDoc.exists()) {
        return { success: false, message: 'Receipt not found.', statusCode: 404 };
      }

      const receiptData = receiptDoc.data();

      // Log receipt viewed event
      await AuditService.log(
        db,
        userId,
        username,
        'RECEIPT_VIEWED',
        `Viewed receipt ${receiptData.receiptNumber || receiptId}.`,
        ip,
        device
      );

      return { success: true, data: receiptData as FeeReceipt };
    } catch (error: any) {
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }

  /**
   * Retrieves a receipt by sequential Receipt Number.
   */
  public static async getReceiptByNumber(
    receiptNumber: string,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ): Promise<{ success: boolean; data?: FeeReceipt; message?: string; statusCode?: number }> {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';

    try {
      const receiptsSnap = await getDocs(collection(db, 'fee_receipts'));
      const receipt = receiptsSnap.docs.find((d: any) => d.id === receiptNumber);

      if (!receipt) {
        return { success: false, message: 'Receipt not found.', statusCode: 404 };
      }

      const receiptData = receipt.data();

      // Log viewed
      await AuditService.log(
        db,
        userId,
        username,
        'RECEIPT_VIEWED',
        `Viewed receipt ${receiptNumber} via number search.`,
        ip,
        device
      );

      return { success: true, data: receiptData as FeeReceipt };
    } catch (error: any) {
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }

  /**
   * Retrieves all receipts for a student.
   */
  public static async getReceiptsByStudent(
    studentId: string,
    db: any
  ): Promise<{ success: boolean; data?: FeeReceipt[]; message?: string; statusCode?: number }> {
    try {
      const receiptsSnap = await getDocs(collection(db, 'fee_receipts'));
      const studentReceipts = receiptsSnap.docs
        .map((d: any) => d.data() as FeeReceipt)
        .filter((r) => r.studentId === studentId);

      return { success: true, data: studentReceipts };
    } catch (error: any) {
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }

  /**
   * Public receipt verification endpoint.
   * Does NOT expose sensitive internal information.
   * Verifies the cryptographic validation hash and returns status.
   */
  public static async verifyReceipt(
    receiptNumber: string,
    db: any,
    ip?: string,
    device?: string
  ): Promise<{ success: boolean; data?: any; message?: string; statusCode?: number }> {
    try {
      const receiptsSnap = await getDocs(collection(db, 'fee_receipts'));
      const docMatch = receiptsSnap.docs.find((d: any) => d.id === receiptNumber);

      if (!docMatch) {
        // Log verification failure
        await AuditService.log(
          db,
          'anonymous',
          'public-verification',
          'RECEIPT_VERIFICATION_FAILED',
          `Failed public verification attempt for receipt number: ${receiptNumber}`,
          ip,
          device
        );
        return { success: false, message: 'Invalid Receipt', statusCode: 404 };
      }

      const r = docMatch.data();

      // Cryptographically verify the verificationHash to ensure it has not been forged
      const calculatedHash = this.generateVerificationHash(r.id, r.paymentId);
      const isValidSignature = r.verificationHash === calculatedHash;

      if (!isValidSignature) {
        await AuditService.log(
          db,
          'anonymous',
          'public-verification',
          'RECEIPT_SIGNATURE_MISMATCH',
          `Tampered/Forged receipt detected! Receipt number: ${receiptNumber}`,
          ip,
          device
        );
        return { success: false, message: 'Invalid Receipt - Signature Verification Failed', statusCode: 400 };
      }

      // Publish ReceiptVerified domain event
      await EventPublisher.publish(db, 'ReceiptVerified', {
        receiptNumber,
        status: r.status,
        verifiedAt: new Date().toISOString()
      });

      // Log receipt verified audit event
      await AuditService.log(
        db,
        'anonymous',
        'public-verification',
        'RECEIPT_VERIFIED',
        `Successfully verified receipt: ${receiptNumber}`,
        ip,
        device
      );

      // Return secure public details only (no highly sensitive fields)
      return {
        success: true,
        data: {
          receiptNumber: r.receiptNumber,
          studentName: r.studentName,
          amount: r.amount || r.amountPaid,
          paymentDate: r.issuedAt || r.generatedAt,
          status: r.status || 'VALID'
        }
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }

  /**
   * Marks a receipt as downloaded and records audits/timeline/events
   */
  public static async recordDownload(
    receiptId: string,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';
    const userRole = currentUser?.role || 'ADMIN';

    try {
      const receiptRef = doc(db, 'fee_receipts', receiptId);
      const receiptDoc = await getDoc(receiptRef);

      if (!receiptDoc.exists()) {
        return { success: false, message: 'Receipt not found.', statusCode: 404 };
      }

      const receiptData = receiptDoc.data();

      // Log audit
      await AuditService.log(
        db,
        userId,
        username,
        'RECEIPT_DOWNLOADED',
        `Downloaded receipt ${receiptData.receiptNumber || receiptId}.`,
        ip,
        device
      );

      // Record student timeline
      await TimelineService.record(
        db,
        receiptData.studentId,
        'RECEIPT_DOWNLOADED',
        '🧾 Receipt Downloaded',
        `Receipt ${receiptData.receiptNumber} was downloaded.`,
        username,
        userRole
      );

      // Publish domain event
      await EventPublisher.publish(db, 'ReceiptDownloaded', {
        receiptNumber: receiptData.receiptNumber,
        studentId: receiptData.studentId,
        downloadedBy: username
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }

  /**
   * Resends receipt - publishes domain events and audit logs
   */
  public static async resendReceipt(
    receiptId: string,
    currentUser: any,
    db: any,
    ip?: string,
    device?: string
  ): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    const username = currentUser?.username || 'system';
    const userId = currentUser?.id || 'system';

    try {
      const receiptRef = doc(db, 'fee_receipts', receiptId);
      const receiptDoc = await getDoc(receiptRef);

      if (!receiptDoc.exists()) {
        return { success: false, message: 'Receipt not found.', statusCode: 404 };
      }

      const receiptData = receiptDoc.data();

      // Log audit
      await AuditService.log(
        db,
        userId,
        username,
        'RECEIPT_RESENT',
        `Resent receipt ${receiptData.receiptNumber || receiptId}.`,
        ip,
        device
      );

      // Publish event
      await EventPublisher.publish(db, 'ReceiptResent', {
        receiptNumber: receiptData.receiptNumber,
        studentId: receiptData.studentId,
        resentBy: username
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Server error', statusCode: 500 };
    }
  }
}
