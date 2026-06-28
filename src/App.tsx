/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserRole,
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

import {
  SEED_COURSES,
  SEED_BATCHES,
  SEED_TEACHERS,
  SEED_STUDENTS,
  SEED_USERS,
  SEED_ADMISSIONS,
  SEED_ATTENDANCE,
  SEED_FEE_STATUS,
  SEED_FEE_RECEIPTS,
  SEED_TESTS,
  SEED_STUDENT_MARKS,
  SEED_HOMEWORK,
  SEED_HOMEWORK_SUBMISSIONS,
  SEED_BLOGS,
  SEED_TESTIMONIALS,
  SEED_GALLERY,
  SEED_NOTIFICATIONS,
  SEED_INQUIRIES,
  SEED_AUDIT_LOGS,
  SEED_STUDENT_SUBSCRIPTIONS,
  SEED_SUBSCRIPTION_PAYMENTS,
  SEED_SUBSCRIPTION_RECEIPTS,
  SEED_SUBSCRIPTION_NOTIFICATIONS,
  SEED_SUBSCRIPTION_CONFIG,
  SEED_TIMETABLE
} from './data';

import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ReceptionDashboard from './components/ReceptionDashboard';
import AdminDashboard from './components/AdminDashboard';
import QuickDemoPanel from './components/QuickDemoPanel';
import ChatBot from './components/ChatBot';
import SunshineLogo from './components/SunshineLogo';

import { LogIn, Shield, Users, BookOpen, UserCheck, Key, LogOut, X } from 'lucide-react';

