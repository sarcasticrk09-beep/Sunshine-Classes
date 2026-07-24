import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from '../shared/db';
import { query, where } from 'firebase/firestore';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { StudentFeeSetting } from '../../types';

export class StudentFeeSettingService {
  /**
   * Get student fee settings and calculate live fee preview.
   */
  public static async getStudentFeeSetting(studentId: string, db: any) {
    // 1. Fetch student document to get class & base fee
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) {
      return {
        success: false,
        statusCode: 404,
        code: 'STUDENT_NOT_FOUND',
        message: `Student with ID '${studentId}' not found.`
      };
    }
    const student = { id: studentDoc.id, ...studentDoc.data() } as any;

    // 2. Fetch fee structure for class to determine current class fee
    let classFee = Number(student.monthlyFee) || 0;
    if (student.class) {
      const structuresSnap = await getDocs(collection(db, 'fee_structures'));
      const activeStructure = structuresSnap.docs.find((d: any) => {
        const data = d.data();
        return data.status === 'ACTIVE' && (
          (data.classId || '').toLowerCase() === student.class.toLowerCase() ||
          (data.className || '').toLowerCase() === student.class.toLowerCase()
        );
      });
      if (activeStructure) {
        classFee = Number(activeStructure.data().monthlyFee) || classFee;
      }
    }
    if (classFee <= 0) classFee = 2000; // Fallback default for preview if unconfigured

    // 3. Fetch setting for student
    const settingsSnap = await getDocs(collection(db, 'student_fee_settings'));
    const settingDoc = settingsSnap.docs.find((d: any) => d.data().studentId === studentId);

    const setting: StudentFeeSetting | null = settingDoc ? ({
      settingId: settingDoc.id,
      ...settingDoc.data()
    } as StudentFeeSetting) : null;

    const activeConcession = setting && setting.status === 'ACTIVE' ? setting.concessionPercentage : 0;
    const concessionAmount = Math.round((classFee * activeConcession) / 100);
    const finalMonthlyFee = Math.max(0, classFee - concessionAmount);

