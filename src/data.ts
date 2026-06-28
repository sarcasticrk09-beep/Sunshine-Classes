/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Student,
  Teacher,
  Admission,
  Course,
  Batch,
  Attendance,
  FeeStatus,
  FeeReceipt,
  Test,
  StudentMark,
  Homework,
  HomeworkSubmission,
  BlogPost,
  Testimonial,
  GalleryItem,
  AppNotification,
  Inquiry,
  AuditLog,
  StudentSubscription,
  SubscriptionPayment,
  SubscriptionReceipt,
  SubscriptionNotification,
  SubscriptionConfig,
  TimetableEntry
} from './types';

export const SEED_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Class 10 Board Specialists (Math, Science, English)',
    subjects: ['Mathematics', 'Science (Phy/Chem/Bio)', 'English Literature & Grammar', 'Social Studies'],
    duration: '1 Year (Full Session)',
    features: ['Weekly Doubt Clearing', 'Chapter-wise MCQ Tests', 'Previous 10 Years Board Papers', 'NCERT-Based Deep Dives'],
    fees: 1500
  },
  {
    id: 'c2',
    name: 'Class 9 Foundation Course (Science & Math focus)',
    subjects: ['Mathematics', 'Science', 'English'],
    duration: '1 Year (Full Session)',
    features: ['Strong concept building', 'Bi-weekly tests', 'Daily revision notes', 'Parent monthly meetups'],
    fees: 1200
  },
  {
    id: 'c3',
    name: 'Class 8 Comprehensive Learning',
    subjects: ['Mathematics', 'Science', 'English', 'Sanskrit/Hindi'],
    duration: '1 Year',
    features: ['Interactive modules', 'Doubt clinics', 'Regular assessment reports'],
    fees: 1000
  },
  {
    id: 'c4',
    name: 'Classes 6 to 7 Standard Path',
    subjects: ['All Primary Subjects (NCERT)'],
    duration: '1 Year',
    features: ['Basic calculations speedups', 'Interactive English reading', 'Fun Science experiments'],
    fees: 800
  },
  {
    id: 'c5',
    name: 'Classes 1 to 5 Junior Sunshine',
    subjects: ['All Primary Subjects (NCERT)'],
    duration: '1 Year',
    features: ['Special attention', 'Interactive homework', 'Creative writing classes'],
    fees: 600
  }
];