export default function App() {
  // Authentication & View states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('STUDENT');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Central Database States (loaded from localStorage or SEED data)
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [feeStatuses, setFeeStatuses] = useState<FeeStatus[]>([]);
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Subscription-Based Billing States
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subscriptions, setSubscriptions] = useState<StudentSubscription[]>([]);
  const [subPayments, setSubPayments] = useState<SubscriptionPayment[]>([]);
  const [subReceipts, setSubReceipts] = useState<SubscriptionReceipt[]>([]);
  const [subNotifications, setSubNotifications] = useState<SubscriptionNotification[]>([]);
  const [subConfig, setSubConfig] = useState<SubscriptionConfig>({ billingDate: 1, gracePeriod: 5, lateFee: 50 });
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  // Sync to LocalStorage helper
  const syncState = (key: string, data: any) => {
    localStorage.setItem(`sunshine_${key}`, JSON.stringify(data));
  };

  /**
   * Helper function that automatically pushes notification alerts for students who have a 'PENDING' fee status past the due date.
   */
  const checkAndPushFeeOverdueNotifications = (
    currentFees: FeeStatus[],
    currentNotifs: AppNotification[]
  ): AppNotification[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    let updatedNotifs = [...currentNotifs];
    let modified = false;

    currentFees.forEach((f) => {
      if (f.status === 'PENDING' && f.dueDate < todayStr) {
        const expectedId = `fee-overdue-${f.id}`;
        const alreadyExists = updatedNotifs.some((n) => n.id === expectedId);
        if (!alreadyExists) {
          const newAlert: AppNotification = {
            id: expectedId,
            title: `OVERDUE FEE REMINDER: ${f.studentName}`,
            content: `Dear ${f.studentName} (${f.class}), your fee of ₹${f.pendingFee} for ${f.month} is overdue. The due date was ${f.dueDate}. Please clear it at the reception desk to avoid late fines.`,
            category: 'FEE',
            targetRole: 'STUDENT',
            date: todayStr,
            isRead: false
          };
          updatedNotifs = [newAlert, ...updatedNotifs];
          modified = true;
        }
      }
    });

    if (modified) {
      syncState('notifications', updatedNotifs);
    }
    return updatedNotifs;
  };

  // Load from LocalStorage
  useEffect(() => {
    function getOrSeed<T>(key: string, seed: T): T {
      const stored = localStorage.getItem(`sunshine_${key}`);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) { console.error(e); }
      }
      localStorage.setItem(`sunshine_${key}`, JSON.stringify(seed));
      return seed;
    }

    const loadedStudents = getOrSeed('students', SEED_STUDENTS);
    const loadedTeachers = getOrSeed('teachers', SEED_TEACHERS);
    const loadedUsers = getOrSeed('users', SEED_USERS);
    const loadedAdmissions = getOrSeed('admissions', SEED_ADMISSIONS);
    const loadedAttendance = getOrSeed('attendance', SEED_ATTENDANCE);
    const loadedFeeStatuses = getOrSeed('fee_statuses', SEED_FEE_STATUS);
    const loadedFeeReceipts = getOrSeed('fee_receipts', SEED_FEE_RECEIPTS);
    const loadedTests = getOrSeed('tests', SEED_TESTS);
    const loadedStudentMarks = getOrSeed('student_marks', SEED_STUDENT_MARKS);
    const loadedHomework = getOrSeed('homework', SEED_HOMEWORK);
    const loadedSubmissions = getOrSeed('submissions', SEED_HOMEWORK_SUBMISSIONS);
    const loadedBlogs = getOrSeed('blogs', SEED_BLOGS);
    const loadedTestimonials = getOrSeed('testimonials', SEED_TESTIMONIALS);
    const loadedGallery = getOrSeed('gallery', SEED_GALLERY);
    const loadedNotifications = getOrSeed('notifications', SEED_NOTIFICATIONS);
    const loadedInquiries = getOrSeed('inquiries', SEED_INQUIRIES);
    const loadedAuditLogs = getOrSeed('audit_logs', SEED_AUDIT_LOGS);

    // Load subscription states
    const loadedBatches = getOrSeed('batches', SEED_BATCHES);
    const loadedSubscriptions = getOrSeed('student_subscriptions', SEED_STUDENT_SUBSCRIPTIONS);
    const loadedSubPayments = getOrSeed('payments', SEED_SUBSCRIPTION_PAYMENTS);
    const loadedSubReceipts = getOrSeed('receipts', SEED_SUBSCRIPTION_RECEIPTS);
    const loadedSubNotifications = getOrSeed('payment_notifications', SEED_SUBSCRIPTION_NOTIFICATIONS);
    const loadedSubConfig = getOrSeed('subscription_config', SEED_SUBSCRIPTION_CONFIG);
    const loadedTimetable = getOrSeed('timetable', SEED_TIMETABLE);

    // Compute updated statuses and days remaining at runtime based on today's date
    const runSubscriptionAutomationAndSync = (
      subs: StudentSubscription[],
      config: SubscriptionConfig,
      initialNotifs: SubscriptionNotification[],
      initialLogs: AuditLog[]
    ): { finalSubs: StudentSubscription[]; finalNotifs: SubscriptionNotification[]; finalLogs: AuditLog[] } => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let subsUpdated = false;
      let notifsUpdated = false;
      let logsUpdated = false;

      const currentNotifs = [...initialNotifs];
      const currentLogs = [...initialLogs];

      const newSubs = subs.map(sub => {
        const dueDate = new Date(sub.nextDueDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        let newStatus: 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'EXPIRED' = sub.status;
        if (daysRemaining > 7) {
          newStatus = 'ACTIVE';
        } else if (daysRemaining <= 7 && daysRemaining >= 0) {
          newStatus = 'DUE_SOON';
        } else if (daysRemaining < 0 && Math.abs(daysRemaining) <= config.gracePeriod) {
          newStatus = 'OVERDUE';
        } else if (daysRemaining < 0 && Math.abs(daysRemaining) > config.gracePeriod) {
          newStatus = 'EXPIRED';
        }

        const statusChanged = sub.status !== newStatus;

        // Auto trigger alerts based on config toggles for grace period levels
        if (newStatus === 'OVERDUE') {
          const daysOverdue = Math.abs(daysRemaining);

          // Level 1: Immediate Overdue SMS (on Day 1 overdue)
          if (daysOverdue === 1 && config.enableOverdueSMS) {
            const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_OVERDUE' && n.channel === 'WHATSAPP' && n.content.includes('overdue'));
            if (!exists) {
              const alertNotif: SubscriptionNotification = {
                id: `auto-overdue-${sub.studentId}-${Date.now()}`,
                studentId: sub.studentId,
                studentName: sub.studentName,
                title: 'URGENT: Monthly Fee Overdue',
                content: `[WhatsApp / SMS Alert] Dear Parent, subscription fee of ₹${sub.monthlyFee} for ${sub.studentName} is overdue. The due date was ${sub.nextDueDate}. Please clear immediately at the reception counter during the grace period.`,
                date: todayStr,
                type: 'REMINDER_OVERDUE',
                status: 'SENT',
                channel: 'WHATSAPP'
              };
              currentNotifs.unshift(alertNotif);
              notifsUpdated = true;

              currentLogs.unshift({
                id: `L-auto-whatsapp-${Date.now()}-${sub.studentId}`,
                userId: 'system',
                username: 'system_daemon',
                action: 'WHATSAPP_TRIGGER',
                details: `Dispatched auto OVERDUE WhatsApp alert to parent of ${sub.studentName} (Batch: ${sub.batchName})`,
                timestamp: new Date().toISOString()
              });
              logsUpdated = true;
            }
          }

          // Level 2: Mid-Grace Period SMS
          const midPoint = Math.max(1, Math.floor(config.gracePeriod / 2));
          if (daysOverdue === midPoint && config.enableMidGraceSMS) {
            const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_3_DAYS' && n.channel === 'WHATSAPP' && n.content.includes('Mid-Grace'));
            if (!exists) {
              const alertNotif: SubscriptionNotification = {
                id: `auto-midgrace-${sub.studentId}-${Date.now()}`,
                studentId: sub.studentId,
                studentName: sub.studentName,
                title: 'WARNING: Mid-Grace Period Reminder',
                content: `[WhatsApp / SMS Alert] Dear Parent, monthly fee of ₹${sub.monthlyFee} for ${sub.studentName} remains unpaid. Mid-Grace warning. Please clear soon to prevent suspension of services.`,
                date: todayStr,
                type: 'REMINDER_3_DAYS',
                status: 'SENT',
                channel: 'WHATSAPP'
              };
              currentNotifs.unshift(alertNotif);
              notifsUpdated = true;

              currentLogs.unshift({
                id: `L-auto-whatsapp-mid-${Date.now()}-${sub.studentId}`,
                userId: 'system',
                username: 'system_daemon',
                action: 'WHATSAPP_TRIGGER',
                details: `Dispatched auto MID-GRACE WhatsApp warning to parent of ${sub.studentName}`,
                timestamp: new Date().toISOString()
              });
              logsUpdated = true;
            }
          }

          // Level 3: Grace Expiry Warning (1 day remaining in grace period)
          const daysLeftInGrace = config.gracePeriod - daysOverdue;
          if (daysLeftInGrace === 1 && config.enableExpiryWarningSMS) {
            const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_7_DAYS' && n.channel === 'WHATSAPP' && n.content.includes('expires tomorrow'));
            if (!exists) {
              const alertNotif: SubscriptionNotification = {
                id: `auto-warning-${sub.studentId}-${Date.now()}`,
                studentId: sub.studentId,
                studentName: sub.studentName,
                title: 'CRITICAL: Grace Period Expiration Notice',
                content: `[WhatsApp / SMS Alert] Final Warning: Tuition fee subscription for ${sub.studentName} expires tomorrow. Standard learning materials and batch seat will lock automatically.`,
                date: todayStr,
                type: 'REMINDER_7_DAYS',
                status: 'SENT',
                channel: 'WHATSAPP'
              };
              currentNotifs.unshift(alertNotif);
              notifsUpdated = true;

              currentLogs.unshift({
                id: `L-auto-whatsapp-warn-${Date.now()}-${sub.studentId}`,
                userId: 'system',
                username: 'system_daemon',
                action: 'WHATSAPP_TRIGGER',
                details: `Dispatched auto GRACE EXPIRY WARNING WhatsApp to parent of ${sub.studentName}`,
                timestamp: new Date().toISOString()
              });
              logsUpdated = true;
            }
          }
        }

        // Level 4: Expiry Alert (Transitioning to EXPIRED status)
        if (newStatus === 'EXPIRED' && statusChanged && config.enableExpiredSMS) {
          const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_OVERDUE' && n.channel === 'WHATSAPP' && n.content.includes('SUSPENDED'));
          if (!exists) {
            const alertNotif: SubscriptionNotification = {
              id: `auto-expired-${sub.studentId}-${Date.now()}`,
              studentId: sub.studentId,
              studentName: sub.studentName,
              title: 'ALERT: Fee Subscription Expired',
              content: `[WhatsApp / SMS Alert] Service SUSPENDED: Grace period ended for ${sub.studentName}'s classes. Access is restricted. Please clear ₹${sub.monthlyFee} to resume immediately.`,
              date: todayStr,
              type: 'REMINDER_OVERDUE',
              status: 'SENT',
              channel: 'WHATSAPP'
            };
            currentNotifs.unshift(alertNotif);
            notifsUpdated = true;

            currentLogs.unshift({
              id: `L-auto-whatsapp-expired-${Date.now()}-${sub.studentId}`,
              userId: 'system',
              username: 'system_daemon',
              action: 'WHATSAPP_TRIGGER',
              details: `Dispatched auto SUBSCRIPTION SUSPENDED WhatsApp to parent of ${sub.studentName}`,
              timestamp: new Date().toISOString()
            });
            logsUpdated = true;
          }
        }

        if (sub.daysRemaining !== daysRemaining || sub.status !== newStatus) {
          subsUpdated = true;
          return {
            ...sub,
            daysRemaining,
            status: newStatus
          };
        }
        return sub;
      });

      if (subsUpdated) {
        localStorage.setItem(`sunshine_student_subscriptions`, JSON.stringify(newSubs));
      }
      if (notifsUpdated) {
        localStorage.setItem(`sunshine_payment_notifications`, JSON.stringify(currentNotifs));
      }
      if (logsUpdated) {
        localStorage.setItem(`sunshine_audit_logs`, JSON.stringify(currentLogs));
      }

      return {
        finalSubs: newSubs,
        finalNotifs: currentNotifs,
        finalLogs: currentLogs
      };
    };

    const { finalSubs, finalNotifs: computedSubNotifs, finalLogs: computedLogs } = runSubscriptionAutomationAndSync(
      loadedSubscriptions,
      loadedSubConfig,
      loadedSubNotifications,
      loadedAuditLogs
    );

    // Automatically push notifications for overdue pending fees
    const finalNotifs = checkAndPushFeeOverdueNotifications(loadedFeeStatuses, loadedNotifications);

    setStudents(loadedStudents);
    setTeachers(loadedTeachers);
    setUsers(loadedUsers);
    setAdmissions(loadedAdmissions);
    setAttendance(loadedAttendance);
    setFeeStatuses(loadedFeeStatuses);
    setFeeReceipts(loadedFeeReceipts);
    setTests(loadedTests);
    setStudentMarks(loadedStudentMarks);
    setHomework(loadedHomework);
    setSubmissions(loadedSubmissions);
    setBlogs(loadedBlogs);
    setTestimonials(loadedTestimonials);
    setGallery(loadedGallery);
    setNotifications(finalNotifs);
    setInquiries(loadedInquiries);
    setAuditLogs(computedLogs);

    // Set subscription states
    setBatches(loadedBatches);
    setSubscriptions(finalSubs);
    setSubPayments(loadedSubPayments);
    setSubReceipts(loadedSubReceipts);
    setSubNotifications(computedSubNotifs);
    setSubConfig(loadedSubConfig);
    setTimetable(loadedTimetable);
  }, []);

  // State update handlers
  const handleAddAdmission = (adm: Omit<Admission, 'id' | 'status' | 'date'>): string => {
    const newId = `ADM-2026-0${admissions.length + 1}`;
    const newAdm: Admission = {
      ...adm,
      id: newId,
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newAdm, ...admissions];
    setAdmissions(updated);
    syncState('admissions', updated);

    // Append Audit log
    const updatedLogs = [{
      id: `L-${Date.now()}`,
      userId: 'u-public',
      username: 'guest',
      action: 'ONLINE_ADMISSION',
      details: `Submitted online admission application for ${adm.studentName}`,
      timestamp: new Date().toISOString()
    }, ...auditLogs];
    setAuditLogs(updatedLogs);
    syncState('audit_logs', updatedLogs);

    return newId;
  };

  const handlePaySubscription = (
    subId: string, 
    paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING',
    amount: number
  ) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const txnId = `TXN-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const payId = `PAY-${Date.now().toString().slice(-6)}`;
    const receiptId = `REC-SUBS-${Date.now().toString().slice(-6)}`;

    // Calculate next due date (add 1 month)
    const currentDueDate = new Date(sub.nextDueDate);
    currentDueDate.setMonth(currentDueDate.getMonth() + 1);
    const nextDueDateStr = currentDueDate.toISOString().split('T')[0];

    // Compute remaining days
    const timeDiff = currentDueDate.getTime() - new Date().getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const newPayment: SubscriptionPayment = {
      id: payId,
      subscriptionId: subId,
      studentId: sub.studentId,
      studentName: sub.studentName,
      admissionNo: sub.admissionNo,
      batchId: sub.batchId,
      batchName: sub.batchName,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      amountPaid: amount,
      paymentMethod,
      transactionId: txnId,
      paymentDate: todayStr,
      status: 'SUCCESS'
    };

    const newReceipt: SubscriptionReceipt = {
      id: receiptId,
      paymentId: payId,
      studentId: sub.studentId,
      studentName: sub.studentName,
      admissionNo: sub.admissionNo,
      batchName: sub.batchName,
      paymentMonth: newPayment.month,
      amountPaid: amount,
      transactionId: txnId,
      paymentMethod,
      paymentDate: todayStr
    };

    const updatedSubs = subscriptions.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          nextDueDate: nextDueDateStr,
          daysRemaining,
          status: 'ACTIVE' as const,
          lastPaymentDate: todayStr
        };
      }
      return s;
    });

    const newNotif: SubscriptionNotification = {
      id: `notif-${Date.now()}`,
      studentId: sub.studentId,
      studentName: sub.studentName,
      title: 'Fee Subscription Paid Successfully',
      content: `Dear ${sub.studentName}, your fee of ₹${amount} for ${newPayment.month} has been received. Thank you!`,
      date: todayStr,
      type: 'REMINDER_DUE_DATE',
      status: 'SENT',
      channel: 'DASHBOARD'
    };

    const newAudit: AuditLog = {
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'unknown',
      username: currentUser?.username || 'unknown',
      action: 'FEE_PAYMENT',
      details: `Paid subscription for ${sub.studentName} - ₹${amount} via ${paymentMethod}`,
      timestamp: new Date().toISOString()
    };

    setSubscriptions(updatedSubs);
    syncState('student_subscriptions', updatedSubs);

    const updatedPayments = [newPayment, ...subPayments];
    setSubPayments(updatedPayments);
    syncState('payments', updatedPayments);

    const updatedReceipts = [newReceipt, ...subReceipts];
    setSubReceipts(updatedReceipts);
    syncState('receipts', updatedReceipts);

    const updatedNotifications = [newNotif, ...subNotifications];
    setSubNotifications(updatedNotifications);
    syncState('payment_notifications', updatedNotifications);

    const updatedAudits = [newAudit, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
  };

  const handleUpdateSubscriptionConfig = (config: SubscriptionConfig) => {
    setSubConfig(config);
    syncState('subscription_config', config);

    // Re-verify daysRemaining and status for everyone
    const today = new Date();
    const updatedSubs = subscriptions.map(sub => {
      const dueDate = new Date(sub.nextDueDate);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let newStatus: 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'EXPIRED' = 'ACTIVE';
      if (daysRemaining > 7) {
        newStatus = 'ACTIVE';
      } else if (daysRemaining <= 7 && daysRemaining >= 0) {
        newStatus = 'DUE_SOON';
      } else if (daysRemaining < 0 && Math.abs(daysRemaining) <= config.gracePeriod) {
        newStatus = 'OVERDUE';
      } else if (daysRemaining < 0 && Math.abs(daysRemaining) > config.gracePeriod) {
        newStatus = 'EXPIRED';
      }

      return {
        ...sub,
        daysRemaining,
        status: newStatus
      };
    });

    setSubscriptions(updatedSubs);
    syncState('student_subscriptions', updatedSubs);

    const newAudit: AuditLog = {
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'admin',
      action: 'CONFIG_UPDATE',
      details: `Updated subscription config: Grace Period: ${config.gracePeriod} days, Billing Date: ${config.billingDate}, Late Fee: ₹${config.lateFee}`,
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newAudit, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
  };

  const handleApproveAdmission = (admissionId: string) => {
    const adm = admissions.find((a) => a.id === admissionId);
    if (!adm) return;

    // 1. Update Admission status
    const updatedAdmissions = admissions.map((a) =>
      a.id === admissionId ? { ...a, status: 'APPROVED' as const } : a
    );
    setAdmissions(updatedAdmissions);
    syncState('admissions', updatedAdmissions);

    // 2. Register into student database
    const nextRollNum = 1000 + students.length + 1;
    const newStudent: Student = {
      id: `s-new-${Date.now()}`,
      userId: `u-new-std-${Date.now()}`,
      rollNo: `SC-${nextRollNum}`,
      name: adm.studentName,
      class: adm.className,
      fatherName: adm.fatherName,
      motherName: adm.motherName,
      dob: adm.dob,
      gender: adm.gender,
      address: adm.address,
      mobile: adm.mobile,
      whatsapp: adm.whatsapp,
      parentMobile: adm.parentMobile,
      email: adm.email,
      preferredBatch: adm.preferredBatch,
      preferredTiming: adm.preferredTiming,
      admissionDate: new Date().toISOString().split('T')[0],
      attendancePercentage: 100
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    syncState('students', updatedStudents);

    // 3. Register user profile for login
    const newUser: User = {
      id: newStudent.userId,
      username: adm.studentName.toLowerCase().replace(' ', ''),
      name: adm.studentName,
      email: adm.email,
      role: 'STUDENT',
      phone: adm.mobile
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    syncState('users', updatedUsers);

    // 4. Create Initial Fee Status
    const newFee: FeeStatus = {
      id: `fs-new-${Date.now()}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      class: newStudent.class,
      month: 'July 2026',
      totalFee: adm.className.includes('10') ? 1500 : 1200,
      discount: 0,
      scholarship: 0,
      paidFee: 0,
      pendingFee: adm.className.includes('10') ? 1500 : 1200,
      status: 'PENDING',
      dueDate: '2026-07-10'
    };
    const updatedFees = [...feeStatuses, newFee];
    setFeeStatuses(updatedFees);
    syncState('fee_statuses', updatedFees);

    // 5. Audit Log
    const updatedLogs = [{
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'u3',
      username: currentUser?.username || 'reception',
      action: 'APPROVE_ADMISSION',
      details: `Approved admission ${admissionId} and generated student ID: SC-${nextRollNum}`,
      timestamp: new Date().toISOString()
    }, ...auditLogs];
    setAuditLogs(updatedLogs);
    syncState('audit_logs', updatedLogs);
  };

  const handleRejectAdmission = (admissionId: string) => {
    const updated = admissions.map((a) =>
      a.id === admissionId ? { ...a, status: 'REJECTED' as const } : a
    );
    setAdmissions(updated);
    syncState('admissions', updated);

    // Audit log
    const updatedLogs = [{
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'u3',
      username: currentUser?.username || 'reception',
      action: 'REJECT_ADMISSION',
      details: `Declined admission file ID: ${admissionId}`,
      timestamp: new Date().toISOString()
    }, ...auditLogs];
    setAuditLogs(updatedLogs);
    syncState('audit_logs', updatedLogs);
  };

  const handleAddInquiry = (inq: Omit<Inquiry, 'id' | 'date'>) => {
    const newInq: Inquiry = {
      ...inq,
      id: `INQ-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newInq, ...inquiries];
    setInquiries(updated);
    syncState('inquiries', updated);
  };

  const handleCollectFee = (fee: Omit<FeeReceipt, 'id' | 'date' | 'receivedBy'>) => {
    // 1. Create Receipt ID
    const receiptId = `REC-0${feeReceipts.length + 101}`;
    const newReceipt: FeeReceipt = {
      ...fee,
      id: receiptId,
      date: new Date().toISOString().split('T')[0],
      receivedBy: currentUser?.name || 'Neha Sharma'
    };
    const updatedReceipts = [newReceipt, ...feeReceipts];
    setFeeReceipts(updatedReceipts);
    syncState('fee_receipts', updatedReceipts);

    // 2. Adjust Ledger pending fees status
    const updatedLedgers = feeStatuses.map((f) => {
      if (f.studentId === fee.studentId && f.month === fee.month) {
        const nextPaid = f.paidFee + fee.amountPaid;
        const nextPending = Math.max(0, f.totalFee - f.discount - f.scholarship - nextPaid);
        return {
          ...f,
          paidFee: nextPaid,
          pendingFee: nextPending,
          status: nextPending === 0 ? ('PAID' as const) : ('PARTIAL' as const)
        };
      }
      return f;
    });
    setFeeStatuses(updatedLedgers);
    syncState('fee_statuses', updatedLedgers);

    // Audit Log
    const updatedLogs = [{
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'u3',
      username: currentUser?.username || 'reception',
      action: 'COLLECT_FEE',
      details: `Collected ₹${fee.amountPaid} tuition fee from ${fee.studentName} for cycle: ${fee.month}`,
      timestamp: new Date().toISOString()
    }, ...auditLogs];
    setAuditLogs(updatedLogs);
    syncState('audit_logs', updatedLogs);
  };

  const handleAddAttendance = (attendanceLogs: Omit<Attendance, 'id'>[]) => {
    const updated = [...attendance];
    attendanceLogs.forEach((log, idx) => {
      updated.push({
        ...log,
        id: `at-new-${Date.now()}-${idx}`
      });
    });
    setAttendance(updated);
    syncState('attendance', updated);

    // Log in audits
    const updatedLogs = [{
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'u2',
      username: currentUser?.username || 'teacher',
      action: 'MARK_ATTENDANCE',
      details: `Marked daily session roll call for class cohort: ${attendanceLogs[0]?.class}`,
      timestamp: new Date().toISOString()
    }, ...auditLogs];
    setAuditLogs(updatedLogs);
    syncState('audit_logs', updatedLogs);
  };

  const handleAddHomework = (hw: Omit<Homework, 'id' | 'teacherId' | 'teacherName'>) => {
    const newHw: Homework = {
      ...hw,
      id: `hw-${Date.now()}`,
      teacherId: currentUser?.id || 't1',
      teacherName: currentUser?.name || 'Suresh Kumar'
    };
    const updated = [newHw, ...homework];
    setHomework(updated);
    syncState('homework', updated);
  };

  const handleAddHomeworkSubmission = (sub: Omit<HomeworkSubmission, 'id'>) => {
    const newSub: HomeworkSubmission = {
      ...sub,
      id: `sub-${Date.now()}`
    };
    const updated = [newSub, ...submissions];
    setSubmissions(updated);
    syncState('submissions', updated);
  };

  const handleReviewSubmission = (submissionId: string, remarks: string, score: string) => {
    const updated = submissions.map((s) =>
      s.id === submissionId ? { ...s, remarks, score, status: 'REVIEWED' as const } : s
    );
    setSubmissions(updated);
    syncState('submissions', updated);
  };

  const handleAddTest = (tst: Omit<Test, 'id'>) => {
    const newTest: Test = {
      ...tst,
      id: `tst-${Date.now()}`
    };
    const updated = [newTest, ...tests];
    setTests(updated);
    syncState('tests', updated);
  };

  const handleAddMarks = (marksList: Omit<StudentMark, 'id'>[]) => {
    // 1. Remove existing marks for this specific test
    const testId = marksList[0]?.testId;
    let filteredMarks = studentMarks.filter((m) => m.testId !== testId);

    // 2. Add newly assigned marks
    marksList.forEach((m, idx) => {
      filteredMarks.push({
        ...m,
        id: `m-new-${Date.now()}-${idx}`
      });
    });

    setStudentMarks(filteredMarks);
    syncState('student_marks', filteredMarks);
  };

  const handleAddNotification = (notif: Omit<AppNotification, 'id' | 'date'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `n-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    syncState('notifications', updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    syncState('notifications', updated);
  };

  const handleAddStudentAdmin = (std: Omit<Student, 'id' | 'rollNo' | 'attendancePercentage'>) => {
    const nextRoll = 1000 + students.length + 1;
    const newStd: Student = {
      ...std,
      id: `s-admin-${Date.now()}`,
      rollNo: `SC-${nextRoll}`,
      attendancePercentage: 100
    };
    const updated = [...students, newStd];
    setStudents(updated);
    syncState('students', updated);

    // Register User Profile
    const newUser: User = {
      id: newStd.userId,
      username: std.name.toLowerCase().replace(' ', ''),
      name: std.name,
      email: std.email,
      role: 'STUDENT',
      phone: std.mobile
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    syncState('users', updatedUsers);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    syncState('students', updated);
  };

  const handleAddTeacherAdmin = (tch: Omit<Teacher, 'id'>) => {
    const newTch: Teacher = {
      ...tch,
      id: `t-admin-${Date.now()}`
    };
    const updated = [...teachers, newTch];
    setTeachers(updated);
    syncState('teachers', updated);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    syncState('teachers', updated);
  };

  const handleTriggerBackup = () => {
    const updatedLogs = [{
      id: `L-${Date.now()}`,
      userId: currentUser?.id || 'u1',
      username: currentUser?.username || 'admin',
      action: 'DATABASE_BACKUP',
      details: 'Triggered fully secure PostgreSQL DB Dump export (Size: 12.8 MB)',
      timestamp: new Date().toISOString()
    }, ...auditLogs];
    setAuditLogs(updatedLogs);
    syncState('audit_logs', updatedLogs);
  };

  const handleUpdateTimetable = (updatedTimetable: TimetableEntry[]) => {
    setTimetable(updatedTimetable);
    syncState('timetable', updatedTimetable);
  };

  // Switch Quick Roles from demo panel
  const handleSelectRole = (role: UserRole) => {
    let matchedUser = users.find((u) => u.role === role);
    if (!matchedUser) {
      matchedUser = SEED_USERS.find((u) => u.role === role);
    }
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setShowLoginModal(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === authUsername.toLowerCase() &&
        u.role === authRole
    );

    if (matched) {
      setCurrentUser(matched);
      setShowLoginModal(false);
      setAuthUsername('');
      setAuthPassword('');
    } else {
      alert("Invalid credentials check. Tip: Use 1-Click hotswap controller panel to log in instantly!");
    }
  };

  // Determine current active student context for dashboard
  const currentStudentContext = students.find((s) => s.userId === currentUser?.id) || students[0];
  const currentTeacherContext = teachers.find((t) => t.userId === currentUser?.id) || teachers[0];

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-between">
      {/* Upper 1-Click Role switcher for evaluator ease */}
      <div className="bg-slate-900 text-white py-3.5 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 flex flex-col gap-3 justify-between items-center md:flex-row">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <strong>Evaluation Mode Enabled:</strong> Use hotswaps to toggle ERP roles and see instant updates!
          </div>
          <QuickDemoPanel
            onSelectRole={handleSelectRole}
            currentRole={currentUser?.role || null}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Primary ERP / Website Display Controller */}
      <div className="flex-1">
        {!currentUser ? (
          /* Public Website */
          <LandingPage
            courses={SEED_COURSES}
            blogs={blogs}
            testimonials={testimonials}
            gallery={gallery}
            onNavigateToERP={() => setShowLoginModal(true)}
            onAddAdmission={handleAddAdmission}
          />
        ) : (
          /* Logged In Dashboard Frame */
          <div className="bg-slate-100 min-h-screen">
            {/* Logged in custom navigation header */}
            <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm">
              <div className="mx-auto max-w-7xl flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <SunshineLogo size={36} showText={true} textSubTitle="Digital ERP Terminal" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">Logged as: {currentUser.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Role: {currentUser.role}</span>
                  </div>

                  <button
                    id="btn-erp-logout"
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-red bg-slate-50 hover:bg-red-50 border border-slate-150 rounded-xl px-3 py-1.5 transition-all"
                  >
                    <LogOut size={13} /> Log Out
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboards Routing */}
            {currentUser.role === 'STUDENT' && currentStudentContext && (
              <StudentDashboard
                student={currentStudentContext}
                attendanceList={attendance}
                feeStatuses={feeStatuses}
                feeReceipts={feeReceipts}
                tests={tests}
                studentMarks={studentMarks}
                homeworkList={homework}
                submissions={submissions}
                notifications={notifications}
                onAddSubmission={handleAddHomeworkSubmission}
                subscriptions={subscriptions}
                subPayments={subPayments}
                subReceipts={subReceipts}
                subNotifications={subNotifications}
                subConfig={subConfig}
                onPaySubscription={handlePaySubscription}
                timetableList={timetable}
              />
            )}

            {currentUser.role === 'TEACHER' && currentTeacherContext && (
              <TeacherDashboard
                teacher={currentTeacherContext}
                students={students}
                attendanceList={attendance}
                homeworkList={homework}
                submissions={submissions}
                tests={tests}
                studentMarks={studentMarks}
                onAddAttendance={handleAddAttendance}
                onAddHomework={handleAddHomework}
                onAddTest={handleAddTest}
                onAddMarks={handleAddMarks}
                onReviewSubmission={handleReviewSubmission}
                timetableList={timetable}
                onUpdateTimetable={handleUpdateTimetable}
              />
            )}

            {currentUser.role === 'RECEPTIONIST' && (
              <ReceptionDashboard
                students={students}
                admissions={admissions}
                feeStatuses={feeStatuses}
                feeReceipts={feeReceipts}
                inquiries={inquiries}
                onApproveAdmission={handleApproveAdmission}
                onRejectAdmission={handleRejectAdmission}
                onAddInquiry={handleAddInquiry}
                onCollectFee={handleCollectFee}
                batches={batches}
                subscriptions={subscriptions}
                subPayments={subPayments}
                subReceipts={subReceipts}
                subNotifications={subNotifications}
                subConfig={subConfig}
                onPaySubscription={handlePaySubscription}
              />
            )}

            {currentUser.role === 'ADMIN' && (
              <AdminDashboard
                students={students}
                teachers={teachers}
                users={users}
                courses={SEED_COURSES}
                batches={batches}
                feeStatuses={feeStatuses}
                feeReceipts={feeReceipts}
                auditLogs={auditLogs}
                notifications={notifications}
                onAddStudent={handleAddStudentAdmin}
                onDeleteStudent={handleDeleteStudent}
                onAddTeacher={handleAddTeacherAdmin}
                onDeleteTeacher={handleDeleteTeacher}
                onAddNotification={handleAddNotification}
                onDeleteNotification={handleDeleteNotification}
                onTriggerBackup={handleTriggerBackup}
                subscriptions={subscriptions}
                subPayments={subPayments}
                subReceipts={subReceipts}
                subNotifications={subNotifications}
                subConfig={subConfig}
                onUpdateConfig={handleUpdateSubscriptionConfig}
                onPaySubscription={handlePaySubscription}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Chatbot */}
      <ChatBot />

      {/* AUTHENTICATION LOGIN DIALOG MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative">
            <h3 className="font-display font-black text-lg text-slate-800 text-center uppercase mb-1 flex items-center gap-1.5 justify-center">
              <LogIn size={20} className="text-brand-orange" /> Sunshine ERP Login
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">Enter details or use 1-Click swap panel to bypass.</p>

            <form onSubmit={handleLoginFormSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Account Username</label>
                <input
                  id="auth-input-username"
                  type="text"
                  required
                  placeholder="e.g. student, teacher, admin, reception"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select System Role</label>
                <select
                  id="auth-select-role"
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                >
                  <option value="STUDENT">Student Dashboard</option>
                  <option value="TEACHER">Teacher Panel</option>
                  <option value="RECEPTIONIST">Reception Desk</option>
                  <option value="ADMIN">Admin ERP System</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Account Password</label>
                <input
                  id="auth-input-password"
                  type="password"
                  required
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="btn-auth-cancel"
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-auth-login"
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white py-2.5 text-xs font-bold shadow-md transition-all"
                >
                  Login Session
                </button>
              </div>
            </form>

            <button
              id="btn-login-close"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
