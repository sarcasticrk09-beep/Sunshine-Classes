/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { PasswordService } from '../auth/PasswordService';
import {
  validateAdmissionInput,
  checkDuplicateStudent,
  generateRollNumber,
  generateUsername,
  generateTemporaryPassword,
  parseClassCode
} from './AdmissionUtils';

export class AdmissionService {
  /**
   * Complete Admission Workflow (All-or-Nothing Transaction)
   */
  public static async createAdmission(
    input: any,
    createdBy: { username: string; userId: string; role: string },
    db: any
  ) {
    // 1. Input Validation
    const validation = validateAdmissionInput(input);
    if (!validation.valid) {
      return {
        success: false,
        statusCode: 400,
        error: 'Validation failed',
        details: validation.errors
      };
    }

    // Read current data snapshots for duplicate check, roll numbers, and usernames
    const [studentsSnap, admissionsSnap, usersSnap, teachersSnap, feeConfigsSnap, deletedRollsSnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'admissions')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'teachers')),
      getDocs(collection(db, 'class_fee_configs')),
      getDocs(collection(db, 'deleted_roll_numbers'))
    ]);

    const existingStudents = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const existingAdmissions = admissionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const existingUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const existingTeachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const classFeeConfigs = feeConfigsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const deletedRollNumbers = deletedRollsSnap.docs.map(d => d.data()?.rollNo || d.id);

    // 2. Duplicate Student Check
    const dupCheck = checkDuplicateStudent(input, existingStudents, existingAdmissions);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        statusCode: 400,
        error: 'Duplicate Student Detected',
        message: dupCheck.reason
      };
    }

    // 3. Roll Number Generation (SC-YYYY-CC-SEQ)
    const allRolls = [
      ...existingStudents.map((s: any) => s.rollNo),
      ...existingAdmissions.map((a: any) => a.rollNo || a.id),
      ...deletedRollNumbers
    ].filter(Boolean);

    const admissionDate = input.date || input.admissionDate || new Date().toISOString().split('T')[0];
    const rollNo = generateRollNumber(input.className || input.class, admissionDate, allRolls);

    // 4. Student Username Generation
    const allUsernames = existingUsers.map((u: any) => u.username).filter(Boolean);
    const customUsername = input.username?.trim();
    
    let username = customUsername;
    if (!username) {
      username = generateUsername(input.studentName, input.className || input.class, allUsernames);
    } else {
      const isTaken = allUsernames.some(u => u.toLowerCase() === username.toLowerCase());
      if (isTaken) {
        return {
          success: false,
          statusCode: 400,
          error: `Username "${username}" is already taken. Please choose another username.`
        };
      }
    }

    // 5. Default Password Generation
    const tempPassword = input.password || generateTemporaryPassword();
    const passwordHash = await PasswordService.hashPassword(tempPassword);

    // 6. Class & Teacher Assignment
    const targetClass = (input.className || input.class || '').trim();
    
    // Find assigned teacher if configured for this class
    let assignedTeacherName = '';
    const matchingTeacher = existingTeachers.find((t: any) => {
      const specs = Array.isArray(t.specialty) ? t.specialty : [];
      const batches = Array.isArray(t.batches) ? t.batches : [];
      return specs.some((s: string) => s.toLowerCase().includes(targetClass.toLowerCase())) ||
             batches.some((b: string) => b.toLowerCase().includes(targetClass.toLowerCase()));
    });
    if (matchingTeacher) {
      assignedTeacherName = (matchingTeacher as any).name;
    }

    // 7. Determine Class Monthly Fee
    let monthlyFee: number | null = null;
    const feeCfg = classFeeConfigs.find((c: any) => (c.className || c.id || '').toLowerCase() === targetClass.toLowerCase()) as any;
    if (feeCfg && typeof feeCfg.monthlyFee === 'number' && feeCfg.monthlyFee > 0) {
      monthlyFee = feeCfg.monthlyFee;
    } else if (input.monthlyFee && Number(input.monthlyFee) > 0) {
      monthlyFee = Number(input.monthlyFee);
    } else if (input.initialFee && Number(input.initialFee) > 0) {
      monthlyFee = Number(input.initialFee);
    }

    if (!monthlyFee || monthlyFee <= 0) {
      return {
        success: false,
        statusCode: 400,
        error: `Fee configuration for "${targetClass}" is missing. Please configure class fee structure in Fee Management or provide an explicit monthly fee before proceeding with admission.`
      };
    }

    // IDs
    const now = new Date();
    const isoString = now.toISOString();
    const timestamp = Date.now();
    
    const userId = `u-std-${timestamp}`;
    const studentId = `st-${timestamp}`;
    const admissionId = `adm-${timestamp}`;

    // 8. Create Document Payload Models
    
    // User Account Document
    const userDoc = {
      id: userId,
      username: username,
      name: input.studentName.trim(),
      email: input.email?.trim() || `${username}@sunshineclasses.net`,
      role: 'STUDENT',
      password: passwordHash,
      passwordHash: passwordHash,
      phone: input.mobile?.trim() || '',
      mustChangePassword: true,
      firstLogin: true,
      active: true,
      isLocked: false,
      failedLoginAttempts: 0,
      createdAt: isoString,
      updatedAt: isoString
    };

    // Student Profile Document
    const studentDoc = {
      id: studentId,
      userId: userId,
      rollNo: rollNo,
      name: input.studentName.trim(),
      class: targetClass,
      fatherName: input.fatherName.trim(),
      motherName: input.motherName?.trim() || '',
      dob: input.dob.trim(),
      gender: input.gender.trim(),
      address: input.address.trim(),
      mobile: input.mobile.trim(),
      whatsapp: input.whatsapp?.trim() || input.mobile.trim(),
      parentMobile: input.parentMobile?.trim() || input.mobile.trim(),
      email: input.email?.trim() || `${username}@sunshineclasses.net`,
      preferredBatch: input.preferredBatch || `${targetClass} Standard Batch`,
      preferredTiming: input.preferredTiming || '08:00 AM - 10:00 AM',
      admissionDate: admissionDate,
      photoUrl: input.photoUrl || '',
      documentUrl: input.documentUrl || '',
      assignedTeacher: assignedTeacherName,
      status: 'ACTIVE',
      attendancePercentage: 100,
      monthlyFee: monthlyFee,
      discount: Number(input.discount || 0),
      scholarship: Number(input.scholarship || 0),
      createdAt: isoString,
      updatedAt: isoString
    };

    // Admission Record Document
    const admissionDoc = {
      id: admissionId,
      admissionNo: rollNo,
      rollNo: rollNo,
      studentId: studentId,
      userId: userId,
      studentName: input.studentName.trim(),
      fatherName: input.fatherName.trim(),
      motherName: input.motherName?.trim() || '',
      dob: input.dob.trim(),
      gender: input.gender.trim(),
      className: targetClass,
      class: targetClass,
      previousSchool: input.previousSchool?.trim() || '',
      mobile: input.mobile.trim(),
      whatsapp: input.whatsapp?.trim() || input.mobile.trim(),
      parentMobile: input.parentMobile?.trim() || input.mobile.trim(),
      email: input.email?.trim() || `${username}@sunshineclasses.net`,
      address: input.address.trim(),
      aadhar: input.aadhar?.trim() || '',
      photoUrl: input.photoUrl || '',
      documentUrl: input.documentUrl || '',
      preferredBatch: input.preferredBatch || `${targetClass} Standard Batch`,
      preferredTiming: input.preferredTiming || '08:00 AM - 10:00 AM',
      status: 'APPROVED',
      date: admissionDate,
      createdBy: createdBy.username,
      assignedTeacher: assignedTeacherName,
      monthlyFee: monthlyFee,
      createdAt: isoString,
      updatedAt: isoString
    };

    // Current Month Fee Record
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();
    const feeMonthStr = `${currentMonthName} ${currentYear}`; // e.g. "July 2026"
    
    // Fee Due Date (e.g., 10th of current month)
    const dueDateStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;

    const feeStatusId = `fee-${studentId}-${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const initialFeeDoc = {
      id: feeStatusId,
      studentId: studentId,
      studentName: input.studentName.trim(),
      class: targetClass,
      month: feeMonthStr,
      totalFee: monthlyFee,
      discount: Number(input.discount || 0),
      scholarship: Number(input.scholarship || 0),
      paidFee: 0,
      pendingFee: Math.max(0, monthlyFee - Number(input.discount || 0) - Number(input.scholarship || 0)),
      status: 'PENDING',
      dueDate: dueDateStr,
      billingPeriod: `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      monthNum: now.getMonth() + 1,
      yearNum: currentYear,
      billingMonth: currentMonthName,
      billingYear: String(currentYear),
      paymentHistory: [],
      createdAt: isoString,
      updatedAt: isoString
    };

    // Audit Log Entry
    const logId = `L-ADM-${timestamp}`;
    const auditLogDoc = {
      id: logId,
      userId: createdBy.userId || 'system',
      username: createdBy.username || 'Admin',
      action: 'ADMISSION_CREATED',
      details: `Created new admission for ${input.studentName} (${targetClass}). Roll No: ${rollNo}, Username: ${username}, Initial Fee: ₹${monthlyFee}`,
      timestamp: isoString
    };

    // 9. Execute Atomic Firestore Transaction
    try {
      await runTransaction(db, async (transaction) => {
        transaction.set(doc(db, 'users', userId), userDoc);
        transaction.set(doc(db, 'students', studentId), studentDoc);
        transaction.set(doc(db, 'admissions', admissionId), admissionDoc);
        transaction.set(doc(db, 'fee_statuses', feeStatusId), initialFeeDoc);
        transaction.set(doc(db, 'audit_logs', logId), auditLogDoc);
      });

      return {
        success: true,
        message: 'Admission created successfully.',
        data: {
          admission: admissionDoc,
          student: studentDoc,
          user: {
            id: userId,
            username: username,
            name: userDoc.name,
            role: 'STUDENT',
            temporaryPassword: tempPassword,
            mustChangePassword: true,
            firstLogin: true
          },
          rollNo: rollNo,
          initialFee: initialFeeDoc
        }
      };
    } catch (txErr: any) {
      console.error('[AdmissionService.createAdmission] Transaction error:', txErr);
      return {
        success: false,
        statusCode: 500,
        error: 'Transaction failed',
        message: txErr.message || 'Failed to persist admission records consistently.'
      };
    }
  }

  /**
   * Search / List Admissions with Filters and Pagination
   */
  public static async getAdmissions(
    queryOptions: {
      page?: number;
      limit?: number;
      search?: string;
      className?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    currentUser: any,
    db: any
  ) {
    const page = Math.max(1, Number(queryOptions.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryOptions.limit) || 20));
    
    // Fetch admissions collection
    const snap = await getDocs(collection(db, 'admissions'));
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Soft-deleted records filter: exclude DELETED records unless explicitly requested
    const filterStatusUpper = (queryOptions.status || '').trim().toUpperCase();
    if (filterStatusUpper !== 'DELETED') {
      list = list.filter((item: any) => item.status !== 'DELETED');
    }

    // Permission filtering
    const role = (currentUser?.role || '').toUpperCase();
    if (role === 'TEACHER') {
      // Teacher can only view admissions for classes/batches assigned to them
      const teacherSnap = await getDocs(collection(db, 'teachers'));
      const teachers = teacherSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const cUser = currentUser as any;
      const teacherProfile = teachers.find(t => t.userId === cUser?.userId || t.userId === cUser?.id || t.email === cUser?.email || t.name === cUser?.name);

      if (teacherProfile) {
        const allowedClasses = [
          ...((teacherProfile as any).specialty || []),
          ...((teacherProfile as any).batches || [])
        ].map((c: string) => c.toLowerCase());

        list = list.filter((a: any) => {
          const aClass = (a.className || a.class || '').toLowerCase();
          return allowedClasses.some(ac => aClass.includes(ac) || ac.includes(aClass));
        });
      } else {
        list = [];
      }
    } else if (role === 'STUDENT') {
      // Student can only view their own admission record
      list = list.filter((a: any) => a.userId === currentUser.userId || a.userId === currentUser.id || a.studentId === currentUser.id);
    }

    // Search filter (Student Name, Roll Number, Username, Class, Mobile, Admission Date, Status)
    const search = (queryOptions.search || '').trim().toLowerCase();
    if (search) {
      list = list.filter((item: any) => {
        const nameMatch = (item.studentName || '').toLowerCase().includes(search);
        const rollMatch = (item.rollNo || item.admissionNo || item.id || '').toLowerCase().includes(search);
        const usernameMatch = (item.username || '').toLowerCase().includes(search);
        const classMatch = (item.className || item.class || '').toLowerCase().includes(search);
        const mobileMatch = (item.mobile || '').includes(search) || (item.parentMobile || '').includes(search);
        const dateMatch = (item.date || item.admissionDate || '').includes(search);
        const statusMatch = (item.status || '').toLowerCase().includes(search);

        return nameMatch || rollMatch || usernameMatch || classMatch || mobileMatch || dateMatch || statusMatch;
      });
    }

    // Class Filter
    if (queryOptions.className) {
      const filterClass = queryOptions.className.trim().toLowerCase();
      list = list.filter((item: any) => (item.className || item.class || '').toLowerCase() === filterClass);
    }

    // Status Filter
    if (queryOptions.status) {
      const filterStatus = queryOptions.status.trim().toUpperCase();
      list = list.filter((item: any) => (item.status || '').toUpperCase() === filterStatus);
    }

    // Date Range Filter
    if (queryOptions.startDate) {
      list = list.filter((item: any) => (item.date || item.admissionDate || '') >= queryOptions.startDate!);
    }
    if (queryOptions.endDate) {
      list = list.filter((item: any) => (item.date || item.admissionDate || '') <= queryOptions.endDate!);
    }

    // Sort by Date descending
    list.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedItems,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages
      }
    };
  }

  /**
   * Get single admission by ID
   */
  public static async getAdmissionById(id: string, currentUser: any, db: any) {
    const docRef = doc(db, 'admissions', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, error: 'Admission record not found.' };
    }

    const admission = { id: snap.id, ...snap.data() } as any;
    const role = (currentUser?.role || '').toUpperCase();
    const cUser = currentUser as any;

    // Permission check for student
    if (role === 'STUDENT') {
      if (admission.userId !== cUser?.userId && admission.userId !== cUser?.id) {
        return { success: false, statusCode: 403, error: 'Forbidden: You can only view your own admission record.' };
      }
    }

    return { success: true, data: admission };
  }

  /**
   * Update Admission
   */
  public static async updateAdmission(
    id: string,
    updates: any,
    updatedBy: { username: string; userId: string; role: string },
    db: any
  ) {
    const role = (updatedBy.role || '').toUpperCase();
    if (role === 'STUDENT' || role === 'TEACHER') {
      return { success: false, statusCode: 403, error: 'Forbidden: You do not have permission to edit admissions.' };
    }

    const docRef = doc(db, 'admissions', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, error: 'Admission record not found.' };
    }

    const existingDoc = snap.data();
    const nowIso = new Date().toISOString();

    const classChanged = updates.className && updates.className !== existingDoc.className;
    const teacherChanged = updates.assignedTeacher && updates.assignedTeacher !== existingDoc.assignedTeacher;

    const updatedAdmission = {
      ...existingDoc,
      ...updates,
      updatedAt: nowIso
    };

    // Also update student profile document if present
    if (existingDoc.studentId) {
      try {
        const studentRef = doc(db, 'students', existingDoc.studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          await updateDoc(studentRef, {
            name: updates.studentName || studentSnap.data().name,
            class: updates.className || updates.class || studentSnap.data().class,
            fatherName: updates.fatherName || studentSnap.data().fatherName,
            mobile: updates.mobile || studentSnap.data().mobile,
            parentMobile: updates.parentMobile || studentSnap.data().parentMobile,
            address: updates.address || studentSnap.data().address,
            assignedTeacher: updates.assignedTeacher || studentSnap.data().assignedTeacher,
            updatedAt: nowIso
          });
        }
      } catch (err) {
        console.warn('Warning updating associated student profile:', err);
      }
    }

    await setDoc(docRef, updatedAdmission, { merge: true });

    // Audit Log for changes
    let logMsg = `Updated admission for ${existingDoc.studentName} (${id})`;
    if (classChanged) logMsg += `. Class changed to ${updates.className}`;
    if (teacherChanged) logMsg += `. Teacher changed to ${updates.assignedTeacher}`;

    const logId = `L-ADM-UPD-${Date.now()}`;
    await setDoc(doc(db, 'audit_logs', logId), {
      id: logId,
      userId: updatedBy.userId,
      username: updatedBy.username,
      action: classChanged ? 'CLASS_CHANGED' : (teacherChanged ? 'TEACHER_CHANGED' : 'ADMISSION_UPDATED'),
      details: logMsg,
      timestamp: nowIso
    });

    return { success: true, message: 'Admission updated successfully.', data: updatedAdmission };
  }

  /**
   * Delete Admission (Restricted to SUPER_ADMIN & ADMIN)
   */
  public static async deleteAdmission(
    id: string,
    deletedBy: { username: string; userId: string; role: string },
    db: any
  ) {
    const role = (deletedBy.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, statusCode: 403, error: 'Forbidden: Only Super Admins and Admins can delete admissions.' };
    }

    const docRef = doc(db, 'admissions', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, statusCode: 404, error: 'Admission record not found.' };
    }

    const admData = snap.data();
    const rollNo = admData.rollNo || admData.admissionNo;

    const nowIso = new Date().toISOString();

    // Record deleted roll number into deleted_roll_numbers so it is NEVER reused
    if (rollNo) {
      await setDoc(doc(db, 'deleted_roll_numbers', rollNo), {
        rollNo,
        studentName: admData.studentName,
        deletedBy: deletedBy.username,
        deletedAt: nowIso
      });
    }

    // Soft delete admission record by updating status to DELETED
    await updateDoc(docRef, {
      status: 'DELETED',
      deletedAt: nowIso,
      deletedBy: deletedBy.username,
      updatedAt: nowIso
    });

    // Soft delete / deactivate student profile record if linked
    if (admData.studentId) {
      try {
        const studentRef = doc(db, 'students', admData.studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          await updateDoc(studentRef, {
            status: 'DELETED',
            active: false,
            deletedAt: nowIso,
            deletedBy: deletedBy.username,
            updatedAt: nowIso
          });
        }
      } catch (e) {
        console.warn('Warning soft-deleting associated student doc:', e);
      }
    }

    // Deactivate associated user account if linked
    if (admData.userId) {
      try {
        const userRef = doc(db, 'users', admData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, {
            status: 'DELETED',
            active: false,
            deletedAt: nowIso,
            deletedBy: deletedBy.username,
            updatedAt: nowIso
          });
        }
      } catch (e) {
        console.warn('Warning deactivating associated user doc:', e);
      }
    }

    // Audit Log
    const logId = `L-ADM-DEL-${Date.now()}`;
    await setDoc(doc(db, 'audit_logs', logId), {
      id: logId,
      userId: deletedBy.userId,
      username: deletedBy.username,
      action: 'ADMISSION_DELETED',
      details: `Deleted admission record ${id} (Roll No: ${rollNo}, Student: ${admData.studentName})`,
      timestamp: new Date().toISOString()
    });

    return { success: true, message: 'Admission record deleted successfully.' };
  }
}
