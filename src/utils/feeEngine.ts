/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, FeeStatus, FeeReceipt } from '../types';

// Parse "Month Year" string into a sequential value for comparisons (e.g. "July 2026" -> val: 24319)
export const parseMonthYear = (monthYearStr: string) => {
  if (!monthYearStr) return { month: 0, year: 0, val: 0 };
  const parts = monthYearStr.trim().split(/\s+/);
  if (parts.length < 2) return { month: 0, year: 0, val: 0 };
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIdx = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
  const year = parseInt(parts[1], 10) || 0;
  return {
    month: monthIdx + 1,
    year,
    val: year * 12 + (monthIdx !== -1 ? monthIdx : 0)
  };
};

// Format sequentially calculated value back to "Month Year" string
export const formatMonthYear = (val: number) => {
  const year = Math.floor(val / 12);
  const monthIdx = val % 12;
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[monthIdx]} ${year}`;
};

// Format Due Date for a Month Year string and due day
export const getDueDateForMonth = (monthYearStr: string, dueDay: number) => {
  const { month, year } = parseMonthYear(monthYearStr);
  if (!month || !year) return "2026-07-10";
  const mStr = String(month).padStart(2, '0');
  const dStr = String(dueDay || 10).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
};

// Get default monthly fee based on class name
export const getDefaultMonthlyFeeForClass = (classStr: string): number => {
  const normalized = (classStr || '').toLowerCase();
  if (normalized.includes('10')) return 1200;
  if (normalized.includes('9')) return 1000;
  if (normalized.includes('5') || normalized.includes('6') || normalized.includes('7') || normalized.includes('8')) return 700;
  if (normalized.includes('1') || normalized.includes('2') || normalized.includes('3') || normalized.includes('4')) return 500;
  return 1200; // fallback
};

// Migrate individual student billing configurations
export const migrateStudentBilling = (student: Student, existingStatuses: FeeStatus[]): Student => {
  const updated = { ...student };
  
  // 1. Admission Date
  if (!updated.admissionDate) {
    updated.admissionDate = "2026-06-01";
  }

  // 2. Fee Starts From (feeStartMonth)
  if (!updated.feeStartMonth) {
    // Look for earliest month in existing status entries for this student
    const studentStatuses = existingStatuses.filter(fs => fs.studentId === student.id);
    if (studentStatuses.length > 0) {
      // Find the earliest status month
      let earliestVal = Infinity;
      let earliestMonth = "June 2026";
      studentStatuses.forEach(fs => {
        const parsed = parseMonthYear(fs.month);
        if (parsed.val < earliestVal) {
          earliestVal = parsed.val;
          earliestMonth = fs.month;
        }
      });
      updated.feeStartMonth = earliestMonth;
    } else {
      // Parse from admission date (e.g. 2026-07-27 -> July 2026)
      const dateParts = updated.admissionDate.split('-');
      if (dateParts.length >= 2) {
        const year = dateParts[0];
        const monthNum = parseInt(dateParts[1], 10);
        const monthNames = [
          "January", "February", "March", "April", "May", "June", 
          "July", "August", "September", "October", "November", "December"
        ];
        const monthName = monthNames[monthNum - 1] || "June";
        updated.feeStartMonth = `${monthName} ${year}`;
      } else {
        updated.feeStartMonth = "June 2026";
      }
    }
  }

  // 3. Monthly Fee
  if (updated.monthlyFee === undefined || updated.monthlyFee === null || isNaN(updated.monthlyFee)) {
    updated.monthlyFee = getDefaultMonthlyFeeForClass(updated.class);
  }

  // 4. Admission, Registration, Discounts & Scholarship
  if (updated.admissionFee === undefined) updated.admissionFee = 0;
  if (updated.registrationFee === undefined) updated.registrationFee = 0;
  if (updated.discount === undefined) updated.discount = 0;
  if (updated.scholarship === undefined) {
    // Priya Mishra has scholarship of 200 in seeds
    updated.scholarship = (updated.id === 's2' || updated.name.toLowerCase().includes('priya')) ? 200 : 0;
  }

  // 5. Due Day
  if (updated.dueDay === undefined) updated.dueDay = 10;

  return updated;
};

// Redesign calculation engine to safely sync and generate fee records
export const syncAndGenerateFeeRecords = (
  students: Student[],
  feeStatuses: FeeStatus[],
  feeReceipts: FeeReceipt[]
): { updatedStudents: Student[]; updatedFeeStatuses: FeeStatus[] } => {
  
  // 1. Migrate students
  const updatedStudents = students.map(s => migrateStudentBilling(s, feeStatuses));

  // 2. Build complete list of relevant billing months in the ERP
  const baseMonths = ["June 2026", "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"];
  const monthsSet = new Set(baseMonths);
  feeStatuses.forEach(fs => { if (fs.month) monthsSet.add(fs.month); });
  feeReceipts.forEach(fr => { if (fr.month) monthsSet.add(fr.month); });

  const sortedMonths = Array.from(monthsSet).sort((a, b) => {
    return parseMonthYear(a).val - parseMonthYear(b).val;
  });

  // 3. Process records
  const nextFeeStatuses: FeeStatus[] = [];

  updatedStudents.forEach(student => {
    sortedMonths.forEach(month => {
      const studentStartParsed = parseMonthYear(student.feeStartMonth || "June 2026");
      const currentMonthParsed = parseMonthYear(month);

      // Do NOT bill months prior to feeStartMonth
      if (currentMonthParsed.val < studentStartParsed.val) {
        return;
      }

      // Find existing FeeStatus record
      const existing = feeStatuses.find(fs => fs.studentId === student.id && fs.month === month);

      // Calculate paid amount from official Receipts ledger
      const paidFee = feeReceipts
        .filter(r => r.studentId === student.id && r.month === month)
        .reduce((sum, r) => sum + r.amountPaid, 0);

      const isStartMonth = month === student.feeStartMonth;
      
      // Starting month includes optional Admission and Registration fees
      const baseMonthlyFee = student.monthlyFee || 0;
      const totalFee = isStartMonth 
        ? baseMonthlyFee + (student.admissionFee || 0) + (student.registrationFee || 0)
        : baseMonthlyFee;

      const discount = student.discount || 0;
      const scholarship = student.scholarship || 0;
      const dueDate = getDueDateForMonth(month, student.dueDay || 10);

      // Carry over manual flags from existing record
      const isWaived = existing?.isWaived || false;
      const isSkipped = existing?.isSkipped || false;

      let pendingFee = 0;
      let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';

      if (isSkipped) {
        // Skipped month has zero fee obligation
        pendingFee = 0;
        status = 'PAID';
      } else if (isWaived) {
        // Waived month waives remaining balance
        pendingFee = 0;
        status = 'PAID';
      } else {
        pendingFee = Math.max(0, totalFee - discount - scholarship - paidFee);
        status = pendingFee === 0 
          ? 'PAID' 
          : (paidFee > 0 ? 'PARTIAL' : 'PENDING');
      }

      nextFeeStatuses.push({
        id: existing?.id || `fs-gen-${student.id}-${month.replace(/\s+/g, '-')}`,
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        month,
        totalFee: isSkipped ? 0 : totalFee,
        discount: isSkipped ? 0 : discount,
        scholarship: isSkipped ? 0 : scholarship,
        paidFee,
        pendingFee,
        status,
        dueDate,
        isWaived,
        isSkipped,
        billingMonth: month.split(' ')[0],
        billingYear: month.split(' ')[1]
      });
    });
  });

  return {
    updatedStudents,
    updatedFeeStatuses: nextFeeStatuses
  };
};

// Calculate Dashboard aggregates from real fee records
export const calculateDashboardTotals = (
  feeStatuses: FeeStatus[],
  feeReceipts: FeeReceipt[]
) => {
  // Total Revenue Collected is the exact sum of all payment receipts
  const totalRevenue = feeReceipts.reduce((sum, r) => sum + r.amountPaid, 0);

  // Total Pending Dues is the sum of pendingFee in all active statuses
  const totalPendingFees = feeStatuses.reduce((sum, f) => sum + f.pendingFee, 0);

  // Overdue Dues are pending dues whose due date is past today
  const todayStr = new Date().toISOString().split('T')[0];
  const overduePending = feeStatuses
    .filter(f => f.pendingFee > 0 && f.dueDate < todayStr)
    .reduce((sum, f) => sum + f.pendingFee, 0);

  // Expected Collection is Total Revenue + Total Pending Dues
  const expectedCollection = totalRevenue + totalPendingFees;

  // Collection Efficiency
  const collectionEfficiency = expectedCollection > 0
    ? Math.round((totalRevenue / expectedCollection) * 100)
    : 100;

  return {
    totalRevenue,
    totalPendingFees,
    overduePending,
    expectedCollection,
    collectionEfficiency
  };
};
