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
  Topper,
  FounderMember,
  StudyMaterial,
  GalleryItem,
  AppNotification,
  Inquiry,
  AuditLog,
  StudentSubscription,
  SubscriptionPayment,
  SubscriptionReceipt,
  SubscriptionNotification,
  SubscriptionConfig,
  TimetableEntry,
  EmailTemplatesConfig,
  WhatsAppTemplatesConfig,
  BatchBulletinPost
} from './types';

export const getFeeForClass = (classStr: string): number => {
  if (!classStr) return 700;
  const match = classStr.match(/\d+/);
  if (match) {
    const classNum = parseInt(match[0], 10);
    if (classNum >= 1 && classNum <= 4) return 500;
    if (classNum >= 5 && classNum <= 8) return 700;
    if (classNum === 9) return 1000;
    if (classNum === 10) return 1200;
  }
  return 700; // default backup fee
};

export const SEED_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Class 10 Board Specialists (Math, Science, English)',
    subjects: ['Mathematics', 'Science (Phy/Chem/Bio)', 'English Literature & Grammar', 'Social Studies'],
    duration: '1 Year (Full Session)',
    features: ['Weekly Doubt Clearing', 'Chapter-wise MCQ Tests', 'Previous 10 Years Board Papers', 'NCERT-Based Deep Dives'],
    fees: 1200
  },
  {
    id: 'c2',
    name: 'Class 9 Foundation Course (Science & Math focus)',
    subjects: ['Mathematics', 'Science', 'English'],
    duration: '1 Year (Full Session)',
    features: ['Strong concept building', 'Bi-weekly tests', 'Daily revision notes', 'Parent monthly meetups'],
    fees: 1000
  },
  {
    id: 'c3',
    name: 'Classes 5 to 8 Apex Learning',
    subjects: ['Mathematics', 'Science', 'English', 'Sanskrit/Hindi'],
    duration: '1 Year',
    features: ['Interactive modules', 'Doubt clinics', 'Regular assessment reports'],
    fees: 700
  },
  {
    id: 'c4',
    name: 'Classes 1 to 4 Junior Sunshine',
    subjects: ['All Primary Subjects (NCERT)'],
    duration: '1 Year',
    features: ['Special attention', 'Interactive homework', 'Creative writing classes'],
    fees: 500
  }
];

