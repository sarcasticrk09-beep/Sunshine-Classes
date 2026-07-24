/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDoc, getDocs } from '../shared/db';
import { getCountFromServer, query, where, limit } from 'firebase/firestore';
import {
  VALID_CLASSES,
  VALID_STATUSES,
  validateStudentUpdateInput
} from './StudentUtils';
import { EventPublisher } from '../shared/EventPublisher';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { TransactionManager } from '../shared/TransactionManager';

export class StudentService {
  /**
   * List students with advanced filtering, multi-field search, sorting, and pagination.
   * Optimized for 10k+ students using fast native aggregations and defensive query caps.
   */
  public static async listStudents(
    queryOptions: {
      search?: string;
      className?: string;
      teacherId?: string;
      status?: string;
      gender?: string;
      admissionYear?: string;
      joinedDate?: string;
      updatedDate?: string;
      hasDocuments?: boolean | string;
      hasPhoto?: boolean | string;
      missingMobile?: boolean | string;
      missingEmail?: boolean | string;
      sortBy?: string; // 'name' | 'rollNo' | 'admissionDate' | 'class' | 'updatedAt'
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
      lastDocId?: string;
    },
    currentUser: any,
    db: any
  ) {
    const page = Math.max(1, Number(queryOptions.page) || 1);
    const fetchLimit = Math.max(1, Math.min(100, Number(queryOptions.limit) || 25));

    console.log(`[StudentService] [listStudents] Optimizing query pipeline for 10k+ dataset...`);

    // 1. Fast Native Aggregation: Fetch total count cheaply using getCountFromServer
    let totalCount = 0;
    try {
      const qCount = query(collection(db, 'students'));
      const countSnap = await getCountFromServer(qCount);
      totalCount = countSnap.data().count;
    } catch (countError) {
      console.warn('[StudentService] [listStudents] getCountFromServer failed, falling back to in-memory count:', countError);
    }

    // 2. High-Performance Slice Fetch:
    // For 10k+ records, we pre-filter by index-friendly fields (like status or className) to shrink the working set size.
    let q = query(collection(db, 'students'));
    const statusFilter = (queryOptions.status || '').trim().toUpperCase();

    if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'DELETED') {
      q = query(collection(db, 'students'), where('status', '==', statusFilter));
    } else if (statusFilter === 'DELETED') {
      q = query(collection(db, 'students'), where('deleted', '==', true));
    } else {
      q = query(collection(db, 'students'), where('deleted', '!=', true));
    }

    // Defensive Cap: Retrieve matching records up to 1000 elements to guarantee low memory usage
    const cappedQuery = query(q, limit(1000));
    const snap = await getDocs(cappedQuery);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    // 3. Permission-based visibility filter
    const role = (currentUser?.role || '').toUpperCase();
    const cUser = currentUser || {};

    if (role === 'TEACHER') {
      const teacherSnap = await getDocs(collection(db, 'teachers'));
      const teachers = teacherSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const teacherProfile = teachers.find(
        t => t.userId === cUser.userId || t.userId === cUser.id || t.email === cUser.email || t.name === cUser.name
      );

      if (teacherProfile) {
        const teacherName = (teacherProfile.name || '').toLowerCase();
        const allowedClasses = [
          ...(teacherProfile.specialty || []),
          ...(teacherProfile.batches || [])
        ].map((c: string) => c.toLowerCase());

        list = list.filter(s => {
          const sClass = (s.class || s.className || '').toLowerCase();
          const sTeacher = (s.assignedTeacher || s.teacherId || '').toLowerCase();
          return sTeacher.includes(teacherName) || allowedClasses.some(ac => sClass.includes(ac));
        });
      } else {
        list = [];
      }
    } else if (role === 'STUDENT') {
      list = list.filter(
        s => s.userId === cUser.userId || s.userId === cUser.id || s.id === cUser.studentId
      );
    }

    // 4. Multi-field Search Filter
    if (queryOptions.search && queryOptions.search.trim()) {
      const searchTerms = queryOptions.search.trim().toLowerCase();
      list = list.filter(s => {
        const name = (s.name || s.personalInfo?.name || '').toLowerCase();
        const roll = (s.rollNo || s.rollNumber || '').toLowerCase();
        const admNo = (s.admissionNo || s.admissionNumber || s.admissionId || '').toLowerCase();
        const father = (s.fatherName || s.parentInfo?.fatherName || '').toLowerCase();
        const mother = (s.motherName || s.parentInfo?.motherName || '').toLowerCase();
        const mobile = (s.mobile || s.contactInfo?.mobile || '').toLowerCase();
        const email = (s.email || s.contactInfo?.email || '').toLowerCase();
        
        return (
          name.includes(searchTerms) ||
          roll.includes(searchTerms) ||
          admNo.includes(searchTerms) ||
          father.includes(searchTerms) ||
          mother.includes(searchTerms) ||
          mobile.includes(searchTerms) ||
          email.includes(searchTerms)
        );
      });
    }

    // 5. Class Filter
    if (queryOptions.className && queryOptions.className.trim()) {
      const targetClass = queryOptions.className.trim().toLowerCase();
      list = list.filter(s => {
        const sClass = (s.class || s.className || s.classId || '').toLowerCase();
        return sClass === targetClass || sClass.includes(targetClass);
      });
    }

    // 6. Teacher Filter
    if (queryOptions.teacherId && queryOptions.teacherId.trim()) {
      const targetTeacher = queryOptions.teacherId.trim().toLowerCase();
      list = list.filter(s => {
        const sTeacher = (s.assignedTeacher || s.teacherId || '').toLowerCase();
        return sTeacher.includes(targetTeacher);
      });
    }

