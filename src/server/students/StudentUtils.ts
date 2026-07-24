/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

export const VALID_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

export const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PASSED_OUT', 'DELETED'];

/**
 * Validates phone numbers (10 digits)
 */
export function validatePhone(phone?: string): boolean {
  if (!phone) return true;
  const clean = phone.replace(/[^0-9]/g, '');
  return clean.length === 10;
}

/**
 * Validates email format
 */
export function validateEmail(email?: string): boolean {
  if (!email) return true;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validates pincode format (6 digits)
 */
export function validatePincode(pincode?: string): boolean {
  if (!pincode) return true;
  const clean = pincode.replace(/[^0-9]/g, '');
  return clean.length === 6;
}

/**
 * Validates date of birth format
 */
export function validateDob(dob?: string): boolean {
  if (!dob) return true;
  const date = new Date(dob);
  return !isNaN(date.getTime());
}

/**
 * Validates student profile update input
 */
export function validateStudentUpdateInput(input: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const name = input.name || input.personalInfo?.name;
  if (name !== undefined && (!name || !name.trim())) {
    errors.push('Student name is a required field.');
  }

  const mobile = input.mobile || input.contactInfo?.mobile;
  if (mobile && !validatePhone(mobile)) {
    errors.push('Student mobile number must be exactly 10 digits.');
  }

  const parentMobile = input.parentMobile || input.contactInfo?.parentMobile;
  if (parentMobile && !validatePhone(parentMobile)) {
    errors.push('Parent mobile number must be exactly 10 digits.');
  }

  const whatsapp = input.whatsapp || input.contactInfo?.whatsapp;
  if (whatsapp && !validatePhone(whatsapp)) {
    errors.push('WhatsApp number must be exactly 10 digits.');
  }

  const email = input.email || input.contactInfo?.email;
  if (email && !validateEmail(email)) {
    errors.push('Invalid email address format.');
  }

  const dob = input.dob || input.personalInfo?.dob;
  if (dob && !validateDob(dob)) {
    errors.push('Date of Birth must be a valid date.');
  }

  const pincode = input.pincode || input.contactInfo?.pincode;
  if (pincode && !validatePincode(pincode)) {
    errors.push('Pincode must be exactly 6 digits.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Record event in student_timelines collection
 */
export async function recordStudentTimelineEvent(
  db: any,
  studentId: string,
  eventType: 'ADMISSION' | 'PROFILE_UPDATED' | 'TEACHER_CHANGED' | 'CLASS_CHANGED' | 'STATUS_CHANGED' | 'SOFT_DELETED',
  title: string,
  description: string,
  performedBy: { username: string; userId?: string; role?: string }
) {
  try {
    const timestamp = Date.now();
    const eventId = `TL-${studentId}-${timestamp}`;
    const isoString = new Date().toISOString();

    const timelineDoc = {
      id: eventId,
      studentId: studentId,
      eventType: eventType,
      title: title,
      description: description,
      performedBy: performedBy.username || 'System',
      performedByRole: performedBy.role || 'ADMIN',
      createdAt: isoString
    };

    await setDoc(doc(db, 'student_timelines', eventId), timelineDoc);
    return timelineDoc;
  } catch (error) {
    console.error('[StudentUtils] Failed to record timeline event:', error);
    return null;
  }
}

/**
 * Record event in audit_logs collection
 */
export async function recordAuditLog(
  db: any,
  userId: string,
  username: string,
  action: string,
  details: string
) {
  try {
    const timestamp = Date.now();
    const logId = `L-STU-${timestamp}`;
    const isoString = new Date().toISOString();

    const auditLogDoc = {
      id: logId,
      userId: userId || 'system',
      username: username || 'Admin',
      action: action,
      details: details,
      timestamp: isoString
    };

    await setDoc(doc(db, 'audit_logs', logId), auditLogDoc);
    return auditLogDoc;
  } catch (error) {
    console.error('[StudentUtils] Failed to record audit log:', error);
    return null;
  }
}