export const SEED_BATCHES: Batch[] = [
  { id: 'b1', name: 'Class 10 - Morning Excellence', time: '07:00 AM - 09:30 AM', class: 'Class 10 Board Specialists', teacherName: 'Priyanshu Gupta', monthlyFee: 1200, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' },
  { id: 'b2', name: 'Class 10 - Evening Stars', time: '04:00 PM - 06:30 PM', class: 'Class 10 Board Specialists', teacherName: 'Priyanshu Gupta', monthlyFee: 1200, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' },
  { id: 'b3', name: 'Class 9 - Foundation Group', time: '03:00 PM - 05:00 PM', class: 'Class 9 Foundation Course', teacherName: 'Anil Pandey', monthlyFee: 1000, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' },
  { id: 'b4', name: 'Classes 5 to 8 - Apex Learning', time: '02:00 PM - 04:00 PM', class: 'Classes 5 to 8 Apex Learning', teacherName: 'Ritu Singh', monthlyFee: 700, startDate: '2026-05-15', billingCycle: 'Monthly', nextDueDate: '2026-06-15', status: 'DUE' },
  { id: 'b5', name: 'Classes 1 to 4 - Junior Sunshine', time: '01:00 PM - 03:00 PM', class: 'Classes 1 to 4 Junior Sunshine', teacherName: 'Neha Sharma', monthlyFee: 500, startDate: '2026-06-01', billingCycle: 'Monthly', nextDueDate: '2026-07-01', status: 'ACTIVE' }
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
  enableExpiredSMS: true,
  whatsappProvider: 'NONE',
  whatsappApiKey: '',
  whatsappPhoneNumber: '',
  whatsappAccountSid: '',
  whatsappAuthToken: '',
  whatsappSenderNumber: '',
  enableOnlinePayments: true,
  paymentGatewayProvider: 'UPI_QR',
  upiId: 'sunshineclasses@upi',
  upiMerchantName: 'Sunshine Classes Ltd',
  bankAccountHolder: 'Sunshine Classes ERP Solutions',
  bankAccountNumber: '33888542347',
  bankName: 'State Bank of India (Pihani Branch)',
  bankIfsc: 'SBIN0011180',
  razorpayKeyId: 'rzp_live_A9B8C7D6E5F4G3',
  stripePublicKey: 'pk_live_51Mxxxxxxxxxxxxxxxx',
  allowPartialPayments: false,
  requireReceiptUpload: true,
  convenienceFeePercent: 0,
  enableUpiMethod: true,
  enableCardMethod: true,
  enableNetBankingMethod: true,
  enableBankTransferMethod: true,
  enableAutomatedFeeAlerts: true,
  // New payment settings requested
  enableUpiPayments: true,
  coachingUpiId: "9161586254@upi",
  accountHolderName: "Sunshine Classes",
  paymentInstructions: "Please scan the QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM) or click 'Pay' if on mobile. After successful payment, please enter the correct 12-digit UPI UTR number and optionally upload the screenshot. Do not submit a dummy or incorrect UTR, as it will be rejected upon admin verification.",
  paymentVerificationTimeLimit: 24,
  receiptPrefix: "SUN-REC-",
  emailReceiptToggle: true,
  studentNotificationToggle: true
};

export const SEED_WHATSAPP_TEMPLATES: WhatsAppTemplatesConfig = {
  receiptTemplate: "Dear Parent, Sunshine Classes has received payment of ₹{{amount}} for {{studentName}} ({{className}}) for the month of {{month}}. Receipt ID: {{receiptId}}. Thank you!",
  reminderTemplate: "Dear Parent, the monthly tuition fee of ₹{{amount}} for {{studentName}} ({{className}}) is pending for {{month}}. Please pay before the due date {{dueDate}} to avoid late fees. Thank you, Sunshine Classes.",
  scheduleTemplate: "Hello {{studentName}}, please note that your batch timing for {{className}} has been adjusted. New timing: {{timing}}. Sunshine Classes."
};

export const SEED_EMAIL_TEMPLATES: EmailTemplatesConfig = {
  receiptSubject: "🧾 Fee Receipt - {{receiptId}} - Sunshine Classes",
  receiptBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">SUNSHINE CLASSES</h1>
    <p style="color: #ea580c; font-size: 12px; font-weight: bold; margin: 5px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Excellence in Education</p>
  </div>
  
  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ea580c;">
    <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #334155;">Official Tuition Fee Receipt</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Receipt No:</td>
        <td style="padding: 4px 0; text-align: right;">{{receiptId}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Date:</td>
        <td style="padding: 4px 0; text-align: right;">{{date}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Student Name:</td>
        <td style="padding: 4px 0; text-align: right;">{{studentName}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Class / Grade:</td>
        <td style="padding: 4px 0; text-align: right;">{{className}}</td>
      </tr>
    </table>
  </div>

  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <th style="padding: 8px 0; text-align: left; color: #334155;">Description</th>
        <th style="padding: 8px 0; text-align: right; color: #334155;">Amount</th>
      </tr>
      <tr>
        <td style="padding: 10px 0;">Tuition Fee - Cycle <strong>{{month}}</strong></td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1e3a8a; font-size: 15px;">₹{{amount}}</td>
      </tr>
    </table>
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #64748b; margin-bottom: 20px;">
    <tr>
      <td><strong>Payment Method:</strong> {{paymentMethod}}</td>
      <td style="text-align: right;"><strong>Ref / Transaction ID:</strong> {{transactionId}}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding-top: 8px;"><strong>Received By:</strong> {{receivedBy}}</td>
    </tr>
  </table>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
    <p style="margin: 0;">Thank you for your valuable support toward excellence in education.</p>
    <p style="margin: 5px 0 0 0; font-weight: bold; color: #475569;">Sunshine Classes, Pihani, Hardoi, UP, India</p>
    <p style="margin: 2px 0 0 0;">WhatsApp: +91 9999900001 | Call: +91 9999900002</p>
  </div>
</div>`,
  reminderSubject: "⚠️ Sunshine Classes - Tuition Fee Pending Reminder ({{month}})",
  reminderBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fecaca; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">SUNSHINE CLASSES</h1>
    <p style="color: #ea580c; font-size: 12px; font-weight: bold; margin: 5px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Excellence in Education</p>
  </div>
  
  <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
    <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #b45309;">⚠️ Tuition Fee Payment Reminder</h2>
    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 15px 0;">
      Dear Parent, 
    </p>
    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 15px 0;">
      We would like to remind you that the tuition fee for your child <strong>{{studentName}}</strong> ({{className}}) for the cycle <strong>{{month}}</strong> of <strong>₹{{amount}}</strong> is currently outstanding.
    </p>
    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0;">
      Please make the payment by the due date of <strong>{{dueDate}}</strong> to prevent late fines or study disruption. Thank you!
    </p>
  </div>

  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #f8fafc;">
    <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; tracking: 0.5px; color: #64748b;">Dues Summary</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Student Name:</td>
        <td style="padding: 4px 0; text-align: right;">{{studentName}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Class / Grade:</td>
        <td style="padding: 4px 0; text-align: right;">{{className}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Pending Month:</td>
        <td style="padding: 4px 0; text-align: right;">{{month}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Due Date:</td>
        <td style="padding: 4px 0; text-align: right;">{{dueDate}}</td>
      </tr>
      <tr style="border-top: 1px solid #e2e8f0;">
        <td style="padding: 8px 0; font-weight: bold; color: #b45309;">Pending Dues:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626; font-size: 16px;">₹{{amount}}</td>
      </tr>
    </table>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
    <p style="margin: 0;">If you have already paid, please ignore this email or present your previous receipt.</p>
    <p style="margin: 5px 0 0 0; font-weight: bold; color: #475569;">Sunshine Classes, Pihani, Hardoi, UP, India</p>
    <p style="margin: 2px 0 0 0;">WhatsApp: +91 9999900001 | Call: +91 9999900002</p>
  </div>
</div>`
};

export const SEED_TEACHERS: Teacher[] = [
  {
    id: 't1',
    userId: 'u2',
    name: 'Priyanshu Gupta',
    email: 'priyanshu@example.com',
    phone: '9999900000',
    qualification: 'M.Sc. Mathematics, B.Ed',
    specialty: ['Mathematics', 'Physics'],
    batches: ['Class 10 - Morning Excellence', 'Class 10 - Evening Stars']
  },
  {
    id: 't2',
    userId: 'u5',
    name: 'Anil Pandey',
    email: 'anil@example.com',
    phone: '9999900005',
    qualification: 'M.Sc. Chemistry, Ph.D. Scholar',
    specialty: ['Chemistry', 'Biology'],
    batches: ['Class 9 - Foundation Group']
  },
  {
    id: 't3',
    userId: 'u6',
    name: 'Ritu Singh',
    email: 'ritu@example.com',
    phone: '9999900006',
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
    class: 'Class 10 Board Specialists',
    fatherName: 'Ram Pal Verma',
    motherName: 'Shanti Devi',
    dob: '2011-05-15',
    gender: 'Male',
    address: '123 Education Lane, Pihani, Hardoi, UP',
    mobile: '9999900001',
    whatsapp: '9999900001',
    parentMobile: '9999900002',
    email: 'student.rahul@example.com',
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
    class: 'Class 10 Board Specialists',
    fatherName: 'Kamlesh Mishra',
    motherName: 'Suman Mishra',
    dob: '2011-08-22',
    gender: 'Female',
    address: '456 Park Road, Pihani, Hardoi',
    mobile: '9999900003',
    whatsapp: '9999900003',
    parentMobile: '9999900004',
    email: 'student.priya@example.com',
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
    class: 'Class 9 Foundation Course',
    fatherName: 'Manoj Gupta',
    motherName: 'Meena Gupta',
    dob: '2012-03-10',
    gender: 'Male',
    address: '789 Temple Street, Pihani, Hardoi',
    mobile: '9999900005',
    whatsapp: '9999900005',
    parentMobile: '9999900006',
    email: 'student.aditya@example.com',
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
    class: 'Class 10 Board Specialists',
    fatherName: 'Vinod Tiwari',
    motherName: 'Reena Tiwari',
    dob: '2011-11-02',
    gender: 'Female',
    address: '101 Green Avenue, Pihani, Hardoi',
    mobile: '9999900007',
    whatsapp: '9999900007',
    parentMobile: '9999900008',
    email: 'student.shreya@example.com',
    preferredBatch: 'Class 10 - Morning Excellence',
    preferredTiming: '07:00 AM - 09:30 AM',
    admissionDate: '2025-04-16',
    attendancePercentage: 94
  }
];

export const SEED_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'Priyanshu Gupta (Founder)', email: 'sunshineclassespihani@gmail.com', role: 'SUPER_ADMIN', phone: '9999900000' },
  { id: 'u2', username: 'teacher', name: 'Priyanshu Gupta', email: 'sunshineclassespihani@gmail.com', role: 'TEACHER', phone: '9999900000' },
  { id: 'u3', username: 'reception', name: 'Neha Sharma', email: 'reception@example.com', role: 'RECEPTIONIST', phone: '9999900002' },
  { id: 'u4', username: 'student', name: 'Rahul Verma', email: 'rahul@example.com', role: 'STUDENT', phone: '9999900001' },
  { id: 'u5', username: 'anil', name: 'Anil Pandey', email: 'anil@example.com', role: 'TEACHER', phone: '9999900005' },
  { id: 'u6', username: 'ritu', name: 'Ritu Singh', email: 'ritu@example.com', role: 'TEACHER', phone: '9999900006' },
  { id: 'u7', username: 'priya', name: 'Priya Mishra', email: 'priya@example.com', role: 'STUDENT', phone: '9999900003' },
  { id: 'u8', username: 'rajeev', name: 'Rajeev Kr. Verma (Co-Founder)', email: 'kumarvermarajeev79@gmail.com', role: 'ADMIN', phone: '9999900001' }
];

export const SEED_ADMISSIONS: Admission[] = [
  {
    id: 'ADM-2026-001',
    studentName: 'Aman Dixit',
    fatherName: 'Rajesh Dixit',
    motherName: 'Anju Dixit',
    dob: '2012-04-18',
    gender: 'Male',
    className: 'Class 9 Foundation Course',
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
    className: 'Classes 5 to 8 Apex Learning',
    previousSchool: 'St. James School, Hardoi',
    mobile: '9161223344',
    whatsapp: '9161223344',
    parentMobile: '9161223345',
    email: 'kajal.rathore@gmail.com',
    address: 'Mishrana, Opposite Subhash Park, Pihani',
    preferredBatch: 'Classes 5 to 8 - Apex Learning',
    preferredTiming: '02:00 PM - 04:00 PM',
    status: 'APPROVED',
    date: '2026-06-20'
  }
];

export const SEED_ATTENDANCE: Attendance[] = [
  // Attendance history for s1 (Rahul)
  { id: 'at1', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-24', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },
  { id: 'at2', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-25', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },
  { id: 'at3', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-26', status: 'LATE', markedBy: 'Priyanshu Gupta' },
  { id: 'at4', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', date: '2026-06-27', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },
  
  // Attendance for s2 (Priya)
  { id: 'at5', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-24', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },
  { id: 'at6', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-25', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },
  { id: 'at7', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-26', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },
  { id: 'at8', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', date: '2026-06-27', status: 'PRESENT', markedBy: 'Priyanshu Gupta' },

  // Attendance for s3 (Aditya)
  { id: 'at9', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', date: '2026-06-26', status: 'ABSENT', markedBy: 'Anil Pandey' },
  { id: 'at10', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', date: '2026-06-27', status: 'PRESENT', markedBy: 'Anil Pandey' }
];

export const SEED_FEE_STATUS: FeeStatus[] = [
  { id: 'fs1', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', month: 'June 2026', totalFee: 1200, discount: 0, scholarship: 0, paidFee: 0, pendingFee: 1200, status: 'PENDING', dueDate: '2026-06-10' },
  { id: 'fs2', studentId: 's1', studentName: 'Rahul Verma', class: 'Class 10', month: 'July 2026', totalFee: 1200, discount: 0, scholarship: 0, paidFee: 0, pendingFee: 1200, status: 'PENDING', dueDate: '2026-07-10' },
  { id: 'fs3', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', month: 'June 2026', totalFee: 1200, discount: 0, scholarship: 200, paidFee: 0, pendingFee: 1000, status: 'PENDING', dueDate: '2026-06-10' },
  { id: 'fs4', studentId: 's2', studentName: 'Priya Mishra', class: 'Class 10', month: 'July 2026', totalFee: 1200, discount: 0, scholarship: 200, paidFee: 0, pendingFee: 1000, status: 'PENDING', dueDate: '2026-07-10' },
  { id: 'fs5', studentId: 's3', studentName: 'Aditya Gupta', class: 'Class 9', month: 'June 2026', totalFee: 1000, discount: 0, scholarship: 0, paidFee: 0, pendingFee: 1000, status: 'PENDING', dueDate: '2026-06-10' }
];

export const SEED_FEE_RECEIPTS: FeeReceipt[] = [];

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
  { id: 'hw1', title: 'Quadratic Equations Exercise 4.2', description: 'Solve all questions from Exercise 4.2 of NCERT textbook and show steps clearly in your notebook.', class: 'Class 10', subject: 'Mathematics', date: '2026-06-25', dueDate: '2026-06-28', teacherId: 't1', teacherName: 'Priyanshu Gupta' },
  { id: 'hw2', title: 'Chemical Reactions Balancing', description: 'Balance the 15 equations provided in the sheet. Upload a clean photograph or PDF of the completed work.', class: 'Class 10', subject: 'Science', date: '2026-06-26', dueDate: '2026-06-29', teacherId: 't1', teacherName: 'Priyanshu Gupta' },
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
    author: 'Priyanshu Gupta (Founder)',
    date: '2026-06-20',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'b2',
    title: 'Overcoming Physics Phobia: Concepts Over Formulas',
    excerpt: 'Physics is easy when you relate it to daily life. Here is our teaching methodology to make science your favorite subject.',
    content: 'Many students struggle with physics numericals because they try to mug up formulas without understanding the fundamental physics behind them. At Sunshine Classes, we focus on visualization. When studying refraction, we show live glass slab experiments. Once you visualize light bending as it changes medium, formulas like Snell\'s Law become logical instead of intimidating.',
    category: 'Study Hacks',
    author: 'Priyanshu Gupta (Senior Faculty)',
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
  { id: 'tt1', day: 'Monday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Priyanshu Gupta', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt2', day: 'Monday', className: 'Class 10', subject: 'Physics', teacherName: 'Priyanshu Gupta', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt3', day: 'Monday', className: 'Class 9', subject: 'Chemistry', teacherName: 'Anil Pandey', room: 'Room 102', startTime: '03:00 PM', endTime: '04:30 PM' },
  { id: 'tt4', day: 'Monday', className: 'Class 10', subject: 'English', teacherName: 'Ritu Singh', room: 'Room 103', startTime: '04:00 PM', endTime: '05:30 PM' },
  { id: 'tt5', day: 'Tuesday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Priyanshu Gupta', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt6', day: 'Tuesday', className: 'Class 10', subject: 'Biology', teacherName: 'Anil Pandey', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt7', day: 'Tuesday', className: 'Class 9', subject: 'Mathematics', teacherName: 'Priyanshu Gupta', room: 'Room 102', startTime: '03:00 PM', endTime: '05:00 PM' },
  { id: 'tt8', day: 'Wednesday', className: 'Class 10', subject: 'Physics', teacherName: 'Priyanshu Gupta', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt9', day: 'Wednesday', className: 'Class 10', subject: 'Chemistry', teacherName: 'Anil Pandey', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt10', day: 'Wednesday', className: 'Class 8', subject: 'English', teacherName: 'Ritu Singh', room: 'Room 103', startTime: '02:00 PM', endTime: '04:00 PM' },
  { id: 'tt11', day: 'Thursday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Priyanshu Gupta', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt12', day: 'Thursday', className: 'Class 10', subject: 'Social Studies', teacherName: 'Ritu Singh', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt13', day: 'Friday', className: 'Class 10', subject: 'Mathematics', teacherName: 'Priyanshu Gupta', room: 'Room 101', startTime: '07:00 AM', endTime: '08:30 AM' },
  { id: 'tt14', day: 'Friday', className: 'Class 10', subject: 'English', teacherName: 'Ritu Singh', room: 'Room 101', startTime: '08:30 AM', endTime: '09:30 AM' },
  { id: 'tt15', day: 'Saturday', className: 'Class 10', subject: 'Revision Test Session', teacherName: 'Priyanshu Gupta', room: 'Main Hall', startTime: '08:00 AM', endTime: '11:00 AM' }
];

export const SEED_TOPPERS: Topper[] = [
  { id: 'top1', name: 'Priya Mishra', score: '98.4%', rank: 'State Topper Rank 4', desc: 'Outstanding logical step marks in Math & Physics numerical sheets.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60' },
  { id: 'top2', name: 'Anuj Soni', score: '96.2%', rank: 'Hardoi District Rank 12', desc: 'Outstanding chemical reactions balancing with flawless grammar papers.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60' },
  { id: 'top3', name: 'Aditi Shukla', score: '95.0%', rank: 'District Rank 18', desc: 'Perfect scoring in Social Studies maps and English grammar assessments.', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60' }
];

export const SEED_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat1',
    materialId: 'mat1',
    title: 'Class 10 Math Formula Cheat-Sheet',
    slug: 'class-10-math-formula-cheat-sheet',
    description: 'Complete algebraic, quadratic, and trigonometric formulas in 2 clean pages for quick revision before pre-board exams.',
    desc: 'Complete algebraic, quadratic, and trigonometric formulas in 2 clean pages.',
    class: 'Class 10',
    subject: 'Mathematics',
    chapter: 'Chapter 1 & 2',
    materialType: 'FORMULA_SHEET',
    category: 'NOTES',
    file: 'math_formulas.pdf',
    size: '1.2 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isPublic: true,
    status: 'PUBLISHED',
    downloadCount: 342,
    viewCount: 1250,
    tags: ['Math', 'Formulas', 'Class 10', 'Board Exam', 'Algebra', 'Trigonometry'],
    seoTitle: 'Class 10 Math Formula Cheat Sheet PDF - Sunshine Classes',
    metaDescription: 'Free download Class 10 Mathematics formula sheet covering Algebra, Trigonometry, and Quadratic equations by Priyanshu Gupta Sir.',
    keywords: ['Class 10 Math', 'Formula Sheet', 'Board Revision', 'NCERT Maths'],
    createdBy: 'Priyanshu Gupta (Founder)',
    uploadedBy: 'Priyanshu Gupta (Founder)',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
    date: '2026-06-01'
  },
  {
    id: 'mat2',
    materialId: 'mat2',
    title: 'Chemical Reactions and Equations PDF',
    slug: 'chemical-reactions-and-equations-pdf',
    description: 'NCERT back exercise solved chemical reactions with balancing shortcuts, oxidation-reduction notes, and board questions.',
    desc: 'NCERT back exercise solved chemical reactions with balancing shortcuts.',
    class: 'Class 10',
    subject: 'Science',
    chapter: 'Chapter 1',
    materialType: 'NOTES',
    category: 'NOTES',
    file: 'chemical_equations.pdf',
    size: '2.5 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isPublic: true,
    status: 'PUBLISHED',
    downloadCount: 289,
    viewCount: 980,
    tags: ['Science', 'Chemistry', 'Chemical Reactions', 'Class 10', 'NCERT'],
    seoTitle: 'Class 10 Science Chapter 1 Notes PDF - Sunshine Classes',
    metaDescription: 'Download NCERT Class 10 Science Chemical Reactions and Equations solved notes with balancing equations practice sheet.',
    keywords: ['Class 10 Chemistry', 'Chemical Reactions Notes', 'NCERT Solutions'],
    createdBy: 'Rajeev Kr. Verma (Co-Founder)',
    uploadedBy: 'Rajeev Kr. Verma (Co-Founder)',
    createdAt: '2026-06-05T11:00:00Z',
    updatedAt: '2026-06-18T14:30:00Z',
    date: '2026-06-05'
  },
  {
    id: 'mat3',
    materialId: 'mat3',
    title: 'Active & Passive Voice Rules Guide',
    slug: 'active-and-passive-voice-rules-guide',
    description: 'English grammar rules with pre-board mock practice questions and 50 solved transformation examples.',
    desc: 'English grammar rules with pre-board mock practice questions.',
    class: 'Class 8',
    subject: 'English',
    chapter: 'Grammar Unit 3',
    materialType: 'WORKSHEET',
    category: 'QUESTION_PAPER',
    file: 'english_grammar_voice.pdf',
    size: '800 KB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isPublic: true,
    status: 'PUBLISHED',
    downloadCount: 175,
    viewCount: 620,
    tags: ['English', 'Grammar', 'Active Passive', 'Class 8', 'Worksheet'],
    seoTitle: 'Class 8 English Active Passive Voice Rules PDF - Sunshine Classes',
    metaDescription: 'Complete guide for Active and Passive Voice for Class 8 English Grammar with solved worksheets.',
    keywords: ['Class 8 English', 'Active Passive Voice', 'Grammar Rules'],
    createdBy: 'Ritu Singh (Teacher)',
    uploadedBy: 'Ritu Singh (Teacher)',
    createdAt: '2026-06-10T09:30:00Z',
    updatedAt: '2026-06-20T16:00:00Z',
    date: '2026-06-10'
  },
  {
    id: 'mat4',
    materialId: 'mat4',
    title: 'Class 10 Physics Ray Diagrams',
    slug: 'class-10-physics-ray-diagrams',
    description: 'Hand-drawn mirror and lens ray formation scenarios for board exam reference with sign convention rules.',
    desc: 'Hand-drawn mirror and lens ray formation scenarios for board exam reference.',
    class: 'Class 10',
    subject: 'Science',
    chapter: 'Chapter 10',
    materialType: 'DIAGRAM_SHEET' as any,
    category: 'NOTES',
    file: 'physics_ray_diagrams.pdf',
    size: '4.1 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isPublic: true,
    status: 'PUBLISHED',
    downloadCount: 412,
    viewCount: 1420,
    tags: ['Physics', 'Ray Diagrams', 'Light', 'Class 10', 'Mirrors', 'Lenses'],
    seoTitle: 'Class 10 Physics Ray Diagrams Sheet PDF - Sunshine Classes',
    metaDescription: 'Download high quality ray diagrams for Class 10 Physics Light Reflection and Refraction chapter.',
    keywords: ['Class 10 Physics', 'Ray Diagrams', 'Light Chapter', 'Board Physics'],
    createdBy: 'Rajeev Kr. Verma (Co-Founder)',
    uploadedBy: 'Rajeev Kr. Verma (Co-Founder)',
    createdAt: '2026-06-12T14:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
    date: '2026-06-12'
  },
  {
    id: 'mat5',
    materialId: 'mat5',
    title: 'Class 10 Maths Chapter 3 Important Questions',
    slug: 'class-10-maths-chapter-3-important-questions',
    description: 'Top 25 high-frequency board examination questions from Pair of Linear Equations in Two Variables with step-by-step solutions.',
    desc: 'Top 25 high-frequency board examination questions from Chapter 3 Pair of Linear Equations.',
    class: 'Class 10',
    subject: 'Mathematics',
    chapter: 'Chapter 3',
    materialType: 'QUESTION_BANK',
    category: 'QUESTION_PAPER',
    file: 'maths_ch3_important_questions.pdf',
    size: '1.8 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isPublic: true,
    status: 'PUBLISHED',
    downloadCount: 520,
    viewCount: 1890,
    tags: ['Mathematics', 'Class 10', 'Chapter 3', 'Linear Equations', 'Important Questions'],
    seoTitle: 'Class 10 Maths Chapter 3 Important Questions PDF - Sunshine Classes',
    metaDescription: 'Free PDF download of Class 10 Maths Chapter 3 Linear Equations Important Questions solved by experts.',
    keywords: ['Class 10 Maths', 'Chapter 3 Important Questions', 'Linear Equations in Two Variables'],
    createdBy: 'Priyanshu Gupta (Founder)',
    uploadedBy: 'Priyanshu Gupta (Founder)',
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-06-25T11:00:00Z',
    date: '2026-06-15'
  },
  {
    id: 'mat6',
    materialId: 'mat6',
    title: 'Class 10 Science Pre-Board Sample Paper 2026',
    slug: 'class-10-science-pre-board-sample-paper-2026',
    description: 'Complete 80-marks CBSE pattern sample paper for Class 10 Science with detailed answer marking scheme and solutions.',
    desc: 'Complete 80-marks CBSE pattern sample paper for Class 10 Science.',
    class: 'Class 10',
    subject: 'Science',
    chapter: 'All Chapters',
    materialType: 'SAMPLE_PAPER',
    category: 'QUESTION_PAPER',
    file: 'science_sample_paper_2026.pdf',
    size: '3.2 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    isPublic: true,
    status: 'PUBLISHED',
    downloadCount: 610,
    viewCount: 2100,
    tags: ['Science', 'Sample Paper', 'Class 10', 'CBSE 2026', 'Pre-Board'],
    seoTitle: 'Class 10 Science Sample Paper 2026 with Solutions - Sunshine Classes',
    metaDescription: 'Download 2026 Class 10 Science board sample paper with answer key and marking scheme.',
    keywords: ['Class 10 Science Sample Paper', 'CBSE Class 10 Sample Paper', 'Pre Board Exam 2026'],
    createdBy: 'Rajeev Kr. Verma (Co-Founder)',
    uploadedBy: 'Rajeev Kr. Verma (Co-Founder)',
    createdAt: '2026-06-18T15:00:00Z',
    updatedAt: '2026-06-26T09:00:00Z',
    date: '2026-06-18'
  }
];

export const SEED_FOUNDERS: FounderMember[] = [
  {
    id: 'fm-priyanshu',
    name: 'Priyanshu Gupta',
    title: 'Founder Director & Lead Mathematics Faculty',
    qualification: 'M.Sc. Mathematics, B.Ed. | UGC NET Qualified',
    message: 'At Sunshine Classes, we believe that education is not merely about cramming question banks. It is about kindling curiosity. When a student visualizes the reflection rays or understands why a quadratic solution represents a graphical curve, they don\'t just score marks — they become innovators. Our doors are always open to parents who wish to participate actively in their child\'s daily progress.',
    tuitionFocus: 'Board Mathematics',
    avatarInitials: 'PG'
  },
  {
    id: 'fm-rajeev',
    name: 'Rajeev Kr. Verma',
    title: 'Co-Founder & Senior Science Specialist',
    qualification: 'B.Sc. Physics & Chemistry, B.Ed. | 12+ Years Exp',
    message: 'True science begins with observation. By teaching our board aspirants to dissect and visualize physical models and chemical reactions, we dismantle exam fear and instill everlasting analytical reasoning. Every student has immense potential; we simply provide the lens of extreme clarity.',
    tuitionFocus: 'Board Physics & Chemistry',
    avatarInitials: 'RV'
  }
];

export const interpolateTemplate = (templateStr: string, variables: Record<string, any>): string => {
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, value !== undefined && value !== null ? String(value) : '');
  }
  return result;
};

export const SEED_BATCH_BULLETINS: BatchBulletinPost[] = [
  {
    id: 'bb1',
    batchId: 'b1',
    batchName: 'Class 10 - Morning Excellence',
    authorId: 'u2',
    authorName: 'Priyanshu Gupta',
    authorRole: 'TEACHER',
    content: 'Good morning everyone! Please make sure to complete the trigonometry assignment before coming to class tomorrow.',
    timestamp: '2026-07-05T08:30:00Z'
  },
  {
    id: 'bb2',
    batchId: 'b2',
    batchName: 'Class 10 - Evening Stars',
    authorId: 'u2',
    authorName: 'Priyanshu Gupta',
    authorRole: 'TEACHER',
    content: 'Excellent work in yesterday’s mock quiz! Today we will begin our discussions on Electricity numericals. Keep your physics notebooks ready.',
    timestamp: '2026-07-06T15:00:00Z'
  },
  {
    id: 'bb3',
    batchId: 'b2',
    batchName: 'Class 10 - Evening Stars',
    authorId: 'u4',
    authorName: 'Rahul Verma',
    authorRole: 'STUDENT',
    content: 'Priyanshu Sir, will we be covering the circuit diagram problems today or in the next class? I had some doubts on parallel resistors.',
    timestamp: '2026-07-06T15:25:00Z'
  }
];