export const SEED_BATCHES: Batch[] = [
  { id: 'b1', name: 'Class 10 - Morning Excellence', time: '07:00 AM - 09:30 AM', class: 'Class 10', teacherName: 'Suresh Kumar', monthlyFee: 1200, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' },
  { id: 'b2', name: 'Class 10 - Evening Stars', time: '04:00 PM - 06:30 PM', class: 'Class 10', teacherName: 'Suresh Kumar', monthlyFee: 1200, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' },
  { id: 'b3', name: 'Class 9 - Foundation Group', time: '03:00 PM - 05:00 PM', class: 'Class 9', teacherName: 'Anil Pandey', monthlyFee: 1000, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' },
  { id: 'b4', name: 'Class 8 - Apex Batch', time: '02:00 PM - 04:00 PM', class: 'Class 8', teacherName: 'Ritu Singh', monthlyFee: 800, startDate: '2026-05-15', billingCycle: 'Monthly', nextDueDate: '2026-06-15', status: 'DUE' },
  { id: 'b5', name: 'Primary - Junior Sunshine', time: '01:00 PM - 03:00 PM', class: 'Class 5', teacherName: 'Neha Sharma', monthlyFee: 600, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' }
];

export const SEED_STUDENT_SUBSCRIPTIONS: StudentSubscription[] = [
  {
    id: 'sub1',
    studentId: 's1',
    studentName: 'Rahul Verma',
    admissionNo: 'SC-1001',
    batchId: 'b2',
    batchName: 'Class 10 - Evening Stars',
    monthlyFee: 1200,
    startDate: '2026-06-01',
    billingCycle: 'Monthly',
    nextDueDate: '2026-07-01',
    status: 'ACTIVE',
    daysRemaining: 4,
    lastPaymentDate: '2026-06-02',
    gracePeriodDays: 5
  },
  {
    id: 'sub2',
    studentId: 's2',
    studentName: 'Priya Mishra',
    admissionNo: 'SC-1002',
    batchId: 'b2',
    batchName: 'Class 10 - Evening Stars',
    monthlyFee: 1200,
    startDate: '2026-06-01',
    billingCycle: 'Monthly',
    nextDueDate: '2026-06-25',
    status: 'OVERDUE',
    daysRemaining: -2,
    lastPaymentDate: '2026-05-24',
    gracePeriodDays: 5
  },
  {
    id: 'sub3',
    studentId: 's3',
    studentName: 'Aditya Gupta',
    admissionNo: 'SC-1003',
    batchId: 'b3',
    batchName: 'Class 9 - Foundation Group',
    monthlyFee: 1000,
    startDate: '2026-06-01',
    billingCycle: 'Monthly',
    nextDueDate: '2026-06-15',
    status: 'EXPIRED',
    daysRemaining: -12,
    lastPaymentDate: '2026-05-14',
    gracePeriodDays: 5
  },
  {
    id: 'sub4',
    studentId: 's4',
    studentName: 'Shreya Tiwari',
    admissionNo: 'SC-1004',
    batchId: 'b1',
    batchName: 'Class 10 - Morning Excellence',
    monthlyFee: 1200,
    startDate: '2026-06-01',
    billingCycle: 'Monthly',
    nextDueDate: '2026-06-30',
    status: 'DUE_SOON',
    daysRemaining: 3,
    lastPaymentDate: '2026-05-30',
    gracePeriodDays: 5
  }
];

export const SEED_SUBSCRIPTION_PAYMENTS: SubscriptionPayment[] = [
  {
    id: 'PAY-1001',
    subscriptionId: 'sub1',
    studentId: 's1',
    studentName: 'Rahul Verma',
    admissionNo: 'SC-1001',
    batchId: 'b2',
    batchName: 'Class 10 - Evening Stars',
    month: 'June 2026',
    amountPaid: 1200,
    paymentMethod: 'UPI',
    transactionId: 'UPI983104820491',
    paymentDate: '2026-06-02',
    status: 'SUCCESS'
  },
  {
    id: 'PAY-1002',
    subscriptionId: 'sub2',
    studentId: 's2',
    studentName: 'Priya Mishra',
    admissionNo: 'SC-1002',
    batchId: 'b2',
    batchName: 'Class 10 - Evening Stars',
    month: 'May 2026',
    amountPaid: 1200,
    paymentMethod: 'CASH',
    transactionId: 'CASH9401824',
    paymentDate: '2026-05-24',
    status: 'SUCCESS'
  },
  {
    id: 'PAY-1003',
    subscriptionId: 'sub3',
    studentId: 's3',
    studentName: 'Aditya Gupta',
    admissionNo: 'SC-1003',
    batchId: 'b3',
    batchName: 'Class 9 - Foundation Group',
    month: 'May 2026',
    amountPaid: 1000,
    paymentMethod: 'CARD',
    transactionId: 'TXN49310582',
    paymentDate: '2026-05-14',
    status: 'SUCCESS'
  },
  {
    id: 'PAY-1004',
    subscriptionId: 'sub4',
    studentId: 's4',
    studentName: 'Shreya Tiwari',
    admissionNo: 'SC-1004',
    batchId: 'b1',
    batchName: 'Class 10 - Morning Excellence',
    month: 'May 2026',
    amountPaid: 1200,
    paymentMethod: 'NET_BANKING',
    transactionId: 'TXN50210482',
    paymentDate: '2026-05-30',
    status: 'SUCCESS'
  }
];

export const SEED_SUBSCRIPTION_RECEIPTS: SubscriptionReceipt[] = [
  {
    id: 'REC-SUBS-101',
    paymentId: 'PAY-1001',
    studentId: 's1',
    studentName: 'Rahul Verma',
    admissionNo: 'SC-1001',
    batchName: 'Class 10 - Evening Stars',
    paymentMonth: 'June 2026',
    amountPaid: 1200,
    transactionId: 'TXN8491049210',
    paymentMethod: 'UPI',
    paymentDate: '2026-06-02'
  },
  {
    id: 'REC-SUBS-102',
    paymentId: 'PAY-1002',
    studentId: 's2',
    studentName: 'Priya Mishra',
    admissionNo: 'SC-1002',
    batchName: 'Class 10 - Evening Stars',
    paymentMonth: 'May 2026',
    amountPaid: 1200,
    transactionId: 'CASH9401824',
    paymentMethod: 'CASH',
    paymentDate: '2026-05-24'
  },
  {
    id: 'REC-SUBS-103',
    paymentId: 'PAY-1003',
    studentId: 's3',
    studentName: 'Aditya Gupta',
    admissionNo: 'SC-1003',
    batchName: 'Class 9 - Foundation Group',
    paymentMonth: 'May 2026',
    amountPaid: 1000,
    transactionId: 'TXN49310582',
    paymentMethod: 'CARD',
    paymentDate: '2026-05-14'
  },
  {
    id: 'REC-SUBS-104',
    paymentId: 'PAY-1004',
    studentId: 's4',
    studentName: 'Shreya Tiwari',
    admissionNo: 'SC-1004',
    batchName: 'Class 10 - Morning Excellence',
    paymentMonth: 'May 2026',
    amountPaid: 1200,
    transactionId: 'TXN50210482',
    paymentMethod: 'NET_BANKING',
    paymentDate: '2026-05-30'
  }
];

export const SEED_SUBSCRIPTION_NOTIFICATIONS: SubscriptionNotification[] = [
  {
    id: 'notif-sub-1',
    studentId: 's2',
    studentName: 'Priya Mishra',
    title: 'Fee Payment Due Soon',
    content: 'Dear Priya Mishra, your monthly subscription fee of ₹1200 for Class 10 - Evening Stars is due on 2026-06-25.',
    date: '2026-06-18',
    type: 'REMINDER_7_DAYS',
    status: 'SENT',
    channel: 'DASHBOARD'
  },
  {
    id: 'notif-sub-2',
    studentId: 's2',
    studentName: 'Priya Mishra',
    title: 'Urgent: Subscription Overdue',
    content: 'Dear Priya Mishra, your monthly fee is overdue since 2026-06-25. Please pay soon to avoid service expiry!',
    date: '2026-06-26',
    type: 'REMINDER_OVERDUE',
    status: 'SENT',
    channel: 'DASHBOARD'
  },
  {
    id: 'notif-sub-3',
    studentId: 's3',
    studentName: 'Aditya Gupta',
    title: 'Subscription EXPIRED',
    content: 'Dear Aditya Gupta, your subscription has EXPIRED since 2026-06-20 (grace period over). Standard resources are now locked until payment.',
    date: '2026-06-21',
    type: 'REMINDER_OVERDUE',
    status: 'SENT',
    channel: 'DASHBOARD'
  }
];

export const SEED_SUBSCRIPTION_CONFIG: SubscriptionConfig = {
  billingDate: 1,
  gracePeriod: 5,
  lateFee: 50,
  enableOverdueSMS: true,
  enableMidGraceSMS: true,
  enableExpiryWarningSMS: false,
  enableExpiredSMS: true
};

export const SEED_TEACHERS: Teacher[] = [
  {
    id: 't1',
    userId: 'u2',
    name: 'Suresh Kumar',
    email: 'suresh@sunshine.com',
    phone: '9876543210',
    qualification: 'M.Sc. Mathematics, B.Ed',
    specialty: ['Mathematics', 'Physics'],
    batches: ['Class 10 - Morning Excellence', 'Class 10 - Evening Stars']
  },
  {
    id: 't2',
    userId: 'u5',
    name: 'Anil Pandey',
    email: 'anil@sunshine.com',
    phone: '8765432109',
    qualification: 'M.Sc. Chemistry, Ph.D. Scholar',
    specialty: ['Chemistry', 'Biology'],
    batches: ['Class 9 - Foundation Group']
  },
  {
    id: 't3',
    userId: 'u6',
    name: 'Ritu Singh',
    email: 'ritu@sunshine.com',
    phone: '7654321098',
    qualification: 'M.A. English Literature, B.Ed',
    specialty: ['English Literature', 'Social Studies'],
    batches: ['Class 8 - Apex Batch']
  }
];

export const SEED_STUDENTS: Student[] = [
  {
    id: 's1',
    userId: 'u4',
    rollNo: 'SC-1001',
    name: 'Rahul Verma',
    class: 'Class 10',
    fatherName: 'Ram Pal Verma',
    motherName: 'Shanti Devi',
    dob: '2011-05-15',
    gender: 'Male',
    address: 'Chungi Road, Pihani, Hardoi, UP',
    mobile: '9161586254',
    whatsapp: '9161586254',
    parentMobile: '8707738284',
    email: 'rahul.verma@gmail.com',
    preferredBatch: 'Class 10 - Evening Stars',
    preferredTiming: '04:00 PM - 06:30 PM',
    admissionDate: '2025-04-10',
    attendancePercentage: 92
  },
  {
    id: 's2',
    userId: 'u7',
    rollNo: 'SC-1002',
    name: 'Priya Mishra',
    class: 'Class 10',
    fatherName: 'Kamlesh Mishra',
    motherName: 'Suman Mishra',
    dob: '2011-08-22',
    gender: 'Female',
    address: 'Near Subhash Park, Pihani, Hardoi',
    mobile: '9450000001',
    whatsapp: '9450000001',
    parentMobile: '9450000002',
    email: 'priya.mishra@gmail.com',
    preferredBatch: 'Class 10 - Evening Stars',
    preferredTiming: '04:00 PM - 06:30 PM',
    admissionDate: '2025-04-12',
    attendancePercentage: 96
  },
  {
    id: 's3',
    userId: 'u8',
    rollNo: 'SC-1003',
    name: 'Aditya Gupta',
    class: 'Class 9',
    fatherName: 'Manoj Gupta',
    motherName: 'Meena Gupta',
    dob: '2012-03-10',
    gender: 'Male',
    address: 'Mohalla Mishrana, Pihani',
    mobile: '9889900112',
    whatsapp: '9889900112',
    parentMobile: '9889900113',
    email: 'aditya.gupta@gmail.com',
    preferredBatch: 'Class 9 - Foundation Group',
    preferredTiming: '03:00 PM - 05:00 PM',
    admissionDate: '2025-04-15',
    attendancePercentage: 88
  },
  {
    id: 's4',
    userId: 'u9',
    rollNo: 'SC-1004',
    name: 'Shreya Tiwari',
    class: 'Class 10',
    fatherName: 'Vinod Tiwari',
    motherName: 'Reena Tiwari',
    dob: '2011-11-02',
    gender: 'Female',
    address: 'Opposite Subhash Park, Pihani',
    mobile: '9123456780',
    whatsapp: '9123456780',
    parentMobile: '9123456781',
    email: 'shreya.tiwari@gmail.com',
    preferredBatch: 'Class 10 - Morning Excellence',
    preferredTiming: '07:00 AM - 09:30 AM',
    admissionDate: '2025-04-16',
    attendancePercentage: 94
  }
];

export const SEED_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'Shubham Shukla (Founder)', email: 'admin@sunshine.com', role: 'ADMIN', phone: '8707738284' },
  { id: 'u2', username: 'teacher', name: 'Suresh Kumar', email: 'suresh@sunshine.com', role: 'TEACHER', phone: '9876543210' },
  { id: 'u3', username: 'reception', name: 'Neha Sharma', email: 'reception@sunshine.com', role: 'RECEPTIONIST', phone: '8707738284' },
  { id: 'u4', username: 'student', name: 'Rahul Verma', email: 'rahul@gmail.com', role: 'STUDENT', phone: '9161586254' },
  { id: 'u5', username: 'anil', name: 'Anil Pandey', email: 'anil@sunshine.com', role: 'TEACHER', phone: '8765432109' },
  { id: 'u6', username: 'ritu', name: 'Ritu Singh', email: 'ritu@sunshine.com', role: 'TEACHER', phone: '7654321098' },
  { id: 'u7', username: 'priya', name: 'Priya Mishra', email: 'priya@gmail.com', role: 'STUDENT', phone: '9450000001' }
];

export const SEED_ADMISSIONS: Admission[] = [
  {
    id: 'ADM-2026-001',
    studentName: 'Aman Dixit',
    fatherName: 'Rajesh Dixit',
    motherName: 'Anju Dixit',
    dob: '2012-04-18',
    gender: 'Male',
    className: 'Class 9',
    previousSchool: 'Pihani Inter College',
    mobile: '9870001122',
    whatsapp: '9870001122',
    parentMobile: '9870001123',
    email: 'aman.dixit@gmail.com',
    address: 'Lohani Mohalla, Pihani, Hardoi',
    preferredBatch: 'Class 9 - Foundation Group',
    preferredTiming: '03:00 PM - 05:00 PM',
    status: 'PENDING',
    date: '2026-06-25'
  },
  {
    id: 'ADM-2026-002',
    studentName: 'Kajal Rathore',
    fatherName: 'Jaswant Rathore',
    motherName: 'Kamla Rathore',
    dob: '2013-09-05',
    gender: 'Female',
    className: 'Class 8',
    previousSchool: 'St. James School, Hardoi',
    mobile: '9161223344',
    whatsapp: '9161223344',
    parentMobile: '9161223345',
    email: 'kajal.rathore@gmail.com',
    address: 'Mishrana, Opposite Subhash Park, Pihani',
    preferredBatch: 'Class 8 - Apex Batch',
    preferredTiming: '02:00 PM - 04:00 PM',
    status: 'APPROVED',
    date: '2026-06-20'
  }
];

export const SEED_ATTENDANCE: Attendance[] = [
  // Attendance history for s1 (Rahul)
  { id: 'at1', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-24', status: 'PRESENT', markedBy: 'Suresh Kumar' },
  { id: 'at2', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-25', status: 'PRESENT', markedBy: 'Suresh Kumar' },
  { id: 'at3', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-26', status: 'LATE', markedBy: 'Suresh Kumar' },
  { id: 'at4', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-27', status: 'PRESENT', markedBy: 'Suresh Kumar' },
  
  // Attendance for s2 (Priya)
  { id: 'at5', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-24', status: 'PRESENT', markedBy: 'Suresh Kumar' },
  { id: 'at6', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-25', status: 'PRESENT', markedBy: 'Suresh Kumar' },
  { id: 'at7', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-26', status: 'PRESENT', markedBy: 'Suresh Kumar' },
  { id: 'at8', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-27', status: 'PRESENT', markedBy: 'Suresh Kumar' },

  // Attendance for s3 (Aditya)
  { id: 'at9', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', date: '2026-06-26', status: 'ABSENT', markedBy: 'Anil Pandey' },
  { id: 'at10', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', date: '2026-06-27', status: 'PRESENT', markedBy: 'Anil Pandey' }
];

export const SEED_FEE_STATUS: FeeStatus[] = [
  { id: 'fs1', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', month: 'June 2026', totalFee: 1500, discount: 100, scholarship: 200, paidFee: 1200, pendingFee: 0, status: 'PAID', dueDate: '2026-06-10' },
  { id: 'fs2', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', month: 'July 2026', totalFee: 1500, discount: 0, scholarship: 0, paidFee: 0, pendingFee: 1500, status: 'PENDING', dueDate: '2026-07-10' },
  { id: 'fs3', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', month: 'June 2026', totalFee: 1500, discount: 0, scholarship: 500, paidFee: 1000, pendingFee: 0, status: 'PAID', dueDate: '2026-06-10' },
  { id: 'fs4', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', month: 'July 2026', totalFee: 1500, discount: 0, scholarship: 500, paidFee: 0, pendingFee: 1000, status: 'PENDING', dueDate: '2026-07-10' },
  { id: 'fs5', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', month: 'June 2026', totalFee: 1200, discount: 0, scholarship: 0, paidFee: 600, pendingFee: 600, status: 'PARTIAL', dueDate: '2026-06-10' }
];

export const SEED_FEE_RECEIPTS: FeeReceipt[] = [
  { id: 'REC-101', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', month: 'June 2026', amountPaid: 1200, paymentMethod: 'UPI', date: '2026-06-08', transactionId: 'UPI983104820491', receivedBy: 'Neha Sharma' },
  { id: 'REC-102', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', month: 'June 2026', amountPaid: 1000, paymentMethod: 'CASH', date: '2026-06-09', receivedBy: 'Neha Sharma' },
  { id: 'REC-103', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', month: 'June 2026', amountPaid: 600, paymentMethod: 'ONLINE', date: '2026-06-10', transactionId: 'TXN8491049210', receivedBy: 'Neha Sharma' }
];

export const SEED_TESTS: Test[] = [
  { id: 'tst1', title: 'Mathematics Chapter 1 & 2', class: 'Class 10', subject: 'Mathematics', chapter: 'Real Numbers & Polynomials', totalMarks: 50, date: '2026-06-15', highestMarks: 49, averageMarks: 38 },
  { id: 'tst2', title: 'Science Mechanics Test', class: 'Class 10', subject: 'Science', chapter: 'Light Reflection & Refraction', totalMarks: 30, date: '2026-06-20', highestMarks: 28, averageMarks: 22 },
  { id: 'tst3', title: 'English Grammar Assessment', class: 'Class 10', subject: 'English', chapter: 'Tenses & Active-Passive Voice', totalMarks: 25, date: '2026-06-22', highestMarks: 24, averageMarks: 18 }
];

export const SEED_STUDENT_MARKS: StudentMark[] = [
  // Math Test (tst1) results
  { id: 'm1', testId: 'tst1', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', marksObtained: 46, remarks: 'Excellent logical skills. Keep it up!', rank: 2 },
  { id: 'm2', testId: 'tst1', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', marksObtained: 49, remarks: 'Outstanding performance. Class Topper!', rank: 1 },
  { id: 'm3', testId: 'tst1', studentId: 's4', studentName: 'Shreya Tiwari', class: 'Class 10', marksObtained: 42, remarks: 'Good grasp, minor calculation mistake in Q5', rank: 3 },
  
  // Science Test (tst2) results
  { id: 'm4', testId: 'tst2', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', marksObtained: 25, remarks: 'Good score, revise ray diagrams', rank: 2 },
  { id: 'm5', testId: 'tst2', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', marksObtained: 28, remarks: 'Very detailed explanations. Excellent.', rank: 1 }
];

export const SEED_HOMEWORK: Homework[] = [
  { id: 'hw1', title: 'Quadratic Equations Exercise 4.2', description: 'Solve all questions from Exercise 4.2 of NCERT textbook and show steps clearly in your notebook.', class: 'Class 10', subject: 'Mathematics', date: '2026-06-25', dueDate: '2026-06-28', teacherId: 't1', teacherName: 'Suresh Kumar' },
  { id: 'hw2', title: 'Chemical Reactions Balancing', description: 'Balance the 15 equations provided in the sheet. Upload a clean photograph or PDF of the completed work.', class: 'Class 10', subject: 'Science', date: '2026-06-26', dueDate: '2026-06-29', teacherId: 't1', teacherName: 'Suresh Kumar' },
  { id: 'hw3', title: 'Nouns & Pronouns Worksheet', description: 'Complete the preposition and pronoun filling exercise uploaded in study materials.', class: 'Class 8', subject: 'English', date: '2026-06-26', dueDate: '2026-06-28', teacherId: 't3', teacherName: 'Ritu Singh' }
];

export const SEED_HOMEWORK_SUBMISSIONS: HomeworkSubmission[] = [
  { id: 'hs1', homeworkId: 'hw1', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', submissionDate: '2026-06-27', textAnswer: 'Completed all 10 questions of Exercise 4.2. Roots calculated correctly.', status: 'SUBMITTED' },
  { id: 'hs2', homeworkId: 'hw1', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', submissionDate: '2026-06-26', textAnswer: 'Submitted homework copy in the class directory.', status: 'REVIEWED', remarks: 'Beautifully solved. Well done.', score: 'Excellent' }
];

export const SEED_BLOGS: BlogPost[] = [
  {
    id: 'b1',
    title: 'How to Score 95%+ in Class 10 Board Examinations',
    excerpt: 'Expert strategy tips from Sunshine Classes to conquer your board syllabus with structural revisions, mock tests, and smart planning.',
    content: 'Scoring above 95% in Class 10 board exams is not just about memorizing everything; it is about strategic planning. First, prioritize the NCERT textbook. Every single question in boards originates or aligns with the concepts in NCERT. Second, practice active recall and spaced repetition. Sunshine Classes conducts weekly test series specifically to enforce this. Third, manage your time during the exams. Spend the first 15 minutes reading the question paper meticulously, mapping out which questions to write first. Always start with the sections you are 100% confident in.',
    category: 'Board Preparation',
    author: 'Shubham Shukla (Founder)',
    date: '2026-06-20',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'b2',
    title: 'Overcoming Physics Phobia: Concepts Over Formulas',
    excerpt: 'Physics is easy when you relate it to daily life. Here is our teaching methodology to make science your favorite subject.',
    content: 'Many students struggle with physics numericals because they try to mug up formulas without understanding the fundamental physics behind them. At Sunshine Classes, we focus on visualization. When studying refraction, we show live glass slab experiments. Once you visualize light bending as it changes medium, formulas like Snell\'s Law become logical instead of intimidating.',
    category: 'Study Hacks',
    author: 'Suresh Kumar (Senior Faculty)',
    date: '2026-06-22',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'b3',
    title: 'The Power of Small Batch Sizes in Coaching',
    excerpt: 'Why crowds of 100+ students in a single class fail to deliver, and why individual attention of small cohorts is the key.',
    content: 'In large classroom halls, students often hesitate to raise their hands and clear doubts. Individual issues are overlooked in favor of general syllabus speed. At Sunshine Classes, we restrict batches to a small size. This allows teachers to understand each student\'s weak areas, analyze their mistakes on weekly tests, and curate custom progress plans.',
    category: 'Education Tips',
    author: 'Neha Sharma (Academic Advisor)',
    date: '2026-06-25',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=60'
  }
];

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: 'tstml1',
    name: 'Sanjay Verma (Parent of Rahul Verma)',
    role: 'PARENT',
    content: 'Sunshine Classes completely transformed Rahul\'s attitude towards Mathematics. The personalized weekly feedback report and digital attendance alert on WhatsApp help me track his regular progress easily.',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'tstml2',
    name: 'Priya Mishra (Class 10 State Topper)',
    role: 'STUDENT',
    content: 'The board preparation guidance here is phenomenal. Solving 10 years of NCERT chapter-wise question papers and attending daily doubt sessions in Mishra sir\'s room gave me massive confidence.',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'tstml3',
    name: 'Ramesh Tiwari (Parent of Shreya Tiwari)',
    role: 'PARENT',
    content: 'We are very happy with the discipline and structured study methodology at Sunshine. The online ERP system lets me view my daughter\'s test score graphs and fee payment receipts instantly.',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
  }
];

export const SEED_GALLERY: GalleryItem[] = [
  { id: 'g1', title: 'Saraswati Puja & Board Aspirants blessing ceremony', category: 'EVENTS', imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60' },
  { id: 'g2', title: 'Interactive Science Practical Demonstration', category: 'CLASSROOM', imageUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=600&auto=format&fit=crop&q=60' },
  { id: 'g3', title: 'Annual Sunshine Academic Excellence Awards 2025', category: 'ANNUAL_FUNCTION', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=60' },
  { id: 'g4', title: 'Weekly Merit Test Session', category: 'ACTIVITIES', imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&auto=format&fit=crop&q=60' },
  { id: 'g5', title: 'Class 10 District Merit Holder Celebration', category: 'RESULTS', imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=60' },
  { id: 'g6', title: 'Parent-Teacher Interaction Meet', category: 'EVENTS', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=60' }
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Admissions Open 2026-27', content: 'Enrollment for Classes 1 to 10 has started. Call office for details.', category: 'ANNOUNCEMENT', targetRole: 'ALL', date: '2026-06-25' },
  { id: 'n2', title: 'Class 10 Board Mock Math Test', content: 'Pre-board diagnostic test on Real Numbers & Algebra this Sunday at 8 AM.', category: 'EXAM', targetRole: 'STUDENT', date: '2026-06-26' },
  { id: 'n3', title: 'Fee Payment Reminder for July', content: 'Due date for July session coaching fee is 10-July-2026. Late charge of 50/- applies post due-date.', category: 'FEE', targetRole: 'STUDENT', date: '2026-06-27' },
  { id: 'n4', title: 'Summer Holiday Notice', content: 'Sunshine Classes will remain closed on 30-June for internal faculty workshop. Regular batches resume from 1-July.', category: 'HOLIDAY', targetRole: 'ALL', date: '2026-06-27' }
];

export const SEED_INQUIRIES: Inquiry[] = [
  { id: 'inq1', name: 'Manish Soni', mobile: '9988776655', whatsapp: '9988776655', className: 'Class 10', notes: 'Inquired about fee structure and night batch timing.', status: 'CONTACTED', date: '2026-06-26' },
  { id: 'inq2', name: 'Rani Patel', mobile: '9451122334', whatsapp: '9451122334', className: 'Class 8', notes: 'Wants demo class for Mathematics.', status: 'PENDING', date: '2026-06-27' }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', userId: 'u1', username: 'admin', action: 'LOGIN', details: 'Admin logged in from secure terminal', timestamp: '2026-06-27T08:00:00Z' },
  { id: 'l2', userId: 'u3', username: 'reception', action: 'FEE_COLLECTION', details: 'Collected 1200/- fee from Rahul Verma (REC-101)', timestamp: '2026-06-27T08:30:00Z' }
];

export const SEED_TIMETABLE: TimetableEntry[] = [
  { id: 'tt1', day: 'Monday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Suresh Kumar', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt2', day: 'Monday', className: 'Class 10', subject: 'Physics', teacherName: 'Suresh Kumar', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt3', day: 'Monday', className: 'Class 9', subject: 'Chemistry', teacherName: 'Anil Pandey', room: 'Room 102', startTime: '03:00 PM', endTime: '04:30 PM' },
  { id: 'tt4', day: 'Monday', className: 'Class 10', subject: 'English', teacherName: 'Ritu Singh', room: 'Room 103', startTime: '04:00 PM', endTime: '05:30 PM' },
  { id: 'tt5', day: 'Tuesday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Suresh Kumar', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt6', day: 'Tuesday', className: 'Class 10', subject: 'Biology', teacherName: 'Anil Pandey', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt7', day: 'Tuesday', className: 'Class 9', subject: 'Mathematics', teacherName: 'Suresh Kumar', room: 'Room 102', startTime: '03:00 PM', endTime: '05:00 PM' },
  { id: 'tt8', day: 'Wednesday', className: 'Class 10', subject: 'Physics', teacherName: 'Suresh Kumar', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt9', day: 'Wednesday', className: 'Class 10', subject: 'Chemistry', teacherName: 'Anil Pandey', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt10', day: 'Wednesday', className: 'Class 8', subject: 'English', teacherName: 'Ritu Singh', room: 'Room 103', startTime: '02:00 PM', endTime: '04:00 PM' },
  { id: 'tt11', day: 'Thursday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Suresh Kumar', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt12', day: 'Thursday', className: 'Class 10', subject: 'Social Studies', teacherName: 'Ritu Singh', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt13', day: 'Friday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Suresh Kumar', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt14', day: 'Friday', className: 'Class 10', subject: 'English', teacherName: 'Ritu Singh', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt15', day: 'Saturday', className: 'Class 10', subject: 'Revision Test Session', teacherName: 'Suresh Kumar', room: 'Main Hall', startTime: '08:00 AM', endTime: '11:00 AM' }
];

