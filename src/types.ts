/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'TEACHER' | 'RECEPTIONIST' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface Student {
  id: string;
  userId: string;
  rollNo: string;
  name: string;
  class: string; // "Class 1" to "Class 10"
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  address: string;
  mobile: string;
  whatsapp: string;
  parentMobile: string;
  email: string;
  preferredBatch: string;
  preferredTiming: string;
  admissionDate: string;
  photoUrl?: string;
  documentUrl?: string;
  attendancePercentage: number;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialty: string[];
  batches: string[];
}

export interface Admission {
  id: string; // Generated Admission ID (e.g. SC-2026-001)
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  className: string;
  previousSchool?: string;
  mobile: string;
  whatsapp: string;
  parentMobile: string;
  email: string;
  address: string;
  aadhar?: string;
  photoUrl?: string;
  documentUrl?: string;
  preferredBatch: string;
  preferredTiming: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

export interface Course {
  id: string;
  name: string; // e.g. "Class 10 Board Specialist"
  subjects: string[];
  duration: string;
  features: string[];
  fees: number;
}

export interface Batch {
  id: string;
  name: string;
  time: string;
  class: string;
  teacherName: string;
  monthlyFee: number;
  startDate: string;
  billingCycle: string;
  nextDueDate: string;
  status: 'ACTIVE' | 'DUE' | 'EXPIRED';
}

export interface StudentSubscription {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  batchId: string;
  batchName: string;
  monthlyFee: number;
  startDate: string;
  billingCycle: 'Monthly';
  nextDueDate: string;
  status: 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'EXPIRED'; // 🟢 Active, 🟡 Due Soon, 🟠 Overdue, 🔴 Expired
  daysRemaining: number;
  lastPaymentDate?: string;
  gracePeriodDays: number;
  batchTime?: string;
  tempTimeChange?: string;
}

export interface SubscriptionPayment {
  id: string; // Transaction ID
  subscriptionId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  batchId: string;
  batchName: string;
  month: string; // e.g., "July 2026"
  amountPaid: number;
  paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING';
  transactionId: string;
  paymentDate: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface SubscriptionReceipt {
  id: string; // Receipt Number (e.g. REC-SUBS-001)
  paymentId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  batchName: string;
  paymentMonth: string;
  amountPaid: number;
  transactionId: string;
  paymentMethod: string;
  paymentDate: string;
}

export interface SubscriptionNotification {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  content: string;
  date: string;
  type: 'REMINDER_7_DAYS' | 'REMINDER_3_DAYS' | 'REMINDER_DUE_DATE' | 'REMINDER_OVERDUE';
  status: 'SENT' | 'PENDING';
  channel: 'DASHBOARD' | 'EMAIL' | 'WHATSAPP';
}

export interface SubscriptionConfig {
  billingDate: number; // e.g. Day 1 of month
  gracePeriod: number; // in days
  lateFee: number; // in Rupees (optional)
  enableOverdueSMS?: boolean;
  enableMidGraceSMS?: boolean;
  enableExpiryWarningSMS?: boolean;
  enableExpiredSMS?: boolean;
  whatsappProvider?: 'TWILIO' | 'WHATSAPP_BUSINESS' | 'NONE';
  whatsappApiKey?: string;
  whatsappPhoneNumber?: string;
  whatsappAccountSid?: string;
  whatsappAuthToken?: string;
  whatsappSenderNumber?: string;
  // Secure Payment Gateway / Fee Collection options
  enableOnlinePayments?: boolean;
  paymentGatewayProvider?: 'UPI_QR' | 'RAZORPAY' | 'STRIPE' | 'BANK_TRANSFER' | 'MOCK';
  upiId?: string;
  upiMerchantName?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfsc?: string;
  razorpayKeyId?: string;
  stripePublicKey?: string;
  // Advanced Fee Collection Controls
  allowPartialPayments?: boolean;
  requireReceiptUpload?: boolean;
  convenienceFeePercent?: number;
  enableUpiMethod?: boolean;
  enableCardMethod?: boolean;
  enableNetBankingMethod?: boolean;
  enableBankTransferMethod?: boolean;
  enableAutomatedFeeAlerts?: boolean;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  markedBy: string;
}

export interface FeeReceipt {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  month: string;
  amountPaid: number;
  paymentMethod: 'CASH' | 'UPI' | 'ONLINE';
  date: string;
  transactionId?: string;
  receivedBy: string;
}

export interface FeeStatus {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  month: string;
  totalFee: number;
  discount: number;
  scholarship: number;
  paidFee: number;
  pendingFee: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  dueDate: string;
}

export interface Test {
  id: string;
  title: string;
  class: string;
  subject: string;
  chapter: string;
  totalMarks: number;
  date: string;
  highestMarks?: number;
  averageMarks?: number;
}

export interface StudentMark {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  class: string;
  marksObtained: number;
  remarks?: string;
  rank?: number;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  class: string;
  subject: string;
  dueDate: string;
  date: string;
  teacherId: string;
  teacherName: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  class: string;
  submissionDate: string;
  textAnswer?: string;
  fileUrl?: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'PENDING';
  remarks?: string;
  score?: string; // e.g. "Excellent", "Good", "Needs Improvement"
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: 'PARENT' | 'STUDENT';
  content: string;
  rating: number;
  avatarUrl: string;
}

export interface Topper {
  id: string;
  name: string;
  score: string;
  rank: string;
  desc: string;
  img: string;
}

export interface FounderMember {
  id: string;
  name: string;
  title: string;
  qualification: string;
  message: string;
  tuitionFocus: string;
  avatarInitials: string;
  photoUrl?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  desc: string;
  file: string;
  size: string;
  class: string;
  category: 'NOTES' | 'QUESTION_PAPER';
  uploadedBy?: string;
  date?: string;
  fileData?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'ANNUAL_FUNCTION' | 'CLASSROOM' | 'ACTIVITIES' | 'RESULTS' | 'EVENTS';
  imageUrl: string;
  isVideo?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  category: 'ANNOUNCEMENT' | 'EXAM' | 'FEE' | 'HOMEWORK' | 'HOLIDAY';
  targetRole: 'ALL' | 'STUDENT' | 'TEACHER' | 'RECEPTIONIST';
  date: string;
  isRead?: boolean;
  targetBatch?: string;
  targetClass?: string;
  sentAsEmail?: boolean;
  emailRecipientsCount?: number;
}

export interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string;
  className: string;
  notes: string;
  status: 'PENDING' | 'CONTACTED' | 'RESOLVED';
  date: string;
}

export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  className: string; // e.g., "Class 10"
  subject: string;
  teacherName: string;
  room: string;
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "11:30 AM"
  isHoliday?: boolean;
  holidayReason?: string;
}

export interface EmailTemplatesConfig {
  receiptSubject: string;
  receiptBody: string;
  reminderSubject: string;
  reminderBody: string;
}

export interface WhatsAppTemplatesConfig {
  receiptTemplate: string;
  reminderTemplate: string;
  scheduleTemplate: string;
}


