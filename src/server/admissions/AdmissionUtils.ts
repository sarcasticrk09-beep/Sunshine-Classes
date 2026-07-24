/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  matchedStudent?: any;
}

/**
 * Extracts a 2-digit class code string from a class name input.
 * e.g., "Class 5" -> "05", "Class 10" -> "10", "1" -> "01", "LKG" -> "00"
 */
export function parseClassCode(className: string): string {
  if (!className) return '00';
  const match = className.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return num < 10 ? `0${num}` : `${num}`;
  }
  const cleanStr = className.trim().toUpperCase();
  if (cleanStr.includes('LKG')) return '00';
  if (cleanStr.includes('UKG')) return '00';
  if (cleanStr.includes('NURSERY')) return '00';
  return '00';
}

/**
 * Generates roll number according to format: SC-YYYY-CC-SEQ (e.g., SC-2026-05-0001)
 * CC = 2-digit class code
 * SEQ = 4-digit sequential number within class and year
 * Ensures no duplicate or reused deleted roll number.
 */
export function generateRollNumber(
  className: string,
  admissionDateStr?: string,
  existingRollNumbers: string[] = []
): string {
  const classCode = parseClassCode(className);
  
  let yearStr = '2026';
  if (admissionDateStr) {
    const yearMatch = admissionDateStr.match(/\d{4}/);
    if (yearMatch) {
      yearStr = yearMatch[0];
    }
  } else {
    yearStr = new Date().getFullYear().toString();
  }

  const prefix = `SC-${yearStr}-${classCode}-`;
  
  // Find all existing sequence numbers for this prefix
  let maxSeq = 0;
  const upperExisting = existingRollNumbers.map(r => (r || '').trim().toUpperCase());

  for (const r of upperExisting) {
    if (r.startsWith(prefix)) {
      const seqPart = r.replace(prefix, '');
      const seqNum = parseInt(seqPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqPadded = nextSeq.toString().padStart(4, '0');
  return `${prefix}${seqPadded}`;
}

/**
 * Automatically generates a unique username for student.
 * e.g., "John Doe" in Class 5 -> "sc_johndoe" or "sc_johndoe_05"
 */
export function generateUsername(
  studentName: string,
  className: string,
  existingUsernames: string[] = []
): string {
  const cleanName = (studentName || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  
  const classCode = parseClassCode(className);
  const baseUsername = `sc_${cleanName || 'student'}_${classCode}`;
  const existingSet = new Set(existingUsernames.map(u => (u || '').toLowerCase().trim()));

  if (!existingSet.has(baseUsername.toLowerCase())) {
    return baseUsername;
  }

  let counter = 1;
  while (existingSet.has(`${baseUsername}${counter}`.toLowerCase())) {
    counter++;
  }
  return `${baseUsername}${counter}`;
}

/**
 * Generates a strong temporary password (e.g. Sun@2026#742)
 */
export function generateTemporaryPassword(): string {
  const years = ['2026', '2027'];
  const symbols = ['@', '#', '$', '!'];
  const year = years[Math.floor(Math.random() * years.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `Sun${symbol}${year}#${randomDigits}`;
}

/**
 * Validates input fields for a new admission
 */
export function validateAdmissionInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input.studentName || !input.studentName.trim()) {
    errors.push('Student name is required.');
  }

  if (!input.fatherName || !input.fatherName.trim()) {
    errors.push("Father's name is required.");
  }

  const targetClass = input.className || input.class;
  if (!targetClass || !targetClass.trim()) {
    errors.push('Class / Grade is required.');
  }

  if (!input.mobile || !input.mobile.trim()) {
    errors.push('Mobile number is required.');
  } else {
    const cleanMobile = input.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      errors.push('Mobile number must be exactly 10 digits.');
    }
  }

  if (input.parentMobile) {
    const cleanParentMobile = input.parentMobile.replace(/\D/g, '');
    if (cleanParentMobile.length !== 10) {
      errors.push('Parent mobile number must be exactly 10 digits.');
    }
  }

  if (!input.dob || !input.dob.trim()) {
    errors.push('Date of Birth (DOB) is required.');
  } else {
    const dobDate = new Date(input.dob);
    if (isNaN(dobDate.getTime())) {
      errors.push('Invalid Date of Birth format.');
    } else {
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 2 || age > 30) {
        errors.push('Date of birth indicates an invalid student age range (must be between 2 and 30 years old).');
      }
    }
  }

  if (!input.gender || !input.gender.trim()) {
    errors.push('Gender is required.');
  }

  if (!input.address || !input.address.trim()) {
    errors.push('Address is required.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks for duplicate student records using Name, Mobile, Parent Mobile, and DOB
 */
export function checkDuplicateStudent(
  input: any,
  existingStudents: any[] = [],
  existingAdmissions: any[] = []
): DuplicateCheckResult {
  const normName = (input.studentName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanMobile = (input.mobile || '').replace(/\D/g, '').slice(-10);
  const cleanParentMobile = (input.parentMobile || '').replace(/\D/g, '').slice(-10);
  const normDob = (input.dob || '').trim();
  const normClass = (input.className || input.class || '').trim().toLowerCase();

  const allRecords = [
    ...existingStudents.map(s => ({ ...s, _type: 'student', studentName: s.name })),
    ...existingAdmissions.map(a => ({ ...a, _type: 'admission' }))
  ];

  for (const rec of allRecords) {
    const recName = (rec.studentName || rec.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const recMobile = (rec.mobile || '').replace(/\D/g, '').slice(-10);
    const recParentMobile = (rec.parentMobile || '').replace(/\D/g, '').slice(-10);
    const recDob = (rec.dob || '').trim();
    const recClass = (rec.className || rec.class || '').trim().toLowerCase();

    // Condition 1: Same Name AND Same Mobile
    if (normName && cleanMobile && recName === normName && recMobile === cleanMobile) {
      return {
        isDuplicate: true,
        reason: `A student named "${rec.studentName || rec.name}" with mobile number "${rec.mobile}" already exists (${rec.rollNo ? 'Roll No: ' + rec.rollNo : 'Admission Record'}).`,
        matchedStudent: rec
      };
    }

    // Condition 2: Same Name AND Same Parent Mobile
    if (normName && cleanParentMobile && recName === normName && recParentMobile === cleanParentMobile) {
      return {
        isDuplicate: true,
        reason: `A student named "${rec.studentName || rec.name}" with parent mobile number "${rec.parentMobile}" already exists.`,
        matchedStudent: rec
      };
    }

    // Condition 3: Same Name AND Same DOB AND Same Class
    if (normName && normDob && normClass && recName === normName && recDob === normDob && recClass === normClass) {
      return {
        isDuplicate: true,
        reason: `A student named "${rec.studentName || rec.name}" with Date of Birth "${rec.dob}" is already enrolled in "${rec.class || rec.className}".`,
        matchedStudent: rec
      };
    }

    // Condition 4: Same Mobile AND Same DOB
    if (cleanMobile && cleanMobile.length === 10 && normDob && recMobile === cleanMobile && recDob === normDob) {
      return {
        isDuplicate: true,
        reason: `A student profile with mobile "${rec.mobile}" and DOB "${rec.dob}" is already registered.`,
        matchedStudent: rec
      };
    }
  }

  return {
    isDuplicate: false
  };
}
