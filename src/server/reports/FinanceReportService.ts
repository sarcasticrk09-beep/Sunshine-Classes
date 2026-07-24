import { collection, getDocs } from '../shared/db';
import { AuditService } from '../shared/AuditService';

export interface DashboardSummaryMetrics {
  totalExpected: number;
  totalCollected: number;
  pendingCollection: number;
  collectionPercentage: number;
  todayCollection: number;
  yesterdayCollection: number;
  thisWeekCollection: number;
  thisMonthCollection: number;
  studentsPaid: number;
  studentsPending: number;
  overdueStudents: number;
  studentsWithConcessions: number;
}

export class FinanceReportService {
  /**
   * Helper: Format Date object to YYYY-MM-DD
   */
  private static formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Check if date string falls within range
   */
  private static isWithinDateRange(dateStr: string, startDate?: string, endDate?: string): boolean {
    if (!dateStr) return false;
    const cleanDate = dateStr.substring(0, 10);
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  }

  /**
   * GET Dashboard Summary Metrics
   */
  public static async getDashboardMetrics(db: any, filters: {
    startDate?: string;
    endDate?: string;
    academicSession?: string;
    classId?: string;
  }): Promise<DashboardSummaryMetrics> {
    const todayStr = this.formatDate(new Date());

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterday);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = this.formatDate(weekAgo);

    const startOfMonthStr = `${todayStr.substring(0, 7)}-01`;

    // Fetch collections concurrently
    let studentsDocs: any[] = [];
    let monthlyFeesDocs: any[] = [];
    let receiptsDocs: any[] = [];
    let feeSettingsDocs: any[] = [];