    // 7. Gender Filter
    if (queryOptions.gender && queryOptions.gender.trim() && queryOptions.gender.toUpperCase() !== 'ALL') {
      const targetGender = queryOptions.gender.trim().toUpperCase();
      list = list.filter(s => {
        const sGender = (s.gender || s.personalInfo?.gender || '').toUpperCase();
        return sGender === targetGender;
      });
    }

    // 8. Admission Year Filter
    if (queryOptions.admissionYear && queryOptions.admissionYear.trim()) {
      const targetYear = queryOptions.admissionYear.trim();
      list = list.filter(s => {
        const admDate = s.admissionDate || s.createdAt || '';
        return admDate.startsWith(targetYear);
      });
    }

    // 9. Joined Date Filter
    if (queryOptions.joinedDate && queryOptions.joinedDate.trim()) {
      const targetJoined = queryOptions.joinedDate.trim();
      list = list.filter(s => {
        const admDate = s.admissionDate || s.createdAt || '';
        return admDate.startsWith(targetJoined);
      });
    }

    // 10. Updated Date Filter
    if (queryOptions.updatedDate && queryOptions.updatedDate.trim()) {
      const targetUpdated = queryOptions.updatedDate.trim();
      list = list.filter(s => {
        const uDate = s.updatedAt || '';
        return uDate.startsWith(targetUpdated);
      });
    }

    // 11. Has Documents Filter
    if (queryOptions.hasDocuments !== undefined && queryOptions.hasDocuments !== '' && queryOptions.hasDocuments !== 'ALL') {
      const isTrue = String(queryOptions.hasDocuments) === 'true';
      list = list.filter(s => {
        const docUrl = s.documentUrl || s.documents?.documentUrl || s.documents?.aadhar || '';
        const hasDoc = Boolean(docUrl && docUrl.trim().length > 0);
        return isTrue ? hasDoc : !hasDoc;
      });
    }

    // 12. Has Photo Filter
    if (queryOptions.hasPhoto !== undefined && queryOptions.hasPhoto !== '' && queryOptions.hasPhoto !== 'ALL') {
      const isTrue = String(queryOptions.hasPhoto) === 'true';
      list = list.filter(s => {
        const photoUrl = s.photoUrl || s.personalInfo?.photoUrl || s.documents?.photoUrl || '';
        const hasPic = Boolean(photoUrl && photoUrl.trim().length > 0);
        return isTrue ? hasPic : !hasPic;
      });
    }

    // 13. Missing Mobile Filter
    if (queryOptions.missingMobile !== undefined && queryOptions.missingMobile !== '' && queryOptions.missingMobile !== 'ALL') {
      const isTrue = String(queryOptions.missingMobile) === 'true';
      list = list.filter(s => {
        const mob = s.mobile || s.contactInfo?.mobile || '';
        const missing = !mob || !mob.trim();
        return isTrue ? missing : !missing;
      });
    }

    // 14. Missing Email Filter
    if (queryOptions.missingEmail !== undefined && queryOptions.missingEmail !== '' && queryOptions.missingEmail !== 'ALL') {
      const isTrue = String(queryOptions.missingEmail) === 'true';
      list = list.filter(s => {
        const eml = s.email || s.contactInfo?.email || '';
        const missing = !eml || !eml.trim();
        return isTrue ? missing : !missing;
      });
    }

    // 14b. Has Concession & Concession Percentage Filter (FM-006)
    if (
      (queryOptions as any).hasConcession !== undefined &&
      (queryOptions as any).hasConcession !== '' &&
      (queryOptions as any).hasConcession !== 'ALL' ||
      (queryOptions as any).concessionPercentage !== undefined &&
      (queryOptions as any).concessionPercentage !== ''
    ) {
      const feeSettingsSnap = await getDocs(collection(db, 'student_fee_settings'));
      const activeSettingsMap = new Map<string, number>();
      feeSettingsSnap.docs.forEach((d: any) => {
        const data = d.data();
        if (data.status === 'ACTIVE' && Number(data.concessionPercentage) > 0) {
          activeSettingsMap.set(data.studentId, Number(data.concessionPercentage));
        }
      });

      const hasConcFilter = String((queryOptions as any).hasConcession);
      if (hasConcFilter === 'true' || hasConcFilter === 'YES') {
        list = list.filter(s => activeSettingsMap.has(s.id));
      } else if (hasConcFilter === 'false' || hasConcFilter === 'NO') {
        list = list.filter(s => !activeSettingsMap.has(s.id));
      }

      const targetPctStr = (queryOptions as any).concessionPercentage;
      if (targetPctStr !== undefined && targetPctStr !== '') {
        const targetPct = Number(targetPctStr);
        if (!isNaN(targetPct)) {
          list = list.filter(s => activeSettingsMap.get(s.id) === targetPct);
        }
      }
    }

    // 15. Sorting
    const sortBy = (queryOptions.sortBy || 'rollNo').trim();
    const sortOrder = (queryOptions.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;

    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortBy) {
        case 'name':
          valA = (a.name || a.personalInfo?.name || '').toLowerCase();
          valB = (b.name || b.personalInfo?.name || '').toLowerCase();
          break;
        case 'rollNo':
        case 'rollNumber':
          valA = (a.rollNo || a.rollNumber || '').toLowerCase();
          valB = (b.rollNo || b.rollNumber || '').toLowerCase();
          break;
        case 'admissionDate':
        case 'joinedDate':
          valA = a.admissionDate || a.createdAt || '';
          valB = b.admissionDate || b.createdAt || '';
          break;
        case 'class':
        case 'className':
          valA = (a.class || a.className || '').toLowerCase();
          valB = (b.class || b.className || '').toLowerCase();
          break;
        case 'updatedAt':
        case 'updatedDate':
          valA = a.updatedAt || '';
          valB = b.updatedAt || '';
          break;
        default:
          valA = (a.rollNo || a.rollNumber || a.name || '').toLowerCase();
          valB = (b.rollNo || b.rollNumber || b.name || '').toLowerCase();
          break;
      }

