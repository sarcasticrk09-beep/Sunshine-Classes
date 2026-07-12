/**
 * Sunshine Classes ERP - Fee Calculation & Redesigned Billing Engine
 * Production-Ready Billing Utility Module
 */

import { Student, FeeStatus } from '../types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Parses a month string like "July 2026" or "August 2026" into its month index (0-11) and year.
 */
export function parseMonthYear(monthStr: string): { month: number; year: number } {
  if (!monthStr) {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  }
  const parts = monthStr.trim().split(/\s+/);
  if (parts.length < 2) {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  }
  const monthName = parts[0];
  const yearNum = parseInt(parts[1], 10) || new Date().getFullYear();
  
  const monthIndex = MONTH_NAMES.findIndex(
    m => m.toLowerCase().startsWith(monthName.toLowerCase())
  );
  
  return {
    month: monthIndex !== -1 ? monthIndex : 0,
    year: yearNum
  };
}

/**
 * Formats a month index (0-11) and year into "July 2026".
 */
export function formatMonthYear(month: number, year: number): string {
  const mSafe = Math.max(0, Math.min(11, month));
  return `${MONTH_NAMES[mSafe]} ${year}`;
}

/**
 * Compares two month strings (e.g. "July 2026" and "August 2026").
 * Returns:
 *   < 0 if a is before b
 *   = 0 if a is same as b
 *   > 0 if a is after b
 */
export function compareMonths(a: string, b: string): number {
  const parsedA = parseMonthYear(a);
  const parsedB = parseMonthYear(b);
  if (parsedA.year !== parsedB.year) {
    return parsedA.year - parsedB.year;
  }
  return parsedA.month - parsedB.month;
}

/**
 * Returns the Current Month and Next Month formatted strings (e.g. "July 2026", "August 2026").
 * It ensures we always operate in the current month and next month dynamically.
 */
export function getCurrentAndNextMonths(): { currentMonth: string; nextMonth: string } {
  const d = new Date();
  const y = d.getFullYear() < 2026 ? 2026 : d.getFullYear();
  const m = d.getMonth();
  
  const currentMonth = formatMonthYear(m, y);
  
  const nextM = (m + 1) % 12;
  const nextY = y + (m === 11 ? 1 : 0);
  const nextMonth = formatMonthYear(nextM, nextY);
  
  return { currentMonth, nextMonth };
}

/**
 * Calculates a standard "YYYY-MM-DD" due date string for a given month and day of month.
 */
export function calculateDueDate(monthStr: string, dueDay: number): string {
  const { month, year } = parseMonthYear(monthStr);
  const daySafe = Math.min(28, Math.max(1, dueDay || 10)); // Safe day within all months
  const monthPadded = String(month + 1).padStart(2, '0');
  const dayPadded = String(daySafe).padStart(2, '0');
  return `${year}-${monthPadded}-${dayPadded}`;
}

/**
 * Resolves the dynamic, current fee status based on payment and current date.
 */
export function getFeeStatusForRecord(
  fee: FeeStatus,
  todayStr: string = new Date().toISOString().split('T')[0]
): 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UPCOMING' | 'PENDING' {
  if (fee.isSkipped) return 'PAID';
  if (fee.isWaived) return 'PAID';
  if (fee.pendingFee === 0) return 'PAID';

  // Check if it's a future month
  const today = new Date(todayStr);
  const currentMonthStr = formatMonthYear(today.getMonth(), today.getFullYear());
  const monthCompare = compareMonths(fee.month, currentMonthStr);

  if (monthCompare > 0) {
    return 'UPCOMING';
  }

  // If unpaid/partial, and past due date
  if (todayStr > fee.dueDate) {
    return 'OVERDUE';
  }

  // If unpaid/partial and in the current/past month but before the due date
  if (fee.paidFee > 0) {
    return 'PARTIAL';
  }

  return 'PENDING';
}

/**
 * Generates initial monthly fee records starting from `feeStartMonth`.
 * Billed months up to 12 months ahead are generated in advance.
 */
export function generateFeeRecords(student: Student, count: number = 12): FeeStatus[] {
  const records: FeeStatus[] = [];
  const startMonthStr = student.feeStartMonth || formatMonthYear(new Date().getMonth(), new Date().getFullYear());
  
  let currentMonthYear = parseMonthYear(startMonthStr);
  const monthlyTuition = student.monthlyFee ?? 1200;
  const dueDay = student.dueDay ?? 10;
  
  for (let i = 0; i < count; i++) {
    const monthName = formatMonthYear(currentMonthYear.month, currentMonthYear.year);
    const isFirstMonth = (i === 0);
    
    // Base gross fee is tuition plus starting admission & registration fees
    const tuition = monthlyTuition;
    const admissionFee = isFirstMonth ? (student.admissionFee ?? 0) : 0;
    const registrationFee = isFirstMonth ? (student.registrationFee ?? 0) : 0;
    const discount = student.discount ?? 0;
    const scholarship = student.scholarship ?? 0;
    
    // totalFee represents gross billing amount before discounts
    const totalFee = tuition + admissionFee + registrationFee;
    const pendingFee = Math.max(0, totalFee - discount - scholarship);
    const dueDate = calculateDueDate(monthName, dueDay);
    
    const recordId = `fs-${student.id}-${currentMonthYear.year}-${String(currentMonthYear.month + 1).padStart(2, '0')}`;
    
    const record: FeeStatus = {
      id: recordId,
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      month: monthName,
      totalFee,
      discount,
      scholarship,
      paidFee: 0,
      pendingFee,
      status: 'PENDING',
      dueDate,
      billingMonth: MONTH_NAMES[currentMonthYear.month],
      billingYear: String(currentMonthYear.year),
      amount: totalFee,
      paid: 0,
      balance: pendingFee,
      paymentHistory: [],
      receiptIds: [],
      isWaived: false,
      isSkipped: false
    };

    // Calculate initial dynamic status
    record.status = getFeeStatusForRecord(record) as any;
    records.push(record);
    
    // Advance to next month
    currentMonthYear.month += 1;
    if (currentMonthYear.month > 11) {
      currentMonthYear.month = 0;
      currentMonthYear.year += 1;
    }
  }
  
  return records;
}

