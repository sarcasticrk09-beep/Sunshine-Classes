import { collection, doc, getDoc, getDocs, setDoc } from '../shared/db';
import { TransactionManager } from '../shared/TransactionManager';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { FeeStructure } from '../../types';

export class FeeStructureService {
  /**
   * Create a new fee structure.
   */
  public static async createFeeStructure(input: any, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Insufficient permissions to manage fee structures.' };
    }

    // Validation
    const validationError = this.validateFeeStructureInput(input);
    if (validationError) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: validationError };
    }

    const structureId = `fee-struct-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const username = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    const status = input.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT';

    const newStructure: FeeStructure = {
      id: structureId,
      structureId,
      classId: input.classId,
      className: input.className,
      academicSessionId: input.academicSessionId,
      academicSessionName: input.academicSessionName,
      monthlyFee: Number(input.monthlyFee),
      quarterlyDiscountEnabled: !!input.quarterlyDiscountEnabled,
      quarterlyDiscountType: input.quarterlyDiscountType || 'PERCENTAGE',
      quarterlyDiscountValue: input.quarterlyDiscountEnabled ? Number(input.quarterlyDiscountValue) : 0,
      effectiveFrom: input.effectiveFrom || nowIso.split('T')[0],
      effectiveTo: input.effectiveTo || '2030-12-31',
      status,
      version: 1,
      remarks: input.remarks || '',
      createdBy: username,
      createdAt: nowIso,
      updatedBy: username,
      updatedAt: nowIso
    };

    try {
      if (status === 'ACTIVE') {
        // Must perform activation transaction
        const result = await TransactionManager.run(db, 'ACTIVATE_FEE_STRUCTURE_NEW', async (transaction) => {
          // Find any existing active version for this Class + Academic Session
          const allDocsSnap = await getDocs(collection(db, 'fee_structures'));
          const existingActive = allDocsSnap.docs.find((d: any) => {
            const data = d.data();
            return data.classId === input.classId && 
                   data.academicSessionId === input.academicSessionId && 
                   data.status === 'ACTIVE';
          });

          if (existingActive) {
            const oldRef = doc(db, 'fee_structures', existingActive.id);
            transaction.update(oldRef, {
              status: 'ARCHIVED',
              archivedAt: nowIso,
              updatedAt: nowIso,
              updatedBy: username
            });

            // Log timeline and audit for the archived version
            TimelineService.recordInTransaction(
              transaction,
              db,
              existingActive.id,
              'FEE_STRUCTURE_ARCHIVED',
              '📦 Fee Structure Archived',
              `Fee structure archived automatically by ${username} on activation of new structure.`,
              username,
              role
            );

            AuditService.logInTransaction(
              transaction,
              db,
              currentUser?.userId,
              username,
              'FEE_STRUCTURE_ARCHIVED',
              `Fee structure ${existingActive.id} for ${dataValue(existingActive).className} (${dataValue(existingActive).academicSessionName}) was archived.`
            );
          }

          // Write new active structure
          const newRef = doc(db, 'fee_structures', structureId);
          transaction.set(newRef, newStructure);

          // Timeline
          TimelineService.recordInTransaction(
            transaction,
            db,
            structureId,
            'FEE_STRUCTURE_CREATED',
            '💰 Fee Structure Created',
            `Fee structure created and activated by ${username}.`,
            username,
            role
          );

          // Audit
          AuditService.logInTransaction(
            transaction,
            db,
            currentUser?.userId,
            username,
            'FEE_STRUCTURE_CREATED',
            `Created and activated fee structure ${structureId} for Class ${input.className} with monthly fee of ₹${input.monthlyFee}.`
          );

          // Domain Event
          EventPublisher.publishInTransaction(
            transaction,
            db,
            'FeeStructureUpdated',
            {
              structureId,
              classId: input.classId,
              className: input.className,
              academicSessionId: input.academicSessionId,
              academicSessionName: input.academicSessionName,
              status: 'ACTIVE',
              version: 1,
              monthlyFee: Number(input.monthlyFee),
              updatedBy: username,
              timestamp: nowIso
            }
          );

          return newStructure;
        });

        return { success: true, message: 'Fee structure created and activated successfully.', data: result };
      } else {
        // Just save as DRAFT directly
        await setDoc(doc(db, 'fee_structures', structureId), newStructure);

        // Standard timeline, audit, event outside transaction
        await TimelineService.record(
          db,
          structureId,
          'FEE_STRUCTURE_CREATED',
          '💰 Fee Structure Created',
          `Fee structure created as DRAFT by ${username}.`,
          username,
          role
        );

        await AuditService.log(
          db,
          currentUser?.userId,
          username,
          'FEE_STRUCTURE_CREATED',
          `Created fee structure ${structureId} as DRAFT for Class ${input.className}.`
        );

        await EventPublisher.publish(db, 'FeeStructureUpdated', {
          structureId,
          classId: input.classId,
          className: input.className,
          status: 'DRAFT',
          version: 1,
          monthlyFee: Number(input.monthlyFee),
          updatedBy: username,
          timestamp: nowIso
        });

        return { success: true, message: 'Fee structure created as DRAFT successfully.', data: newStructure };
      }
    } catch (err: any) {
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Update an existing fee structure.
   */
  public static async updateFeeStructure(id: string, input: any, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Insufficient permissions to manage fee structures.' };
    }

    const docRef = doc(db, 'fee_structures', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Fee structure not found.' };
    }

    const existing = snap.data() as FeeStructure;
    const username = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    // Validation
    const validationError = this.validateFeeStructureInput(input);
    if (validationError) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: validationError };
    }

    if (existing.status === 'DRAFT') {
      // DRAFT is editable in-place
      const updatedStructure: FeeStructure = {
        ...existing,
        classId: input.classId || existing.classId,
        className: input.className || existing.className,
        academicSessionId: input.academicSessionId || existing.academicSessionId,
        academicSessionName: input.academicSessionName || existing.academicSessionName,
        monthlyFee: Number(input.monthlyFee),
        quarterlyDiscountEnabled: !!input.quarterlyDiscountEnabled,
        quarterlyDiscountType: input.quarterlyDiscountType || 'PERCENTAGE',
        quarterlyDiscountValue: input.quarterlyDiscountEnabled ? Number(input.quarterlyDiscountValue) : 0,
        effectiveFrom: input.effectiveFrom || existing.effectiveFrom,
        effectiveTo: input.effectiveTo || existing.effectiveTo,
        remarks: input.remarks || existing.remarks,
        updatedBy: username,
        updatedAt: nowIso
      };

      await setDoc(docRef, updatedStructure);

      await TimelineService.record(
        db,
        id,
        'FEE_STRUCTURE_UPDATED',
        '💰 Fee Structure Updated',
        `Fee structure updated by ${username}.`,
        username,
        role
      );

      await AuditService.log(
        db,
        currentUser?.userId,
        username,
        'FEE_STRUCTURE_UPDATED',
        `Updated draft fee structure ${id} (Class: ${input.className}).`
      );

      await EventPublisher.publish(db, 'FeeStructureUpdated', {
        structureId: id,
        classId: updatedStructure.classId,
        className: updatedStructure.className,
        status: updatedStructure.status,
        version: updatedStructure.version,
        monthlyFee: updatedStructure.monthlyFee,
        updatedBy: username,
        timestamp: nowIso
      });

      return { success: true, message: 'Draft fee structure updated successfully.', data: updatedStructure };
    } else {
      // Historical active/archived versions are IMMUTABLE.
      // We create a NEW version with status DRAFT.
      const newVersion = existing.version + 1;
      const structureId = `fee-struct-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

      const newStructure: FeeStructure = {
        id: structureId,
        structureId,
        classId: input.classId || existing.classId,
        className: input.className || existing.className,
        academicSessionId: input.academicSessionId || existing.academicSessionId,
        academicSessionName: input.academicSessionName || existing.academicSessionName,
        monthlyFee: Number(input.monthlyFee),
        quarterlyDiscountEnabled: !!input.quarterlyDiscountEnabled,
        quarterlyDiscountType: input.quarterlyDiscountType || 'PERCENTAGE',
        quarterlyDiscountValue: input.quarterlyDiscountEnabled ? Number(input.quarterlyDiscountValue) : 0,
        effectiveFrom: input.effectiveFrom || nowIso.split('T')[0],
        effectiveTo: input.effectiveTo || '2030-12-31',
        status: 'DRAFT', // Always DRAFT on revision creation
        version: newVersion,
        remarks: input.remarks || '',
        createdBy: username,
        createdAt: nowIso,
        updatedBy: username,
        updatedAt: nowIso
      };

      await setDoc(doc(db, 'fee_structures', structureId), newStructure);

      await TimelineService.record(
        db,
        structureId,
        'FEE_STRUCTURE_CREATED',
        '💰 Fee Structure Created',
        `New version ${newVersion} created from version ${existing.version} as DRAFT by ${username}.`,
        username,
        role
      );

      await AuditService.log(
        db,
        currentUser?.userId,
        username,
        'FEE_STRUCTURE_CREATED',
        `Created new fee structure version ${newVersion} (${structureId}) from parent ${id} (Class: ${input.className}).`
      );

      await EventPublisher.publish(db, 'FeeStructureUpdated', {
        structureId,
        classId: newStructure.classId,
        className: newStructure.className,
        status: 'DRAFT',
        version: newVersion,
        monthlyFee: newStructure.monthlyFee,
        updatedBy: username,
        timestamp: nowIso
      });

      return {
        success: true,
        message: 'A new version has been created because the original fee structure is active/archived.',
        data: newStructure
      };
    }
  }

  /**
   * Activate a draft/archived fee structure (archiving the previous active one).
   */
  public static async activateFeeStructure(id: string, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Insufficient permissions to manage fee structures.' };
    }

    const docRef = doc(db, 'fee_structures', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Fee structure not found.' };
    }

    const target = snap.data() as FeeStructure;
    if (target.status === 'ACTIVE') {
      return { success: true, message: 'Fee structure is already active.', data: target };
    }

    const username = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    try {
      const result = await TransactionManager.run(db, 'ACTIVATE_FEE_STRUCTURE', async (transaction) => {
        // Find existing ACTIVE structure for this class + academic session
        const allDocsSnap = await getDocs(collection(db, 'fee_structures'));
        const existingActive = allDocsSnap.docs.find((d: any) => {
          const data = d.data();
          return data.classId === target.classId && 
                 data.academicSessionId === target.academicSessionId && 
                 data.status === 'ACTIVE';
        });

        if (existingActive) {
          const oldRef = doc(db, 'fee_structures', existingActive.id);
          transaction.update(oldRef, {
            status: 'ARCHIVED',
            archivedAt: nowIso,
            updatedAt: nowIso,
            updatedBy: username
          });

          // Log archiving timeline event
          TimelineService.recordInTransaction(
            transaction,
            db,
            existingActive.id,
            'FEE_STRUCTURE_ARCHIVED',
            '📦 Fee Structure Archived',
            `Fee structure archived automatically by ${username} on activation of version ${target.version}.`,
            username,
            role
          );

          AuditService.logInTransaction(
            transaction,
            db,
            currentUser?.userId,
            username,
            'FEE_STRUCTURE_ARCHIVED',
            `Fee structure ${existingActive.id} for ${dataValue(existingActive).className} was archived.`
          );
        }

        // Activate the target structure
        transaction.update(docRef, {
          status: 'ACTIVE',
          updatedAt: nowIso,
          updatedBy: username
        });

        // Timeline for activated structure
        TimelineService.recordInTransaction(
          transaction,
          db,
          id,
          'FEE_STRUCTURE_UPDATED',
          '💰 Fee Structure Updated',
          `Fee structure version ${target.version} activated by ${username}.`,
          username,
          role
        );

        // Audit
        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          username,
          'FEE_STRUCTURE_ACTIVATED',
          `Activated fee structure ${id} (Class: ${target.className}, Academic Session: ${target.academicSessionName}, Version: ${target.version}).`
        );

        // Domain Event
        EventPublisher.publishInTransaction(
          transaction,
          db,
          'FeeStructureUpdated',
          {
            structureId: id,
            classId: target.classId,
            className: target.className,
            academicSessionId: target.academicSessionId,
            academicSessionName: target.academicSessionName,
            status: 'ACTIVE',
            version: target.version,
            monthlyFee: target.monthlyFee,
            updatedBy: username,
            timestamp: nowIso
          }
        );

        return { ...target, status: 'ACTIVE', updatedAt: nowIso, updatedBy: username };
      });

      return { success: true, message: 'Fee structure activated successfully.', data: result };
    } catch (err: any) {
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Retrieve list of all fee structures.
   */
  public static async listFeeStructures(currentUser: any, db: any) {
    const snap = await getDocs(collection(db, 'fee_structures'));
    const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Sort by class and version desc
    list.sort((a: any, b: any) => {
      const cls = (a.className || '').localeCompare(b.className || '');
      if (cls !== 0) return cls;
      return (b.version || 0) - (a.version || 0);
    });

    return { success: true, data: list };
  }

  /**
   * Get fee structure by ID.
   */
  public static async getFeeStructureById(id: string, currentUser: any, db: any) {
    const docRef = doc(db, 'fee_structures', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Fee structure not found.' };
    }

    return { success: true, data: snap.data() };
  }

  /**
   * Get version history of a fee structure (based on ClassId + AcademicSessionId).
   */
  public static async getVersionHistory(id: string, currentUser: any, db: any) {
    const targetRes = await this.getFeeStructureById(id, currentUser, db);
    if (!targetRes.success) {
      return targetRes;
    }

    const target = targetRes.data;
    const snap = await getDocs(collection(db, 'fee_structures'));
    const list = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((d: any) => d.classId === target.classId && d.academicSessionId === target.academicSessionId);

    // Sort by version descending
    list.sort((a: any, b: any) => (b.version || 0) - (a.version || 0));

    return { success: true, data: list };
  }

  /**
   * Helper input validation.
   */
  private static validateFeeStructureInput(input: any): string | null {
    if (!input.classId || !input.className) {
      return 'Class ID and Name are required.';
    }
    if (!input.academicSessionId || !input.academicSessionName) {
      return 'Academic Session ID and Name are required.';
    }
    if (input.monthlyFee === undefined || isNaN(Number(input.monthlyFee)) || Number(input.monthlyFee) <= 0) {
      return 'Monthly fee must be greater than zero.';
    }
    if (input.quarterlyDiscountEnabled) {
      const val = Number(input.quarterlyDiscountValue);
      if (isNaN(val) || val < 0) {
        return 'Discount value must be zero or positive.';
      }
      if (input.quarterlyDiscountType === 'PERCENTAGE' && (val < 0 || val > 100)) {
        return 'Discount percentage must be between 0 and 100.';
      }
    }
    return null;
  }
}

function dataValue(docSnap: any): any {
  return typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
}