    try {
      const [studentsSnap, monthlyFeesSnap, receiptsSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'student_monthly_fees')),
        getDocs(collection(db, 'fee_receipts')),
        getDocs(collection(db, 'student_fee_settings'))
      ]);

      studentsDocs = studentsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      monthlyFeesDocs = monthlyFeesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      receiptsDocs = receiptsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      feeSettingsDocs = settingsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Database fetch warning:', e?.message || e);
    }

    // Apply filters if provided
    let filteredFees = monthlyFeesDocs;
    let filteredReceipts = receiptsDocs.filter((r: any) => r.status !== 'VOID' && r.status !== 'REFUNDED');

    if (filters.classId && filters.classId !== 'ALL') {
      filteredFees = filteredFees.filter((f: any) => f.class === filters.classId || f.preferredBatch === filters.classId);
      filteredReceipts = filteredReceipts.filter((r: any) => r.class === filters.classId || r.className === filters.classId);
    }

    let totalExpected = 0;
    let totalCollected = 0;
    let pendingCollection = 0;

    filteredFees.forEach((f: any) => {
      const exp = Number(f.totalFee) || Number(f.baseFee) || 0;
      const paid = Number(f.paidFee) || 0;
      const pend = Number(f.pendingFee) || Math.max(0, exp - paid);

      totalExpected += exp;
      totalCollected += paid;
      pendingCollection += pend;
    });

    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    let todayCollection = 0;
    let yesterdayCollection = 0;
    let thisWeekCollection = 0;
    let thisMonthCollection = 0;

    filteredReceipts.forEach((r: any) => {
      const amt = Number(r.amountPaid) || Number(r.amount) || 0;
      const rDate = (r.date || r.issuedAt || r.createdAt || '').substring(0, 10);

      if (rDate === todayStr) todayCollection += amt;
      if (rDate === yesterdayStr) yesterdayCollection += amt;
      if (rDate >= weekAgoStr && rDate <= todayStr) thisWeekCollection += amt;
      if (rDate >= startOfMonthStr && rDate <= todayStr) thisMonthCollection += amt;
    });

    // Student counts
    const paidStudentIds = new Set<string>();
    const pendingStudentIds = new Set<string>();
    const overdueStudentIds = new Set<string>();

    filteredFees.forEach((f: any) => {
      const pend = Number(f.pendingFee) || 0;
      const isOverdue = f.dueDate && f.dueDate < todayStr && pend > 0;

      if (f.status === 'PAID' || pend === 0) {
        paidStudentIds.add(f.studentId);
      } else {
        pendingStudentIds.add(f.studentId);
        if (isOverdue) overdueStudentIds.add(f.studentId);
      }
    });

    const activeConcessionStudentIds = new Set<string>();
    feeSettingsDocs.forEach((s: any) => {
      if (s.status === 'ACTIVE' && Number(s.concessionPercentage) > 0) {
        activeConcessionStudentIds.add(s.studentId);
      }
    });

    return {
      totalExpected,
      totalCollected,
      pendingCollection,
      collectionPercentage,
      todayCollection,
      yesterdayCollection,
      thisWeekCollection,
      thisMonthCollection,
      studentsPaid: paidStudentIds.size,
      studentsPending: pendingStudentIds.size,
      overdueStudents: overdueStudentIds.size,
      studentsWithConcessions: activeConcessionStudentIds.size
    };
  }

  /**
   * GET Collection Analytics (Daily, Weekly, Monthly, Yearly)
   */
  public static async getCollectionAnalytics(db: any, filters: {
    startDate?: string;
    endDate?: string;
    classId?: string;
    paymentMode?: string;
  }) {
    let receipts: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'fee_receipts'));
      receipts = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Receipts fetch error:', e?.message || e);
    }

    receipts = receipts.filter((r: any) => r.status !== 'VOID' && r.status !== 'REFUNDED');

    if (filters.classId && filters.classId !== 'ALL') {
      receipts = receipts.filter((r: any) => r.class === filters.classId || r.className === filters.classId);
    }
    if (filters.paymentMode && filters.paymentMode !== 'ALL') {
      receipts = receipts.filter((r: any) => (r.paymentMode || r.paymentMethod) === filters.paymentMode);
    }

    // Daily breakdown (last 14 days or custom range)
    const dailyMap = new Map<string, number>();
    // Monthly breakdown (12 months)
    const monthlyMap = new Map<string, number>();

    receipts.forEach((r: any) => {
      const amt = Number(r.amountPaid) || Number(r.amount) || 0;
      const rDate = (r.date || r.issuedAt || r.createdAt || '').substring(0, 10);
      if (!rDate) return;

      if (this.isWithinDateRange(rDate, filters.startDate, filters.endDate)) {
        dailyMap.set(rDate, (dailyMap.get(rDate) || 0) + amt);

        const mKey = rDate.substring(0, 7); // YYYY-MM
        monthlyMap.set(mKey, (monthlyMap.get(mKey) || 0) + amt);
      }
    });

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      dailyTrend,
      monthlyTrend
    };
  }

  /**
   * GET Class-Wise Financial Reports
   */
  public static async getClassWiseReport(db: any, options: {
    sortBy?: 'highest_collection' | 'lowest_collection' | 'pending_amount';
  }) {
    let studentsDocs: any[] = [];
    let monthlyFeesDocs: any[] = [];
    let settingsDocs: any[] = [];

    try {
      const [sSnap, mSnap, setSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'student_monthly_fees')),
        getDocs(collection(db, 'student_fee_settings'))
      ]);

      studentsDocs = sSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      monthlyFeesDocs = mSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      settingsDocs = setSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Class report fetch error:', e?.message || e);
    }

    const classMap = new Map<string, {
      className: string;
      totalStudents: Set<string>;
      expectedFees: number;
      collectedFees: number;
      pendingFees: number;
      concessionAmount: number;
    }>();

    // Initialize classes from students
    studentsDocs.forEach((s: any) => {
      const cName = s.class || s.preferredBatch || 'Unassigned Class';
      if (!classMap.has(cName)) {
        classMap.set(cName, {
          className: cName,
          totalStudents: new Set(),
          expectedFees: 0,
          collectedFees: 0,
          pendingFees: 0,
          concessionAmount: 0
        });
      }
      classMap.get(cName)!.totalStudents.add(s.id);
    });

    // Aggregate fees
    monthlyFeesDocs.forEach((f: any) => {
      const cName = f.class || f.preferredBatch || 'Unassigned Class';
      if (!classMap.has(cName)) {
        classMap.set(cName, {
          className: cName,
          totalStudents: new Set(),
          expectedFees: 0,
          collectedFees: 0,
          pendingFees: 0,
          concessionAmount: 0
        });
      }

      const rec = classMap.get(cName)!;
      rec.totalStudents.add(f.studentId);
      const exp = Number(f.totalFee) || Number(f.baseFee) || 0;
      const paid = Number(f.paidFee) || 0;
      const pend = Number(f.pendingFee) || Math.max(0, exp - paid);
      const conc = Number(f.concessionAmount) || 0;

      rec.expectedFees += exp;
      rec.collectedFees += paid;
      rec.pendingFees += pend;
      rec.concessionAmount += conc;
    });

    let result = Array.from(classMap.values()).map(c => {
      const totalStudentsCount = c.totalStudents.size;
      const collectionPercentage = c.expectedFees > 0 ? Math.round((c.collectedFees / c.expectedFees) * 100) : 0;
      return {
        className: c.className,
        totalStudents: totalStudentsCount,
        expectedFees: c.expectedFees,
        collectedFees: c.collectedFees,
        pendingFees: c.pendingFees,
        collectionPercentage,
        concessionAmount: c.concessionAmount
      };
    });

    // Sorting
    if (options.sortBy === 'lowest_collection') {
      result.sort((a, b) => a.collectedFees - b.collectedFees);
    } else if (options.sortBy === 'pending_amount') {
      result.sort((a, b) => b.pendingFees - a.pendingFees);
    } else {
      // Default highest_collection
      result.sort((a, b) => b.collectedFees - a.collectedFees);
    }

    return result;
  }

  /**
   * GET Student Financial Reports
   */
  public static async getStudentReport(db: any, queryParams: {
    search?: string;
    classId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const todayStr = this.formatDate(new Date());

    let studentsDocs: any[] = [];
    let monthlyFeesDocs: any[] = [];
    let settingsDocs: any[] = [];
    let receiptsDocs: any[] = [];

    try {
      const [sSnap, mSnap, setSnap, rSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'student_monthly_fees')),
        getDocs(collection(db, 'student_fee_settings')),
        getDocs(collection(db, 'fee_receipts'))
      ]);

      studentsDocs = sSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      monthlyFeesDocs = mSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      settingsDocs = setSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      receiptsDocs = rSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Student report fetch error:', e?.message || e);
    }

    const settingsMap = new Map<string, any>();
    settingsDocs.forEach((s: any) => {
      if (s.status === 'ACTIVE') settingsMap.set(s.studentId, s);
    });

    const lastPaymentMap = new Map<string, string>();
    receiptsDocs.forEach((r: any) => {
      const rDate = (r.date || r.issuedAt || r.createdAt || '').substring(0, 10);
      if (rDate) {
        const prev = lastPaymentMap.get(r.studentId);
        if (!prev || rDate > prev) {
          lastPaymentMap.set(r.studentId, rDate);
        }
      }
    });

    const studentFeeSummary = new Map<string, {
      totalPaid: number;
      totalPending: number;
      isOverdue: boolean;
      months: any[];
    }>();

    monthlyFeesDocs.forEach((f: any) => {
      if (!studentFeeSummary.has(f.studentId)) {
        studentFeeSummary.set(f.studentId, {
          totalPaid: 0,
          totalPending: 0,
          isOverdue: false,
          months: []
        });
      }
      const summary = studentFeeSummary.get(f.studentId)!;
      summary.totalPaid += Number(f.paidFee) || 0;
      const pend = Number(f.pendingFee) || 0;
      summary.totalPending += pend;
      if (f.dueDate && f.dueDate < todayStr && pend > 0) {
        summary.isOverdue = true;
      }
      summary.months.push(f);
    });

    let list = studentsDocs.map((s: any) => {
      const summary = studentFeeSummary.get(s.id) || { totalPaid: 0, totalPending: 0, isOverdue: false, months: [] };
      const setting = settingsMap.get(s.id);
      const concessionPct = setting ? Number(setting.concessionPercentage) || 0 : 0;
      const lastPaymentDate = lastPaymentMap.get(s.id) || 'N/A';

      let currentStatus: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID';
      if (summary.isOverdue) {
        currentStatus = 'OVERDUE';
      } else if (summary.totalPending > 0) {
        currentStatus = 'PENDING';
      }

      return {
        studentId: s.id,
        studentName: s.name || s.studentName || 'N/A',
        admissionNo: s.admissionNo || s.admissionNumber || 'N/A',
        rollNo: s.rollNo || s.rollNumber || 'N/A',
        class: s.class || s.preferredBatch || 'N/A',
        currentMonthStatus: currentStatus,
        paidFee: summary.totalPaid,
        pendingFee: summary.totalPending,
        concessionPercentage: concessionPct,
        lastPaymentDate,
        outstandingAmount: summary.totalPending
      };
    });

    // Apply filters
    if (queryParams.search) {
      const q = queryParams.search.toLowerCase().trim();
      list = list.filter((s: any) =>
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q)
      );
    }

    if (queryParams.classId && queryParams.classId !== 'ALL') {
      list = list.filter((s: any) => s.class === queryParams.classId);
    }

    if (queryParams.status && queryParams.status !== 'ALL') {
      list = list.filter((s: any) => s.currentMonthStatus === queryParams.status);
    }

    const total = list.length;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated
    };
  }

  /**
   * GET Overdue Fee Report
   */
  public static async getOverdueReport(db: any, filters: {
    classId?: string;
  }) {
    const todayStr = this.formatDate(new Date());

    let monthlyFeesDocs: any[] = [];
    let remindersDocs: any[] = [];

    try {
      const [mSnap, rSnap] = await Promise.all([
        getDocs(collection(db, 'student_monthly_fees')),
        getDocs(collection(db, 'fee_reminders'))
      ]);
      monthlyFeesDocs = mSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      remindersDocs = rSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Overdue report fetch error:', e?.message || e);
    }

    const lastReminderMap = new Map<string, string>();
    remindersDocs.forEach((r: any) => {
      const sentAt = r.sentAt || r.createdAt;
      if (sentAt) {
        const prev = lastReminderMap.get(r.studentId);
        if (!prev || sentAt > prev) {
          lastReminderMap.set(r.studentId, sentAt);
        }
      }
    });

    let overdueList = monthlyFeesDocs
      .filter((f: any) => f.dueDate && f.dueDate < todayStr && (Number(f.pendingFee) || 0) > 0)
      .map((f: any) => {
        const dueDateObj = new Date(f.dueDate);
        const todayObj = new Date(todayStr);
        const diffTime = Math.abs(todayObj.getTime() - dueDateObj.getTime());
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: f.id,
          studentId: f.studentId,
          studentName: f.studentName || 'N/A',
          rollNo: f.rollNo || 'N/A',
          class: f.class || f.preferredBatch || 'N/A',
          dueMonth: f.month || 'N/A',
          dueAmount: Number(f.pendingFee) || 0,
          daysOverdue,
          concessionApplied: f.concessionPercentage ? `${f.concessionPercentage}% (₹${f.concessionAmount || 0})` : 'None',
          lastReminderSent: lastReminderMap.get(f.studentId) ? lastReminderMap.get(f.studentId)?.substring(0, 10) : 'Never'
        };
      });

    if (filters.classId && filters.classId !== 'ALL') {
      overdueList = overdueList.filter((f: any) => f.class === filters.classId);
    }

    overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return overdueList;
  }

  /**
   * GET Concession Report
   */
  public static async getConcessionReport(db: any, filters: {
    classId?: string;
  }) {
    let settingsDocs: any[] = [];
    let studentsDocs: any[] = [];

    try {
      const [setSnap, sSnap] = await Promise.all([
        getDocs(collection(db, 'student_fee_settings')),
        getDocs(collection(db, 'students'))
      ]);
      settingsDocs = setSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      studentsDocs = sSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Concession report error:', e?.message || e);
    }

    const studentMap = new Map<string, any>();
    studentsDocs.forEach((s: any) => studentMap.set(s.id, s));

    let list = settingsDocs
      .filter((s: any) => s.status === 'ACTIVE' && Number(s.concessionPercentage) > 0)
      .map((s: any) => {
        const student = studentMap.get(s.studentId) || {};
        const originalFee = Number(s.classFee) || 2000;
        const concPct = Number(s.concessionPercentage) || 0;
        const concAmt = Math.round((originalFee * concPct) / 100);
        const finalFee = Math.max(0, originalFee - concAmt);

        const effFrom = s.effectiveFrom || 'N/A';
        const effTill = s.effectiveTill || 'Indefinite';

        return {
          id: s.id,
          studentId: s.studentId,
          studentName: student.name || s.studentName || 'N/A',
          rollNo: student.rollNo || s.rollNo || 'N/A',
          class: student.class || student.preferredBatch || s.class || 'N/A',
          originalFee,
          concessionPercentage: concPct,
          concessionAmount: concAmt,
          finalFee,
          reason: s.reason || 'Not Specified',
          effectivePeriod: `${effFrom} to ${effTill}`
        };
      });

    if (filters.classId && filters.classId !== 'ALL') {
      list = list.filter((item: any) => item.class === filters.classId);
    }

    return list;
  }

  /**
   * GET Payment Mode Report
   */
  public static async getPaymentModeReport(db: any) {
    let receiptsDocs: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'fee_receipts'));
      receiptsDocs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Payment mode report error:', e?.message || e);
    }

    const validReceipts = receiptsDocs.filter((r: any) => r.status !== 'VOID' && r.status !== 'REFUNDED');

    const modes = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'];
    const modeMap = new Map<string, { transactionCount: number; totalAmount: number }>();

    modes.forEach(m => modeMap.set(m, { transactionCount: 0, totalAmount: 0 }));

    let grandTotal = 0;

    validReceipts.forEach((r: any) => {
      let m = (r.paymentMode || r.paymentMethod || 'OTHER').toUpperCase();
      if (!modes.includes(m)) m = 'OTHER';

      const amt = Number(r.amountPaid) || Number(r.amount) || 0;
      const curr = modeMap.get(m)!;
      curr.transactionCount += 1;
      curr.totalAmount += amt;
      grandTotal += amt;
    });

    const breakdown = Array.from(modeMap.entries()).map(([mode, data]) => ({
      paymentMode: mode,
      transactionCount: data.transactionCount,
      totalAmount: data.totalAmount,
      percentage: grandTotal > 0 ? Math.round((data.totalAmount / grandTotal) * 100) : 0
    }));

    return {
      grandTotal,
      breakdown
    };
  }

  /**
   * GET Receipt Report
   */
  public static async getReceiptReport(db: any, queryParams: {
    search?: string;
    paymentMode?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    let receiptsDocs: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'fee_receipts'));
      receiptsDocs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn('[FinanceReportService] Receipt report error:', e?.message || e);
    }

    let list = receiptsDocs.map((r: any) => ({
      receiptNumber: r.receiptNumber || r.id,
      studentId: r.studentId || 'N/A',
      studentName: r.studentName || 'N/A',
      rollNo: r.rollNo || r.rollNumber || 'N/A',
      class: r.class || r.className || 'N/A',
      amount: Number(r.amountPaid) || Number(r.amount) || 0,
      paymentMode: r.paymentMode || r.paymentMethod || 'CASH',
      date: (r.date || r.issuedAt || r.createdAt || '').substring(0, 10),
      month: r.month || r.billingMonth || 'N/A',
      status: r.status || 'VALID',
      rawReceipt: r
    }));

    if (queryParams.search) {
      const q = queryParams.search.toLowerCase().trim();
      list = list.filter((r: any) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.rollNo.toLowerCase().includes(q) ||
        r.class.toLowerCase().includes(q)
      );
    }

    if (queryParams.paymentMode && queryParams.paymentMode !== 'ALL') {
      list = list.filter((r: any) => r.paymentMode === queryParams.paymentMode);
    }

    if (queryParams.status && queryParams.status !== 'ALL') {
      list = list.filter((r: any) => r.status === queryParams.status);
    }

    if (queryParams.startDate || queryParams.endDate) {
      list = list.filter((r: any) => this.isWithinDateRange(r.date, queryParams.startDate, queryParams.endDate));
    }

    list.sort((a, b) => b.date.localeCompare(a.date));

    const total = list.length;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated
    };
  }

  /**
   * Log Report Export Audit
   */
  public static async logReportExport(db: any, user: any, reportName: string, exportType: string, filtersUsed: any) {
    if (!user) return;
    try {
      await AuditService.log(
        db,
        user.id || user.uid,
        user.username || user.name || 'Admin',
        'REPORT_EXPORTED',
        `Exported ${reportName} as ${exportType} with filters: ${JSON.stringify(filtersUsed)}`
      );
    } catch (e: any) {
      console.warn('[FinanceReportService] Audit log error:', e?.message || e);
    }
  }

  /**
   * Log Dashboard Access Audit
   */
  public static async logDashboardAccess(db: any, user: any) {
    if (!user) return;
    try {
      await AuditService.log(
        db,
        user.id || user.uid,
        user.username || user.name || 'Admin',
        'DASHBOARD_ACCESSED',
        `Accessed Finance Dashboard & Reports (FM-007)`
      );
    } catch (e: any) {
      console.warn('[FinanceReportService] Dashboard audit log error:', e?.message || e);
    }
  }
}
