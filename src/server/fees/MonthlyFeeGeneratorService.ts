import { collection, doc, getDoc, getDocs, setDoc, runTransaction } from '../shared/db';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { parseMonthYear, formatMonthYear, getDueDateForMonth } from '../../utils/feeEngine';

export interface FeeStructureSnapshot {
  id: string;
  classId: string;
  className: string;
  monthlyFee: number;
  quarterlyDiscountEnabled: boolean;
  quarterlyDiscountType: 'PERCENTAGE' | 'FIXED';
  quarterlyDiscountValue: number;
}

export interface StudentMonthlyFee {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  class: string;
  preferredBatch: string;
  month: string;
  monthVal: number;
  baseFee: number;
  discountApplied: number;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  dueDate: string;
  feeStructureSnapshot: FeeStructureSnapshot | null;
  generatedBy: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  originalClassFee?: number;
  concessionPercentage?: number;
  concessionAmount?: number;
  concessionReason?: string;
}

export interface FeeGenerationReport {
  id: string;
  targetMonth: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  totalStudentsProcessed: number;
  totalFeesGenerated: number;
  totalAmount: number;
  students: Array<{
    studentId: string;
    name: string;
    rollNo: string;
    class: string;
    feeId: string;
    month: string;
    amount: number;
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
    error?: string;
  }>;
  generatedBy: string;
  generatedAt: string;
}

export class MonthlyFeeGeneratorService {
  /**
   * Determine the correct start month for fee generation based on student's admission date:
   * - Admission <= 10th of month: current month
   * - Admission > 10th of month: next month
   */
  public static getStudentStartMonth(admissionDateStr: string): string {
    if (!admissionDateStr) return "June 2026";
    const parts = admissionDateStr.split('-');
    if (parts.length < 3) return "June 2026";
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];