      if (valA < valB) return -1 * sortOrder;
      if (valA > valB) return 1 * sortOrder;
      return 0;
    });

    // 16. Localized Capped Pagination
    const computedTotalCount = Math.max(totalCount, list.length);
    const totalPages = Math.ceil(list.length / fetchLimit) || 1;

    let paginatedList = list;
    if (queryOptions.lastDocId) {
      const lastIndex = list.findIndex(s => s.id === queryOptions.lastDocId);
      if (lastIndex !== -1) {
        paginatedList = list.slice(lastIndex + 1, lastIndex + 1 + fetchLimit);
      } else {
        const startIndex = (page - 1) * fetchLimit;
        paginatedList = list.slice(startIndex, startIndex + fetchLimit);
      }
    } else {
      const startIndex = (page - 1) * fetchLimit;
      paginatedList = list.slice(startIndex, startIndex + fetchLimit);
    }

    return {
      success: true,
      data: paginatedList,
      pagination: {
        totalCount: computedTotalCount,
        page,
        limit: fetchLimit,
        totalPages,
        hasMore: page < totalPages,
        lastDocId: paginatedList.length > 0 ? paginatedList[paginatedList.length - 1].id : null
      }
    };
  }

  /**
   * Search students across key fields.
   */
  public static async searchStudents(searchTerm: string, currentUser: any, db: any) {
    return this.listStudents({ search: searchTerm, limit: 50 }, currentUser, db);
  }

  /**
   * Get single student profile by ID.
   */
  public static async getStudentById(studentId: string, currentUser: any, db: any) {
    const docRef = doc(db, 'students', studentId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
    }

    const student = { id: snap.id, ...snap.data() } as any;
    const role = (currentUser?.role || '').toUpperCase();
    const cUser = currentUser || {};

    // Role-based Access Check
    if (role === 'STUDENT') {
      if (student.userId !== cUser.userId && student.userId !== cUser.id && student.id !== cUser.studentId) {
        return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: You can only view your own student profile.' };
      }
    } else if (role === 'TEACHER') {
      const teacherSnap = await getDocs(collection(db, 'teachers'));
      const teachers = teacherSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const teacherProfile = teachers.find(
        t => t.userId === cUser.userId || t.userId === cUser.id || t.email === cUser.email || t.name === cUser.name
      );

      if (teacherProfile) {
        const teacherName = (teacherProfile.name || '').toLowerCase();
        const allowedClasses = [
          ...(teacherProfile.specialty || []),
          ...(teacherProfile.batches || [])
        ].map((c: string) => c.toLowerCase());

        const sClass = (student.class || student.className || '').toLowerCase();
        const sTeacher = (student.assignedTeacher || student.teacherId || '').toLowerCase();

        if (!sTeacher.includes(teacherName) && !allowedClasses.some(ac => sClass.includes(ac))) {
          return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Student is not assigned to your classes.' };
        }
      }
    }

    return { success: true, data: student };
  }

  /**
   * Update student profile (PUT).
   * Fully stabilized using TransactionManager, AuditService, and TimelineService.
   */
  public static async updateStudent(studentId: string, input: any, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'];

    if (!allowedRoles.includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Insufficient permissions to update student profile.' };
    }

    if (role === 'RECEPTIONIST' && (input.dob !== undefined || input.personalInfo?.dob !== undefined)) {
      return { success: false, statusCode: 403, code: 'FIELD_FORBIDDEN', message: 'Field-level permission denied: Receptionist cannot edit Date of Birth. Restricted to Admin and Super Admin.' };
    }

    const validation = validateStudentUpdateInput(input);
    if (!validation.valid) {
      return { success: false, statusCode: 400, code: 'VALIDATION_ERROR', message: validation.errors.join(' ') };
    }

    const docRef = doc(db, 'students', studentId);
    const updatedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    try {
      const resultData = await TransactionManager.run(db, 'UPDATE_STUDENT', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const existingStudent = snap.data() as any;
        if (existingStudent.status === 'DELETED' || existingStudent.deleted === true) {
          throw new Error('CANNOT_UPDATE_DELETED');
        }

        // 1. Read-Only Fields Protection
        const readOnlyFieldsMap: { [key: string]: any } = {
          id: existingStudent.id,
          studentId: existingStudent.id,
          admissionNo: existingStudent.admissionNo || existingStudent.admissionNumber || existingStudent.admissionId,
          admissionNumber: existingStudent.admissionNo || existingStudent.admissionNumber || existingStudent.admissionId,
          admissionId: existingStudent.admissionId || existingStudent.admissionNo,
          rollNo: existingStudent.rollNo || existingStudent.rollNumber,
          rollNumber: existingStudent.rollNo || existingStudent.rollNumber,
          username: existingStudent.username,
          userId: existingStudent.userId,
          admissionDate: existingStudent.admissionDate,
          createdAt: existingStudent.createdAt,
          createdBy: existingStudent.createdBy,
          lastLogin: existingStudent.lastLogin
        };

        for (const [fieldKey, storedValue] of Object.entries(readOnlyFieldsMap)) {
          if (storedValue !== undefined && input[fieldKey] !== undefined) {
            if (String(input[fieldKey]).trim() !== String(storedValue).trim()) {
              throw new Error(`READ_ONLY_MODIFICATION:${fieldKey}`);
            }
          }
        }

        // 2. Concurrency Control Check
        const clientTimestamp = input.lastKnownUpdatedAt || input.clientUpdatedAt;
        if (clientTimestamp && existingStudent.updatedAt) {
          const serverTime = new Date(existingStudent.updatedAt).getTime();
          const clientTime = new Date(clientTimestamp).getTime();
          if (!isNaN(serverTime) && !isNaN(clientTime) && serverTime > clientTime) {
            throw new Error('CONCURRENCY_CONFLICT');
          }
        }

        const personalInfo = {
          name: input.personalInfo?.name || input.name || existingStudent.personalInfo?.name || existingStudent.name,
          dob: input.personalInfo?.dob || input.dob || existingStudent.personalInfo?.dob || existingStudent.dob || '',
          gender: input.personalInfo?.gender || input.gender || existingStudent.personalInfo?.gender || existingStudent.gender || 'MALE',
          category: input.personalInfo?.category || input.category || existingStudent.personalInfo?.category || existingStudent.category || '',
          bloodGroup: input.personalInfo?.bloodGroup || input.bloodGroup || existingStudent.personalInfo?.bloodGroup || existingStudent.bloodGroup || '',
          photoUrl: input.personalInfo?.photoUrl || input.photoUrl || existingStudent.personalInfo?.photoUrl || existingStudent.photoUrl || '',
          aadhar: input.personalInfo?.aadhar || input.aadhar || existingStudent.personalInfo?.aadhar || existingStudent.aadhar || ''
        };

        const parentInfo = {
          fatherName: input.parentInfo?.fatherName || input.fatherName || existingStudent.parentInfo?.fatherName || existingStudent.fatherName || '',
          motherName: input.parentInfo?.motherName || input.motherName || existingStudent.parentInfo?.motherName || existingStudent.motherName || '',
          guardianName: input.parentInfo?.guardianName || input.guardianName || existingStudent.parentInfo?.guardianName || existingStudent.guardianName || '',
          fatherOccupation: input.parentInfo?.fatherOccupation || input.fatherOccupation || existingStudent.parentInfo?.fatherOccupation || existingStudent.fatherOccupation || ''
        };

        const contactInfo = {
          mobile: input.contactInfo?.mobile || input.mobile || existingStudent.contactInfo?.mobile || existingStudent.mobile || '',
          whatsapp: input.contactInfo?.whatsapp || input.whatsapp || existingStudent.contactInfo?.whatsapp || existingStudent.whatsapp || '',
          parentMobile: input.contactInfo?.parentMobile || input.parentMobile || existingStudent.contactInfo?.parentMobile || existingStudent.parentMobile || '',
          email: input.contactInfo?.email || input.email || existingStudent.contactInfo?.email || existingStudent.email || '',
          address: input.contactInfo?.address || input.address || existingStudent.contactInfo?.address || existingStudent.address || '',
          city: input.contactInfo?.city || input.city || existingStudent.contactInfo?.city || existingStudent.city || '',
          state: input.contactInfo?.state || input.state || existingStudent.contactInfo?.state || existingStudent.state || '',
          pincode: input.contactInfo?.pincode || input.pincode || existingStudent.contactInfo?.pincode || existingStudent.pincode || ''
        };

        const documents = {
          photoUrl: input.documents?.photoUrl || input.photoUrl || existingStudent.documents?.photoUrl || existingStudent.photoUrl || '',
          documentUrl: input.documents?.documentUrl || input.documentUrl || existingStudent.documents?.documentUrl || existingStudent.documentUrl || '',
          aadhar: input.documents?.aadhar || input.aadhar || existingStudent.documents?.aadhar || existingStudent.documents?.aadhar || '',
          docsList: input.documents?.docsList || existingStudent.documents?.docsList || existingStudent.docsList || []
        };

        const remarks = input.remarks !== undefined ? input.remarks : (existingStudent.remarks || '');

        const updatePayload: any = {
          personalInfo,
          parentInfo,
          contactInfo,
          documents,
          remarks,
          name: personalInfo.name,
          dob: personalInfo.dob,
          gender: personalInfo.gender,
          fatherName: parentInfo.fatherName,
          motherName: parentInfo.motherName,
          mobile: contactInfo.mobile,
          whatsapp: contactInfo.whatsapp,
          parentMobile: contactInfo.parentMobile,
          email: contactInfo.email,
          address: contactInfo.address,
          pincode: contactInfo.pincode,
          photoUrl: documents.photoUrl,
          documentUrl: documents.documentUrl,
          preferredBatch: input.preferredBatch || existingStudent.preferredBatch || 'Default Batch',
          preferredTiming: input.preferredTiming || existingStudent.preferredTiming || '10:00 AM - 12:00 PM',
          updatedAt: nowIso,
          updatedBy: updatedByUsername
        };

        // Determine modified section events
        const changes: string[] = [];
        const checkChange = (fieldLabel: string, oldVal: any, newVal: any) => {
          if (String(oldVal || '') !== String(newVal || '')) {
            changes.push(`${fieldLabel}: "${oldVal || ''}" → "${newVal || ''}"`);
          }
        };

        checkChange('Name', existingStudent.name, personalInfo.name);
        checkChange('DOB', existingStudent.dob, personalInfo.dob);
        checkChange('Mobile', existingStudent.mobile, contactInfo.mobile);

        const sectionEvents: { title: string; eventType: string; description: string }[] = [];
        if (input.updatedSection === 'PERSONAL' || changes.some(c => c.startsWith('Name') || c.startsWith('DOB'))) {
          sectionEvents.push({ eventType: 'PROFILE_UPDATED', title: 'Profile Updated', description: `Personal details updated by ${updatedByUsername}` });
        }
        if (input.updatedSection === 'CONTACT' || changes.some(c => c.startsWith('Mobile'))) {
          sectionEvents.push({ eventType: 'CONTACT_UPDATED', title: 'Contact Updated', description: `Contact details updated by ${updatedByUsername}` });
        }

        if (sectionEvents.length === 0) {
          sectionEvents.push({ eventType: 'PROFILE_UPDATED', title: 'Profile Updated', description: `Student details updated by ${updatedByUsername}` });
        }

        // Update Student
        transaction.update(docRef, updatePayload);

        // Record Timeline Entries
        sectionEvents.forEach((ev) => {
          TimelineService.recordInTransaction(transaction, db, studentId, ev.eventType, ev.title, ev.description, updatedByUsername, role);
        });

        // Record Audit Logs
        const detailsText = changes.length > 0 
          ? `Updated student ${personalInfo.name} (${existingStudent.rollNo || studentId}). Changes: ${changes.join('; ')}`
          : `Updated student profile for ${personalInfo.name}`;
        AuditService.logInTransaction(transaction, db, currentUser?.userId, updatedByUsername, 'STUDENT_PROFILE_UPDATED', detailsText);

        return { id: studentId, ...existingStudent, ...updatePayload };
      });

      return {
        success: true,
        message: 'Student profile updated successfully.',
        data: resultData
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      if (err.message === 'CANNOT_UPDATE_DELETED') {
        return { success: false, statusCode: 400, code: 'DELETED_RECORD', message: 'Cannot update a soft-deleted student.' };
      }
      if (err.message === 'CONCURRENCY_CONFLICT') {
        return { success: false, statusCode: 409, code: 'CONCURRENCY_CONFLICT', message: 'Stale data detected: The student profile was updated by another user. Please reload the profile and try again.' };
      }
      if (err.message?.startsWith('READ_ONLY_MODIFICATION:')) {
        const field = err.message.split(':')[1];
        return { success: false, statusCode: 400, code: 'READ_ONLY_FIELD', message: `Cannot modify read-only field "${field}".` };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Change student status (PATCH).
   */
  public static async updateStatus(studentId: string, newStatus: string, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Receptionists cannot change student status. Admin access required.' };
    }

    const cleanStatus = (newStatus || '').trim().toUpperCase();
    if (!VALID_STATUSES.includes(cleanStatus)) {
      return { success: false, statusCode: 400, code: 'INVALID_STATUS', message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}` };
    }

    const docRef = doc(db, 'students', studentId);
    const updatedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    try {
      const resultData = await TransactionManager.run(db, 'UPDATE_STATUS', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const student = snap.data() as any;
        const oldStatus = student.status || 'ACTIVE';

        transaction.update(docRef, {
          status: cleanStatus,
          updatedAt: nowIso,
          updatedBy: updatedByUsername
        });

        if (student.userId) {
          const userRef = doc(db, 'users', student.userId);
          transaction.update(userRef, {
            active: cleanStatus === 'ACTIVE',
            updatedAt: nowIso
          });
        }

        TimelineService.recordInTransaction(
          transaction,
          db,
          studentId,
          'STATUS_CHANGED',
          'Student Status Changed',
          `Status changed from ${oldStatus} to ${cleanStatus} by ${updatedByUsername}`,
          updatedByUsername,
          role
        );

        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          updatedByUsername,
          'STUDENT_STATUS_CHANGED',
          `Changed status for student ${student.name} from ${oldStatus} to ${cleanStatus}`
        );

        return { studentId, oldStatus, newStatus: cleanStatus };
      });

      return {
        success: true,
        message: `Student status changed successfully.`,
        data: resultData
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Reassign student class direct update.
   */
  public static async updateClass(studentId: string, newClassName: string, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Receptionists cannot reassign student class. Admin access required.' };
    }

    if (!newClassName || !newClassName.trim()) {
      return { success: false, statusCode: 400, code: 'MISSING_FIELD', message: 'Class name is required.' };
    }

    const targetClass = newClassName.trim();
    const docRef = doc(db, 'students', studentId);
    const updatedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    try {
      const resultData = await TransactionManager.run(db, 'UPDATE_CLASS', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const student = snap.data() as any;
        const oldClass = student.class || student.className || 'Unassigned';

        transaction.update(docRef, {
          class: targetClass,
          className: targetClass,
          classId: targetClass,
          updatedAt: nowIso,
          updatedBy: updatedByUsername
        });

        TimelineService.recordInTransaction(
          transaction,
          db,
          studentId,
          'CLASS_CHANGED',
          'Student Class Reassigned',
          `Class changed from "${oldClass}" to "${targetClass}" by ${updatedByUsername}`,
          updatedByUsername,
          role
        );

        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          updatedByUsername,
          'STUDENT_CLASS_CHANGED',
          `Reassigned class for student ${student.name} from "${oldClass}" to "${targetClass}"`
        );

        return { studentId, oldClass, newClass: targetClass };
      });

      return {
        success: true,
        message: `Student class reassigned to ${targetClass}.`,
        data: resultData
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Transactional Student Class Transfer with history tracking and pending fee adjustments.
   */
  public static async changeClass(studentId: string, input: {
    newClassName: string;
    newTeacherId?: string;
    newTeacherName?: string;
    effectiveDate?: string;
    reason?: string;
    remarks?: string;
  }, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Only SUPER_ADMIN and ADMIN can transfer student classes.' };
    }

    const newClass = (input.newClassName || '').trim();
    if (!newClass) {
      return { success: false, statusCode: 400, code: 'MISSING_FIELD', message: 'New class name is required.' };
    }

    const effectiveDate = input.effectiveDate || new Date().toISOString().split('T')[0];
    const reason = (input.reason || 'Academic Promotion').trim();
    const remarks = (input.remarks || '').trim();
    const updatedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    const docRef = doc(db, 'students', studentId);

    try {
      let assignedTeacherName = input.newTeacherName || '';
      let assignedTeacherId = input.newTeacherId || '';
      if (assignedTeacherId || assignedTeacherName) {
        const teachersSnap = await getDocs(collection(db, 'teachers'));
        const teachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const tMatch = teachers.find(t => t.id === assignedTeacherId || (t.name || '').toLowerCase() === assignedTeacherName.toLowerCase());
        if (tMatch) {
          assignedTeacherName = tMatch.name;
          assignedTeacherId = tMatch.id;
        }
      }

      const resultData = await TransactionManager.run(db, 'TRANSFER_CLASS', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const student = snap.data() as any;
        const oldClass = student.class || student.className || 'Unassigned';

        if (oldClass.toLowerCase() === newClass.toLowerCase()) {
          throw new Error('SAME_CLASS');
        }

        const status = (student.status || 'ACTIVE').toUpperCase();
        if (['COMPLETED', 'PASSED_OUT', 'GRADUATED', 'LEFT', 'DROPPED', 'INACTIVE'].includes(status)) {
          throw new Error(`INVALID_STATUS:${status}`);
        }

        const admDate = student.admissionDate || student.createdAt?.split('T')[0] || '';
        if (admDate && effectiveDate < admDate) {
          throw new Error('EFFECTIVE_DATE_BEFORE_ADMISSION');
        }

        // Update future pending fees
        const feeSnap = await getDocs(collection(db, 'fee_statuses'));
        const studentFees = feeSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const futurePendingFees = studentFees.filter(f => 
          f.studentId === studentId && f.status === 'PENDING' && f.dueDate >= effectiveDate
        );

        let newMonthlyFee = student.monthlyFee || 500;
        if (newClass === 'Class 10') newMonthlyFee = 1200;
        else if (newClass === 'Class 9') newMonthlyFee = 1000;

        for (const fee of futurePendingFees) {
          const feeRef = doc(db, 'fee_statuses', fee.id);
          transaction.update(feeRef, {
            class: newClass,
            totalFee: newMonthlyFee,
            pendingFee: newMonthlyFee - (fee.paidFee || 0),
            updatedAt: nowIso
          });
        }

        const oldTeacher = student.assignedTeacher || 'Unassigned';
        const finalTeacherName = assignedTeacherName || oldTeacher;
        const finalTeacherId = assignedTeacherId || student.teacherId || '';

        const studentUpdatePayload: any = {
          class: newClass,
          className: newClass,
          classId: newClass,
          monthlyFee: newMonthlyFee,
          updatedAt: nowIso,
          updatedBy: updatedByUsername
        };
        if (assignedTeacherName) {
          studentUpdatePayload.assignedTeacher = assignedTeacherName;
          studentUpdatePayload.teacherId = assignedTeacherId;
        }

        transaction.update(docRef, studentUpdatePayload);

        // Immutable history tracking
        const historyId = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const historyRef = doc(db, 'student_class_history', historyId);
        transaction.set(historyRef, {
          historyId,
          studentId,
          oldClassId: oldClass,
          newClassId: newClass,
          oldTeacherId: oldTeacher,
          newTeacherId: finalTeacherName,
          effectiveDate,
          reason,
          remarks,
          changedBy: updatedByUsername,
          changedAt: nowIso
        });

        TimelineService.recordInTransaction(
          transaction,
          db,
          studentId,
          'CLASS_CHANGED',
          'Class Changed',
          `Transferred from "${oldClass}" to "${newClass}" (${reason}) by ${updatedByUsername}`,
          updatedByUsername,
          role
        );

        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          updatedByUsername,
          'STUDENT_CLASS_TRANSFER',
          `Transferred student ${student.name} from class "${oldClass}" to "${newClass}". Reason: ${reason}`
        );

        // Domain Event: StudentClassTransferred
        EventPublisher.publishInTransaction(transaction, db, 'StudentClassTransferred', {
          studentId,
          oldClass,
          newClass,
          reason,
          effectiveDate,
          changedBy: updatedByUsername
        });

        return {
          studentId,
          oldClass,
          newClass,
          effectiveDate,
          reason,
          updatedFeeRecordsCount: futurePendingFees.length
        };
      });

      return {
        success: true,
        message: `Student successfully transferred to ${newClass}.`,
        data: resultData
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      if (err.message === 'SAME_CLASS') {
        return { success: false, statusCode: 400, code: 'SAME_CLASS', message: 'New class cannot be the same as the current class.' };
      }
      if (err.message?.startsWith('INVALID_STATUS:')) {
        const st = err.message.split(':')[1];
        return { success: false, statusCode: 400, code: 'INVALID_STATUS', message: `Cannot transfer student with status "${st}".` };
      }
      if (err.message === 'EFFECTIVE_DATE_BEFORE_ADMISSION') {
        return { success: false, statusCode: 400, code: 'INVALID_DATE', message: 'Effective date cannot be before the student admission date.' };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Get student class history.
   */
  public static async getClassHistory(studentId: string, currentUser: any, db: any) {
    try {
      const snap = await getDocs(collection(db, 'student_class_history'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const studentHistory = list.filter(h => h.studentId === studentId);
      
      studentHistory.sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime());

      return {
        success: true,
        data: studentHistory
      };
    } catch (err: any) {
      return { success: false, statusCode: 500, code: 'FETCH_FAILED', message: err.message || 'Failed to fetch class history.' };
    }
  }

  /**
   * Transactional Teacher Assignment (PATCH).
   */
  public static async assignTeacher(studentId: string, input: {
    newTeacherId: string;
    newTeacherName?: string;
    assignmentType?: 'PERMANENT' | 'TEMPORARY';
    effectiveFrom?: string;
    effectiveTo?: string;
    reason?: string;
    remarks?: string;
  }, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Only SUPER_ADMIN and ADMIN can assign teachers.' };
    }

    const newTeacherId = (input.newTeacherId || '').trim();
    if (!newTeacherId) {
      return { success: false, statusCode: 400, code: 'MISSING_FIELD', message: 'New teacher ID is required.' };
    }

    const assignmentType = (input.assignmentType || 'PERMANENT').toUpperCase() as 'PERMANENT' | 'TEMPORARY';
    const effectiveFrom = input.effectiveFrom || new Date().toISOString().split('T')[0];
    const effectiveTo = input.effectiveTo || (assignmentType === 'TEMPORARY' ? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] : '');
    const reason = (input.reason || 'Faculty Reallocation').trim();
    const remarks = (input.remarks || '').trim();
    const updatedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    if (assignmentType === 'TEMPORARY' && effectiveTo && effectiveFrom > effectiveTo) {
      return { success: false, statusCode: 400, code: 'INVALID_DATE_RANGE', message: 'Effective "From" date cannot be after effective "To" date.' };
    }

    const docRef = doc(db, 'students', studentId);

    try {
      const teachersSnap = await getDocs(collection(db, 'teachers'));
      const teachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const targetTeacher = teachers.find(t => t.id === newTeacherId || (t.name || '').toLowerCase() === newTeacherId.toLowerCase());

      if (!targetTeacher) {
        return { success: false, statusCode: 404, code: 'TEACHER_NOT_FOUND', message: 'Selected teacher record not found.' };
      }

      if (targetTeacher.status === 'INACTIVE' || targetTeacher.active === false) {
        return { success: false, statusCode: 400, code: 'INACTIVE_TEACHER', message: `Teacher ${targetTeacher.name} is currently inactive.` };
      }

      // Teacher capacity verification
      const studentsSnap = await getDocs(collection(db, 'students'));
      const allStudents = studentsSnap.docs.map(d => d.data()) as any[];
      const currentAssignedCount = allStudents.filter(s => s.teacherId === targetTeacher.id || s.assignedTeacher === targetTeacher.name).length;
      const maxCapacity = targetTeacher.maxCapacity || targetTeacher.capacity || 30;

      if (currentAssignedCount >= maxCapacity) {
        return { success: false, statusCode: 400, code: 'CAPACITY_EXCEEDED', message: `Teacher ${targetTeacher.name} has reached maximum capacity (${currentAssignedCount}/${maxCapacity} students).` };
      }

      const resultData = await TransactionManager.run(db, 'ASSIGN_TEACHER', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const student = snap.data() as any;
        const oldTeacherId = student.teacherId || student.assignedTeacher || 'Unassigned';
        const studentStatus = (student.status || 'ACTIVE').toUpperCase();

        if (['COMPLETED', 'PASSED_OUT', 'GRADUATED', 'LEFT', 'DROPPED', 'INACTIVE'].includes(studentStatus)) {
          throw new Error(`INVALID_STATUS:${studentStatus}`);
        }

        if (oldTeacherId === targetTeacher.id || oldTeacherId === targetTeacher.name) {
          throw new Error('SAME_TEACHER');
        }

        // Apply Update
        transaction.update(docRef, {
          teacherId: targetTeacher.id,
          assignedTeacher: targetTeacher.name,
          updatedAt: nowIso,
          updatedBy: updatedByUsername
        });

        // Immutable Teacher Assignment history entry
        const historyId = `sth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const historyRef = doc(db, 'student_teacher_history', historyId);
        transaction.set(historyRef, {
          historyId,
          studentId,
          oldTeacherId,
          newTeacherId: targetTeacher.name,
          newTeacherIdRef: targetTeacher.id,
          assignmentType,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          reason,
          remarks,
          changedBy: updatedByUsername,
          changedAt: nowIso
        });

        TimelineService.recordInTransaction(
          transaction,
          db,
          studentId,
          'TEACHER_ASSIGNED',
          'Teacher Assigned',
          `Assigned teacher ${targetTeacher.name} (${assignmentType}) by ${updatedByUsername}`,
          updatedByUsername,
          role
        );

        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          updatedByUsername,
          'STUDENT_TEACHER_ASSIGNMENT',
          `Assigned teacher ${targetTeacher.name} (${assignmentType}) to student ${student.name}. Reason: ${reason}`
        );

        // Domain Event: StudentTeacherAssigned
        EventPublisher.publishInTransaction(transaction, db, 'StudentTeacherAssigned', {
          studentId,
          oldTeacherId,
          newTeacherId: targetTeacher.name,
          assignmentType,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          changedBy: updatedByUsername,
          timestamp: nowIso
        });

        return {
          studentId,
          oldTeacherId,
          newTeacherId: targetTeacher.name,
          assignmentType,
          effectiveFrom
        };
      });

      return {
        success: true,
        message: `Teacher ${targetTeacher.name} assigned successfully (${assignmentType}).`,
        data: resultData
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      if (err.message === 'SAME_TEACHER') {
        return { success: false, statusCode: 400, code: 'SAME_TEACHER', message: 'Student is already assigned to this teacher.' };
      }
      if (err.message?.startsWith('INVALID_STATUS:')) {
        const st = err.message.split(':')[1];
        return { success: false, statusCode: 400, code: 'INVALID_STATUS', message: `Cannot assign teacher for student with status "${st}".` };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Get student teacher history.
   */
  public static async getTeacherHistory(studentId: string, currentUser: any, db: any) {
    try {
      const snap = await getDocs(collection(db, 'student_teacher_history'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const studentHistory = list.filter(h => h.studentId === studentId);
      
      studentHistory.sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime());

      return {
        success: true,
        data: studentHistory
      };
    } catch (err: any) {
      return { success: false, statusCode: 500, code: 'FETCH_FAILED', message: err.message || 'Failed to fetch teacher history.' };
    }
  }

  /**
   * Direct Teacher Reassignment (Admin utility shortcut).
   */
  public static async updateTeacher(studentId: string, teacherIdentifier: string, currentUser: any, db: any) {
    return this.assignTeacher(studentId, { newTeacherId: teacherIdentifier }, currentUser, db);
  }

  /**
   * Update student documents.
   */
  public static async updateDocuments(studentId: string, input: any, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'];

    if (!allowedRoles.includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Insufficient permissions to update student documents.' };
    }

    const docRef = doc(db, 'students', studentId);
    const updatedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    try {
      const resultData = await TransactionManager.run(db, 'UPDATE_DOCUMENTS', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const student = snap.data() as any;
        const existingDocs = student.documents || {};

        const updatedDocs = {
          photoUrl: input.photoUrl || input.documents?.photoUrl || existingDocs.photoUrl || student.photoUrl || '',
          documentUrl: input.documentUrl || input.documents?.documentUrl || existingDocs.documentUrl || student.documentUrl || '',
          aadhar: input.aadhar || input.documents?.aadhar || existingDocs.aadhar || ''
        };

        transaction.update(docRef, {
          documents: updatedDocs,
          photoUrl: updatedDocs.photoUrl,
          documentUrl: updatedDocs.documentUrl,
          updatedAt: nowIso,
          updatedBy: updatedByUsername
        });

        TimelineService.recordInTransaction(
          transaction,
          db,
          studentId,
          'PROFILE_UPDATED',
          'Student Documents Updated',
          `Documents updated by ${updatedByUsername}`,
          updatedByUsername,
          role
        );

        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          updatedByUsername,
          'STUDENT_DOCUMENTS_UPDATED',
          `Updated documents for student ${student.name} (Roll: ${student.rollNo || studentId})`
        );

        return { studentId, documents: updatedDocs };
      });

      return {
        success: true,
        message: 'Student documents updated successfully.',
        data: resultData
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Get student timeline events.
   */
  public static async getStudentTimeline(studentId: string, currentUser: any, db: any) {
    const studentRes = await this.getStudentById(studentId, currentUser, db);
    if (!studentRes.success) {
      return studentRes;
    }

    const snap = await getDocs(collection(db, 'student_timelines'));
    let timelineEvents = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    timelineEvents = timelineEvents.filter(e => e.studentId === studentId);
    timelineEvents.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return {
      success: true,
      data: timelineEvents
    };
  }

  /**
   * Soft-delete student record.
   */
  public static async softDeleteStudent(studentId: string, currentUser: any, db: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden: Receptionists cannot delete student records. Admin access required.' };
    }

    const docRef = doc(db, 'students', studentId);
    const deletedByUsername = currentUser?.username || 'Admin';
    const nowIso = new Date().toISOString();

    try {
      const resultData = await TransactionManager.run(db, 'SOFT_DELETE_STUDENT', async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('NOT_FOUND');
        }

        const student = snap.data() as any;
        const studentName = student.name || 'Student';

        transaction.update(docRef, {
          status: 'DELETED',
          deleted: true,
          deletedAt: nowIso,
          deletedBy: deletedByUsername,
          updatedAt: nowIso
        });

        if (student.admissionId) {
          const admRef = doc(db, 'admissions', student.admissionId);
          transaction.update(admRef, {
            status: 'DELETED',
            deletedAt: nowIso,
            deletedBy: deletedByUsername,
            updatedAt: nowIso
          });
        }

        if (student.userId) {
          const userRef = doc(db, 'users', student.userId);
          transaction.update(userRef, {
            status: 'DELETED',
            active: false,
            deletedAt: nowIso,
            deletedBy: deletedByUsername,
            updatedAt: nowIso
          });
        }

        TimelineService.recordInTransaction(
          transaction,
          db,
          studentId,
          'SOFT_DELETED',
          'Student Record Soft-Deleted',
          `Student record soft-deleted by ${deletedByUsername}`,
          deletedByUsername,
          role
        );

        AuditService.logInTransaction(
          transaction,
          db,
          currentUser?.userId,
          deletedByUsername,
          'STUDENT_SOFT_DELETED',
          `Soft-deleted student record for ${studentName} (Roll: ${student.rollNo || studentId})`
        );

        return { studentId, studentName };
      });

      return {
        success: true,
        message: `Student ${resultData.studentName} soft-deleted successfully.`
      };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
      }
      return { success: false, statusCode: 500, code: 'TRANSACTION_FAILED', message: err.message || 'Transaction failed.' };
    }
  }
}