    return {
      success: true,
      data: {
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo || student.id,
        class: student.class || '',
        classFee,
        setting,
        preview: {
          classFee,
          concessionPercentage: activeConcession,
          concessionAmount,
          finalMonthlyFee
        }
      }
    };
  }

  /**
   * Assign or update a percentage concession for a student.
   */
  public static async saveStudentFeeSetting(
    studentId: string,
    payload: {
      concessionPercentage: number;
      reason?: string;
      effectiveFrom: string;
      effectiveTill?: string;
      status?: 'ACTIVE' | 'INACTIVE';
      feeStructureId?: string;
    },
    currentUser: any,
    db: any
  ) {
    const { concessionPercentage, reason, effectiveFrom, effectiveTill, status, feeStructureId } = payload;

    // 1. Validations
    if (concessionPercentage === undefined || concessionPercentage === null || typeof concessionPercentage !== 'number') {
      return {
        success: false,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Concession percentage is required and must be a number.'
      };
    }

    if (concessionPercentage < 0 || concessionPercentage > 100) {
      return {
        success: false,
        statusCode: 400,
        code: 'INVALID_CONCESSION',
        message: 'Concession percentage must be between 0% and 100%.'
      };
    }

    if (!effectiveFrom) {
      return {
        success: false,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Effective from date is required.'
      };
    }

    if (effectiveTill && effectiveTill < effectiveFrom) {
      return {
        success: false,
        statusCode: 400,
        code: 'INVALID_DATE_RANGE',
        message: 'Effective till date cannot be before effective from date.'
      };
    }

    // 2. Ensure student exists
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) {
      return {
        success: false,
        statusCode: 404,
        code: 'STUDENT_NOT_FOUND',
        message: `Student with ID '${studentId}' not found.`
      };
    }
    const student = { id: studentDoc.id, ...studentDoc.data() } as any;

    const username = currentUser?.username || currentUser?.email || 'Admin';
    const userRole = currentUser?.role || 'ADMIN';
    const userId = currentUser?.id || 'system';
    const nowIso = new Date().toISOString();

    // 3. Find existing setting or create new ID
    const settingsSnap = await getDocs(collection(db, 'student_fee_settings'));
    const existingDoc = settingsSnap.docs.find((d: any) => d.data().studentId === studentId);
    const settingId = existingDoc ? existingDoc.id : `sfs-${studentId}`;
    const isUpdate = !!existingDoc;

    const newSetting: StudentFeeSetting = {
      settingId,
      studentId,
      feeStructureId: feeStructureId || '',
      concessionPercentage,
      reason: reason ? reason.trim() : '',
      effectiveFrom,
      effectiveTill: effectiveTill || '',
      status: status || 'ACTIVE',
      createdBy: existingDoc ? (existingDoc.data().createdBy || username) : username,
      createdAt: existingDoc ? (existingDoc.data().createdAt || nowIso) : nowIso,
      updatedAt: nowIso
    };

    await setDoc(doc(db, 'student_fee_settings', settingId), newSetting);

    // 4. Audit Log, Timeline, Domain Event
    const actionType = isUpdate ? 'CONCESSION_UPDATED' : 'CONCESSION_CREATED';
    const eventName = isUpdate ? 'StudentConcessionUpdated' : 'StudentConcessionCreated';

    await AuditService.log(
      db,
      userId,
      username,
      actionType,
      `${isUpdate ? 'Updated' : 'Assigned'} ${concessionPercentage}% fee concession for student ${student.name} (${student.rollNo || student.id}). Reason: ${reason || 'N/A'}`
    );

    await TimelineService.record(
      db,
      studentId,
      actionType,
      isUpdate ? '✏️ Fee Concession Updated' : '🏷️ Fee Concession Applied',
      `${concessionPercentage}% Concession ${isUpdate ? 'updated' : 'applied'}.${reason ? ` Reason: ${reason}` : ''}`,
      username,
      userRole
    );

    await EventPublisher.publish(db, eventName, {
      settingId,
      studentId,
      studentName: student.name,
      concessionPercentage,
      reason: reason || '',
      effectiveFrom,
      effectiveTill: effectiveTill || '',
      status: newSetting.status,
      updatedBy: username,
      updatedAt: nowIso
    });

    // 5. Calculate preview return data
    const previewRes = await this.getStudentFeeSetting(studentId, db);

    return {
      success: true,
      statusCode: isUpdate ? 200 : 201,
      message: `Fee concession of ${concessionPercentage}% ${isUpdate ? 'updated' : 'assigned'} successfully.`,
      data: previewRes.data
    };
  }

  /**
   * Remove or deactivate concession setting for a student.
   */
  public static async removeStudentFeeSetting(studentId: string, currentUser: any, db: any) {
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) {
      return {
        success: false,
        statusCode: 404,
        code: 'STUDENT_NOT_FOUND',
        message: `Student with ID '${studentId}' not found.`
      };
    }
    const student = { id: studentDoc.id, ...studentDoc.data() } as any;

    const settingsSnap = await getDocs(collection(db, 'student_fee_settings'));
    const existingDoc = settingsSnap.docs.find((d: any) => d.data().studentId === studentId);

    if (!existingDoc) {
      return {
        success: false,
        statusCode: 404,
        code: 'SETTING_NOT_FOUND',
        message: 'No fee concession setting found for this student.'
      };
    }

    const username = currentUser?.username || currentUser?.email || 'Admin';
    const userRole = currentUser?.role || 'ADMIN';
    const userId = currentUser?.id || 'system';
    const nowIso = new Date().toISOString();

    // Remove or set INACTIVE
    await deleteDoc(doc(db, 'student_fee_settings', existingDoc.id));

    await AuditService.log(
      db,
      userId,
      username,
      'CONCESSION_REMOVED',
      `Removed fee concession for student ${student.name} (${student.rollNo || student.id}).`
    );

    await TimelineService.record(
      db,
      studentId,
      'CONCESSION_REMOVED',
      '❌ Fee Concession Removed',
      `Fee concession removed by ${username}. Student will inherit normal class fee.`,
      username,
      userRole
    );

    await EventPublisher.publish(db, 'StudentConcessionRemoved', {
      settingId: existingDoc.id,
      studentId,
      studentName: student.name,
      removedBy: username,
      removedAt: nowIso
    });

    const previewRes = await this.getStudentFeeSetting(studentId, db);

    return {
      success: true,
      message: 'Student fee concession removed successfully.',
      data: previewRes.data
    };
  }

  /**
   * List/Search students filtered by concession settings (Has Concession, No Concession, Concession %, Class)
   */
  public static async searchConcessions(
    filters: {
      hasConcession?: string; // 'true' | 'false' | 'all'
      concessionPercentage?: string | number;
      className?: string;
      search?: string;
    },
    db: any
  ) {
    // 1. Fetch active students
    const studentsSnap = await getDocs(collection(db, 'students'));
    let students = studentsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // 2. Fetch all student fee settings
    const settingsSnap = await getDocs(collection(db, 'student_fee_settings'));
    const settingsMap = new Map<string, StudentFeeSetting>();
    settingsSnap.docs.forEach((d: any) => {
      const data = d.data() as StudentFeeSetting;
      settingsMap.set(data.studentId, { settingId: d.id, ...data });
    });

    // 3. Filter by Class if provided
    if (filters.className) {
      students = students.filter(
        (s: any) => (s.class || '').toLowerCase() === filters.className!.toLowerCase()
      );
    }

    // 4. Filter by text search if provided
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      students = students.filter(
        (s: any) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.rollNo || '').toLowerCase().includes(q) ||
          (s.id || '').toLowerCase().includes(q) ||
          (s.mobile || '').includes(q)
      );
    }

    // 5. Combine student data with concession settings
    let result = students.map((s: any) => {
      const setting = settingsMap.get(s.id);
      const activeConcession = setting && setting.status === 'ACTIVE' ? setting.concessionPercentage : 0;
      return {
        studentId: s.id,
        studentName: s.name,
        rollNo: s.rollNo || s.id,
        class: s.class || '',
        hasConcession: activeConcession > 0,
        concessionPercentage: activeConcession,
        reason: setting?.reason || '',
        effectiveFrom: setting?.effectiveFrom || '',
        effectiveTill: setting?.effectiveTill || '',
        settingStatus: setting?.status || 'NO_SETTING'
      };
    });

    // 6. Filter by Has Concession / No Concession
    if (filters.hasConcession === 'true') {
      result = result.filter(r => r.hasConcession);
    } else if (filters.hasConcession === 'false') {
      result = result.filter(r => !r.hasConcession);
    }

    // 7. Filter by exact / min Concession %
    if (filters.concessionPercentage !== undefined && filters.concessionPercentage !== '') {
      const targetPct = Number(filters.concessionPercentage);
      if (!isNaN(targetPct)) {
        result = result.filter(r => r.concessionPercentage === targetPct);
      }
    }

    return {
      success: true,
      totalCount: result.length,
      students: result
    };
  }
}