    if (day <= 10) {
      return `${monthNames[monthIdx]} ${year}`;
    } else {
      let nextMonthIdx = monthIdx + 1;
      let nextYear = year;
      if (nextMonthIdx > 11) {
        nextMonthIdx = 0;
        nextYear++;
      }
      return `${monthNames[nextMonthIdx]} ${nextYear}`;
    }
  }

  /**
   * Generates a list of month names (e.g., ["June 2026", "July 2026"]) between start and target month inclusive.
   */
  public static getMonthsInRange(startMonth: string, targetMonth: string): string[] {
    const start = parseMonthYear(startMonth);
    const end = parseMonthYear(targetMonth);
    
    if (start.val > end.val) return [];
    
    const months: string[] = [];
    for (let val = start.val; val <= end.val; val++) {
      months.push(formatMonthYear(val));
    }
    return months;
  }

  /**
   * Calculates the active quarterly discount if applicable.
   * Quarter-starting months: January, April, July, October
   */
  public static calculateQuarterlyDiscount(month: string, structure: any): number {
    if (!structure || !structure.quarterlyDiscountEnabled) return 0;
    
    const parsed = parseMonthYear(month);
    // Quarter starting months are January (1), April (4), July (7), October (10)
    const isQuarterStart = [1, 4, 7, 10].includes(parsed.month);
    if (!isQuarterStart) return 0;

    const baseFee = Number(structure.monthlyFee) || 0;
    const value = Number(structure.quarterlyDiscountValue) || 0;

    if (structure.quarterlyDiscountType === 'PERCENTAGE') {
      return Math.min(baseFee, baseFee * (value / 100));
    } else {
      return Math.min(baseFee, value);
    }
  }

  /**
   * Helper to fetch active concession setting for a student and calculate concession amount
   */
  public static getActiveConcession(studentId: string, monthStr: string, baseFee: number, allFeeSettings: any[]): { concessionPercentage: number; concessionAmount: number; reason: string } {
    if (!allFeeSettings || allFeeSettings.length === 0) {
      return { concessionPercentage: 0, concessionAmount: 0, reason: '' };
    }

    const studentSetting = allFeeSettings.find((s: any) => s.studentId === studentId && s.status === 'ACTIVE');
    if (!studentSetting) {
      return { concessionPercentage: 0, concessionAmount: 0, reason: '' };
    }

    const percentage = Number(studentSetting.concessionPercentage) || 0;
    if (percentage <= 0 || percentage > 100) {
      return { concessionPercentage: 0, concessionAmount: 0, reason: '' };
    }

    // Date range check if effectiveFrom/effectiveTill are provided
    const parsed = parseMonthYear(monthStr);
    if (parsed && parsed.val > 0) {
      const monthStartIso = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-01`;
      const monthEndIso = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-31`;

      if (studentSetting.effectiveFrom && studentSetting.effectiveFrom > monthEndIso) {
        return { concessionPercentage: 0, concessionAmount: 0, reason: '' };
      }
      if (studentSetting.effectiveTill && studentSetting.effectiveTill < monthStartIso) {
        return { concessionPercentage: 0, concessionAmount: 0, reason: '' };
      }
    }

    const concessionAmount = Math.round((baseFee * percentage) / 100);
    return {
      concessionPercentage: percentage,
      concessionAmount,
      reason: studentSetting.reason || ''
    };
  }

  /**
   * Get target monthly fee and discount structure snapshot for a class.
   */
  public static async getFeeStructureForClass(className: string, db: any): Promise<any | null> {
    const structuresSnap = await getDocs(collection(db, 'fee_structures'));
    const active = structuresSnap.docs.find((d: any) => {
      const data = d.data();
      return data.status === 'ACTIVE' && (
        (data.classId || '').toLowerCase() === className.toLowerCase() ||
        (data.className || '').toLowerCase() === className.toLowerCase()
      );
    });
    return active ? { id: active.id, ...active.data() } : null;
  }

  /**
   * Generate preview of monthly fees that would be created
   */
  public static async generatePreview(month: string, classId: string | null, currentUser: any, db: any) {
    const parsedTarget = parseMonthYear(month);
    if (!parsedTarget || parsedTarget.val === 0) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: "Invalid month format. Expected 'Month Year' (e.g. 'July 2026')." };
    }

    // 1. Fetch active students
    const studentsSnap = await getDocs(collection(db, 'students'));
    let activeStudents = studentsSnap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((s: any) => s.status === 'ACTIVE');

    if (classId) {
      activeStudents = activeStudents.filter((s: any) => 
        (s.class || '').toLowerCase() === classId.toLowerCase() ||
        (s.preferredBatch || '').toLowerCase() === classId.toLowerCase()
      );
    }

    // 2. Fetch existing generated monthly fees & student fee settings
    const [existingFeesSnap, feeSettingsSnap] = await Promise.all([
      getDocs(collection(db, 'student_monthly_fees')),
      getDocs(collection(db, 'student_fee_settings'))
    ]);
    const existingFees = existingFeesSnap.docs.map((d: any) => d.data());
    const allFeeSettings = feeSettingsSnap.docs.map((d: any) => d.data());

    const previewDetails: Array<{
      studentId: string;
      name: string;
      rollNo: string;
      class: string;
      month: string;
      amount: number;
      isBackfill: boolean;
      originalClassFee?: number;
      concessionPercentage?: number;
      concessionAmount?: number;
    }> = [];

    let totalAmount = 0;

    // 3. Process preview
    for (const student of activeStudents) {
      const startMonth = this.getStudentStartMonth(student.admissionDate);
      const startParsed = parseMonthYear(startMonth);
      
      // If student enrollment is in the future relative to target month, skip
      if (startParsed.val > parsedTarget.val) {
        continue;
      }

      const range = this.getMonthsInRange(startMonth, month);
      
      for (const m of range) {
        // Check if already generated
        const alreadyExists = existingFees.some((f: any) => f.studentId === student.id && f.month === m);
        if (alreadyExists) {
          continue;
        }

        // Determine fee structure
        const structure = await this.getFeeStructureForClass(student.class, db);
        const baseFee = structure ? Number(structure.monthlyFee) : (Number(student.monthlyFee) || 500);

        if (baseFee <= 0) {
          return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'Monthly fee must be greater than zero.' };
        }

        const qDiscount = this.calculateQuarterlyDiscount(m, structure);
        const concessionInfo = this.getActiveConcession(student.id, m, baseFee, allFeeSettings);
        const discountApplied = qDiscount + concessionInfo.concessionAmount;
        const totalFee = Math.max(0, baseFee - discountApplied);

        previewDetails.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          month: m,
          amount: totalFee,
          isBackfill: m !== month,
          originalClassFee: baseFee,
          concessionPercentage: concessionInfo.concessionPercentage,
          concessionAmount: concessionInfo.concessionAmount
        });

        totalAmount += totalFee;
      }
    }

    return {
      success: true,
      data: {
        totalStudents: activeStudents.length,
        totalAmount,
        details: previewDetails
      }
    };
  }

  /**
   * Run the actual monthly fee generation engine (Resume-safe & duplicate-proof)
   */
  public static async generateFees(month: string, classId: string | null, currentUser: any, db: any) {
    const parsedTarget = parseMonthYear(month);
    if (!parsedTarget || parsedTarget.val === 0) {
      return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: "Invalid month format. Expected 'Month Year' (e.g. 'July 2026')." };
    }

    const username = currentUser?.username || 'Admin';
    const userRole = currentUser?.role || 'ADMIN';
    const userId = currentUser?.id || 'system';
    const nowIso = new Date().toISOString();

    // 1. Fetch active students
    const studentsSnap = await getDocs(collection(db, 'students'));
    let activeStudents = studentsSnap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((s: any) => s.status === 'ACTIVE');

    if (classId) {
      activeStudents = activeStudents.filter((s: any) => 
        (s.class || '').toLowerCase() === classId.toLowerCase() ||
        (s.preferredBatch || '').toLowerCase() === classId.toLowerCase()
      );
    }

    // 2. Fetch existing generated monthly fees & student fee settings
    const [existingFeesSnap, feeSettingsSnap] = await Promise.all([
      getDocs(collection(db, 'student_monthly_fees')),
      getDocs(collection(db, 'student_fee_settings'))
    ]);
    const existingFees = existingFeesSnap.docs.map((d: any) => d.data());
    const allFeeSettings = feeSettingsSnap.docs.map((d: any) => d.data());

    const generatedFees: StudentMonthlyFee[] = [];
    const reportStudents: Array<{
      studentId: string;
      name: string;
      rollNo: string;
      class: string;
      feeId: string;
      month: string;
      amount: number;
      status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
      error?: string;
    }> = [];

    let totalFeesGenerated = 0;
    let totalAmount = 0;

    // 3. Process inside a batch write / sequential run transaction to ensure resume-safety
    for (const student of activeStudents) {
      const startMonth = this.getStudentStartMonth(student.admissionDate);
      const startParsed = parseMonthYear(startMonth);
      
      if (startParsed.val > parsedTarget.val) {
        reportStudents.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          feeId: '',
          month,
          amount: 0,
          status: 'SKIPPED',
          error: `Admission date is past target month. Student starts in ${startMonth}.`
        });
        continue;
      }

      const range = this.getMonthsInRange(startMonth, month);

      for (const m of range) {
        const uniqueId = `smf-${student.id}-${m.replace(/\s+/g, '-')}`;
        
        // Resume Safe: skip if already generated
        const alreadyExists = existingFees.some((f: any) => f.id === uniqueId);
        if (alreadyExists) {
          reportStudents.push({
            studentId: student.id,
            name: student.name,
            rollNo: student.rollNo,
            class: student.class,
            feeId: uniqueId,
            month: m,
            amount: 0,
            status: 'SKIPPED',
            error: `Fee record already exists for ${m}.`
          });
          continue;
        }

        // Determine fee structure and details
        const structure = await this.getFeeStructureForClass(student.class, db);
        const baseFee = structure ? Number(structure.monthlyFee) : (Number(student.monthlyFee) || 500);

        if (baseFee <= 0) {
          return { success: false, statusCode: 400, code: 'BAD_REQUEST', message: 'Monthly fee must be greater than zero.' };
        }

        const qDiscount = this.calculateQuarterlyDiscount(m, structure);
        const concessionInfo = this.getActiveConcession(student.id, m, baseFee, allFeeSettings);
        const discountApplied = qDiscount + concessionInfo.concessionAmount;
        const totalFee = Math.max(0, baseFee - discountApplied);
        const dueDate = getDueDateForMonth(m, student.dueDay || 10);

        const snapshot: FeeStructureSnapshot | null = structure ? {
          id: structure.id,
          classId: structure.classId || '',
          className: structure.className || '',
          monthlyFee: Number(structure.monthlyFee),
          quarterlyDiscountEnabled: !!structure.quarterlyDiscountEnabled,
          quarterlyDiscountType: structure.quarterlyDiscountType || 'PERCENTAGE',
          quarterlyDiscountValue: Number(structure.quarterlyDiscountValue || 0)
        } : null;

        const newFee: StudentMonthlyFee = {
          id: uniqueId,
          studentId: student.id,
          studentName: student.name,
          rollNo: student.rollNo || '',
          class: student.class || '',
          preferredBatch: student.preferredBatch || '',
          month: m,
          monthVal: parseMonthYear(m).val,
          baseFee,
          discountApplied,
          totalFee,
          paidFee: 0,
          pendingFee: totalFee,
          status: 'PENDING',
          dueDate,
          feeStructureSnapshot: snapshot,
          originalClassFee: baseFee,
          concessionPercentage: concessionInfo.concessionPercentage,
          concessionAmount: concessionInfo.concessionAmount,
          concessionReason: concessionInfo.reason,
          generatedBy: username,
          generatedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso
        };

        try {
          // Perform writing inside transaction or direct setDoc
          await setDoc(doc(db, 'student_monthly_fees', uniqueId), newFee);

          // 1. Audit log
          await AuditService.log(
            db,
            userId,
            username,
            'MONTHLY_FEE_GENERATED',
            `Generated monthly fee of ${totalFee} for student ${student.name} (${student.rollNo}) for ${m}.`
          );

          // 2. Timeline entry
          await TimelineService.record(
            db,
            student.id,
            'MONTHLY_FEE_GENERATED',
            '💰 Monthly Fee Generated',
            `Monthly fee of ₹${totalFee} generated for ${m}.`,
            username,
            userRole
          );

          // 3. Publish domain event
          await EventPublisher.publish(
            db,
            'MonthlyFeeGenerated',
            {
              studentId: student.id,
              name: student.name,
              rollNo: student.rollNo,
              class: student.class,
              month: m,
              amount: totalFee,
              status: 'PENDING',
              generatedBy: username,
              generatedAt: nowIso
            }
          );

          generatedFees.push(newFee);
          totalFeesGenerated++;
          totalAmount += totalFee;

          reportStudents.push({
            studentId: student.id,
            name: student.name,
            rollNo: student.rollNo,
            class: student.class,
            feeId: uniqueId,
            month: m,
            amount: totalFee,
            status: 'SUCCESS'
          });

        } catch (err: any) {
          console.error(`Failed to generate fee for student ${student.id} for month ${m}:`, err);
          reportStudents.push({
            studentId: student.id,
            name: student.name,
            rollNo: student.rollNo,
            class: student.class,
            feeId: uniqueId,
            month: m,
            amount: 0,
            status: 'FAILED',
            error: err.message || 'Unknown database write error.'
          });
        }
      }
    }

    // 4. Create and store the fee generation report
    const reportId = `report-${Date.now()}`;
    const report: FeeGenerationReport = {
      id: reportId,
      targetMonth: month,
      status: totalFeesGenerated === 0 && activeStudents.length > 0 ? 'FAILED' : (totalFeesGenerated < activeStudents.length ? 'PARTIAL' : 'SUCCESS'),
      totalStudentsProcessed: activeStudents.length,
      totalFeesGenerated,
      totalAmount,
      students: reportStudents,
      generatedBy: username,
      generatedAt: nowIso
    };

    await setDoc(doc(db, 'fee_generation_reports', reportId), report);

    return {
      success: true,
      message: `Successfully processed monthly fee generation. Generated ${totalFeesGenerated} new record(s).`,
      data: report
    };
  }

  /**
   * Retrieves all generated monthly fees, optionally filtered.
   */
  public static async listMonthlyFees(filters: any, db: any) {
    const snap = await getDocs(collection(db, 'student_monthly_fees'));
    let fees = snap.docs.map((d: any) => d.data());

    if (filters.studentId) {
      fees = fees.filter((f: any) => f.studentId === filters.studentId);
    }
    if (filters.class) {
      fees = fees.filter((f: any) => (f.class || '').toLowerCase() === filters.class.toLowerCase());
    }
    if (filters.month) {
      fees = fees.filter((f: any) => f.month === filters.month);
    }
    if (filters.status) {
      fees = fees.filter((f: any) => f.status === filters.status);
    }

    // Sort by month values descending, then studentName ascending
    fees.sort((a: any, b: any) => {
      if (b.monthVal !== a.monthVal) return b.monthVal - a.monthVal;
      return (a.studentName || '').localeCompare(b.studentName || '');
    });

    return { success: true, data: fees };
  }

  /**
   * Retrieves generated monthly fees for a single student.
   */
  public static async getMonthlyFeesByStudent(studentId: string, db: any) {
    // Confirm student exists
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) {
      return { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Student record not found.' };
    }

    const snap = await getDocs(collection(db, 'student_monthly_fees'));
    const fees = snap.docs
      .map((d: any) => d.data())
      .filter((f: any) => f.studentId === studentId)
      .sort((a: any, b: any) => b.monthVal - a.monthVal);

    return { success: true, data: fees };
  }

  /**
   * Retrieves fee generation reports list.
   */
  public static async listGenerationReports(db: any) {
    const snap = await getDocs(collection(db, 'fee_generation_reports'));
    const reports = snap.docs
      .map((d: any) => d.data())
      .sort((a: any, b: any) => b.generatedAt.localeCompare(a.generatedAt));

    return { success: true, data: reports };
  }
}