/**
 * Migration routine: Migrates all existing students and fills missing billing records safely.
 * Filters out any billing months prior to Fee Starts From (Billing Start Month).
 * Does not delete existing payment histories.
 */
export function migrateExistingData(
  students: Student[],
  existingFeeStatuses: FeeStatus[]
): { migratedStudents: Student[]; migratedFeeStatuses: FeeStatus[] } {
  
  const migratedStudents = students.map(s => {
    const updated = { ...s };

    // 1. Ensure admissionDate exists
    if (!updated.admissionDate) {
      updated.admissionDate = "2026-06-01";
    }

    // 2. Ensure feeStartMonth exists
    if (!updated.feeStartMonth) {
      const studentStatuses = existingFeeStatuses.filter(fs => fs.studentId === s.id);
      if (studentStatuses.length > 0) {
        let earliestVal = Infinity;
        let earliestMonth = "June 2026";
        studentStatuses.forEach(fs => {
          const parsed = parseMonthYear(fs.month);
          const val = parsed.year * 12 + parsed.month;
          if (val < earliestVal) {
            earliestVal = val;
            earliestMonth = fs.month;
          }
        });
        updated.feeStartMonth = earliestMonth;
      } else {
        const parts = updated.admissionDate.split('-');
        if (parts.length >= 2) {
          const yearNum = parseInt(parts[0], 10);
          const monthIdx = parseInt(parts[1], 10) - 1;
          updated.feeStartMonth = formatMonthYear(monthIdx, yearNum);
        } else {
          updated.feeStartMonth = "June 2026";
        }
      }
    }

    // 3. Ensure monthlyFee exists (fallback to class defaults)
    if (updated.monthlyFee === undefined) {
      const className = updated.class || '';
      if (className.toLowerCase().includes('class 10')) {
        updated.monthlyFee = 1200;
      } else if (className.toLowerCase().includes('class 9')) {
        updated.monthlyFee = 1000;
      } else if (className.toLowerCase().includes('5 to 8')) {
        updated.monthlyFee = 700;
      } else if (className.toLowerCase().includes('1 to 4')) {
        updated.monthlyFee = 500;
      } else {
        updated.monthlyFee = 1200;
      }
    }

    // 4. Default billing fields
    if (updated.dueDay === undefined) updated.dueDay = 10;
    if (updated.admissionFee === undefined) updated.admissionFee = 0;
    if (updated.registrationFee === undefined) updated.registrationFee = 0;
    if (updated.discount === undefined) updated.discount = 0;
    if (updated.scholarship === undefined) {
      updated.scholarship = (updated.id === 's2' || updated.name.toLowerCase().includes('priya')) ? 200 : 0;
    }
    if (updated.currentBalance === undefined) updated.currentBalance = 0;

    return updated;
  });

  const finalFeeStatuses: FeeStatus[] = [];

  migratedStudents.forEach(student => {
    // Keep only existing statuses that are >= student.feeStartMonth
    const studentStatuses = existingFeeStatuses.filter(fs => {
      if (fs.studentId !== student.id) return false;
      return compareMonths(fs.month, student.feeStartMonth || "June 2026") >= 0;
    });

    // Ensure we have expected monthly records (up to 12 months)
    const expected = generateFeeRecords(student, 12);

    expected.forEach(newRec => {
      const existingIdx = studentStatuses.findIndex(
        ex => ex.month.toLowerCase() === newRec.month.toLowerCase()
      );

      if (existingIdx !== -1) {
        const existing = studentStatuses[existingIdx];
        const totalFee = existing.totalFee !== undefined ? existing.totalFee : newRec.totalFee;
        const paidFee = existing.paidFee !== undefined ? existing.paidFee : 0;
        const discount = student.discount ?? 0;
        const scholarship = student.scholarship ?? 0;
        const isWaived = existing.isWaived || false;
        const isSkipped = existing.isSkipped || false;

        let pendingFee = 0;
        if (isSkipped) {
          pendingFee = 0;
        } else if (isWaived) {
          pendingFee = 0;
        } else {
          pendingFee = Math.max(0, totalFee - discount - scholarship - paidFee);
        }

        const merged: FeeStatus = {
          ...newRec,
          ...existing,
          totalFee: isSkipped ? 0 : totalFee,
          discount: isSkipped ? 0 : discount,
          scholarship: isSkipped ? 0 : scholarship,
          paidFee,
          pendingFee,
          amount: isSkipped ? 0 : totalFee,
          paid: paidFee,
          balance: pendingFee,
          isWaived,
          isSkipped
        };
        merged.status = getFeeStatusForRecord(merged) as any;
        studentStatuses[existingIdx] = merged;
      } else {
        studentStatuses.push(newRec);
      }
    });

    finalFeeStatuses.push(...studentStatuses);
  });

  // Include fee statuses for students who may not be active in the list currently
  const activeStudentIds = new Set(migratedStudents.map(s => s.id));
  existingFeeStatuses.forEach(fs => {
    if (!activeStudentIds.has(fs.studentId)) {
      finalFeeStatuses.push(fs);
    }
  });

  return {
    migratedStudents,
    migratedFeeStatuses: finalFeeStatuses
  };
}
