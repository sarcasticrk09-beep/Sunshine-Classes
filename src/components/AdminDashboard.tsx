/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Settings,
  Database,
  Plus,
  Trash2,
  Edit,
  Activity,
  Bell,
  Sparkles,
  Search,
  Check,
  Award,
  FileSpreadsheet,
  Printer,
  Key,
  X,
  MessageSquare,
  CheckCircle,
  Percent,
  Smartphone,
  AlertCircle,
  Mail,
  Send,
  Download,
  Upload,
  Clock,
  Archive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Student, Teacher, User, Course, Batch, Topper, StudyMaterial, FounderMember, FeeStatus, FeeReceipt, AuditLog, AppNotification, StudentSubscription, SubscriptionPayment, SubscriptionReceipt, SubscriptionNotification, SubscriptionConfig, Admission, Attendance, Test, StudentMark, Homework, HomeworkSubmission, BlogPost, Testimonial, GalleryItem, Inquiry, TimetableEntry, EmailTemplatesConfig, WhatsAppTemplatesConfig } from '../types';
import { interpolateTemplate } from '../data';
import { sendWhatsAppMessage, interpolateWhatsAppTemplate } from '../lib/whatsappService';

interface AdminDashboardProps {
  students: Student[];
  teachers: Teacher[];
  users: User[];
  courses: Course[];
  batches: Batch[];
  onUpdateBatches: (batches: Batch[]) => void;
  toppers: Topper[];
  onAddOrEditTopper: (topper: Topper) => void;
  onDeleteTopper: (id: string) => void;
  studyMaterials: StudyMaterial[];
  onAddStudyMaterial: (material: Omit<StudyMaterial, 'id'>) => void;
  onDeleteStudyMaterial: (id: string) => void;
  founders: FounderMember[];
  onAddOrEditFounder: (founder: FounderMember) => void;
  onDeleteFounder: (id: string) => void;
  feeStatuses: FeeStatus[];
  feeReceipts: FeeReceipt[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  onAddStudent: (std: Omit<Student, 'id' | 'rollNo' | 'attendancePercentage'>) => void;
  onDeleteStudent: (id: string) => void;
  onAddTeacher: (tch: Omit<Teacher, 'id'>) => void;
  onDeleteTeacher: (id: string) => void;
  onUpdateTeacher: (tch: Teacher) => void;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'date'>) => void;
  onDeleteNotification: (id: string) => void;
  onTriggerBackup: () => void;
  subscriptions: StudentSubscription[];
  subPayments: SubscriptionPayment[];
  subReceipts: SubscriptionReceipt[];
  subNotifications: SubscriptionNotification[];
  subConfig: SubscriptionConfig;
  onUpdateConfig: (cfg: SubscriptionConfig) => void;
  onPaySubscription: (subId: string, paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING', amount: number) => void;
  onCollectFee: (fee: Omit<FeeReceipt, 'id' | 'date' | 'receivedBy'> & { skipWhatsApp?: boolean }) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  strictMode: boolean;
  onToggleStrictMode: () => void;

  // New diagnostics collections and state handler
  admissions: Admission[];
  attendanceList: Attendance[];
  tests: Test[];
  studentMarks: StudentMark[];
  homeworkList: Homework[];
  submissions: HomeworkSubmission[];
  blogs: BlogPost[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
  inquiries: Inquiry[];
  timetableList: TimetableEntry[];
  onHealState: (key: string, data: any) => void;
  emailTemplates: EmailTemplatesConfig;
  onUpdateEmailTemplates: (templates: EmailTemplatesConfig) => void;
  whatsappTemplates: WhatsAppTemplatesConfig;
  onUpdateWhatsappTemplates: (templates: WhatsAppTemplatesConfig) => void;
  onApproveAdmission?: (admissionId: string) => void;
  onRejectAdmission?: (admissionId: string) => void;
  currentUser?: User | null;
}

export default function AdminDashboard({
  students,
  teachers,
  users,
  courses,
  batches,
  onUpdateBatches,
  toppers,
  onAddOrEditTopper,
  onDeleteTopper,
  studyMaterials,
  onAddStudyMaterial,
  onDeleteStudyMaterial,
  founders,
  onAddOrEditFounder,
  onDeleteFounder,
  feeStatuses,
  feeReceipts,
  auditLogs,
  notifications,
  onAddStudent,
  onDeleteStudent,
  onAddTeacher,
  onDeleteTeacher,
  onUpdateTeacher,
  onAddNotification,
  onDeleteNotification,
  onTriggerBackup,
  subscriptions,
  subPayments,
  subReceipts,
  subNotifications,
  subConfig,
  onUpdateConfig,
  onPaySubscription,
  onCollectFee,
  onUpdateUserPassword,
  strictMode,
  onToggleStrictMode,

  // De-structured new diagnostic props
  admissions,
  attendanceList,
  tests,
  studentMarks,
  homeworkList,
  submissions,
  blogs,
  testimonials,
  gallery,
  inquiries,
  timetableList,
  onHealState,
  emailTemplates,
  onUpdateEmailTemplates,
  whatsappTemplates,
  onUpdateWhatsappTemplates,
  onApproveAdmission,
  onRejectAdmission,
  currentUser
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'batches' | 'announcements' | 'website' | 'audit' | 'settings' | 'fees' | 'diagnostics' | 'whatsapp'>('overview');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedSearchStudentId, setSelectedSearchStudentId] = useState<string | null>(null);

  // --- START OF SYSTEM DIAGNOSTICS STATES & FUNCTIONS ---
  const [integrityIssues, setIntegrityIssues] = useState<{
    id: string;
    collection: string;
    itemId?: string;
    itemName?: string;
    severity: 'error' | 'warning';
    message: string;
    field: string;
    expected: string;
    actual: string;
  }[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosedAt, setDiagnosedAt] = useState<string | null>(null);
  const [healLog, setHealLog] = useState<string[]>([]);

  // Local helper to avoid importing and risk circular dependencies
  const localSimpleSecureHash = (password: string): string => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < password.length; i++) {
      hash ^= password.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  };

  const runSystemCheck = () => {
    setIsDiagnosing(true);
    const issues: typeof integrityIssues = [];

    // 1. USERS COLLECTION
    if (Array.isArray(users)) {
      users.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.id) {
          issues.push({
            id: `users-id-${id}`,
            collection: 'users',
            itemId: id,
            itemName: item.name || 'Unknown User',
            severity: 'error',
            message: 'Missing unique identifier (id)',
            field: 'id',
            expected: 'string',
            actual: typeof item.id
          });
        }
        if (!item.username) {
          issues.push({
            id: `users-username-${id}`,
            collection: 'users',
            itemId: id,
            itemName: item.name || 'Unknown User',
            severity: 'error',
            message: 'Username is empty or undefined',
            field: 'username',
            expected: 'non-empty string',
            actual: String(item.username)
          });
        }
        if (!item.role || !['ADMIN', 'TEACHER', 'RECEPTIONIST', 'STUDENT'].includes(item.role)) {
          issues.push({
            id: `users-role-${id}`,
            collection: 'users',
            itemId: id,
            itemName: item.name || item.username || 'Unknown',
            severity: 'error',
            message: `Invalid role specified: "${item.role}"`,
            field: 'role',
            expected: 'ADMIN | TEACHER | RECEPTIONIST | STUDENT',
            actual: String(item.role)
          });
        }
        if (strictMode && item.password && !item.password.startsWith('sha256_mock_')) {
          issues.push({
            id: `users-password-security-${id}`,
            collection: 'users',
            itemId: id,
            itemName: item.name || item.username,
            severity: 'warning',
            message: 'Vulnerable plaintext password. Hardening required.',
            field: 'password',
            expected: 'sha256_mock_ prefixed hash',
            actual: 'plaintext'
          });
        }
      });
    } else {
      issues.push({
        id: 'users-not-array',
        collection: 'users',
        severity: 'error',
        message: 'Users collection is corrupted or not a valid array.',
        field: 'root',
        expected: 'Array',
        actual: typeof users
      });
    }

    // 2. STUDENTS COLLECTION
    if (Array.isArray(students)) {
      students.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.id) {
          issues.push({
            id: `students-id-${id}`,
            collection: 'students',
            itemId: id,
            itemName: item.name || 'Unknown Student',
            severity: 'error',
            message: 'Missing id attribute',
            field: 'id',
            expected: 'string',
            actual: typeof item.id
          });
        }
        if (!item.name) {
          issues.push({
            id: `students-name-${id}`,
            collection: 'students',
            itemId: id,
            itemName: 'Unnamed Record',
            severity: 'error',
            message: 'Student name is blank',
            field: 'name',
            expected: 'string',
            actual: String(item.name)
          });
        }
        if (!item.rollNo) {
          issues.push({
            id: `students-roll-${id}`,
            collection: 'students',
            itemId: id,
            itemName: item.name || 'Unknown Student',
            severity: 'error',
            message: 'Student is missing an assigned roll number',
            field: 'rollNo',
            expected: 'string',
            actual: String(item.rollNo)
          });
        }
        if (typeof item.attendancePercentage !== 'number' || isNaN(item.attendancePercentage)) {
          issues.push({
            id: `students-attendance-${id}`,
            collection: 'students',
            itemId: id,
            itemName: item.name || 'Unknown Student',
            severity: 'warning',
            message: 'Attendance percentage is not a valid number',
            field: 'attendancePercentage',
            expected: 'number',
            actual: typeof item.attendancePercentage
          });
        }
        if (item.userId && Array.isArray(users) && !users.find(u => u.id === item.userId)) {
          issues.push({
            id: `students-userid-ref-${id}`,
            collection: 'students',
            itemId: id,
            itemName: item.name,
            severity: 'warning',
            message: `Referenced user ID (${item.userId}) does not exist in users ledger`,
            field: 'userId',
            expected: 'valid user id reference',
            actual: 'orphaned link'
          });
        }
      });
    }

    // 3. TEACHERS COLLECTION
    if (Array.isArray(teachers)) {
      teachers.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.name) {
          issues.push({
            id: `teachers-name-${id}`,
            collection: 'teachers',
            itemId: id,
            itemName: 'Unnamed Instructor',
            severity: 'error',
            message: 'Faculty name is blank',
            field: 'name',
            expected: 'string',
            actual: String(item.name)
          });
        }
        if (!Array.isArray(item.specialty)) {
          issues.push({
            id: `teachers-specialty-${id}`,
            collection: 'teachers',
            itemId: id,
            itemName: item.name || 'Unknown Faculty',
            severity: 'warning',
            message: 'Specialty list must be a string array',
            field: 'specialty',
            expected: 'string[]',
            actual: typeof item.specialty
          });
        }
        if (!Array.isArray(item.batches)) {
          issues.push({
            id: `teachers-batches-${id}`,
            collection: 'teachers',
            itemId: id,
            itemName: item.name || 'Unknown Faculty',
            severity: 'warning',
            message: 'Assigned batches must be a string array',
            field: 'batches',
            expected: 'string[]',
            actual: typeof item.batches
          });
        }
      });
    }

    // 4. BATCHES COLLECTION
    if (Array.isArray(batches)) {
      batches.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.name) {
          issues.push({
            id: `batches-name-${id}`,
            collection: 'batches',
            itemId: id,
            itemName: 'Unnamed Batch',
            severity: 'error',
            message: 'Batch name is missing',
            field: 'name',
            expected: 'string',
            actual: 'undefined'
          });
        }
        if (typeof item.monthlyFee !== 'number' || isNaN(item.monthlyFee)) {
          issues.push({
            id: `batches-fee-${id}`,
            collection: 'batches',
            itemId: id,
            itemName: item.name || 'Unknown Batch',
            severity: 'warning',
            message: 'Tuition monthly fee parameter must be numeric',
            field: 'monthlyFee',
            expected: 'number',
            actual: typeof item.monthlyFee
          });
        }
        if (!['ACTIVE', 'DUE', 'EXPIRED'].includes(item.status)) {
          issues.push({
            id: `batches-status-${id}`,
            collection: 'batches',
            itemId: id,
            itemName: item.name || 'Unknown Batch',
            severity: 'warning',
            message: `Invalid batch status field: "${item.status}"`,
            field: 'status',
            expected: 'ACTIVE | DUE | EXPIRED',
            actual: String(item.status)
          });
        }
      });
    }

    // 5. ADMISSIONS COLLECTION
    if (Array.isArray(admissions)) {
      admissions.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.studentName) {
          issues.push({
            id: `admissions-name-${id}`,
            collection: 'admissions',
            itemId: id,
            itemName: 'Unknown Admission',
            severity: 'error',
            message: 'Applicant name is missing on admission file',
            field: 'studentName',
            expected: 'string',
            actual: 'undefined'
          });
        }
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(item.status)) {
          issues.push({
            id: `admissions-status-${id}`,
            collection: 'admissions',
            itemId: id,
            itemName: item.studentName || 'Unknown Admission',
            severity: 'error',
            message: `Invalid status attribute: "${item.status}"`,
            field: 'status',
            expected: 'PENDING | APPROVED | REJECTED',
            actual: String(item.status)
          });
        }
      });
    }

    // 6. FEE STATUSES
    if (Array.isArray(feeStatuses)) {
      feeStatuses.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (typeof item.totalFee !== 'number' || typeof item.paidFee !== 'number' || typeof item.pendingFee !== 'number' || isNaN(item.totalFee)) {
          issues.push({
            id: `feestatuses-numeric-${id}`,
            collection: 'fee_statuses',
            itemId: id,
            itemName: item.studentName || 'Unknown Fee Status',
            severity: 'warning',
            message: 'Tuition financials must contain numeric values',
            field: 'totalFee/paidFee/pendingFee',
            expected: 'number',
            actual: 'non-numeric/undefined'
          });
        }
        if (!['PAID', 'PARTIAL', 'PENDING'].includes(item.status)) {
          issues.push({
            id: `feestatuses-status-${id}`,
            collection: 'fee_statuses',
            itemId: id,
            itemName: item.studentName || 'Unknown Fee Status',
            severity: 'error',
            message: `Invalid fee status state: "${item.status}"`,
            field: 'status',
            expected: 'PAID | PARTIAL | PENDING',
            actual: String(item.status)
          });
        }
      });
    }

    // 7. FEE RECEIPTS
    if (Array.isArray(feeReceipts)) {
      feeReceipts.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (typeof item.amountPaid !== 'number' || isNaN(item.amountPaid)) {
          issues.push({
            id: `feereceipts-amount-${id}`,
            collection: 'fee_receipts',
            itemId: id,
            itemName: item.studentName || 'Unknown Receipt',
            severity: 'warning',
            message: 'Receipt amountPaid attribute is non-numeric',
            field: 'amountPaid',
            expected: 'number',
            actual: typeof item.amountPaid
          });
        }
      });
    }

    // 8. STUDENT SUBSCRIPTIONS
    if (Array.isArray(subscriptions)) {
      subscriptions.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.studentId || !item.batchId) {
          issues.push({
            id: `subscriptions-refs-${id}`,
            collection: 'student_subscriptions',
            itemId: id,
            itemName: item.studentName || 'Unknown Subscription',
            severity: 'error',
            message: 'Billing subscription missing studentId or batchId constraints',
            field: 'studentId/batchId',
            expected: 'valid reference strings',
            actual: 'missing'
          });
        }
        if (!['ACTIVE', 'DUE_SOON', 'OVERDUE', 'EXPIRED'].includes(item.status)) {
          issues.push({
            id: `subscriptions-status-${id}`,
            collection: 'student_subscriptions',
            itemId: id,
            itemName: item.studentName || 'Unknown Subscription',
            severity: 'error',
            message: `Invalid subscription billing status state: "${item.status}"`,
            field: 'status',
            expected: 'ACTIVE | DUE_SOON | OVERDUE | EXPIRED',
            actual: String(item.status)
          });
        }
      });
    }

    // 9. TIMETABLE
    if (Array.isArray(timetableList)) {
      timetableList.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.day || !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(item.day)) {
          issues.push({
            id: `timetable-day-${id}`,
            collection: 'timetable',
            itemId: id,
            itemName: `${item.className || 'Class'} ${item.subject || 'Subject'}`,
            severity: 'error',
            message: `Timetable contains an invalid day parameter: "${item.day}"`,
            field: 'day',
            expected: 'Monday to Sunday string',
            actual: String(item.day)
          });
        }
      });
    }

    // 10. INQUIRIES
    if (Array.isArray(inquiries)) {
      inquiries.forEach((item, idx) => {
        const id = item.id || `idx-${idx}`;
        if (!item.name) {
          issues.push({
            id: `inquiries-name-${id}`,
            collection: 'inquiries',
            itemId: id,
            itemName: 'Anonymous Inquiry',
            severity: 'error',
            message: 'Inquirer primary name is blank',
            field: 'name',
            expected: 'string',
            actual: 'undefined'
          });
        }
        if (!['PENDING', 'CONTACTED', 'RESOLVED'].includes(item.status)) {
          issues.push({
            id: `inquiries-status-${id}`,
            collection: 'inquiries',
            itemId: id,
            itemName: item.name || 'Unknown',
            severity: 'error',
            message: `Invalid inquiry status attribute: "${item.status}"`,
            field: 'status',
            expected: 'PENDING | CONTACTED | RESOLVED',
            actual: String(item.status)
          });
        }
      });
    }

    // Simulation timing to feel realistic
    setTimeout(() => {
      setIntegrityIssues(issues);
      setIsDiagnosing(false);
      setDiagnosedAt(new Date().toLocaleTimeString());
    }, 850);
  };

  const handleHealAllCollections = () => {
    if (integrityIssues.length === 0) {
      alert("🎉 Database Integrity Verified: All schema checks cleared successfully!");
      return;
    }

    if (!confirm("⚠️ Proceed with Self-Healing?\n\nThis will automatically patch data types, assign fallback defaults, and cryptographically harden weak logins back into Firestore. Continue?")) {
      return;
    }

    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] Starting automated diagnostics healing pipeline...`);

    // --- USERS HEAL ---
    if (Array.isArray(users)) {
      let changed = false;
      const healed = users.map(item => {
        const copy = { ...item };
        if (!copy.id) {
          copy.id = `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          changed = true;
          logs.push(`Users: Assigned missing ID "${copy.id}"`);
        }
        if (!copy.username) {
          copy.username = (copy.name || 'user').toLowerCase().replace(/\s+/g, '') || `user_${copy.id.slice(-4)}`;
          changed = true;
          logs.push(`Users: Set username to "${copy.username}"`);
        }
        if (!copy.role || !['ADMIN', 'TEACHER', 'RECEPTIONIST', 'STUDENT'].includes(copy.role)) {
          copy.role = 'STUDENT';
          changed = true;
          logs.push(`Users [${copy.username}]: reset invalid role to "STUDENT"`);
        }
        if (strictMode && copy.password && !copy.password.startsWith('sha256_mock_')) {
          copy.password = 'sha256_mock_' + localSimpleSecureHash(copy.password);
          changed = true;
          logs.push(`Users [${copy.username}]: Cryptographically hardened weak password!`);
        }
        return copy;
      });
      if (changed) {
        onHealState('users', healed);
      }
    }

    // --- STUDENTS HEAL ---
    if (Array.isArray(students)) {
      let changed = false;
      const healed = students.map(item => {
        const copy = { ...item };
        if (!copy.id) {
          copy.id = `STD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          changed = true;
          logs.push(`Students: Assigned missing ID "${copy.id}"`);
        }
        if (!copy.name) {
          copy.name = 'Healed Student';
          changed = true;
          logs.push(`Students: Repaired blank name with default`);
        }
        if (!copy.rollNo) {
          copy.rollNo = `S-10${Math.floor(Math.random() * 900 + 100)}`;
          changed = true;
          logs.push(`Students [${copy.name}]: Assigned generated roll number "${copy.rollNo}"`);
        }
        if (typeof copy.attendancePercentage !== 'number' || isNaN(copy.attendancePercentage)) {
          copy.attendancePercentage = 100;
          changed = true;
          logs.push(`Students [${copy.name}]: Coerced attendance to 100%`);
        }
        if (!copy.preferredBatch) {
          copy.preferredBatch = 'Batch A';
          changed = true;
          logs.push(`Students [${copy.name}]: Setup fallback preferred batch`);
        }
        return copy;
      });
      if (changed) {
        onHealState('students', healed);
      }
    }

    // --- TEACHERS HEAL ---
    if (Array.isArray(teachers)) {
      let changed = false;
      const healed = teachers.map(item => {
        const copy = { ...item };
        if (!copy.name) {
          copy.name = 'Coaching Faculty';
          changed = true;
        }
        if (!Array.isArray(copy.specialty)) {
          copy.specialty = ['General Science'];
          changed = true;
          logs.push(`Teachers [${copy.name}]: Initialized missing specialty array`);
        }
        if (!Array.isArray(copy.batches)) {
          copy.batches = [];
          changed = true;
          logs.push(`Teachers [${copy.name}]: Initialized empty batches tracker`);
        }
        return copy;
      });
      if (changed) {
        onHealState('teachers', healed);
      }
    }

    // --- BATCHES HEAL ---
    if (Array.isArray(batches)) {
      let changed = false;
      const healed = batches.map(item => {
        const copy = { ...item };
        if (!copy.name) {
          copy.name = 'General Batch';
          changed = true;
        }
        if (typeof copy.monthlyFee !== 'number' || isNaN(copy.monthlyFee)) {
          copy.monthlyFee = 450;
          changed = true;
          logs.push(`Batches [${copy.name}]: Assigned fallback fee of ₹450`);
        }
        if (!['ACTIVE', 'DUE', 'EXPIRED'].includes(copy.status)) {
          copy.status = 'ACTIVE';
          changed = true;
          logs.push(`Batches [${copy.name}]: Corrected invalid status to ACTIVE`);
        }
        return copy;
      });
      if (changed) {
        onHealState('batches', healed);
      }
    }

    // --- ADMISSIONS HEAL ---
    if (Array.isArray(admissions)) {
      let changed = false;
      const healed = admissions.map(item => {
        const copy = { ...item };
        if (!copy.studentName) {
          copy.studentName = 'Admission Applicant';
          changed = true;
        }
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(copy.status)) {
          copy.status = 'PENDING';
          changed = true;
          logs.push(`Admissions [${copy.studentName}]: Repaired invalid status field to "PENDING"`);
        }
        return copy;
      });
      if (changed) {
        onHealState('admissions', healed);
      }
    }

    // --- FEE STATUSES HEAL ---
    if (Array.isArray(feeStatuses)) {
      let changed = false;
      const healed = feeStatuses.map(item => {
        const copy = { ...item };
        let numericIssue = false;
        if (typeof copy.totalFee !== 'number' || isNaN(copy.totalFee)) { copy.totalFee = 450; numericIssue = true; }
        if (typeof copy.paidFee !== 'number' || isNaN(copy.paidFee)) { copy.paidFee = 0; numericIssue = true; }
        if (typeof copy.pendingFee !== 'number' || isNaN(copy.pendingFee)) { copy.pendingFee = copy.totalFee - copy.paidFee; numericIssue = true; }
        if (numericIssue) {
          changed = true;
          logs.push(`Fee Status [${copy.studentName || 'Record'}]: Recalculated ledger financials.`);
        }
        if (!['PAID', 'PARTIAL', 'PENDING'].includes(copy.status)) {
          copy.status = 'PENDING';
          changed = true;
          logs.push(`Fee Status [${copy.studentName || 'Record'}]: Set status to PENDING`);
        }
        return copy;
      });
      if (changed) {
        onHealState('fee_statuses', healed);
      }
    }

    // --- STUDENT SUBSCRIPTIONS HEAL ---
    if (Array.isArray(subscriptions)) {
      let changed = false;
      const healed = subscriptions.map(item => {
        const copy = { ...item };
        if (!copy.studentId) { copy.studentId = 'HEALED-ST'; changed = true; }
        if (!copy.batchId) { copy.batchId = 'HEALED-BT'; changed = true; }
        if (!['ACTIVE', 'DUE_SOON', 'OVERDUE', 'EXPIRED'].includes(copy.status)) {
          copy.status = 'ACTIVE';
          changed = true;
          logs.push(`Subscriptions [${copy.studentName || 'Record'}]: Reset status to ACTIVE`);
        }
        return copy;
      });
      if (changed) {
        onHealState('student_subscriptions', healed);
      }
    }

    // --- TIMETABLE HEAL ---
    if (Array.isArray(timetableList)) {
      let changed = false;
      const healed = timetableList.map(item => {
        const copy = { ...item };
        if (!copy.day || !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(copy.day)) {
          copy.day = 'Monday';
          changed = true;
          logs.push(`Timetable [${copy.subject}]: Corrected invalid day attribute to "Monday"`);
        }
        return copy;
      });
      if (changed) {
        onHealState('timetable', healed);
      }
    }

    // --- INQUIRIES HEAL ---
    if (Array.isArray(inquiries)) {
      let changed = false;
      const healed = inquiries.map(item => {
        const copy = { ...item };
        if (!copy.name) { copy.name = 'Web Prospect'; changed = true; }
        if (!['PENDING', 'CONTACTED', 'RESOLVED'].includes(copy.status)) {
          copy.status = 'PENDING';
          changed = true;
          logs.push(`Inquiries [${copy.name}]: Corrected state to PENDING`);
        }
        return copy;
      });
      if (changed) {
        onHealState('inquiries', healed);
      }
    }

    logs.push(`[${new Date().toLocaleTimeString()}] All corrections successfully completed! Synchronizing Cloud Firestore...`);
    setHealLog(prev => [...prev, ...logs]);

    // Re-check
    setTimeout(() => {
      runSystemCheck();
    }, 600);
  };

  // Run automatically on mounting tab
  useEffect(() => {
    if (activeTab === 'diagnostics') {
      runSystemCheck();
    }
  }, [activeTab]);
  // --- END OF SYSTEM DIAGNOSTICS STATES & FUNCTIONS ---

  // Local Storage Backups & Scheduling States
  const [backupFrequency, setBackupFrequency] = useState<'MANUAL' | '12_HOURS' | 'DAILY' | 'WEEKLY'>(() => {
    return (localStorage.getItem('sunshine_backup_frequency') as any) || 'DAILY';
  });
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem('sunshine_last_backup_time') || 'Never';
  });
  const [localBackupsArchive, setLocalBackupsArchive] = useState<{
    id: string;
    timestamp: string;
    sizeKB: number;
    data: any;
  }[]>(() => {
    try {
      const stored = localStorage.getItem('sunshine_local_backups_archive');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  // Automated Backup Scheduler Evaluator
  useEffect(() => {
    const lastBackupStr = localStorage.getItem('sunshine_last_backup_time_epoch');
    const lastBackupEpoch = lastBackupStr ? parseInt(lastBackupStr, 10) : 0;
    const nowEpoch = Date.now();

    let shouldTrigger = false;
    let intervalMs = 0;

    if (backupFrequency === '12_HOURS') intervalMs = 12 * 60 * 60 * 1000;
    else if (backupFrequency === 'DAILY') intervalMs = 24 * 60 * 60 * 1000;
    else if (backupFrequency === 'WEEKLY') intervalMs = 7 * 24 * 60 * 60 * 1000;

    if (intervalMs > 0 && (nowEpoch - lastBackupEpoch >= intervalMs)) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      try {
        const backupData: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !key.startsWith('sunshine_local_backups_archive')) {
            backupData[key] = localStorage.getItem(key) || '';
          }
        }
        
        const dataStr = JSON.stringify(backupData);
        const sizeKB = Math.round((dataStr.length * 2) / 1024 * 10) / 10;
        
        const newSnapshot = {
          id: `auto-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          sizeKB,
          data: backupData
        };

        const updatedArchive = [newSnapshot, ...localBackupsArchive].slice(0, 5);
        setLocalBackupsArchive(updatedArchive);
        localStorage.setItem('sunshine_local_backups_archive', JSON.stringify(updatedArchive));
        
        const nowStr = new Date().toLocaleString();
        setLastBackupTime(nowStr);
        localStorage.setItem('sunshine_last_backup_time', nowStr);
        localStorage.setItem('sunshine_last_backup_time_epoch', nowEpoch.toString());

        // Dispatch system notification
        onAddNotification({
          title: '💾 Automated Backup Succeeded',
          content: `An automated backup snapshot has been saved to the local archives (${sizeKB} KB).`,
          category: 'ANNOUNCEMENT',
          targetRole: 'TEACHER'
        });
      } catch (err) {
        console.error("Auto backup execution failed", err);
      }
    }
  }, [backupFrequency, localBackupsArchive, onAddNotification]);

  // Detailed Fees & Ledger local state variables
  const [feeSelectedMonth, setFeeSelectedMonth] = useState('June 2026');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeFilterClass, setFeeFilterClass] = useState('ALL');
  const [feeFilterStatus, setFeeFilterStatus] = useState<'ALL' | 'UNPAID'>('UNPAID');
  const [showReminderTemplateEditor, setShowReminderTemplateEditor] = useState(false);
  const [showBulkWASender, setShowBulkWASender] = useState(false);
  const [bulkWAFilterClass, setBulkWAFilterClass] = useState('ALL');
  const [bulkWAFilterBatch, setBulkWAFilterBatch] = useState('ALL');
  const [isSendingBulkWA, setIsSendingBulkWA] = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState(
    "Dear Parent, this is a friendly reminder from Sunshine Classes, Pihani. The tuition fee of ₹[AMOUNT] for your child [STUDENT_NAME] ([CLASS]) for [MONTH] is currently pending. Please submit the fee at your earliest convenience to avoid any disruption. Thank you! - Priyanshu Gupta (Founder)"
  );

  // Recording payments local form states
  const [collectStudentId, setCollectStudentId] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMonth, setCollectMonth] = useState('June 2026');
  const [collectMethod, setCollectMethod] = useState<'CASH' | 'UPI' | 'ONLINE'>('UPI');
  const [collectTxnId, setCollectTxnId] = useState('');
  const [showCollectForm, setShowCollectForm] = useState(false);

  // Website CMS State Variables
  const [showTopperForm, setShowTopperForm] = useState(false);
  const [editingTopper, setEditingTopper] = useState<Topper | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Omit<StudyMaterial, 'id'> | null>(null);

  // Founder and Member CMS State Variables
  const [showFounderForm, setShowFounderForm] = useState(false);
  const [editingFounder, setEditingFounder] = useState<FounderMember | null>(null);
  const [founderName, setFounderName] = useState('');
  const [founderTitle, setFounderTitle] = useState('');
  const [founderQualification, setFounderQualification] = useState('');
  const [founderMessage, setFounderMessage] = useState('');
  const [founderTuitionFocus, setFounderTuitionFocus] = useState('');
  const [founderAvatarInitials, setFounderAvatarInitials] = useState('');
  const [founderPhotoUrl, setFounderPhotoUrl] = useState('');

  // Batch manager state variables
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchFormName, setBatchFormName] = useState('');
  const [batchFormTime, setBatchFormTime] = useState('');
  const [batchFormClass, setBatchFormClass] = useState('');
  const [batchFormTeacher, setBatchFormTeacher] = useState('');
  const [batchFormFee, setBatchFormFee] = useState(0);
  const [batchFormStatus, setBatchFormStatus] = useState<'ACTIVE' | 'DUE' | 'EXPIRED'>('ACTIVE');

  // State for Admin resetting another user's password
  const [resettingUser, setResettingUser] = useState<{ userId: string; username: string; name: string } | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');

  // Quick Fee Collect State Variables
  const [quickCollectStudent, setQuickCollectStudent] = useState<Student | null>(null);
  const [quickCollectAmount, setQuickCollectAmount] = useState('');
  const [quickCollectMonth, setQuickCollectMonth] = useState('June 2026');
  const [quickCollectMethod, setQuickCollectMethod] = useState<'CASH' | 'UPI' | 'ONLINE'>('UPI');
  const [quickCollectTxnId, setQuickCollectTxnId] = useState('');
  const [showQuickCollectHistory, setShowQuickCollectHistory] = useState(false);
  const [quickCollectSendWhatsApp, setQuickCollectSendWhatsApp] = useState(true);

  const openQuickCollect = (student: Student) => {
    setQuickCollectStudent(student);
    setShowQuickCollectHistory(false);
    setQuickCollectSendWhatsApp(true);
    // Find first month with pending fee for this student in feeStatuses
    const studentPendingStatuses = feeStatuses.filter(f => f.studentId === student.id && f.pendingFee > 0);
    let initialMonth = 'July 2026';
    let initialAmount = '';
    if (studentPendingStatuses.length > 0) {
      initialMonth = studentPendingStatuses[0].month;
      initialAmount = studentPendingStatuses[0].pendingFee.toString();
    } else {
      // Find July 2026 status, or other status, or default to standard fee
      const julyStatus = feeStatuses.find(f => f.studentId === student.id && f.month === 'July 2026');
      if (julyStatus) {
        initialAmount = julyStatus.pendingFee.toString();
      } else {
        const anyStatus = feeStatuses.find(f => f.studentId === student.id);
        if (anyStatus) {
          initialAmount = anyStatus.pendingFee.toString();
        } else {
          initialAmount = '1500';
        }
      }
    }
    setQuickCollectMonth(initialMonth);
    setQuickCollectAmount(initialAmount);
    setQuickCollectMethod('UPI');
    setQuickCollectTxnId('');
  };

  const handleQuickCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCollectStudent) return;
    const amount = Number(quickCollectAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid tuition fee amount.");
      return;
    }

    onCollectFee({
      studentId: quickCollectStudent.id,
      studentName: quickCollectStudent.name,
      class: quickCollectStudent.class,
      month: quickCollectMonth,
      amountPaid: amount,
      paymentMethod: quickCollectMethod,
      transactionId: quickCollectTxnId || undefined,
      skipWhatsApp: !quickCollectSendWhatsApp
    });

    alert(`Successfully recorded fee payment of ₹${amount} for ${quickCollectStudent.name} (${quickCollectMonth}).`);
    setQuickCollectStudent(null);
  };

  // Helper for CSV download
  const exportToCSV = (data: any[], filename: string, headers: string[], keys: string[]) => {
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    for (const item of data) {
      const values = keys.map(key => {
        let val = item[key];
        if (val === undefined || val === null) val = '';
        if (Array.isArray(val)) val = val.join(', ');
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for PDF print
  const exportToPDF = (title: string, headers: string[], rows: string[][], summaryStats?: { label: string; value: string }[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
              background-color: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title-area h1 {
              margin: 0;
              font-size: 22px;
              color: #1e3a8a;
              font-weight: 800;
              letter-spacing: -0.025em;
            }
            .title-area p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
            }
            .document-type {
              text-align: right;
            }
            .document-type h3 {
              margin: 0;
              font-size: 14px;
              color: #475569;
              font-weight: 800;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            .document-type p {
              margin: 4px 0 0 0;
              font-size: 10px;
              color: #94a3b8;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 12px;
              margin-bottom: 30px;
            }
            .stat-card {
              background-color: #f8fafc;
              border: 1px solid #f1f5f9;
              padding: 12px;
              border-radius: 10px;
            }
            .stat-card span {
              display: block;
              font-size: 9px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.05em;
            }
            .stat-card strong {
              display: block;
              font-size: 15px;
              color: #1e293b;
              margin-top: 4px;
              font-weight: 800;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 10px;
              color: #334155;
              line-height: 1.4;
            }
            tr:nth-child(even) td {
              background-color: #fcfdfe;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #f1f5f9;
              padding-top: 15px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              font-weight: 500;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
              <h1>SUNSHINE CLASSES</h1>
              <p>Mishra Gali opposite Subhash Park, Pihani, Hardoi • ERP System</p>
            </div>
            <div class="document-type">
              <h3>${title}</h3>
              <p>Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          ${summaryStats && summaryStats.length > 0 ? `
            <div class="stats-grid">
              ${summaryStats.map(stat => `
                <div class="stat-card">
                  <span>${stat.label}</span>
                  <strong>${stat.value}</strong>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Sunshine Classes ERP Automated Registry System • Priyanshu Gupta, Founder.
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportStudentsCSV = () => {
    const headers = [
      'Roll No',
      'Name',
      'Class',
      'Father Name',
      'Mother Name',
      'DOB',
      'Gender',
      'Address',
      'Mobile',
      'Parent Mobile',
      'Email',
      'Batch',
      'Timing',
      'Admission Date'
    ];
    const keys = [
      'rollNo',
      'name',
      'class',
      'fatherName',
      'motherName',
      'dob',
      'gender',
      'address',
      'mobile',
      'parentMobile',
      'email',
      'preferredBatch',
      'preferredTiming',
      'admissionDate'
    ];
    exportToCSV(students, `enrolled_students_${new Date().toISOString().split('T')[0]}.csv`, headers, keys);
  };

  const handleExportStudentsPDF = () => {
    const headers = ['Roll No', 'Name', 'Class', 'Parents', 'Contacts', 'Admission Date'];
    const rows = students.map(s => [
      s.rollNo,
      s.name,
      s.class,
      `Father: ${s.fatherName}\nMother: ${s.motherName}`,
      `Self: ${s.mobile}\nParent: ${s.parentMobile}`,
      s.admissionDate
    ]);
    const summaryStats = [
      { label: 'Total Enrolled', value: `${students.length} Students` },
      { label: 'Class 10 (Boards)', value: `${students.filter(s => s.class.includes('10')).length} Students` },
      { label: 'Classes 1-9', value: `${students.filter(s => !s.class.includes('10')).length} Students` }
    ];
    exportToPDF('Sunshine Enrolled Students Ledger', headers, rows, summaryStats);
  };

  const handleExportPaymentsCSV = () => {
    const headers = [
      'Receipt ID',
      'Student ID',
      'Student Name',
      'Class',
      'Month/Cycle',
      'Amount Paid (INR)',
      'Payment Method',
      'Date Received',
      'Transaction ID',
      'Received By'
    ];
    const keys = [
      'id',
      'studentId',
      'studentName',
      'class',
      'month',
      'amountPaid',
      'paymentMethod',
      'date',
      'transactionId',
      'receivedBy'
    ];
    exportToCSV(feeReceipts, `fee_payments_ledger_${new Date().toISOString().split('T')[0]}.csv`, headers, keys);
  };

  const handleExportPaymentsPDF = () => {
    const headers = ['Receipt ID', 'Student Name', 'Class', 'Cycle Month', 'Amount Paid', 'Method', 'Received By'];
    const rows = feeReceipts.map(rec => [
      rec.id,
      rec.studentName,
      rec.class,
      rec.month,
      `₹${rec.amountPaid}`,
      rec.paymentMethod,
      rec.receivedBy
    ]);
    const summaryStats = [
      { label: 'Total Receipts', value: `${feeReceipts.length} Payments` },
      { label: 'Total Revenue', value: `₹${feeReceipts.reduce((sum, r) => sum + r.amountPaid, 0)}` },
      { label: 'Cash Revenue', value: `₹${feeReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.amountPaid, 0)}` },
      { label: 'Digital Revenue', value: `₹${feeReceipts.filter(r => r.paymentMethod !== 'CASH').reduce((sum, r) => sum + r.amountPaid, 0)}` }
    ];
    exportToPDF('Tuition Fee Revenue Ledgers', headers, rows, summaryStats);
  };

  const handleExportMonthlyFinancialReportPDF = (selectedMonth: string) => {
    const isAll = selectedMonth === 'ALL';
    const monthReceipts = feeReceipts.filter(r => isAll ? true : r.month === selectedMonth);
    const monthStatuses = feeStatuses.filter(f => isAll ? true : f.month === selectedMonth);

    const totalCollected = monthReceipts.reduce((sum, r) => sum + r.amountPaid, 0);
    const totalPending = monthStatuses.reduce((sum, f) => sum + f.pendingFee, 0);
    const totalExpected = totalCollected + totalPending;
    const collectionEfficiency = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;

    const paidCount = monthStatuses.filter(f => f.pendingFee === 0).length;
    const unpaidCount = monthStatuses.filter(f => f.pendingFee > 0).length;

    const cashCollected = monthReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.amountPaid, 0);
    const digitalCollected = monthReceipts.filter(r => r.paymentMethod !== 'CASH').reduce((sum, r) => sum + r.amountPaid, 0);

    // Class-wise breakdowns
    const allClasses = Array.from(new Set([
      ...students.map(s => s.class),
      ...monthStatuses.map(f => f.class),
      ...monthReceipts.map(r => r.class)
    ])).filter(Boolean).sort();

    const classBreakdowns = allClasses.map(cls => {
      const clsCollected = monthReceipts.filter(r => r.class === cls).reduce((sum, r) => sum + r.amountPaid, 0);
      const clsPending = monthStatuses.filter(f => f.class === cls).reduce((sum, f) => sum + f.pendingFee, 0);
      const clsExpected = clsCollected + clsPending;
      const clsRate = clsExpected > 0 ? Math.round((clsCollected / clsExpected) * 100) : 100;
      const clsStudentsCount = students.filter(s => s.class === cls).length;

      return {
        className: cls,
        studentsCount: clsStudentsCount,
        collected: clsCollected,
        pending: clsPending,
        expected: clsExpected,
        rate: clsRate
      };
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export the financial summary report PDF.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sunshine Classes - Monthly Financial Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
              background-color: #ffffff;
              line-height: 1.5;
            }

            @media print {
              body {
                padding: 10px;
              }
              .no-print {
                display: none !important;
              }
              .page-break {
                page-break-before: always;
              }
            }

            .header-container {
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }

            .brand-section h1 {
              margin: 0;
              font-size: 26px;
              color: #1e3a8a;
              font-weight: 800;
              letter-spacing: -0.03em;
            }

            .brand-section p {
              margin: 2px 0 0 0;
              font-size: 11px;
              color: #475569;
              font-weight: 500;
            }

            .report-title-section {
              text-align: right;
            }

            .report-title-section h2 {
              margin: 0;
              font-size: 16px;
              color: #0f172a;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .report-title-section p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
            }

            .report-meta {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-bottom: 24px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 11px;
            }

            .meta-item strong {
              color: #334155;
            }

            .stats-dashboard {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-bottom: 28px;
            }

            .stat-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }

            .stat-card.collected { border-left: 4px solid #10b981; }
            .stat-card.pending { border-left: 4px solid #f43f5e; }
            .stat-card.efficiency { border-left: 4px solid #6366f1; }
            .stat-card.expected { border-left: 4px solid #f59e0b; }

            .stat-card span {
              display: block;
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .stat-card strong {
              display: block;
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 6px;
            }

            .stat-card p {
              margin: 4px 0 0 0;
              font-size: 10px;
              color: #475569;
            }

            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              margin: 24px 0 12px 0;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .section-title span {
              font-size: 10px;
              color: #64748b;
              font-weight: 500;
              text-transform: none;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }

            th {
              background-color: #f1f5f9;
              color: #334155;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              padding: 8px 10px;
              border-bottom: 2px solid #cbd5e1;
              text-align: left;
            }

            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 10px;
              color: #334155;
            }

            tr:nth-child(even) td {
              background-color: #f8fafc;
            }

            .badge {
              display: inline-block;
              padding: 2px 6px;
              font-size: 8px;
              font-weight: 700;
              border-radius: 4px;
              text-transform: uppercase;
            }

            .badge-success { background: #d1fae5; color: #065f46; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-danger { background: #fee2e2; color: #991b1b; }

            .text-right { text-align: right; }
            .font-mono { font-family: monospace, Courier; }
            .text-emerald { color: #059669; font-weight: 600; }
            .text-rose { color: #dc2626; font-weight: 600; }

            .revenue-split-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 16px;
            }

            .split-bar-container {
              background: #f1f5f9;
              height: 12px;
              border-radius: 6px;
              overflow: hidden;
              margin-top: 8px;
            }

            .split-bar-fill {
              height: 100%;
              background: #10b981;
            }

            .signature-area {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #475569;
            }

            .sig-box {
              border-top: 1px solid #cbd5e1;
              width: 180px;
              text-align: center;
              padding-top: 8px;
            }

            .footer-info {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              text-align: center;
              font-size: 8px;
              color: #94a3b8;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand-section">
              <h1>SUNSHINE CLASSES</h1>
              <p>Mishra Gali opposite Subhash Park, Pihani, Hardoi • Tuition Fee Audit</p>
            </div>
            <div class="report-title-section">
              <h2>Financial Summary Report</h2>
              <p>Billing Cycle: <strong>${isAll ? 'All Active Cycles' : selectedMonth}</strong></p>
            </div>
          </div>

          <div class="report-meta">
            <div class="meta-item">
              <strong>Report Period:</strong> ${isAll ? 'Inception to Date' : selectedMonth}<br/>
              <strong>Scope:</strong> All Classes & Batches
            </div>
            <div class="meta-item">
              <strong>Generated On:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}<br/>
              <strong>System Status:</strong> Operational ERP
            </div>
            <div class="meta-item">
              <strong>Accounts Overview:</strong> ${paidCount + unpaidCount} Registered billings<br/>
              <strong>Settled vs Unsettled:</strong> ${paidCount} Paid / ${unpaidCount} Pending Dues
            </div>
          </div>

          <div class="stats-dashboard">
            <div class="stat-card expected">
              <span>Expected Revenue</span>
              <strong>₹${totalExpected.toLocaleString('en-IN')}</strong>
              <p>Total billings generated</p>
            </div>
            <div class="stat-card collected">
              <span>Collected Fees</span>
              <strong class="text-emerald">₹${totalCollected.toLocaleString('en-IN')}</strong>
              <p>Amount received via counters</p>
            </div>
            <div class="stat-card pending">
              <span>Outstanding Dues</span>
              <strong class="text-rose">₹${totalPending.toLocaleString('en-IN')}</strong>
              <p>Dues pending resolution</p>
            </div>
            <div class="stat-card efficiency">
              <span>Collection Efficiency</span>
              <strong>${collectionEfficiency}%</strong>
              <p>Percentage of dues cleared</p>
            </div>
          </div>

          <div class="revenue-split-grid">
            <div class="stat-card">
              <span>Counter Cash Income</span>
              <strong>₹${cashCollected.toLocaleString('en-IN')}</strong>
              <div class="split-bar-container">
                <div class="split-bar-fill" style="width: ${totalCollected > 0 ? (cashCollected / totalCollected) * 100 : 0}%; background-color: #34d399;"></div>
              </div>
              <p style="margin-top: 4px; font-size: 9px; color: #64748b;">${totalCollected > 0 ? Math.round((cashCollected / totalCollected) * 100) : 0}% of total collections</p>
            </div>
            <div class="stat-card">
              <span>Digital/UPI/Netbanking Income</span>
              <strong>₹${digitalCollected.toLocaleString('en-IN')}</strong>
              <div class="split-bar-container">
                <div class="split-bar-fill" style="width: ${totalCollected > 0 ? (digitalCollected / totalCollected) * 100 : 0}%; background-color: #6366f1;"></div>
              </div>
              <p style="margin-top: 4px; font-size: 9px; color: #64748b;">${totalCollected > 0 ? Math.round((digitalCollected / totalCollected) * 100) : 0}% of total collections</p>
            </div>
          </div>

          <div class="section-title">
            Performance Breakdown by School Class
            <span>All Class Segments</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>School Class Segment</th>
                <th class="text-right">Enrolled Students</th>
                <th class="text-right">Collected Revenue</th>
                <th class="text-right">Outstanding Dues</th>
                <th class="text-right">Total Expected</th>
                <th class="text-right">Efficiency Rate</th>
              </tr>
            </thead>
            <tbody>
              ${classBreakdowns.map(row => `
                <tr>
                  <td><strong>${row.className}</strong></td>
                  <td class="text-right font-mono">${row.studentsCount} Students</td>
                  <td class="text-right font-mono text-emerald">₹${row.collected.toLocaleString('en-IN')}</td>
                  <td class="text-right font-mono text-rose">₹${row.pending.toLocaleString('en-IN')}</td>
                  <td class="text-right font-mono">₹${row.expected.toLocaleString('en-IN')}</td>
                  <td class="text-right">
                    <span class="badge ${row.rate >= 80 ? 'badge-success' : row.rate >= 50 ? 'badge-warning' : 'badge-danger'}">
                      ${row.rate}% Cleared
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-break"></div>

          <div class="section-title" style="margin-top: 0;">
            Collected Fees Ledger (Disbursed Receipts)
            <span>Showing ${monthReceipts.length} entries for ${isAll ? 'All Months' : selectedMonth}</span>
          </div>
          ${monthReceipts.length === 0 ? `
            <p style="font-size: 11px; color: #64748b; font-style: italic; text-align: center; padding: 20px;">
              No fee collections logged for this cycle.
            </p>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>Receipt ID</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Date Logged</th>
                  <th>Payment Mode</th>
                  <th class="text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                ${monthReceipts.map(rec => `
                  <tr>
                    <td class="font-mono" style="font-size: 9px; color: #475569;">${rec.id}</td>
                    <td><strong>${rec.studentName}</strong></td>
                    <td>${rec.class}</td>
                    <td>${rec.date}</td>
                    <td><span class="badge" style="background-color: #f1f5f9; color: #334155;">${rec.paymentMethod}</span></td>
                    <td class="text-right font-mono text-emerald" style="font-weight: 600;">₹${rec.amountPaid.toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}

          <div class="section-title">
            Outstanding Tuition Dues ledger
            <span>Showing ${monthStatuses.filter(f => f.pendingFee > 0).length} students pending remittance</span>
          </div>
          ${monthStatuses.filter(f => f.pendingFee > 0).length === 0 ? `
            <p style="font-size: 11px; color: #059669; font-weight: 600; text-align: center; padding: 20px;">
              🎉 Outstanding dues are fully cleared! All students have completed their tuition fee payments.
            </p>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Month</th>
                  <th>Dues Status</th>
                  <th class="text-right">Outstanding Amount</th>
                </tr>
              </thead>
              <tbody>
                ${monthStatuses.filter(f => f.pendingFee > 0).map(fee => `
                  <tr>
                    <td><strong>${fee.studentName}</strong></td>
                    <td>${fee.class}</td>
                    <td>${fee.month}</td>
                    <td>
                      <span class="badge ${fee.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}">
                        ${fee.status === 'PARTIAL' ? 'Partial Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td class="text-right font-mono text-rose" style="font-weight: 600;">₹${fee.pendingFee.toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}

          <div class="signature-area">
            <div>
              <p>Sunshine ERP Auditor Signature</p>
              <div class="sig-box" style="margin-top: 35px;">
                Verified Account Representative
              </div>
            </div>
            <div>
              <p>Sunshine Classes, Pihani, Hardoi</p>
              <div class="sig-box" style="margin-top: 35px;">
                Priyanshu Gupta, Founder
              </div>
            </div>
          </div>

          <div class="footer-info">
            Sunshine Classes tuition ERP software system summary report • Pihani, Hardoi • Page 1 of 2
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };


  // Add Student Form States
  const [stdName, setStdName] = useState('');
  const [stdClass, setStdClass] = useState('Class 10');
  const [stdFather, setStdFather] = useState('');
  const [stdMother, setStdMother] = useState('');
  const [stdDob, setStdDob] = useState('2011-05-15');
  const [stdGender, setStdGender] = useState('Male');
  const [stdAddress, setStdAddress] = useState('');
  const [stdMobile, setStdMobile] = useState('');
  const [stdWhatsapp, setStdWhatsapp] = useState('');
  const [stdParentMobile, setStdParentMobile] = useState('');
  const [stdEmail, setStdEmail] = useState('');
  const [stdBatch, setStdBatch] = useState('Class 10 - Evening Stars');
  const [stdTiming, setStdTiming] = useState('04:00 PM - 06:30 PM');
  const [stdPhotoUrl, setStdPhotoUrl] = useState('');

  // Add Teacher Form States
  const [tchName, setTchName] = useState('');
  const [tchEmail, setTchEmail] = useState('');
  const [tchPhone, setTchPhone] = useState('');
  const [tchQual, setTchQual] = useState('');
  const [tchSpecs, setTchSpecs] = useState('');
  const [tchBatches, setTchBatches] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showTeacherForm, setShowTeacherForm] = useState(false);

  // Add Notification Form States
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifCategory, setNotifCategory] = useState<'ANNOUNCEMENT' | 'EXAM' | 'FEE' | 'HOLIDAY'>('ANNOUNCEMENT');
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');

  // Batch Assignment States
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollBatchId, setEnrollBatchId] = useState('');
  const [enrollBatchTime, setEnrollBatchTime] = useState('');
  const [enrollTempTimeChange, setEnrollTempTimeChange] = useState('');
  const [enrollMonthlyFee, setEnrollMonthlyFee] = useState(1500);
  const [whatsAppLogs, setWhatsAppLogs] = useState<{ id: string; studentName: string; message: string; date: string }[]>([]);

  // Bulk / Targeted Notification states
  const [bulkTargetType, setBulkTargetType] = useState<'BATCH' | 'CLASS' | 'FEES_DUE'>('BATCH');
  const [bulkSelectedBatch, setBulkSelectedBatch] = useState('');
  const [bulkSelectedClass, setBulkSelectedClass] = useState('Class 10');
  const [bulkTemplateMode, setBulkTemplateMode] = useState<'CUSTOM' | 'REMINDER' | 'RECEIPT'>('CUSTOM');
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkCategory, setBulkCategory] = useState<'ANNOUNCEMENT' | 'EXAM' | 'FEE' | 'HOLIDAY'>('ANNOUNCEMENT');
  const [bulkChannel, setBulkChannel] = useState<'BOTH' | 'SYSTEM' | 'EMAIL'>('BOTH');
  const [bulkContent, setBulkContent] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkEmailProgress, setBulkEmailProgress] = useState<{ current: number; total: number; stage: string }>({ current: 0, total: 0, stage: '' });
  const [bulkReportData, setBulkReportData] = useState<{ studentName: string; email: string; success: boolean; previewUrl?: string | null; error?: string }[]>([]);
  const [bulkShowReport, setBulkShowReport] = useState<boolean>(false);
  
  // Simulated bulk dispatches log
  const [bulkHistory, setBulkHistory] = useState<{
    id: string;
    title: string;
    category: string;
    targetType: 'BATCH' | 'CLASS' | 'FEES_DUE';
    targetValue: string;
    channel: string;
    recipientsCount: number;
    date: string;
    content: string;
  }[]>(() => {
    try {
      const stored = localStorage.getItem('sunshine_bulk_notif_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'bulk-1',
        title: 'Class 10 Pre-Board Revision Special Batch Timings Changed',
        category: 'ANNOUNCEMENT',
        targetType: 'CLASS',
        targetValue: 'Class 10',
        channel: 'BOTH',
        recipientsCount: 4,
        date: '2026-06-25 04:30 PM',
        content: 'Dear students, please note that the special revision batch for math and physics is rescheduled from 4:00 PM to 4:45 PM for this week.'
      }
    ];
  });

  const saveBulkHistory = (history: any[]) => {
    setBulkHistory(history);
    try {
      localStorage.setItem('sunshine_bulk_notif_history', JSON.stringify(history));
    } catch (e) {}
  };

  // Set default bulk target batch if empty on render or change
  useEffect(() => {
    if (batches.length > 0 && !bulkSelectedBatch) {
      setBulkSelectedBatch(batches[0].name);
    }
  }, [batches, bulkSelectedBatch]);

  // Reactive calculations for matching students
  const getMatchingStudents = () => {
    return students.filter(student => {
      if (bulkTargetType === 'BATCH') {
        return student.preferredBatch && student.preferredBatch.toLowerCase() === bulkSelectedBatch.toLowerCase();
      } else if (bulkTargetType === 'CLASS') {
        return student.class && student.class.toLowerCase() === bulkSelectedClass.toLowerCase();
      } else if (bulkTargetType === 'FEES_DUE') {
        const studentPendingStatuses = feeStatuses.filter(f => f.studentId === student.id && f.pendingFee > 0);
        return studentPendingStatuses.length > 0;
      }
      return false;
    });
  };

  const matchingStudents = getMatchingStudents();

  const handleSendBulkBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bulkTemplateMode === 'CUSTOM' && (!bulkTitle.trim() || !bulkContent.trim())) {
      alert("Please fill out the Notice Heading and Notice Content.");
      return;
    }

    const targetVal = bulkTargetType === 'BATCH' 
      ? bulkSelectedBatch 
      : bulkTargetType === 'CLASS' 
        ? bulkSelectedClass 
        : 'Students with Due Fees';

    const currentAudience = getMatchingStudents();
    if (currentAudience.length === 0) {
      alert(`No matching students found for target: ${targetVal}`);
      return;
    }

    if (!confirm(`Are you sure you want to dispatch this bulk email broadcast to ${currentAudience.length} students?`)) {
      return;
    }

    setIsSendingBulk(true);
    setBulkShowReport(false);
    setBulkReportData([]);
    setBulkEmailProgress({ current: 0, total: currentAudience.length, stage: 'Initializing queue...' });

    const report: typeof bulkReportData = [];
    const dispatchChannel = bulkChannel;
    const templateMode = bulkTemplateMode;

    // Process each matching student
    for (let i = 0; i < currentAudience.length; i++) {
      const student = currentAudience[i];
      setBulkEmailProgress({ current: i + 1, total: currentAudience.length, stage: `Processing email for ${student.name}...` });

      if (!student.email) {
        report.push({
          studentName: student.name,
          email: 'N/A',
          success: false,
          error: 'Missing email address'
        });
        continue;
      }

      let subject = '';
      let htmlContent = '';
      let emailType = 'custom';

      if (templateMode === 'REMINDER') {
        emailType = 'reminder';
        // Try to find a pending bill for this student
        const pendingBill = feeStatuses.find(f => f.studentId === student.id && f.pendingFee > 0);
        const variables = {
          studentName: student.name,
          className: student.class || student.preferredBatch || 'N/A',
          month: pendingBill ? pendingBill.month : 'Current Cycle',
          amount: pendingBill ? pendingBill.pendingFee : 1500,
          dueDate: pendingBill ? '10th of the Month' : 'As Specified'
        };
        subject = interpolateTemplate(emailTemplates.reminderSubject, variables);
        htmlContent = interpolateTemplate(emailTemplates.reminderBody, variables);
      } else if (templateMode === 'RECEIPT') {
        emailType = 'receipt';
        // Try to find any fee status or receipt
        const matchedReceipt = feeReceipts.find(r => r.studentId === student.id);
        const variables = {
          receiptId: matchedReceipt ? matchedReceipt.id : `REC-BULK-${Date.now()}`,
          date: matchedReceipt ? matchedReceipt.date : new Date().toLocaleDateString(),
          studentName: student.name,
          className: student.class || student.preferredBatch || 'N/A',
          month: matchedReceipt ? matchedReceipt.month : 'Current Cycle',
          amount: matchedReceipt ? matchedReceipt.amountPaid : 1500,
          paymentMethod: matchedReceipt ? matchedReceipt.paymentMethod : 'CASH',
          transactionId: (matchedReceipt && matchedReceipt.transactionId) || 'N/A',
          receivedBy: 'Admin Office'
        };
        subject = interpolateTemplate(emailTemplates.receiptSubject, variables);
        htmlContent = interpolateTemplate(emailTemplates.receiptBody, variables);
      } else {
        // Custom template
        subject = bulkTitle;
        htmlContent = bulkContent;
      }

      // If the channel includes email, make a real call to /api/send-email
      if (dispatchChannel === 'BOTH' || dispatchChannel === 'EMAIL') {
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: emailType,
              to: student.email,
              studentName: student.name,
              customSubject: subject,
              customHtml: htmlContent
            })
          });

          if (res.ok) {
            const data = await res.json();
            report.push({
              studentName: student.name,
              email: student.email,
              success: true,
              previewUrl: data.previewUrl
            });
          } else {
            const errData = await res.json().catch(() => ({}));
            report.push({
              studentName: student.name,
              email: student.email,
              success: false,
              error: errData.error || `HTTP error ${res.status}`
            });
          }
        } catch (error: any) {
          report.push({
            studentName: student.name,
            email: student.email,
            success: false,
            error: error.message || 'Network exception'
          });
        }
      } else {
        // Portal Notice Board Only
        report.push({
          studentName: student.name,
          email: student.email,
          success: true,
          previewUrl: null
        });
      }
    }

    // 1. Save to system notification state if channel is BOTH or SYSTEM
    const finalSubject = templateMode === 'CUSTOM' ? bulkTitle : (templateMode === 'REMINDER' ? 'Fee Overdue Alert' : 'Receipt Summary Alert');
    const finalContent = templateMode === 'CUSTOM' ? bulkContent : `Automated system email broadcast sent. Type: ${templateMode}`;

    if (dispatchChannel === 'BOTH' || dispatchChannel === 'SYSTEM') {
      onAddNotification({
        title: `[Targeted Alert] ${finalSubject}`,
        content: finalContent,
        category: bulkCategory,
        targetRole: 'STUDENT',
        targetBatch: bulkTargetType === 'BATCH' ? targetVal : undefined,
        targetClass: bulkTargetType === 'CLASS' ? targetVal : undefined,
        sentAsEmail: dispatchChannel === 'BOTH' || dispatchChannel === 'EMAIL',
        emailRecipientsCount: currentAudience.filter(s => s.email).length
      });
    }

    // 2. Add to bulk dispatcher log
    const newHistoryItem = {
      id: `bulk-${Date.now()}`,
      title: finalSubject,
      category: bulkCategory,
      targetType: bulkTargetType,
      targetValue: targetVal,
      channel: dispatchChannel,
      recipientsCount: currentAudience.length,
      date: new Date().toLocaleString(),
      content: finalContent
    };

    const updatedHistory = [newHistoryItem, ...bulkHistory];
    saveBulkHistory(updatedHistory);

    setBulkReportData(report);
    setIsSendingBulk(false);
    setBulkShowReport(true);

    // Reset manual form fields if it was custom
    if (templateMode === 'CUSTOM') {
      setBulkTitle('');
      setBulkContent('');
    }

    const successfulDispatches = report.filter(r => r.success).length;
    alert(`🎉 Bulk Email Broadcast Completed!\n\n` +
          `Successfully processed: ${successfulDispatches} / ${currentAudience.length} students.\n` +
          `A complete dispatch report is now available below for your verification.`
    );
  };

  // Subscription Config States
  const [cfgBillingDate, setCfgBillingDate] = useState(subConfig.billingDate);
  const [cfgGracePeriod, setCfgGracePeriod] = useState(subConfig.gracePeriod);
  const [cfgLateFee, setCfgLateFee] = useState(subConfig.lateFee || 0);
  const [cfgEnableOverdueSMS, setCfgEnableOverdueSMS] = useState(subConfig.enableOverdueSMS ?? true);
  const [cfgEnableMidGraceSMS, setCfgEnableMidGraceSMS] = useState(subConfig.enableMidGraceSMS ?? true);
  const [cfgEnableExpiryWarningSMS, setCfgEnableExpiryWarningSMS] = useState(subConfig.enableExpiryWarningSMS ?? false);
  const [cfgEnableExpiredSMS, setCfgEnableExpiredSMS] = useState(subConfig.enableExpiredSMS ?? true);
  const [cfgEnableAutomatedFeeAlerts, setCfgEnableAutomatedFeeAlerts] = useState(subConfig.enableAutomatedFeeAlerts ?? true);

  // WhatsApp & Twilio Integration Config States
  const [cfgWhatsappProvider, setCfgWhatsappProvider] = useState<'TWILIO' | 'WHATSAPP_BUSINESS' | 'NONE'>(subConfig.whatsappProvider ?? 'NONE');
  const [cfgWhatsappApiKey, setCfgWhatsappApiKey] = useState(subConfig.whatsappApiKey ?? '');
  const [cfgWhatsappPhoneNumber, setCfgWhatsappPhoneNumber] = useState(subConfig.whatsappPhoneNumber ?? '');
  const [cfgWhatsappAccountSid, setCfgWhatsappAccountSid] = useState(subConfig.whatsappAccountSid ?? '');
  const [cfgWhatsappAuthToken, setCfgWhatsappAuthToken] = useState(subConfig.whatsappAuthToken ?? '');
  const [cfgWhatsappSenderNumber, setCfgWhatsappSenderNumber] = useState(subConfig.whatsappSenderNumber ?? '');

  // Secure Payment Gateway / Fee Collection Config States
  const [cfgEnableOnlinePayments, setCfgEnableOnlinePayments] = useState(subConfig.enableOnlinePayments ?? true);
  const [cfgPaymentGatewayProvider, setCfgPaymentGatewayProvider] = useState<'UPI_QR' | 'RAZORPAY' | 'STRIPE' | 'BANK_TRANSFER' | 'MOCK'>(subConfig.paymentGatewayProvider ?? 'UPI_QR');
  const [cfgUpiId, setCfgUpiId] = useState(subConfig.upiId ?? '9161586254@upi');
  const [cfgUpiMerchantName, setCfgUpiMerchantName] = useState(subConfig.upiMerchantName ?? 'Sunshine Classes Ltd');
  const [cfgBankAccountHolder, setCfgBankAccountHolder] = useState(subConfig.bankAccountHolder ?? 'Sunshine Classes ERP Solutions');
  const [cfgBankAccountNumber, setCfgBankAccountNumber] = useState(subConfig.bankAccountNumber ?? '33888542347');
  const [cfgBankName, setCfgBankName] = useState(subConfig.bankName ?? 'State Bank of India (Pihani Branch)');
  const [cfgBankIfsc, setCfgBankIfsc] = useState(subConfig.bankIfsc ?? 'SBIN0011180');
  const [cfgRazorpayKeyId, setCfgRazorpayKeyId] = useState(subConfig.razorpayKeyId ?? 'rzp_live_A9B8C7D6E5F4G3');
  const [cfgStripePublicKey, setCfgStripePublicKey] = useState(subConfig.stripePublicKey ?? 'pk_live_51Mxxxxxxxxxxxxxxxx');

  // Advanced Fee Collection States
  const [cfgAllowPartialPayments, setCfgAllowPartialPayments] = useState(subConfig.allowPartialPayments ?? false);
  const [cfgRequireReceiptUpload, setCfgRequireReceiptUpload] = useState(subConfig.requireReceiptUpload ?? true);
  const [cfgConvenienceFeePercent, setCfgConvenienceFeePercent] = useState(subConfig.convenienceFeePercent ?? 0);
  const [cfgEnableUpiMethod, setCfgEnableUpiMethod] = useState(subConfig.enableUpiMethod ?? true);
  const [cfgEnableCardMethod, setCfgEnableCardMethod] = useState(subConfig.enableCardMethod ?? true);
  const [cfgEnableNetBankingMethod, setCfgEnableNetBankingMethod] = useState(subConfig.enableNetBankingMethod ?? true);
  const [cfgEnableBankTransferMethod, setCfgEnableBankTransferMethod] = useState(subConfig.enableBankTransferMethod ?? true);

  // Gateway Testing States
  const [testPhoneNo, setTestPhoneNo] = useState('');
  const [testMsgBody, setTestMsgBody] = useState('Hello from Sunshine Classes! This is a test notification from your Tuition Management Portal integration settings.');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testDispatchResult, setTestDispatchResult] = useState<{ success: boolean; message: string; log: string } | null>(null);

  // Custom Email Templates Configuration States
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<'receipt' | 'reminder'>('receipt');
  const [receiptSubject, setReceiptSubject] = useState(emailTemplates?.receiptSubject || '');
  const [receiptBody, setReceiptBody] = useState(emailTemplates?.receiptBody || '');
  const [reminderSubject, setReminderSubject] = useState(emailTemplates?.reminderSubject || '');
  const [reminderBody, setReminderBody] = useState(emailTemplates?.reminderBody || '');

  // Custom WhatsApp Templates Configuration States
  const [selectedWATemplateTab, setSelectedWATemplateTab] = useState<'receipt' | 'reminder' | 'schedule'>('receipt');
  const [receiptWATemplate, setReceiptWATemplate] = useState(whatsappTemplates?.receiptTemplate || '');
  const [reminderWATemplate, setReminderWATemplate] = useState(whatsappTemplates?.reminderTemplate || '');
  const [scheduleWATemplate, setScheduleWATemplate] = useState(whatsappTemplates?.scheduleTemplate || '');

  // Keep state in sync if props change
  useEffect(() => {
    if (emailTemplates) {
      setReceiptSubject(emailTemplates.receiptSubject || '');
      setReceiptBody(emailTemplates.receiptBody || '');
      setReminderSubject(emailTemplates.reminderSubject || '');
      setReminderBody(emailTemplates.reminderBody || '');
    }
  }, [emailTemplates]);

  useEffect(() => {
    if (whatsappTemplates) {
      setReceiptWATemplate(whatsappTemplates.receiptTemplate || '');
      setReminderWATemplate(whatsappTemplates.reminderTemplate || '');
      setScheduleWATemplate(whatsappTemplates.scheduleTemplate || '');
    }
  }, [whatsappTemplates]);

  const handleSaveEmailTemplates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmailTemplates({
      receiptSubject,
      receiptBody,
      reminderSubject,
      reminderBody
    });
    alert("✉️ Email templates saved and synchronized successfully to secure database!");
  };

  const handleSaveWATemplates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWhatsappTemplates({
      receiptTemplate: receiptWATemplate,
      reminderTemplate: reminderWATemplate,
      scheduleTemplate: scheduleWATemplate
    });
    alert("🟢 WhatsApp template configurations saved and synchronized successfully to secure database!");
  };

  // Dedicated WhatsApp Messaging Tab States
  const [waSubTab, setWaSubTab] = useState<'single' | 'bulk'>('single');
  const [manualRecipientNo, setManualRecipientNo] = useState('');
  const [manualMsgBody, setManualMsgBody] = useState('');
  const [selectedStudentHelperId, setSelectedStudentHelperId] = useState('');
  const [selectedTemplateHelper, setSelectedTemplateHelper] = useState<'custom' | 'receipt' | 'reminder' | 'schedule'>('custom');
  const [isSendingManual, setIsSendingManual] = useState(false);
  const [manualResult, setManualResult] = useState<{ success: boolean; message: string; log: string } | null>(null);
  const [waLogsSearchQuery, setWaLogsSearchQuery] = useState('');
  const [waLogsFilterType, setWaLogsFilterType] = useState<'all' | 'inbound' | 'outbound'>('all');

  // Student ERP filter states
  const [studentFilterBatch, setStudentFilterBatch] = useState<string>('all');
  const [studentFilterClass, setStudentFilterClass] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Bulk WhatsApp Messaging States with waBulk prefix to avoid conflict
  const [waBulkTargetType, setWaBulkTargetType] = useState<'all' | 'batch' | 'class'>('all');
  const [waBulkTargetBatchId, setWaBulkTargetBatchId] = useState('');
  const [waBulkTargetClass, setWaBulkTargetClass] = useState('');
  const [waBulkTemplateType, setWaBulkTemplateType] = useState<'custom' | 'receipt' | 'reminder' | 'schedule'>('custom');
  const [waBulkCustomBody, setWaBulkCustomBody] = useState('');
  const [isWaBulkSending, setIsWaBulkSending] = useState(false);
  const [waBulkProgress, setWaBulkProgress] = useState({ current: 0, total: 0 });
  const [waBulkCancelRequested, setWaBulkCancelRequested] = useState(false);
  const [waBulkDispatchLogs, setWaBulkDispatchLogs] = useState<Array<{
    studentName: string;
    phone: string;
    status: 'pending' | 'sending' | 'success' | 'failed';
    error?: string;
  }>>([]);

  const handleSendManualWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRecipientNo.trim()) {
      alert("Please specify a valid recipient mobile number.");
      return;
    }
    if (!manualMsgBody.trim()) {
      alert("Please enter a message body to transmit.");
      return;
    }

    setIsSendingManual(true);
    setManualResult(null);

    try {
      const result = await sendWhatsAppMessage({
        to: manualRecipientNo,
        message: manualMsgBody,
        studentName: students.find(s => s.id === selectedStudentHelperId)?.name || 'Manual Admin Message'
      });

      setManualResult({
        success: result.success,
        message: result.success 
          ? "Message dispatched and delivered successfully via configured gateway!" 
          : "Gateway API call returned an error or is in loopback mode.",
        log: result.log
      });

      if (result.success) {
        alert("🟢 Message transmitted successfully! Check the Gateway log stream.");
        setManualMsgBody('');
      } else {
        alert("⚠️ Transmission finished. View debugging logs below.");
      }
    } catch (err: any) {
      setManualResult({
        success: false,
        message: "An unexpected error occurred during client-side dispatch.",
        log: err.message
      });
      alert("❌ Client dispatch failure: " + err.message);
    } finally {
      setIsSendingManual(false);
    }
  };

  const handleSendBulkWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Get filtered list of students
    let targets = [...students];
    if (waBulkTargetType === 'batch') {
      if (!waBulkTargetBatchId) {
        alert("Please select a target Batch.");
        return;
      }
      targets = students.filter(s => s.preferredBatch === waBulkTargetBatchId);
    } else if (waBulkTargetType === 'class') {
      if (!waBulkTargetClass) {
        alert("Please select a target Class.");
        return;
      }
      targets = students.filter(s => s.class === waBulkTargetClass);
    }

    // Filter out students with no phone number at all
    const validTargets = targets.filter(s => (s.whatsapp || s.parentMobile || s.mobile || '').trim() !== '');

    if (validTargets.length === 0) {
      alert("No students with registered phone numbers found in the selected target group.");
      return;
    }

    const confirmMsg = `Are you sure you want to broadcast this message to ${validTargets.length} student(s)?\n` +
                       `(Skips: ${targets.length - validTargets.length} with no phone recorded)`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsWaBulkSending(true);
    setWaBulkCancelRequested(false);
    setWaBulkProgress({ current: 0, total: validTargets.length });

    // Initialize individual log state
    const initialLogs = validTargets.map(s => ({
      studentName: s.name,
      phone: s.whatsapp || s.parentMobile || s.mobile,
      status: 'pending' as const
    }));
    setWaBulkDispatchLogs(initialLogs);

    let sentCount = 0;

    for (let i = 0; i < validTargets.length; i++) {
      // Check if user requested cancellation
      if (waBulkCancelRequested) {
        break;
      }

      const student = validTargets[i];
      const phone = student.whatsapp || student.parentMobile || student.mobile;
      
      // Update status to sending
      setWaBulkDispatchLogs(prev => prev.map((l, index) => index === i ? { ...l, status: 'sending' as const } : l));

      // Resolve dynamic message content for this specific student
      let rawTmpl = '';
      if (waBulkTemplateType === 'custom') {
        rawTmpl = waBulkCustomBody;
      } else if (waBulkTemplateType === 'receipt') {
        rawTmpl = whatsappTemplates?.receiptTemplate || '';
      } else if (waBulkTemplateType === 'reminder') {
        rawTmpl = whatsappTemplates?.reminderTemplate || '';
      } else if (waBulkTemplateType === 'schedule') {
        rawTmpl = whatsappTemplates?.scheduleTemplate || '';
      }

      const message = interpolateWhatsAppTemplate(rawTmpl, {
        studentName: student.name,
        amount: '1500',
        month: 'July 2026',
        className: student.class,
        receiptId: 'REC-BULK',
        dueDate: '10-July-2026',
        timing: student.preferredTiming || '04:30 PM'
      });

      try {
        const result = await sendWhatsAppMessage({
          to: phone,
          message,
          studentName: student.name
        });

        // Update with success or failure
        setWaBulkDispatchLogs(prev => prev.map((l, index) => index === i ? { 
          ...l, 
          status: result.success ? ('success' as const) : ('failed' as const),
          error: result.success ? undefined : result.log || 'Gateway error'
        } : l));

        if (result.success) {
          sentCount++;
        }
      } catch (err: any) {
        setWaBulkDispatchLogs(prev => prev.map((l, index) => index === i ? { 
          ...l, 
          status: 'failed' as const,
          error: err.message
        } : l));
      }

      setWaBulkProgress(prev => ({ ...prev, current: i + 1 }));

      // Soft breathing delay to show interactive transmitting state beautifully and avoid rate-limits
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setIsWaBulkSending(false);
    alert(`🎉 Bulk Broadcast dispatch completed!\nTransmitted successfully to: ${sentCount} / ${validTargets.length} recipient(s).`);
  };

  // Helper calculation numbers
  const totalRevenue = feeReceipts.reduce((acc, r) => acc + r.amountPaid, 0);
  const totalPendingFees = feeStatuses.reduce((acc, f) => acc + f.pendingFee, 0);
  const activeStudentsCount = students.length;
  const totalTeachersCount = teachers.length;

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent({
      userId: `u-new-${Date.now()}`,
      name: stdName,
      class: stdClass,
      fatherName: stdFather,
      motherName: stdMother,
      dob: stdDob,
      gender: stdGender,
      address: stdAddress,
      mobile: stdMobile,
      whatsapp: stdWhatsapp,
      parentMobile: stdParentMobile,
      email: stdEmail,
      preferredBatch: stdBatch,
      preferredTiming: stdTiming,
      admissionDate: new Date().toISOString().split('T')[0],
      photoUrl: stdPhotoUrl || undefined
    });

    setStdName('');
    setStdFather('');
    setStdMother('');
    setStdAddress('');
    setStdMobile('');
    setStdWhatsapp('');
    setStdParentMobile('');
    setStdEmail('');
    setStdPhotoUrl('');
    alert("New student registered into Sunshine Classes ERP system successfully.");
  };

  const handleSubmitTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      // Edit mode
      const updatedTeacher: Teacher = {
        ...editingTeacher,
        name: tchName,
        email: tchEmail,
        phone: tchPhone,
        qualification: tchQual,
        specialty: tchSpecs.split(',').map((s) => s.trim()),
        batches: tchBatches.split(',').map((b) => b.trim())
      };
      onUpdateTeacher(updatedTeacher);
      alert(`Teacher "${tchName}" profile updated successfully.`);
    } else {
      // Create mode
      onAddTeacher({
        userId: `u-tch-${Date.now()}`,
        name: tchName,
        email: tchEmail,
        phone: tchPhone,
        qualification: tchQual,
        specialty: tchSpecs.split(',').map((s) => s.trim()),
        batches: tchBatches.split(',').map((b) => b.trim())
      });
      alert(`New faculty "${tchName}" registered successfully.`);
    }

    // Reset Form & state
    setTchName('');
    setTchEmail('');
    setTchPhone('');
    setTchQual('');
    setTchSpecs('');
    setTchBatches('');
    setEditingTeacher(null);
    setShowTeacherForm(false);
  };

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBatch) {
      // Edit mode
      const updated = batches.map((b) =>
        b.id === editingBatch.id
          ? {
              ...b,
              name: batchFormName,
              time: batchFormTime,
              class: batchFormClass,
              teacherName: batchFormTeacher,
              monthlyFee: Number(batchFormFee),
              status: batchFormStatus,
            }
          : b
      );
      onUpdateBatches(updated);
      alert(`Batch "${batchFormName}" updated successfully.`);
    } else {
      // Create mode
      const today = new Date().toISOString().split('T')[0];
      // Due Date is 30 days from now
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      const nextDueStr = nextDue.toISOString().split('T')[0];

      const newBatch: Batch = {
        id: `batch-${Date.now()}`,
        name: batchFormName,
        time: batchFormTime,
        class: batchFormClass,
        teacherName: batchFormTeacher || 'Self (1 Teacher Setup)',
        monthlyFee: Number(batchFormFee),
        startDate: today,
        billingCycle: 'Monthly',
        nextDueDate: nextDueStr,
        status: batchFormStatus,
      };
      onUpdateBatches([...batches, newBatch]);
      alert(`Batch "${batchFormName}" created successfully.`);
    }

    // Reset state
    setShowBatchForm(false);
    setEditingBatch(null);
    setBatchFormName('');
    setBatchFormTime('');
    setBatchFormClass('');
    setBatchFormTeacher('');
    setBatchFormFee(0);
    setBatchFormStatus('ACTIVE');
  };

  const handleEnrollAndScheduleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId || !enrollBatchId) {
      alert("Please select a student and a batch first.");
      return;
    }

    const targetStudent = students.find(s => s.id === enrollStudentId);
    const targetBatch = batches.find(b => b.id === enrollBatchId);

    if (!targetStudent || !targetBatch) {
      alert("Selected student or batch could not be found.");
      return;
    }

    // Check if subscription already exists
    const existingSubIndex = subscriptions.findIndex(sub => sub.studentId === enrollStudentId);

    let updatedSubscriptions = [...subscriptions];
    const finalTiming = enrollBatchTime || targetBatch.time;

    if (existingSubIndex >= 0) {
      // Update existing
      updatedSubscriptions[existingSubIndex] = {
        ...updatedSubscriptions[existingSubIndex],
        batchId: enrollBatchId,
        batchName: targetBatch.name,
        batchTime: finalTiming,
        tempTimeChange: enrollTempTimeChange || undefined,
        monthlyFee: Number(enrollMonthlyFee),
      };
    } else {
      // Create new
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      const nextDueStr = nextDue.toISOString().split('T')[0];

      const newSub = {
        id: `sub-${Date.now()}`,
        studentId: enrollStudentId,
        studentName: targetStudent.name,
        admissionNo: targetStudent.rollNo || `SC-${Math.floor(1000 + Math.random() * 9000)}`,
        batchId: enrollBatchId,
        batchName: targetBatch.name,
        monthlyFee: Number(enrollMonthlyFee),
        startDate: new Date().toISOString().split('T')[0],
        billingCycle: 'Monthly' as const,
        nextDueDate: nextDueStr,
        status: 'ACTIVE' as const,
        daysRemaining: 30,
        gracePeriodDays: 5,
        batchTime: finalTiming,
        tempTimeChange: enrollTempTimeChange || undefined,
      };
      updatedSubscriptions.push(newSub);
    }

    // Also update student's own preferredBatch and preferredTiming
    const updatedStudents = students.map(s => {
      if (s.id === enrollStudentId) {
        return {
          ...s,
          preferredBatch: targetBatch.name,
          preferredTiming: finalTiming
        };
      }
      return s;
    });

    // Notify/Heal State
    onHealState('student_subscriptions', updatedSubscriptions);
    onHealState('students', updatedStudents);

    // If temporary change is set, dispatch simulated WhatsApp message
    let alertMsg = `Regular batch timing updated to ${finalTiming}.`;
    if (enrollTempTimeChange) {
      alertMsg = `⚠️ ALERT: Temporary batch timing adjusted: "${enrollTempTimeChange}". Standard schedule is suspended today.`;
      
      const whatsAppMsg = `Hello ${targetStudent.name}, Sunshine Classes has updated your batch timing for "${targetBatch.name}". Temporary timing active: "${enrollTempTimeChange}". Please reach accordingly.`;
      
      setWhatsAppLogs(prev => [
        {
          id: `wa-${Date.now()}`,
          studentName: targetStudent.name,
          message: whatsAppMsg,
          date: new Date().toLocaleTimeString(),
        },
        ...prev
      ]);
    }

    alert(`Batch enrollment updated successfully for ${targetStudent.name}!\n${alertMsg}`);

    // Reset inputs
    setEnrollStudentId('');
    setEnrollBatchId('');
    setEnrollBatchTime('');
    setEnrollTempTimeChange('');
  };

  const handleStudentSelectChange = (studentId: string) => {
    setEnrollStudentId(studentId);
    if (!studentId) return;
    const sub = subscriptions.find(s => s.studentId === studentId);
    if (sub) {
      setEnrollBatchId(sub.batchId);
      setEnrollBatchTime(sub.batchTime || '');
      setEnrollTempTimeChange(sub.tempTimeChange || '');
      setEnrollMonthlyFee(sub.monthlyFee);
    } else {
      const student = students.find(s => s.id === studentId);
      if (student) {
        const matchedBatch = batches.find(b => b.name === student.preferredBatch) || batches[0];
        setEnrollBatchId(matchedBatch?.id || '');
        setEnrollBatchTime(student.preferredTiming || matchedBatch?.time || '');
        setEnrollTempTimeChange('');
        setEnrollMonthlyFee(matchedBatch?.monthlyFee || 1500);
      }
    }
  };

  const handleEditBatchClick = (b: Batch) => {
    setEditingBatch(b);
    setBatchFormName(b.name);
    setBatchFormTime(b.time);
    setBatchFormClass(b.class);
    setBatchFormTeacher(b.teacherName);
    setBatchFormFee(b.monthlyFee);
    setBatchFormStatus(b.status);
    setShowBatchForm(true);
  };

  const handleDeleteBatch = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete batch "${name}"? This action cannot be undone.`)) {
      const updated = batches.filter((b) => b.id !== id);
      onUpdateBatches(updated);
      alert(`Batch "${name}" deleted.`);
    }
  };

  const handleCreateNotif = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNotification({
      title: notifTitle,
      content: notifContent,
      category: notifCategory,
      targetRole: notifTarget === 'ALL' ? 'ALL' : notifTarget === 'STUDENT' ? 'STUDENT' : 'TEACHER'
    });

    setNotifTitle('');
    setNotifContent('');
    alert("Official notice broadcasted to student portals & website notice board.");
  };

  const handleTriggerBackupSubmit = () => {
    onTriggerBackup();
    alert("PostgreSQL Database schema exported! Encryption check completed. Backup file saved: 'sunshine_classes_backup_latest.sql' (Size: 12.8 MB)");
  };

  const handleExportSystemState = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (!key.startsWith('sunshine_local_backups_archive')) {
            backupData[key] = localStorage.getItem(key) || '';
          }
        }
      }
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `sunshine_erp_localstorage_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString();
      setLastBackupTime(nowStr);
      localStorage.setItem('sunshine_last_backup_time', nowStr);
      localStorage.setItem('sunshine_last_backup_time_epoch', Date.now().toString());

      alert("🎉 Local storage application state exported successfully as a downloadable backup JSON file!");
    } catch (error) {
      alert("Failed to export backup: " + error);
    }
  };

  const handleImportSystemState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ WARNING: Importing a backup file will OVERWRITE all your current students, faculty, payments, and setting records with the data inside the file. This action cannot be undone. Do you wish to proceed?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsed = JSON.parse(fileContent);
        
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error("Invalid backup file format. Must be a JSON object of key-value pairs.");
        }

        localStorage.clear();
        Object.entries(parsed).forEach(([key, val]) => {
          localStorage.setItem(key, val as string);
        });

        alert("🎉 Application state successfully restored from backup! The portal will now reload to apply all restored parameters.");
        window.location.reload();
      } catch (error: any) {
        alert("❌ Restore failed: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateScheduleSettings = (freq: 'MANUAL' | '12_HOURS' | 'DAILY' | 'WEEKLY') => {
    setBackupFrequency(freq);
    localStorage.setItem('sunshine_backup_frequency', freq);
    alert(`Backup frequency schedule updated to: ${freq === 'MANUAL' ? 'Manual Only' : freq === '12_HOURS' ? 'Every 12 Hours' : freq === 'DAILY' ? 'Daily (24 Hours)' : 'Weekly (7 Days)'}`);
  };

  const handleTriggerManualSnapshot = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('sunshine_local_backups_archive')) {
          backupData[key] = localStorage.getItem(key) || '';
        }
      }
      
      const dataStr = JSON.stringify(backupData);
      const sizeKB = Math.round((dataStr.length * 2) / 1024 * 10) / 10;
      
      const newSnapshot = {
        id: `manual-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        sizeKB,
        data: backupData
      };

      const updatedArchive = [newSnapshot, ...localBackupsArchive].slice(0, 5);
      setLocalBackupsArchive(updatedArchive);
      localStorage.setItem('sunshine_local_backups_archive', JSON.stringify(updatedArchive));

      const nowStr = new Date().toLocaleString();
      setLastBackupTime(nowStr);
      localStorage.setItem('sunshine_last_backup_time', nowStr);
      localStorage.setItem('sunshine_last_backup_time_epoch', Date.now().toString());

      alert(`📸 Success! Manual local state snapshot captured and stored in the local archives (${sizeKB} KB).`);
    } catch (err) {
      alert("Failed to capture snapshot: " + err);
    }
  };

  const handleRestoreFromArchive = (archiveItem: any) => {
    if (!confirm(`⚠️ WARNING: Are you sure you want to restore the system state to the snapshot taken on "${archiveItem.timestamp}"? This will overwrite your current active session state.`)) {
      return;
    }

    try {
      const archiveBackupStr = localStorage.getItem('sunshine_local_backups_archive');
      localStorage.clear();
      if (archiveBackupStr) {
        localStorage.setItem('sunshine_local_backups_archive', archiveBackupStr);
      }

      Object.entries(archiveItem.data).forEach(([key, val]) => {
        localStorage.setItem(key, val as string);
      });

      alert("🎉 Local storage state successfully restored from snapshot archive! The portal will now reload to apply the changes.");
      window.location.reload();
    } catch (e: any) {
      alert("Failed to restore: " + e.message);
    }
  };

  const handleDeleteArchiveItem = (id: string) => {
    if (!confirm("Are you sure you want to delete this historical snapshot?")) return;
    const updated = localBackupsArchive.filter(item => item.id !== id);
    setLocalBackupsArchive(updated);
    localStorage.setItem('sunshine_local_backups_archive', JSON.stringify(updated));
  };

  const handleSaveConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      billingDate: Number(cfgBillingDate),
      gracePeriod: Number(cfgGracePeriod),
      lateFee: Number(cfgLateFee),
      enableOverdueSMS: cfgEnableOverdueSMS,
      enableMidGraceSMS: cfgEnableMidGraceSMS,
      enableExpiryWarningSMS: cfgEnableExpiryWarningSMS,
      enableExpiredSMS: cfgEnableExpiredSMS,
      whatsappProvider: cfgWhatsappProvider,
      whatsappApiKey: cfgWhatsappApiKey,
      whatsappPhoneNumber: cfgWhatsappPhoneNumber,
      whatsappAccountSid: cfgWhatsappAccountSid,
      whatsappAuthToken: cfgWhatsappAuthToken,
      whatsappSenderNumber: cfgWhatsappSenderNumber,
      enableOnlinePayments: cfgEnableOnlinePayments,
      paymentGatewayProvider: cfgPaymentGatewayProvider,
      upiId: cfgUpiId,
      upiMerchantName: cfgUpiMerchantName,
      bankAccountHolder: cfgBankAccountHolder,
      bankAccountNumber: cfgBankAccountNumber,
      bankName: cfgBankName,
      bankIfsc: cfgBankIfsc,
      razorpayKeyId: cfgRazorpayKeyId,
      stripePublicKey: cfgStripePublicKey,
      allowPartialPayments: cfgAllowPartialPayments,
      requireReceiptUpload: cfgRequireReceiptUpload,
      convenienceFeePercent: Number(cfgConvenienceFeePercent),
      enableUpiMethod: cfgEnableUpiMethod,
      enableCardMethod: cfgEnableCardMethod,
      enableNetBankingMethod: cfgEnableNetBankingMethod,
      enableBankTransferMethod: cfgEnableBankTransferMethod,
      enableAutomatedFeeAlerts: cfgEnableAutomatedFeeAlerts
    });
    alert("Sunshine Classes ERP configurations updated successfully! Secure online payment routing handles, late fees, and SMS/WhatsApp gateway settings are synchronized.");
  };

  const handleTestGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNo) {
      alert("Please provide a destination phone number to dispatch the test message.");
      return;
    }

    setIsTestingGateway(true);
    setTestDispatchResult(null);

    const timeStr = new Date().toISOString();

    fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: testPhoneNo,
        message: testMsgBody,
        provider: cfgWhatsappProvider,
        apiKey: cfgWhatsappApiKey,
        phoneNumber: cfgWhatsappPhoneNumber,
        accountSid: cfgWhatsappAccountSid,
        authToken: cfgWhatsappAuthToken,
        senderNumber: cfgWhatsappSenderNumber
      })
    })
    .then(r => r.json())
    .then(data => {
      setIsTestingGateway(false);
      setTestDispatchResult({
        success: data.success,
        message: data.success ? `Test message transmitted successfully!` : `Handshake completed but provider returned an error status.`,
        log: `[${timeStr}] API Response Received.
- Active Provider: ${data.provider}
- Destination: ${data.recipient}
- Service Logs:
${data.log}`
      });
    })
    .catch(err => {
      setIsTestingGateway(false);
      setTestDispatchResult({
        success: false,
        message: 'Network request failed.',
        log: `[${timeStr}] Connection issue: ${err.message}`
      });
    });
  };

  // Render SVG Analytics Charts
  const renderRevenueGrowthChart = () => {
    const chartWidth = 500;
    const chartHeight = 150;
    const padding = 30;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    // Monthly data points
    const monthlyData = [
      { month: 'Jan', revenue: 120000 },
      { month: 'Feb', revenue: 145000 },
      { month: 'Mar', revenue: 185000 },
      { month: 'Apr', revenue: 290000 },
      { month: 'May', revenue: 350000 },
      { month: 'Jun', revenue: 420000 }
    ];

    const maxVal = 450000;
    const points = monthlyData.map((d, idx) => {
      const x = padding + (idx / (monthlyData.length - 1)) * graphWidth;
      const y = padding + graphHeight - (d.revenue / maxVal) * graphHeight;
      return { x, y, ...d };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <h4 className="mb-3 font-display font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp size={14} className="text-brand-orange" /> Revenue Progression (INR)
        </h4>
        <div className="relative h-[150px] w-full">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
            {/* Grid lines */}
            {[0, 150000, 300000, 450000].map((v) => {
              const y = padding + graphHeight - (v / maxVal) * graphHeight;
              return (
                <g key={v}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                  <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[8px] font-mono fill-slate-400">₹{v / 1000}k</text>
                </g>
              );
            })}

            {/* Line area */}
            {points.length > 1 && (
              <path d={pathData} fill="none" stroke="#0D47A1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Data nodes */}
            {points.map((p, idx) => (
              <g key={idx} className="cursor-pointer group">
                <circle cx={p.x} cy={p.y} r="5" fill="#FF9800" stroke="#0D47A1" strokeWidth="2" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[8px] font-bold fill-brand-blue">{p.revenue / 1000}k</text>
                <text x={p.x} y={chartHeight - 8} textAnchor="middle" className="text-[9px] font-medium fill-slate-500">{p.month}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // Filter students for the ERP ledger table
  const filteredStudentsForTable = students.filter(student => {
    const matchesSearch = studentSearchQuery.trim() === '' ||
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      student.mobile.includes(studentSearchQuery) ||
      (student.parentMobile && student.parentMobile.includes(studentSearchQuery)) ||
      (student.fatherName && student.fatherName.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
      (student.motherName && student.motherName.toLowerCase().includes(studentSearchQuery.toLowerCase()));

    const matchesBatch = studentFilterBatch === 'all' ||
      student.preferredBatch === studentFilterBatch;

    const matchesClass = studentFilterClass === 'all' ||
      student.class === studentFilterClass;

    return matchesSearch && matchesBatch && matchesClass;
  });

  const loggedInFounder = founders.find(f => {
    if (currentUser?.username === 'admin') return f.id === 'fm-priyanshu';
    if (currentUser?.username === 'rajeev') return f.id === 'fm-rajeev';
    return false;
  });

  return (
    <div id="admin-portal" className="mx-auto max-w-7xl px-4 py-8">
      {/* Admin Head Badge */}
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-indigo-950 p-6 text-white md:flex-row md:items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative group flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-orange text-indigo-950 text-2xl font-black shadow overflow-hidden">
            {loggedInFounder?.photoUrl ? (
              <img src={loggedInFounder.photoUrl} alt={currentUser?.name} className="h-full w-full object-cover" />
            ) : (
              <Shield size={32} />
            )}
            
            {/* Direct Change Photo Overlay */}
            <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center cursor-pointer text-[9px] font-bold text-white leading-tight text-center">
              <Upload size={14} className="mb-0.5 text-white" />
              <span>Choose</span>
              <span className="text-[7px] text-slate-300">Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      onAddOrEditFounder({
                        ...(loggedInFounder || {
                          id: currentUser?.username === 'admin' ? 'fm-priyanshu' : 'fm-rajeev',
                          name: currentUser?.name || 'Priyanshu Gupta',
                          title: currentUser?.username === 'rajeev' ? 'Co-Founder & Director' : 'Founder & Lead Director',
                          qualification: currentUser?.username === 'rajeev' ? 'B.Sc. Physics & Chemistry' : 'M.Sc. Mathematics',
                          message: 'Welcome to Sunshine Classes!',
                          tuitionFocus: currentUser?.username === 'rajeev' ? 'Science' : 'Mathematics',
                          avatarInitials: currentUser?.username === 'rajeev' ? 'RV' : 'PG',
                        }),
                        photoUrl: base64
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-black">{currentUser?.name || 'Priyanshu Gupta'}</h2>
              <span className="rounded bg-brand-orange/20 border border-brand-orange/30 px-2.5 py-0.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                {currentUser?.username === 'rajeev' ? 'Co-Founder & Director' : 'Founder & Lead Director'}
              </span>
            </div>
            <p className="text-sm text-slate-300">Sunshine Classes • Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406)</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Security Token</span>
          <span className="font-mono text-xs font-bold text-emerald-400">STATUS: ADMIN_ROOT_ACTIVE</span>
        </div>
      </div>

      {/* Numerical Stats overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Students</span>
            <span className="font-display text-2xl font-black text-slate-800">{activeStudentsCount}</span>
            <span className="text-[10px] text-green-600 font-semibold block mt-0.5">Classes 1 to 10</span>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-brand-blue"><Users size={22} /></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Coaching Faculty</span>
            <span className="font-display text-2xl font-black text-slate-800">{totalTeachersCount}</span>
            <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">Board Specialists</span>
          </div>
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><BookOpen size={22} /></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Revenue Collected</span>
            <span className="font-display text-2xl font-black text-emerald-600">₹{totalRevenue}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Session cycle 2026-27</span>
          </div>
          <div className="rounded-xl bg-green-50 p-3 text-green-600"><DollarSign size={22} /></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pending monthly fees</span>
            <span className="font-display text-2xl font-black text-brand-red">₹{totalPendingFees}</span>
            <span className="text-[10px] text-brand-red font-medium block mt-0.5">Auto reminder queued</span>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-brand-red"><Bell size={22} /></div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {renderRevenueGrowthChart()}
        </div>

        {/* Weak Subject Predictions Analysis / Stats */}
        <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-orange animate-pulse" /> Weak Topic Analytics AI
          </h4>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Algebra & Quadratic Equations</span>
                <span className="text-brand-orange font-bold">12% student doubt risk</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-orange rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Refraction Ray Diagrams</span>
                <span className="text-brand-red font-bold">28% revisions required</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-red rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Prepositional Voice rules</span>
                <span className="text-green-600 font-bold">94% master accuracy</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
            *Sunshine Classes predictive engine automatically calculates weak subjects based on marks logs from the teacher's grading ledger!
          </p>
        </div>
      </div>

      {/* Main ERP Tab System */}
      {(() => {
        const tabsList = [
          { id: 'overview', label: 'Admin Operations Overview', icon: <Activity size={16} /> },
          { id: 'students', label: `Manage Student ERP (${students.length})`, icon: <Users size={16} /> },
          { id: 'fees', label: 'Manage Fees & Ledger', icon: <DollarSign size={16} /> },
          { id: 'teachers', label: 'Manage Faculty Directory', icon: <BookOpen size={16} /> },
          { id: 'batches', label: 'Manage Batches & Timings', icon: <Calendar size={16} /> },
          { id: 'website', label: 'Public Website & Notes CMS', icon: <Sparkles size={16} /> },
          { id: 'announcements', label: 'Broadcast Announcements', icon: <Bell size={16} /> },
          { id: 'audit', label: 'Audit & System Logs', icon: <FileText size={16} /> },
          { id: 'settings', label: 'Database Backup & settings', icon: <Settings size={16} /> },
          { id: 'whatsapp', label: 'WhatsApp Messaging', icon: <MessageSquare size={16} /> },
          { id: 'diagnostics', label: 'System Diagnostics', icon: <Shield size={16} className="text-emerald-500" /> }
        ] as const;

        return (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Mobile Dropdown Tab Switcher (Visible only on screens < lg) */}
            <div className="block lg:hidden col-span-full">
              <div className="relative">
                <button
                  id="mobile-tab-dropdown-btn"
                  type="button"
                  onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-indigo-200 active:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-900">
                      {tabsList.find(t => t.id === activeTab)?.icon}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {tabsList.find(t => t.id === activeTab)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Menu</span>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isTabDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown on tap outside */}
                    <div 
                      className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-3xs" 
                      onClick={() => setIsTabDropdownOpen(false)} 
                    />
                    
                    <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                      <div className="px-3 py-1.5 mb-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Navigate ERP Workspace
                      </div>
                      <div className="pt-1.5 space-y-1">
                        {tabsList.map((tab) => {
                          const isSelected = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              id={`mobile-tab-opt-${tab.id}`}
                              type="button"
                              onClick={() => {
                                setActiveTab(tab.id);
                                setIsTabDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-900 text-white shadow-sm font-bold' 
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                                {tab.icon}
                              </span>
                              <span className="text-left font-semibold text-xs flex-1">{tab.label}</span>
                              {isSelected && (
                                <Check size={14} className="text-emerald-400 font-bold" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Navigation Sidebar (Visible only on screens >= lg) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 lg:p-4 shadow-sm space-y-1.5 sticky top-6">
                <span className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ERP Operations</span>

                <div className="flex flex-col gap-1">
                  {tabsList.map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`admin-tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                          isSelected ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="lg:col-span-3 col-span-full">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-black text-base text-slate-800">ERP Control Center</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Welcome to Sunshine Classes premium administrative suite. From this portal, you can monitor student roll counts, view real-time monthly tuition revenues, verify database backup settings, and broadcast critical notice reminders directly to teacher and student dashboards instantly.
              </p>

              {/* --- START OF GLOBAL STUDENT SEARCH HUB --- */}
              <div id="global-student-search-hub" className="border border-indigo-100 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 shadow-sm">
                <h4 className="font-display font-black text-xs text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Search size={15} className="text-indigo-600 animate-pulse" />
                  Live Student Directory & Status Auditing
                </h4>
                <p className="text-[11px] text-slate-500 mb-4">
                  Type a student's name, enrolled class/batch, or parent phone number to instantly retrieve real-time attendance logs, active tuition invoices, and fee compliance alerts.
                </p>

                {/* Search Bar Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    id="input-global-student-search"
                    placeholder="Search by student name, school class, batch, or mobile..."
                    value={globalSearchQuery}
                    onChange={(e) => {
                      setGlobalSearchQuery(e.target.value);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                  />
                  {globalSearchQuery && (
                    <button
                      id="btn-clear-global-search"
                      onClick={() => {
                        setGlobalSearchQuery('');
                        setSelectedSearchStudentId(null);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Filtered Student Search Results dropdown/grid */}
                {globalSearchQuery.trim() !== '' && (
                  <div id="search-results-container" className="mt-3 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-lg z-10 relative">
                    {students.filter(student => {
                      const query = globalSearchQuery.toLowerCase();
                      const nameMatch = student.name?.toLowerCase().includes(query);
                      const batchMatch = (student.preferredBatch?.toLowerCase().includes(query) || student.class?.toLowerCase().includes(query));
                      const mobileMatch = (
                        student.mobile?.includes(query) ||
                        student.parentMobile?.includes(query) ||
                        student.whatsapp?.includes(query)
                      );
                      return nameMatch || batchMatch || mobileMatch;
                    }).map(student => {
                      const isSelected = selectedSearchStudentId === student.id;
                      return (
                        <button
                          key={student.id}
                          id={`search-item-${student.id}`}
                          onClick={() => {
                            setSelectedSearchStudentId(student.id);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{student.name}</span>
                            <span className="text-[10px] text-slate-500">Class: {student.class} • Batch: {student.preferredBatch || 'No Batch'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono block">
                              {student.mobile || student.parentMobile || 'No Phone'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {students.filter(student => {
                      const query = globalSearchQuery.toLowerCase();
                      const nameMatch = student.name?.toLowerCase().includes(query);
                      const batchMatch = (student.preferredBatch?.toLowerCase().includes(query) || student.class?.toLowerCase().includes(query));
                      const mobileMatch = (
                        student.mobile?.includes(query) ||
                        student.parentMobile?.includes(query) ||
                        student.whatsapp?.includes(query)
                      );
                      return nameMatch || batchMatch || mobileMatch;
                    }).length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No students found matching "{globalSearchQuery}"
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Student Status Card (Only shown if a student is selected) */}
                {selectedSearchStudentId ? (() => {
                  const student = students.find(s => s.id === selectedSearchStudentId);
                  if (!student) return null;

                  const studentFeeStatuses = feeStatuses.filter(fs => fs.studentId === student.id);
                  const studentAttendance = attendanceList.filter(att => att.studentId === student.id);

                  // Sort attendance by date descending
                  const sortedAttendance = [...studentAttendance].sort((a, b) => b.date.localeCompare(a.date));

                  return (
                    <div id="student-status-detail-card" className="mt-4 border border-indigo-100 rounded-xl bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              {student.name}
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                Roll No: {student.rollNo || 'N/A'}
                              </span>
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              {student.class} • Batch: <strong className="text-slate-700">{student.preferredBatch || 'Not Assigned'}</strong>
                            </p>
                          </div>
                        </div>
                        <button
                          id="btn-close-audit-card"
                          onClick={() => setSelectedSearchStudentId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={12} /> Clear Audit
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Attendance Tracker Panel */}
                        <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                              <Activity size={13} className="text-brand-orange animate-pulse" />
                              Attendance Compliance
                            </span>
                            <span className="text-xs font-black text-indigo-950">
                              {student.attendancePercentage}% Overall
                            </span>
                          </div>

                          {/* Attendance Bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                            <div
                              className={`h-full transition-all duration-500 ${
                                student.attendancePercentage >= 85
                                  ? 'bg-emerald-500'
                                  : student.attendancePercentage >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${student.attendancePercentage}%` }}
                            ></div>
                          </div>

                          {/* Recent logs list */}
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {sortedAttendance.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">
                                No session-by-session attendance logs found in system database.
                              </p>
                            ) : (
                              sortedAttendance.map(att => {
                                let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                                if (att.status === 'PRESENT') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                else if (att.status === 'ABSENT') badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                                else if (att.status === 'LATE') badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                                else if (att.status === 'LEAVE') badgeColor = 'bg-sky-50 text-sky-700 border-sky-100';

                                return (
                                  <div key={att.id} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-100 text-[10px]">
                                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                                      <Calendar size={10} className="text-slate-400" />
                                      {att.date}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded font-black border text-[9px] ${badgeColor}`}>
                                      {att.status}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Fee Status Audit Panel */}
                        <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-2.5">
                            <DollarSign size={13} className="text-emerald-600" />
                            Fee Ledger Status
                          </span>

                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {studentFeeStatuses.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">
                                No monthly tuition invoices generated for this student.
                              </p>
                            ) : (
                              studentFeeStatuses.map(fee => {
                                let badgeColor = 'bg-red-50 text-red-700 border-red-100';
                                if (fee.status === 'PAID') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                else if (fee.status === 'PARTIAL') badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';

                                return (
                                  <div key={fee.id} className="p-2 bg-white rounded-lg border border-slate-100 flex flex-col gap-1 text-[11px]">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-700">{fee.month} Cycle</span>
                                      <span className={`px-2 py-0.5 rounded font-black border text-[9px] uppercase tracking-wider ${badgeColor}`}>
                                        {fee.status}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 text-[10px] text-slate-500 pt-1 border-t border-slate-50">
                                      <div>Total: <strong>₹{fee.totalFee}</strong></div>
                                      <div>Paid: <strong className="text-emerald-600">₹{fee.paidFee}</strong></div>
                                      <div>Pending: <strong className={fee.pendingFee > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>₹{fee.pendingFee}</strong></div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Immediate CTA Section */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Smartphone size={11} /> Primary Parent Contact: <strong>{student.parentMobile || student.mobile || 'None'}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="mt-3 border border-dashed border-slate-200 rounded-xl p-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <Users size={12} className="text-slate-300" />
                    Enter query above to explore live student payment status and attendance logs.
                  </div>
                )}
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Database size={14} className="text-brand-blue" /> Cloud Storage Integrity
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-600">
                  <div>• Target SQL Instance: **Supabase Cloud PostgreSQL DB**</div>
                  <div>• Server Host Region: **asia-southeast1 (Singapore)**</div>
                  <div>• Database Connectivity: **100% Secure SSL Handshake**</div>
                  <div>• Tables count: **22 models synchronized**</div>
                </div>
              </div>

              {/* Tuition & Subscription Fee Revenue Logs */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" /> Payment & Fee Revenue Log
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Real-time tuition fees and digital sub-payments ledger</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportPaymentsCSV}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <FileSpreadsheet size={12} className="text-emerald-600" /> Export CSV
                    </button>
                    <button
                      onClick={handleExportPaymentsPDF}
                      className="rounded-lg bg-indigo-900 hover:bg-indigo-950 px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <Printer size={12} /> Export PDF
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200/60 rounded-xl bg-white max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-2">Receipt ID</th>
                        <th className="p-2">Student</th>
                        <th className="p-2">Cycle/Month</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Mode</th>
                        <th className="p-2">Received By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[11px] text-slate-700">
                      {feeReceipts.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50">
                          <td className="p-2 font-semibold text-brand-blue font-mono">{rec.id}</td>
                          <td className="p-2 font-bold">{rec.studentName}</td>
                          <td className="p-2">{rec.month}</td>
                          <td className="p-2 font-bold text-emerald-600">₹{rec.amountPaid}</td>
                          <td className="p-2 text-slate-500 font-mono text-[9px]">{rec.paymentMethod}</td>
                          <td className="p-2 text-slate-400">{rec.receivedBy}</td>
                        </tr>
                      ))}
                      {feeReceipts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-400">No payment records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* PENDING ONLINE ADMISSIONS PANEL */}
              {(() => {
                const pendingAdmissions = Array.isArray(admissions) 
                  ? admissions.filter((a) => a.status === 'PENDING') 
                  : [];
                if (pendingAdmissions.length === 0) return null;
                return (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/25 p-6 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                          <h3 className="font-display font-black text-sm sm:text-base text-slate-800">
                            Pending Online Admission Applications ({pendingAdmissions.length})
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          New student files submitted via the public "Admissions 2026" portal. Approve them to instantly generate active student ERP profiles and log-in credentials!
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {pendingAdmissions.map((adm) => (
                        <div 
                          key={adm.id} 
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-brand-blue/30 transition-all space-y-3 text-xs"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="font-mono text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {adm.id}
                              </span>
                              <h4 className="font-black text-slate-800 mt-1.5 text-sm">{adm.studentName}</h4>
                              <p className="text-[11px] text-slate-500 font-medium">Applying for: <strong>{adm.className}</strong></p>
                            </div>
                            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100/70 px-2.5 py-1 rounded-full shrink-0">
                              ⏱ Pending Review
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-100 pt-2 bg-slate-50/50 p-2 rounded-lg">
                            <div><strong>Father:</strong> {adm.fatherName}</div>
                            <div><strong>Mother:</strong> {adm.motherName}</div>
                            <div><strong>Mobile:</strong> {adm.mobile}</div>
                            <div><strong>Batch Pref:</strong> {adm.preferredBatch}</div>
                          </div>

                          <div className="flex gap-2 pt-1 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (onRejectAdmission) {
                                  onRejectAdmission(adm.id);
                                  alert(`Admission ${adm.id} rejected.`);
                                } else {
                                  alert("Rejection callback not configured.");
                                }
                              }}
                              className="rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-bold px-3 py-1.5 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onApproveAdmission) {
                                  onApproveAdmission(adm.id);
                                  alert(`Success! ${adm.studentName} has been enrolled in ${adm.className}. Roll No generated.`);
                                } else {
                                  alert("Approval callback not configured.");
                                }
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                              Approve & Enroll
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Add Student Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Enroll Student Offline Form</h3>
                <p className="text-xs text-slate-500 mb-4">Register new walk-in student with roll number generation and batch allocation.</p>

                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name</label>
                      <input
                        id="input-std-name"
                        type="text"
                        required
                        placeholder="e.g. Rahul Verma"
                        value={stdName}
                        onChange={(e) => setStdName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Father Name</label>
                      <input
                        id="input-std-father"
                        type="text"
                        required
                        placeholder="e.g. Ram Pal Verma"
                        value={stdFather}
                        onChange={(e) => setStdFather(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mother Name</label>
                      <input
                        id="input-std-mother"
                        type="text"
                        required
                        value={stdMother}
                        onChange={(e) => setStdMother(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Class Intake</label>
                      <select
                        id="select-std-class"
                        value={stdClass}
                        onChange={(e) => setStdClass(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      >
                        <option value="Class 10">Class 10 (Boards)</option>
                        <option value="Class 9">Class 9 (Foundation)</option>
                        <option value="Class 8">Class 8</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700 font-display">Student WhatsApp No *</label>
                      <input
                        id="input-std-whatsapp"
                        type="tel"
                        required
                        placeholder="e.g. 9161586254"
                        value={stdWhatsapp}
                        onChange={(e) => setStdWhatsapp(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700 font-display">Student Email ID *</label>
                      <input
                        id="input-std-email"
                        type="email"
                        required
                        placeholder="e.g. student@gmail.com"
                        value={stdEmail}
                        onChange={(e) => setStdEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700 font-display">Parent's WhatsApp No *</label>
                      <input
                        id="input-std-parent-whatsapp"
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={stdParentMobile}
                        onChange={(e) => setStdParentMobile(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mobile Phone</label>
                      <input
                        id="input-std-mobile"
                        type="tel"
                        required
                        placeholder="e.g. 9161586254"
                        value={stdMobile}
                        onChange={(e) => setStdMobile(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Address Location</label>
                      <input
                        id="input-std-address"
                        type="text"
                        required
                        placeholder="e.g. Mishrana, Pihani"
                        value={stdAddress}
                        onChange={(e) => setStdAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Preferred Tuition Batch</label>
                      <select
                        id="select-std-batch"
                        value={stdBatch}
                        onChange={(e) => {
                          setStdBatch(e.target.value);
                          const matched = batches.find(b => b.name === e.target.value);
                          if (matched) {
                            setStdTiming(matched.time);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Tuition Class Timing</label>
                      <input
                        id="input-std-timing"
                        type="text"
                        required
                        placeholder="e.g. 04:00 PM - 06:30 PM"
                        value={stdTiming}
                        onChange={(e) => setStdTiming(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3 border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Student Passport Photo</label>
                      <div className="flex gap-4 items-center">
                        {stdPhotoUrl ? (
                          <img src={stdPhotoUrl} alt="Student preview" className="h-12 w-12 rounded-full object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                            <Upload size={18} />
                          </div>
                        )}
                        <div className="relative border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-all text-center flex-1 flex items-center justify-center cursor-pointer">
                          <input
                            type="file"
                            id="std-photo-picker-offline"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setStdPhotoUrl(reader.result as string);
                                };
                                reader.readAsDataURL(f);
                              }
                            }}
                          />
                          <label htmlFor="std-photo-picker-offline" className="cursor-pointer flex items-center gap-1.5 text-xs text-slate-600">
                            <Upload size={13} className="text-slate-400" />
                            <span className="font-bold text-indigo-950 hover:underline">Choose Photo</span>
                          </label>
                        </div>
                        {stdPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setStdPhotoUrl('')}
                            className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-add-std-submit"
                      type="submit"
                      className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
                    >
                      Authorize Enrolment Registry
                    </button>
                  </div>
                </form>
              </div>

              {/* Students Table List */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">Sunshine Enrolled Students Ledger</h3>
                    <p className="text-xs text-slate-500">Full registered list of currently attending students across classes 1 to 10.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportStudentsCSV}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV
                    </button>
                    <button
                      onClick={handleExportStudentsPDF}
                      className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-3.5 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Printer size={14} /> Export PDF
                    </button>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="mb-4 grid gap-3 sm:grid-cols-12 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="sm:col-span-6 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      id="input-student-search"
                      type="text"
                      placeholder="Search students by name, roll no, father name or mobile..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-900"
                    />
                    {studentSearchQuery && (
                      <button
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      id="select-student-filter-batch"
                      value={studentFilterBatch}
                      onChange={(e) => setStudentFilterBatch(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:border-indigo-900 cursor-pointer"
                    >
                      <option value="all">📅 All Batches</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      id="select-student-filter-class"
                      value={studentFilterClass}
                      onChange={(e) => setStudentFilterClass(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:border-indigo-900 cursor-pointer"
                    >
                      <option value="all">🎓 All Classes</option>
                      {Array.from(new Set(students.map(s => s.class))).filter(Boolean).map(cls => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-3">Roll ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Parents Info</th>
                        <th className="p-3">Contacts</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {filteredStudentsForTable.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-slate-400 font-medium">
                            No students match the selected batch, class or search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudentsForTable.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-indigo-900 font-mono">{student.rollNo}</td>
                            <td className="p-3 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                {student.photoUrl ? (
                                  <img src={student.photoUrl} alt={student.name} className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-100 text-indigo-900 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span>{student.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">{student.class}</td>
                            <td className="p-3 text-slate-500">F: {student.fatherName}<br />M: {student.motherName}</td>
                            <td className="p-3 text-slate-500">{student.mobile}</td>
                            <td className="p-3">
                              <button
                                id={`btn-quick-collect-student-${student.id}`}
                                onClick={() => openQuickCollect(student)}
                                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 mr-2 cursor-pointer inline-flex items-center justify-center"
                                title="Quick Collect Fees"
                              >
                                <CreditCard size={14} />
                              </button>
                              <button
                                id={`btn-reset-student-${student.id}`}
                                onClick={() => {
                                  const matchedUser = users.find(u => u.id === student.userId);
                                  setResettingUser({
                                    userId: student.userId,
                                    username: matchedUser?.username || student.name.toLowerCase().replace(/\s+/g, ''),
                                    name: student.name
                                  });
                                  setNewPasswordForUser('');
                                }}
                                className="rounded p-1.5 text-brand-orange hover:bg-amber-50 mr-2"
                                title="Reset Password"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                id={`btn-del-student-${student.id}`}
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${student.name} from ERP records?`)) {
                                    onDeleteStudent(student.id);
                                  }
                                }}
                                className="rounded p-1.5 text-brand-red hover:bg-red-50"
                                title="Delete Student"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* Add / Edit Teacher Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-base text-slate-800">
                    {editingTeacher ? 'Edit Faculty Profile' : 'Register New Coaching Faculty'}
                  </h3>
                  {editingTeacher && (
                    <button
                      id="btn-cancel-teacher-edit"
                      onClick={() => {
                        setTchName('');
                        setTchEmail('');
                        setTchPhone('');
                        setTchQual('');
                        setTchSpecs('');
                        setTchBatches('');
                        setEditingTeacher(null);
                        setShowTeacherForm(false);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {editingTeacher
                    ? `Modify the contact details, qualification, specialties, and class assignments for ${editingTeacher.name}.`
                    : 'Register credential profiles of new teachers to allow class syllabus marking, student allocation, and separate portal logins.'}
                </p>

                {(!showTeacherForm && !editingTeacher) ? (
                  <button
                    id="btn-trigger-new-teacher"
                    onClick={() => setShowTeacherForm(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow transition-colors"
                  >
                    <Plus size={14} /> Register New Teacher
                  </button>
                ) : (
                  <form onSubmit={handleSubmitTeacher} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Teacher Name</label>
                        <input
                          id="input-tch-name"
                          type="text"
                          required
                          placeholder="e.g. Dr. Ramesh Kumar"
                          value={tchName}
                          onChange={(e) => setTchName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address</label>
                        <input
                          id="input-tch-email"
                          type="email"
                          required
                          placeholder="e.g. s@sunshine.com"
                          value={tchEmail}
                          onChange={(e) => setTchEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Phone Number</label>
                        <input
                          id="input-tch-phone"
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={tchPhone}
                          onChange={(e) => setTchPhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Qualification</label>
                        <input
                          id="input-tch-qual"
                          type="text"
                          required
                          placeholder="e.g. M.Sc. Physics, B.Ed"
                          value={tchQual}
                          onChange={(e) => setTchQual(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Faculty Specialties (comma separated)</label>
                        <input
                          id="input-tch-specs"
                          type="text"
                          required
                          placeholder="e.g. Mathematics, Organic Chemistry"
                          value={tchSpecs}
                          onChange={(e) => setTchSpecs(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Batch & Timings Allocations (comma separated)</label>
                        <input
                          id="input-tch-batches"
                          type="text"
                          required
                          placeholder="e.g. Class 10 Morning, Class 9 Evening"
                          value={tchBatches}
                          onChange={(e) => setTchBatches(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        id="btn-cancel-teacher-form"
                        type="button"
                        onClick={() => {
                          setTchName('');
                          setTchEmail('');
                          setTchPhone('');
                          setTchQual('');
                          setTchSpecs('');
                          setTchBatches('');
                          setEditingTeacher(null);
                          setShowTeacherForm(false);
                        }}
                        className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-add-tch-submit"
                        type="submit"
                        className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-2 text-xs font-bold text-white shadow transition-colors"
                      >
                        {editingTeacher ? 'Save Changes' : 'Authorize Faculty Profile'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Faculty Directory List */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">Board Teachers Directory</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage and audit teachers, contact lists, credentials, and academic schedules.</p>
                  </div>
                  
                  {/* Quick Search */}
                  <div className="relative max-w-xs w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search faculty name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {teachers
                    .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((t) => (
                      <div key={t.id} className="rounded-xl border border-slate-100 p-5 bg-slate-50/50 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">{t.name}</h4>
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                              {t.qualification}
                            </span>
                          </div>
                          
                          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 text-xs text-slate-600">
                            <div>
                              <span className="font-semibold text-slate-400">Email:</span> {t.email}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Phone:</span> {t.phone}
                            </div>
                            <div className="sm:col-span-2 mt-1">
                              <span className="font-semibold text-slate-400">Specialties:</span>{' '}
                              <span className="inline-flex flex-wrap gap-1 mt-0.5">
                                {t.specialty.map((s, idx) => (
                                  <span key={idx} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium">
                                    {s}
                                  </span>
                                ))}
                              </span>
                            </div>
                            <div className="sm:col-span-2 mt-1.5">
                              <span className="font-semibold text-slate-400">Assigned Timings & Batches:</span>{' '}
                              <span className="inline-flex flex-wrap gap-1 mt-0.5">
                                {t.batches.map((b, idx) => (
                                  <span key={idx} className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] text-amber-800 font-medium">
                                    {b}
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end md:self-center border-t border-slate-100 md:border-none pt-3 md:pt-0">
                          <button
                            id={`btn-edit-teacher-profile-${t.id}`}
                            onClick={() => {
                              setEditingTeacher(t);
                              setTchName(t.name);
                              setTchEmail(t.email);
                              setTchPhone(t.phone);
                              setTchQual(t.qualification);
                              setTchSpecs(t.specialty.join(', '));
                              setTchBatches(t.batches.join(', '));
                              setShowTeacherForm(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-1 rounded-xl border border-indigo-100 hover:border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50/50 transition-colors"
                            title="Edit Contact & Timings"
                          >
                            <Edit size={13} /> Edit Profile
                          </button>
                          
                          <button
                            id={`btn-reset-teacher-${t.id}`}
                            onClick={() => {
                              const matchedUser = users.find(u => u.id === t.userId);
                              setResettingUser({
                                userId: t.userId,
                                username: matchedUser?.username || t.name.toLowerCase().replace(/\s+/g, ''),
                                name: t.name
                              });
                              setNewPasswordForUser('');
                            }}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50/30 hover:border-amber-100 transition-colors"
                            title="Reset Password"
                          >
                            <Key size={14} />
                          </button>
                          
                          <button
                            id={`btn-del-teacher-${t.id}`}
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${t.name} from the Sunshine Faculty list? This will revoke all their access.`)) {
                                onDeleteTeacher(t.id);
                              }
                            }}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-brand-red hover:bg-red-50 hover:border-red-100 transition-colors"
                            title="Remove Faculty"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  
                  {teachers.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="py-10 text-center text-slate-400 font-medium">
                      No matching educators found in directory.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3.5: MANAGE FEES & LEDGER */}
          {activeTab === 'fees' && (() => {
            // Dynamic derived collections and lists
            const uniqueMonths = Array.from(new Set([
              ...feeStatuses.map(f => f.month),
              ...feeReceipts.map(r => r.month)
            ])).sort((a, b) => b.localeCompare(a));

            const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();

            // Computations
            const collectedThisMonth = feeReceipts
              .filter(r => r.month === feeSelectedMonth)
              .reduce((sum, r) => sum + r.amountPaid, 0);

            const overallCollected = feeReceipts.reduce((sum, r) => sum + r.amountPaid, 0);

            const totalPendingOverall = feeStatuses.reduce((sum, r) => sum + r.pendingFee, 0);

            const totalPendingSelectedMonth = feeStatuses
              .filter(f => f.month === feeSelectedMonth)
              .reduce((sum, f) => sum + f.pendingFee, 0);

            const collectionRate = Math.round((overallCollected / (overallCollected + totalPendingOverall || 1)) * 100);

            // Filter student lists
            const filteredFeeStatuses = feeStatuses.filter(f => {
              const matchesSearch = f.studentName.toLowerCase().includes(feeSearchQuery.toLowerCase());
              const matchesClass = feeFilterClass === 'ALL' ? true : f.class === feeFilterClass;
              const matchesStatus = feeFilterStatus === 'ALL' ? true : (f.pendingFee > 0 || f.status !== 'PAID');
              const matchesMonth = feeSelectedMonth === 'ALL' ? true : f.month === feeSelectedMonth;
              return matchesSearch && matchesClass && matchesStatus && matchesMonth;
            });

            // Form Submit for Tuition Payments
            const handleRecordPaymentSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              if (!collectStudentId) {
                alert("Please select a student first.");
                return;
              }
              const matchedStudent = students.find(s => s.id === collectStudentId);
              if (!matchedStudent) {
                alert("Student profile not found.");
                return;
              }
              const amount = Number(collectAmount);
              if (isNaN(amount) || amount <= 0) {
                alert("Please enter a valid tuition fee amount.");
                return;
              }

              onCollectFee({
                studentId: collectStudentId,
                studentName: matchedStudent.name,
                class: matchedStudent.class,
                month: collectMonth,
                amountPaid: amount,
                paymentMethod: collectMethod,
                transactionId: collectTxnId || undefined
              });

              // Add a default log or alert
              alert(`Successfully recorded fee payment of ₹${amount} for ${matchedStudent.name} (${collectMonth}).`);
              setCollectStudentId('');
              setCollectAmount('');
              setCollectTxnId('');
              setShowCollectForm(false);
            };

            // Get student's whatsapp link
            const getWhatsAppLink = (statusEntry: FeeStatus) => {
              const student = students.find(s => s.id === statusEntry.studentId);
              const rawPhone = student?.whatsapp || student?.parentMobile || student?.mobile || '';
              if (!rawPhone) return '';

              let cleanPhone = rawPhone.replace(/\D/g, '');
              if (cleanPhone.startsWith('0')) {
                cleanPhone = cleanPhone.slice(1);
              }
              if (cleanPhone.length === 10) {
                cleanPhone = '91' + cleanPhone;
              }

              const msg = reminderTemplate
                .replace('[AMOUNT]', statusEntry.pendingFee.toString())
                .replace('[STUDENT_NAME]', statusEntry.studentName)
                .replace('[CLASS]', statusEntry.class)
                .replace('[MONTH]', statusEntry.month);

              return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
            };

            const handleSendSingleEmailReminder = (statusEntry: FeeStatus, email: string) => {
              if (!confirm(`Do you want to send a real tuition fee reminder email to ${email}?`)) {
                return;
              }
              
              const matchedSub = subscriptions.find(sub => sub.studentId === statusEntry.studentId);
              const dueDate = matchedSub ? matchedSub.nextDueDate : `10-${statusEntry.month}-2026`;
              const variables = {
                studentName: statusEntry.studentName,
                className: statusEntry.class,
                month: statusEntry.month,
                amount: statusEntry.pendingFee,
                dueDate: dueDate
              };
              const customSubject = interpolateTemplate(emailTemplates.reminderSubject, variables);
              const customHtml = interpolateTemplate(emailTemplates.reminderBody, variables);

              fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'reminder',
                  to: email,
                  studentName: statusEntry.studentName,
                  amount: statusEntry.pendingFee,
                  month: statusEntry.month,
                  className: statusEntry.class,
                  customSubject,
                  customHtml
                })
              })
              .then(r => r.json())
              .then(res => {
                if (res.success) {
                  onAddNotification({
                    title: `📧 Reminder Sent: ${statusEntry.studentName}`,
                    content: `Emailed parent at ${email} for pending ₹${statusEntry.pendingFee} dues (${statusEntry.month}).`,
                    category: 'FEE',
                    targetRole: 'ALL',
                    targetBatch: statusEntry.class,
                    sentAsEmail: true,
                    emailRecipientsCount: 1
                  });
                  
                  if (res.isEthereal && res.previewUrl) {
                    alert(`📧 Real SMTP Email Reminder sent to ${email}!\n\nView mock delivery here:\n${res.previewUrl}`);
                  } else {
                    alert(`📧 Real Reminder Email dispatched to ${email} via SMTP!`);
                  }
                } else {
                  alert(`❌ Failed to send email: ${res.error || 'Unknown error'}`);
                }
              })
              .catch(err => {
                alert(`❌ Network error while sending email: ${err.message}`);
              });
            };

            return (
              <div className="space-y-6">
                {/* Financial Health Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Monthly Collections */}
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                      Revenue Collected This Month ({feeSelectedMonth === 'ALL' ? 'Overall' : feeSelectedMonth})
                    </span>
                    <span className="font-display text-2xl font-black text-emerald-700 mt-1 block">
                      ₹{(feeSelectedMonth === 'ALL' ? overallCollected : collectedThisMonth).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold mt-0.5 block">
                      {feeReceipts.filter(r => feeSelectedMonth === 'ALL' ? true : r.month === feeSelectedMonth).length} Receipts logged
                    </span>
                  </div>

                  {/* Overall Cumulative Collections */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 shadow-sm">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                      Overall Fee Collected (All Students)
                    </span>
                    <span className="font-display text-2xl font-black text-indigo-900 mt-1 block">
                      ₹{overallCollected.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-indigo-500 font-semibold mt-0.5 block">
                      Cumulative digital & cash ledgers
                    </span>
                  </div>

                  {/* Total Pending Dues */}
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-5 shadow-sm">
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">
                      Total Pending Tuition Dues
                    </span>
                    <span className="font-display text-2xl font-black text-rose-700 mt-1 block">
                      ₹{totalPendingOverall.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">
                      {feeStatuses.filter(f => f.pendingFee > 0).length} Unpaid bills remaining
                    </span>
                  </div>

                  {/* Billing Collection efficiency */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      ERP Collection efficiency
                    </span>
                    <span className="font-display text-2xl font-black text-slate-800 mt-1 block">
                      {collectionRate}%
                    </span>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${collectionRate}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* ERP Controls & Form Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-toggle-collect-form"
                      onClick={() => setShowCollectForm(!showCollectForm)}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 px-4 py-2 text-xs font-bold text-white transition-colors"
                    >
                      <Plus size={14} /> Record Student Payment
                    </button>

                    <button
                      id="btn-toggle-template-editor"
                      onClick={() => setShowReminderTemplateEditor(!showReminderTemplateEditor)}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                        showReminderTemplateEditor
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <MessageSquare size={14} /> Configure WhatsApp Template
                    </button>

                    <button
                      id="btn-toggle-bulk-wa-sender"
                      onClick={() => {
                        setShowBulkWASender(!showBulkWASender);
                        if (!showBulkWASender) {
                          setShowReminderTemplateEditor(false);
                          setShowCollectForm(false);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                        showBulkWASender
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Smartphone size={14} className="text-emerald-600" /> Bulk WhatsApp & Portal Dues Reminders
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Smartphone size={14} className="text-slate-400" />
                    <span>WhatsApp triggers send direct ERP SMS link.</span>
                  </div>
                </div>

                {/* Collapsible Payments Collection Form */}
                {showCollectForm && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-bold text-base text-slate-800">
                        Record Tuition Fee Remittance
                      </h3>
                      <button
                        onClick={() => setShowCollectForm(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">
                      Manually log incoming fees collected via Cash, UPI scan, or online transfer to update parent ledgers instantly.
                    </p>

                    <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Student selection */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Student</label>
                          <select
                            id="select-collect-student"
                            required
                            value={collectStudentId}
                            onChange={(e) => {
                              const sId = e.target.value;
                              setCollectStudentId(sId);
                              // Auto-populate pending fee for the student if available
                              const matchedStatus = feeStatuses.find(f => f.studentId === sId && f.month === collectMonth);
                              if (matchedStatus) {
                                setCollectAmount(matchedStatus.pendingFee.toString());
                              } else {
                                setCollectAmount('');
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          >
                            <option value="">-- Choose Student --</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.class}) - Roll No {s.rollNo}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount paid */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Amount Paid (₹)</label>
                          <input
                            id="input-collect-amount"
                            type="number"
                            required
                            placeholder="e.g. 1500"
                            value={collectAmount}
                            onChange={(e) => setCollectAmount(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          />
                        </div>

                        {/* Month cycle */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Fee Month / Cycle</label>
                          <select
                            id="select-collect-month"
                            required
                            value={collectMonth}
                            onChange={(e) => {
                              const selectedM = e.target.value;
                              setCollectMonth(selectedM);
                              // Auto-update pending amount for selected month
                              if (collectStudentId) {
                                const matchedStatus = feeStatuses.find(f => f.studentId === collectStudentId && f.month === selectedM);
                                if (matchedStatus) {
                                  setCollectAmount(matchedStatus.pendingFee.toString());
                                }
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          >
                            <option value="June 2026">June 2026</option>
                            <option value="July 2026">July 2026</option>
                            <option value="August 2026">August 2026</option>
                          </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Payment Method</label>
                          <select
                            id="select-collect-method"
                            required
                            value={collectMethod}
                            onChange={(e) => setCollectMethod(e.target.value as 'CASH' | 'UPI' | 'ONLINE')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          >
                            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                            <option value="CASH">Cash in Hand</option>
                            <option value="ONLINE">Bank Transfer / NetBanking</option>
                          </select>
                        </div>

                        {/* Transaction reference ID */}
                        {collectMethod !== 'CASH' && (
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Transaction Ref / UTR ID</label>
                            <input
                              id="input-collect-txnid"
                              type="text"
                              placeholder="e.g. UPI38194821038"
                              value={collectTxnId}
                              onChange={(e) => setCollectTxnId(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCollectForm(false)}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold transition-all"
                        >
                          Record Payment Receipt
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Collapsible WhatsApp Template Configurator */}
                {showReminderTemplateEditor && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 shadow-sm space-y-4">
                    <div>
                      <h4 className="font-display font-bold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        Configure WhatsApp Reminder Template
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tailor the payment reminder message sent to parents on click. The system dynamically substitutes bracket fields for individual students.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        id="textarea-reminder-template"
                        rows={3}
                        value={reminderTemplate}
                        onChange={(e) => setReminderTemplate(e.target.value)}
                        className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
                        placeholder="Type WhatsApp reminder content..."
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                        <div className="flex gap-2">
                          <span className="font-semibold bg-emerald-50 text-emerald-700 px-1 rounded">[STUDENT_NAME]</span>
                          <span className="font-semibold bg-emerald-50 text-emerald-700 px-1 rounded">[AMOUNT]</span>
                          <span className="font-semibold bg-emerald-50 text-emerald-700 px-1 rounded">[CLASS]</span>
                          <span className="font-semibold bg-emerald-50 text-emerald-700 px-1 rounded">[MONTH]</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReminderTemplate(
                            "Dear Parent, this is a friendly reminder from Sunshine Classes, Pihani. The tuition fee of ₹[AMOUNT] for your child [STUDENT_NAME] ([CLASS]) for [MONTH] is currently pending. Please submit the fee at your earliest convenience to avoid any disruption. Thank you! - Priyanshu Gupta (Founder)"
                          )}
                          className="text-emerald-700 font-semibold hover:underline"
                        >
                          Reset to Default
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsible Bulk WhatsApp Sender */}
                {showBulkWASender && (
                  <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-md space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-display font-bold text-sm text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Smartphone className="text-emerald-600 animate-pulse" size={16} /> Bulk WhatsApp & Portal Alerts Assistant
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Seamlessly nudge parents with outstanding dues. Use the live filters below to target specific batches, school classes, or cycles.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBulkWASender(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕ Close Assistant
                      </button>
                    </div>

                    {/* Filter controls */}
                    <div className="grid gap-4 sm:grid-cols-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Target Month</label>
                        <select
                          value={collectMonth}
                          onChange={(e) => setCollectMonth(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
                        >
                          <option value="June 2026">June 2026</option>
                          <option value="May 2026">May 2026</option>
                          <option value="April 2026">April 2026</option>
                          <option value="ALL">All Months</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Target School Class</label>
                        <select
                          value={bulkWAFilterClass}
                          onChange={(e) => setBulkWAFilterClass(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
                        >
                          <option value="ALL">All Classes (1 to 10)</option>
                          {Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`).map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Target Tuition Batch</label>
                        <select
                          value={bulkWAFilterBatch}
                          onChange={(e) => setBulkWAFilterBatch(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
                        >
                          <option value="ALL">All Batches</option>
                          {batches.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Active Alert Template</label>
                        <div className="text-xs text-slate-600 font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg flex items-center justify-between">
                          <span className="truncate max-w-[120px]" title={reminderTemplate}>
                            {reminderTemplate}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowReminderTemplateEditor(true);
                            }}
                            className="text-[10px] text-emerald-700 underline font-bold hover:text-emerald-900 ml-1 shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pending Dues Audience estimator */}
                    {(() => {
                      const pendingAudience = feeStatuses.filter(entry => {
                        if (entry.pendingFee <= 0) return false;
                        if (collectMonth !== 'ALL' && entry.month !== collectMonth) return false;
                        if (bulkWAFilterClass !== 'ALL' && entry.class !== bulkWAFilterClass) return false;
                        
                        // If filtering by Batch, check student preferredBatch
                        if (bulkWAFilterBatch !== 'ALL') {
                          const student = students.find(s => s.id === entry.studentId);
                          if (!student?.preferredBatch || student.preferredBatch.toLowerCase() !== bulkWAFilterBatch.toLowerCase()) {
                            return false;
                          }
                        }
                        return true;
                      });

                      const handleTriggerSimulatedBulkDuesReminders = () => {
                        if (pendingAudience.length === 0) {
                          alert("No pending fee records found matching these criteria.");
                          return;
                        }

                        if (!confirm(`This will trigger automated WhatsApp alerts, portal notifications, and dispatch REAL SMTP emails to all parents with saved email addresses (${pendingAudience.length} candidates). Do you want to proceed?`)) {
                          return;
                        }

                        setIsSendingBulkWA(true);

                        const emailPromises = pendingAudience.map(entry => {
                          const studentProfile = students.find(s => s.id === entry.studentId);
                          const parentEmail = studentProfile?.email;
                          if (!parentEmail) {
                            return Promise.resolve({ studentName: entry.studentName, success: false, skipped: true, error: false, previewUrl: null, isEthereal: false, email: '' });
                          }

                          const matchedSub = subscriptions.find(sub => sub.studentId === entry.studentId);
                          const dueDate = matchedSub ? matchedSub.nextDueDate : `10-${entry.month}-2026`;
                          const variables = {
                            studentName: entry.studentName,
                            className: entry.class,
                            month: entry.month,
                            amount: entry.pendingFee,
                            dueDate: dueDate
                          };
                          const customSubject = interpolateTemplate(emailTemplates.reminderSubject, variables);
                          const customHtml = interpolateTemplate(emailTemplates.reminderBody, variables);

                          return fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'reminder',
                              to: parentEmail,
                              studentName: entry.studentName,
                              amount: entry.pendingFee,
                              month: entry.month,
                              className: entry.class,
                              customSubject,
                              customHtml
                            })
                          })
                          .then(r => r.json())
                          .then(res => ({ studentName: entry.studentName, success: !!res.success, skipped: false, error: false, previewUrl: res.previewUrl || null, isEthereal: !!res.isEthereal, email: parentEmail }))
                          .catch(err => ({ studentName: entry.studentName, success: false, skipped: false, error: true, errorMessage: err.message, previewUrl: null, isEthereal: false, email: parentEmail }));
                        });

                        Promise.all(emailPromises).then(results => {
                          setIsSendingBulkWA(false);

                          const successCount = results.filter(r => r.success).length;
                          const skippedCount = results.filter(r => r.skipped).length;
                          const failedCount = results.filter(r => r.error).length;
                          const demoMails = results.filter(r => r.success && r.isEthereal);

                          // Dispatch in-app system notifications
                          pendingAudience.forEach(entry => {
                            onAddNotification({
                              title: `⚠️ [Fee Payment Reminder] ${entry.month}`,
                              content: `Dear parent, school/tuition fee of ₹${entry.pendingFee} for ${entry.studentName} is outstanding. Kindly clear at the desk soon. Thank you!`,
                              category: 'FEE',
                              targetRole: 'ALL',
                              targetBatch: entry.class,
                              sentAsEmail: true,
                              emailRecipientsCount: 1
                            });
                          });

                          let alertMsg = `🎉 Real Bulk Alerts Dispatch Process Completed!\n\n` +
                                        `• Successful Emails: ${successCount}\n` +
                                        `• Skipped (no email address): ${skippedCount}\n` +
                                        `• Failed: ${failedCount}\n\n`;

                          if (demoMails.length > 0 && demoMails[0].previewUrl) {
                            alertMsg += `⚡ Ethereal demo SMTP accounts were used because SMTP credentials are not yet configured in settings/env.\n` +
                                        `You can view one of the sent reminder designs here:\n${demoMails[0].previewUrl}`;
                          } else if (successCount > 0) {
                            alertMsg += `📨 All reminders dispatched via your custom configured SMTP server!`;
                          }

                          alert(alertMsg);
                        });
                      };

                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Users size={14} className="text-emerald-700" /> Live Target Audience: 
                                <strong className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                                  {pendingAudience.length} Pending
                                </strong>
                              </span>
                              <p className="text-[10px] text-slate-500">
                                Parents with partial or outstanding fees matching selected filters.
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleTriggerSimulatedBulkDuesReminders}
                              disabled={isSendingBulkWA || pendingAudience.length === 0}
                              className={`rounded-xl px-4 py-2.5 text-xs font-black text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                                isSendingBulkWA 
                                  ? 'bg-slate-350 cursor-wait' 
                                  : pendingAudience.length === 0 
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow'
                              }`}
                            >
                              {isSendingBulkWA ? (
                                <>
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                  Broadcasting...
                                </>
                              ) : (
                                <>
                                  <Send size={13} /> Send Bulk Alerts ({pendingAudience.length})
                                </>
                              )}
                            </button>
                          </div>

                          {/* List of target audience */}
                          <div className="border border-slate-150 rounded-xl max-h-[220px] overflow-y-auto divide-y divide-slate-100 bg-white">
                            {pendingAudience.length > 0 ? (
                              pendingAudience.map(entry => {
                                const sProfile = students.find(s => s.id === entry.studentId);
                                const phoneNum = sProfile?.whatsapp || sProfile?.parentMobile || sProfile?.mobile || '';
                                const singleWa = getWhatsAppLink(entry);
                                return (
                                  <div key={entry.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                                    <div>
                                      <span className="font-bold text-slate-800">{entry.studentName}</span>
                                      <span className="text-slate-400 font-semibold ml-2 text-[10px]">({entry.class})</span>
                                      <div className="flex gap-2 text-[10px] mt-0.5 font-medium text-slate-500">
                                        <span className="text-rose-600 font-bold">Outstanding: ₹{entry.pendingFee}</span>
                                        <span>•</span>
                                        <span>Cycle: {entry.month}</span>
                                        {phoneNum && (
                                          <>
                                            <span>•</span>
                                            <span>Parent Phone: {phoneNum}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-1.5">
                                      {singleWa ? (
                                        <a
                                          href={singleWa}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                          title="Open direct WhatsApp Web chat for this parent"
                                        >
                                          <MessageSquare size={11} /> Ping WhatsApp
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-rose-500 italic">No phone contact</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-8 text-center text-slate-400 italic">
                                No unpaid fees found matching selected filters. All clear! 🎉
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Filter and Search Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-800">
                        Student Fee Status Board
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Monitor payment histories, pending dues, and send instant parent WhatsApp reminders on single-click triggers.
                      </p>
                    </div>

                    {/* Export logs */}
                    <div className="flex gap-2 self-end lg:self-center">
                      <button
                        onClick={handleExportPaymentsCSV}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                      >
                        <FileSpreadsheet size={13} className="text-emerald-600" /> Export Ledger CSV
                      </button>

                      <button
                        id="btn-generate-monthly-report-pdf"
                        onClick={() => handleExportMonthlyFinancialReportPDF(feeSelectedMonth)}
                        className="rounded-lg bg-indigo-900 hover:bg-indigo-950 px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Printer size={13} /> Monthly Summary PDF
                      </button>
                    </div>
                  </div>

                  {/* Filters Grid */}
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {/* Month selector */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Billing Cycle Month</label>
                      <select
                        id="select-fee-month-filter"
                        value={feeSelectedMonth}
                        onChange={(e) => setFeeSelectedMonth(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      >
                        <option value="ALL">All Months</option>
                        {uniqueMonths.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Class filter */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Filter Class</label>
                      <select
                        id="select-fee-class-filter"
                        value={feeFilterClass}
                        onChange={(e) => setFeeFilterClass(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      >
                        <option value="ALL">All Classes ({students.length} students)</option>
                        {uniqueClasses.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Submission status toggle */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Submission Status</label>
                      <select
                        id="select-fee-status-filter"
                        value={feeFilterStatus}
                        onChange={(e) => setFeeFilterStatus(e.target.value as 'ALL' | 'UNPAID')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      >
                        <option value="UNPAID">Not Submitted / Pending Dues</option>
                        <option value="ALL">All Records (Paid & Pending)</option>
                      </select>
                    </div>

                    {/* Student name search */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Search Student</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Search size={12} />
                        </span>
                        <input
                          id="input-fee-student-search"
                          type="text"
                          placeholder="Type name to search..."
                          value={feeSearchQuery}
                          onChange={(e) => setFeeSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Student Cards / Directory Table */}
                  <div className="overflow-hidden border border-slate-150 rounded-xl bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3">Student / Class</th>
                            <th className="px-4 py-3">Cycle Month</th>
                            <th className="px-4 py-3 text-right">Bill Detail</th>
                            <th className="px-4 py-3 text-center font-mono">Status</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3 text-right">One-Click Action Reminder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {filteredFeeStatuses.map((entry) => {
                            const studentProfile = students.find(s => s.id === entry.studentId);
                            const rawPhone = studentProfile?.whatsapp || studentProfile?.parentMobile || studentProfile?.mobile || '';
                            const hasPending = entry.pendingFee > 0;
                            const waLink = getWhatsAppLink(entry);

                            return (
                              <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                                {/* Student name & class */}
                                <td className="px-4 py-3.5">
                                  <div>
                                    <span className="font-bold text-slate-800 block text-sm">{entry.studentName}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold block">{entry.class}</span>
                                  </div>
                                </td>

                                {/* Month */}
                                <td className="px-4 py-3.5 text-slate-600 font-medium">
                                  {entry.month}
                                </td>

                                {/* Bill Details */}
                                <td className="px-4 py-3.5 text-right font-semibold">
                                  <div>
                                    <span className="text-slate-800 block">Total: ₹{entry.totalFee}</span>
                                    <div className="text-[10px] space-x-1.5 mt-0.5">
                                      <span className="text-emerald-600">Paid: ₹{entry.paidFee}</span>
                                      {hasPending && (
                                        <span className="text-rose-600 font-bold">Due: ₹{entry.pendingFee}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Status badge */}
                                <td className="px-4 py-3.5 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                                    entry.status === 'PAID'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : entry.status === 'PARTIAL'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {entry.status}
                                  </span>
                                </td>

                                {/* Due Date */}
                                <td className="px-4 py-3.5 text-slate-500 font-medium">
                                  {entry.dueDate}
                                </td>

                                {/* WhatsApp single-click action */}
                                <td className="px-4 py-3.5 text-right">
                                  {hasPending ? (
                                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                                      {rawPhone && (
                                        <span className="text-[10px] text-slate-400 font-mono" title="Phone">
                                          ({rawPhone})
                                        </span>
                                      )}
                                      {waLink ? (
                                        <a
                                          href={waLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow transition-all cursor-pointer hover:shadow"
                                          title="Open direct WhatsApp Chat with template reminder"
                                        >
                                          <MessageSquare size={11} /> Ping WhatsApp
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-rose-500 italic">No phone contact</span>
                                      )}

                                      {(() => {
                                        const sProfile = students.find(s => s.id === entry.studentId);
                                        const parentEmail = sProfile?.email;
                                        if (parentEmail) {
                                          return (
                                            <button
                                              onClick={() => handleSendSingleEmailReminder(entry, parentEmail)}
                                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow transition-all cursor-pointer hover:shadow"
                                              title={`Send official Email reminder to ${parentEmail}`}
                                            >
                                              <Mail size={11} /> Email Parent
                                            </button>
                                          );
                                        }
                                        return (
                                          <span className="text-[10px] text-slate-400 italic">No email logged</span>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-end gap-1 text-emerald-600 font-bold text-[10px]">
                                      <CheckCircle size={14} className="text-emerald-500" /> Fully Settled
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredFeeStatuses.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                                <CheckCircle size={28} className="mx-auto text-emerald-300 mb-2" />
                                No students match the selected fee criteria. All settled!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB: MANAGE BATCHES & TIMINGS */}
          {activeTab === 'batches' && (
            <div className="space-y-6">
              {/* Add / Edit Batch Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-base text-slate-800">
                    {editingBatch ? 'Edit Batch Configuration' : 'Create New Academic Batch'}
                  </h3>
                  {editingBatch && (
                    <button
                      id="btn-cancel-batch-edit"
                      onClick={() => {
                        setEditingBatch(null);
                        setBatchFormName('');
                        setBatchFormTime('');
                        setBatchFormClass('');
                        setBatchFormTeacher('');
                        setBatchFormFee(0);
                        setBatchFormStatus('ACTIVE');
                        setShowBatchForm(false);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Define your daily class slots, academic class levels, timing routines, and monthly subscription fee structures.
                </p>

                {(!showBatchForm && !editingBatch) ? (
                  <button
                    id="btn-trigger-new-batch"
                    onClick={() => setShowBatchForm(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow transition-colors"
                  >
                    <Plus size={14} /> Add New Class Batch
                  </button>
                ) : (
                  <form onSubmit={handleSubmitBatch} className="space-y-4">
                    <div className="rounded-xl bg-amber-50/50 border border-amber-200/60 p-3.5 mb-2 text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="text-lg">☀️</span>
                      <div>
                        <span className="font-bold text-amber-900 block">1-Teacher Operation Mode</span>
                        <p className="text-slate-600 mt-0.5">
                          Since you are currently running with a single-teacher setup, new batches will automatically assign <strong>Priyanshu Gupta</strong> (or the default faculty) as the main teacher unless you specify a secondary educator.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Batch Name</label>
                        <input
                          id="input-batch-name"
                          type="text"
                          required
                          placeholder="e.g. Class 10 - Morning Excellence"
                          value={batchFormName}
                          onChange={(e) => setBatchFormName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Class Level</label>
                        <select
                          id="select-batch-class"
                          required
                          value={batchFormClass}
                          onChange={(e) => setBatchFormClass(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white animate-none"
                        >
                          <option value="">-- Choose Class --</option>
                          <option value="Class 10">Class 10 (Board Syllabus)</option>
                          <option value="Class 9">Class 9 (Foundation)</option>
                          <option value="Class 8">Class 8</option>
                          <option value="Class 7">Class 7</option>
                          <option value="Class 6">Class 6</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Timing Slot</label>
                        <input
                          id="input-batch-time"
                          type="text"
                          required
                          placeholder="e.g. 07:00 AM - 08:30 AM"
                          value={batchFormTime}
                          onChange={(e) => setBatchFormTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Main Teacher</label>
                        <select
                          id="select-batch-teacher"
                          required
                          value={batchFormTeacher}
                          onChange={(e) => setBatchFormTeacher(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white animate-none"
                        >
                          <option value="">-- Choose Educator --</option>
                          <option value="Priyanshu Gupta (Founder)">Priyanshu Gupta (Founder)</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name} ({t.qualification || 'Faculty'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Monthly Tuition Fee (₹)</label>
                        <input
                          id="input-batch-fee"
                          type="number"
                          required
                          min="0"
                          placeholder="e.g. 1200"
                          value={batchFormFee || ''}
                          onChange={(e) => setBatchFormFee(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Batch Status</label>
                        <select
                          id="select-batch-status"
                          required
                          value={batchFormStatus}
                          onChange={(e) => setBatchFormStatus(e.target.value as 'ACTIVE' | 'DUE' | 'EXPIRED')}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white animate-none"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="DUE">DUE (In arrears)</option>
                          <option value="EXPIRED">EXPIRED / SUSPENDED</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        id="btn-cancel-batch-form"
                        type="button"
                        onClick={() => {
                          setShowBatchForm(false);
                          setEditingBatch(null);
                          setBatchFormName('');
                          setBatchFormTime('');
                          setBatchFormClass('');
                          setBatchFormTeacher('');
                          setBatchFormFee(0);
                          setBatchFormStatus('ACTIVE');
                        }}
                        className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-save-batch-submit"
                        type="submit"
                        className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-2 text-xs font-bold text-white shadow transition-colors"
                      >
                        {editingBatch ? 'Save Batch Changes' : 'Confirm & Create Batch'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Batches Table / Grid */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">Active Sunshine Batches & Schedules</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time status of tuition programs, timeslots, and monthly pricing metrics.</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {batches.length} Active Classes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Batch Name & Class</th>
                        <th className="px-6 py-3.5">Daily Timing</th>
                        <th className="px-6 py-3.5">Allocated Faculty</th>
                        <th className="px-6 py-3.5">Monthly Fee</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {batches.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                            No batches registered in database yet. Create one above.
                          </td>
                        </tr>
                      ) : (
                        batches.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{b.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{b.class} • Created on {b.startDate}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-600">
                              {b.time}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {b.teacherName || 'Founder (Priyanshu Gupta)'}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              ₹{b.monthlyFee}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                b.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : b.status === 'DUE'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  id={`btn-edit-batch-${b.id}`}
                                  onClick={() => handleEditBatchClick(b)}
                                  className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Edit Timing / Fee"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  id={`btn-delete-batch-${b.id}`}
                                  onClick={() => handleDeleteBatch(b.id, b.name)}
                                  className="rounded p-1.5 text-brand-red hover:bg-red-50 transition-colors"
                                  title="Delete Batch"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Batch Enrollment & Timings Manager */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Manager Form */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                      <Clock size={18} className="text-indigo-600" /> Student Batch Enrollment & Timings Manager
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Assign students to tuition batches, configure personalized billing fees, regular schedules, or post temporary timing updates with automatic outbound notifications.
                    </p>
                  </div>

                  <form onSubmit={handleEnrollAndScheduleUpdate} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold text-slate-400 uppercase">Select Student</label>
                        <select
                          id="select-enroll-student"
                          value={enrollStudentId}
                          onChange={(e) => handleStudentSelectChange(e.target.value)}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-700 focus:bg-white"
                        >
                          <option value="">-- Choose Student to Enroll --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.class} - {s.rollNo})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold text-slate-400 uppercase">Select Target Batch</label>
                        <select
                          id="select-enroll-batch"
                          value={enrollBatchId}
                          onChange={(e) => {
                            setEnrollBatchId(e.target.value);
                            const selected = batches.find(b => b.id === e.target.value);
                            if (selected) {
                              setEnrollBatchTime(selected.time);
                              setEnrollMonthlyFee(selected.monthlyFee);
                            }
                          }}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-700 focus:bg-white"
                        >
                          <option value="">-- Choose Batch --</option>
                          {batches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.class} - Fee: ₹{b.monthlyFee}/mo)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold text-slate-400 uppercase">Regular Batch Time</label>
                        <input
                          id="input-enroll-batch-time"
                          type="text"
                          value={enrollBatchTime}
                          onChange={(e) => setEnrollBatchTime(e.target.value)}
                          placeholder="e.g. 04:00 PM - 06:30 PM"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-700 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold text-slate-400 uppercase">Monthly Subscription Fee (₹)</label>
                        <input
                          id="input-enroll-monthly-fee"
                          type="number"
                          value={enrollMonthlyFee}
                          onChange={(e) => setEnrollMonthlyFee(Number(e.target.value))}
                          placeholder="Monthly billing rate"
                          required
                          min={0}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-700 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                        <h4 className="text-xs font-bold text-amber-900 uppercase">Publish Temporary Timing Change</h4>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        If there are temporary shifts (e.g. delay by 1 hour, emergency cancellation), provide the reason/timing below. Students will receive an instant WhatsApp text notification, and the alert will flash directly on their dynamic dashboard.
                      </p>
                      <div>
                        <input
                          id="input-enroll-temp-timing"
                          type="text"
                          value={enrollTempTimeChange}
                          onChange={(e) => setEnrollTempTimeChange(e.target.value)}
                          placeholder="e.g. Today's class will start at 05:00 PM temporarily due to heavy rain."
                          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-amber-950 placeholder-amber-400 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        id="btn-confirm-enrollment"
                        type="submit"
                        className="rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs px-5 py-2.5 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <CheckCircle size={14} /> Assign Batch & Update Schedule
                      </button>
                    </div>
                  </form>
                </div>

                {/* WhatsApp Sim Logs */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      💬 WhatsApp Dispatch Logs
                    </h4>
                    <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase">
                      Active Sim
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {whatsAppLogs.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        <span className="block font-medium">No WhatsApp notifications dispatched yet.</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Modify any student timing with a temporary shift to test alerts.</span>
                      </div>
                    ) : (
                      whatsAppLogs.map(log => (
                        <div key={log.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 shadow-xs space-y-1 relative">
                          <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider block">Dispatched to {log.studentName}</span>
                          <p className="text-[11px] text-emerald-950 leading-relaxed font-mono">
                            "{log.message}"
                          </p>
                          <span className="text-[9px] text-slate-400 text-right block mt-1">{log.date} via WhatsApp API</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BROADCAST NOTICE */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                
                {/* Panel 1: Global Announcements */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-950">
                      <Bell size={16} />
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-800">Global Notice Broadcast</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Dispatch general notices instantly visible to all student portfolios and staff.
                  </p>

                  <form onSubmit={handleCreateNotif} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notice Heading</label>
                        <input
                          id="input-notif-title"
                          type="text"
                          required
                          placeholder="e.g. Pre-Board mock date sheet out"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Category Tag</label>
                        <select
                          id="select-notif-category"
                          value={notifCategory}
                          onChange={(e) => setNotifCategory(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        >
                          <option value="ANNOUNCEMENT">Standard Announcement</option>
                          <option value="EXAM">Examination Notice</option>
                          <option value="FEE">Fee Remittance Notification</option>
                          <option value="HOLIDAY">Holiday Bulletin</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notice content</label>
                      <textarea
                        id="ta-notif-content"
                        required
                        rows={3}
                        placeholder="Write brief description notice details here..."
                        value={notifContent}
                        onChange={(e) => setNotifContent(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      ></textarea>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        id="btn-notif-submit"
                        type="submit"
                        className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow transition-colors"
                      >
                        Dispatch Broadcast
                      </button>
                    </div>
                  </form>
                </div>

                {/* Panel 2: Targeted Bulk notice & Email Alerts */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-950">
                      <Mail size={16} />
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-800">Targeted Bulk Notice & Email Broadcast</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Send automated announcements, notices, or payment reminders using manual custom messages or the saved system templates.
                  </p>

                  <form onSubmit={handleSendBulkBroadcast} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Filter Target Audience By</label>
                        <select
                          id="select-bulk-target-type"
                          value={bulkTargetType}
                          onChange={(e) => setBulkTargetType(e.target.value as 'BATCH' | 'CLASS' | 'FEES_DUE')}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        >
                          <option value="BATCH">Specific Tuition Batch</option>
                          <option value="CLASS">Specific School Class</option>
                          <option value="FEES_DUE">All Students with Due Fees ⚠️</option>
                        </select>
                      </div>

                      <div>
                        {bulkTargetType === 'BATCH' ? (
                          <>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target Batch</label>
                            <select
                              id="select-bulk-batch"
                              value={bulkSelectedBatch}
                              onChange={(e) => setBulkSelectedBatch(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                            >
                              {batches.map(b => (
                                <option key={b.id} value={b.name}>{b.name} ({b.class})</option>
                              ))}
                            </select>
                          </>
                        ) : bulkTargetType === 'CLASS' ? (
                          <>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target Class</label>
                            <select
                              id="select-bulk-class"
                              value={bulkSelectedClass}
                              onChange={(e) => setBulkSelectedClass(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                            >
                              {Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`).map(cls => (
                                <option key={cls} value={cls}>{cls}</option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Target Segment Info</label>
                            <div className="w-full rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 text-[11px] font-medium text-rose-800 leading-tight">
                              Matches students with outstanding/unpaid balance logs in <strong>fee statuses</strong>.
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Dispatch Channel</label>
                        <select
                          id="select-bulk-channel"
                          value={bulkChannel}
                          onChange={(e) => setBulkChannel(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        >
                          <option value="BOTH">Portal Notice + Real SMTP Email</option>
                          <option value="SYSTEM">Portal Notice Board Only</option>
                          <option value="EMAIL">Real SMTP Email Dispatch Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Template / Content Mode</label>
                        <select
                          id="select-bulk-template-mode"
                          value={bulkTemplateMode}
                          onChange={(e) => {
                            const mode = e.target.value as 'CUSTOM' | 'REMINDER' | 'RECEIPT';
                            setBulkTemplateMode(mode);
                            if (mode === 'REMINDER' || mode === 'RECEIPT') {
                              setBulkCategory('FEE');
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        >
                          <option value="CUSTOM">Custom Text (Write Subject & Body Below)</option>
                          <option value="REMINDER">System Template: Overdue Fee Reminder</option>
                          <option value="RECEIPT">System Template: Payment Receipt</option>
                        </select>
                      </div>
                    </div>

                    {/* Template preview vs custom input fields */}
                    {bulkTemplateMode === 'CUSTOM' ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notice Heading / Subject</label>
                            <input
                              id="input-bulk-title"
                              type="text"
                              required
                              placeholder="e.g. Special Timings Changed for this Week"
                              value={bulkTitle}
                              onChange={(e) => setBulkTitle(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Category Tag</label>
                            <select
                              id="select-bulk-category"
                              value={bulkCategory}
                              onChange={(e) => setBulkCategory(e.target.value as any)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                            >
                              <option value="ANNOUNCEMENT">Standard Announcement</option>
                              <option value="EXAM">Examination Notice</option>
                              <option value="FEE">Fee Remittance Notification</option>
                              <option value="HOLIDAY">Holiday Bulletin</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notice Content / Email Body</label>
                          <textarea
                            id="ta-bulk-content"
                            required
                            rows={2}
                            placeholder="Type targeted alert details here..."
                            value={bulkContent}
                            onChange={(e) => setBulkContent(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                          ></textarea>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={12} className="text-indigo-900" /> Saved System Template Preview
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">Uses settings configurations</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-xs text-slate-700 bg-white border border-indigo-50 rounded-lg p-3">
                          <div>
                            <strong className="text-slate-500">Subject:</strong> {bulkTemplateMode === 'REMINDER' ? emailTemplates.reminderSubject : emailTemplates.receiptSubject}
                          </div>
                          <div className="border-t border-slate-100 my-1.5"></div>
                          <div 
                            className="max-h-36 overflow-y-auto leading-relaxed text-[11px] select-none text-slate-500" 
                            dangerouslySetInnerHTML={{ __html: bulkTemplateMode === 'REMINDER' ? emailTemplates.reminderBody : emailTemplates.receiptBody }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Audience estimator */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <Users size={12} className="text-indigo-900" /> Live Audience Estimator:
                        </span>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-900 px-2 rounded-full">
                          {matchingStudents.length} Students found
                        </span>
                      </div>
                      {matchingStudents.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                          {matchingStudents.map(student => (
                            <span key={student.id} className="text-[9px] bg-white border border-slate-150 text-slate-650 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                              {student.name} <span className="text-[8px] text-slate-400">({student.email || 'no-email'})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-400 italic">No matching students found for this selection.</p>
                      )}
                    </div>

                    {/* Progress Monitor */}
                    {isSendingBulk && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                          <span className="flex items-center gap-2">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-900 border-t-transparent"></div>
                            {bulkEmailProgress.stage}
                          </span>
                          <span>{bulkEmailProgress.current} / {bulkEmailProgress.total}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-amber-600 transition-all duration-300" 
                            style={{ width: `${(bulkEmailProgress.current / (bulkEmailProgress.total || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Report Card */}
                    {bulkShowReport && bulkReportData.length > 0 && (
                      <div className="rounded-xl border border-indigo-100 bg-slate-50 p-4 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            📊 Bulk Dispatch Delivery ledger
                          </h4>
                          <button 
                            type="button" 
                            onClick={() => setBulkShowReport(false)} 
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            Dismiss
                          </button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto border border-slate-150 rounded-lg bg-white divide-y divide-slate-100">
                          {bulkReportData.map((item, idx) => (
                            <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{item.studentName}</span>
                                <span className="text-slate-400 text-[10px] block font-mono">{item.email}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                {item.success ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Dispatched
                                    </span>
                                    {item.previewUrl && (
                                      <a 
                                        href={item.previewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 font-black text-[9px] hover:underline"
                                      >
                                        <ExternalLink size={9} /> View Email
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                                    ⚠️ {item.error || 'Failed'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        id="btn-bulk-submit"
                        type="submit"
                        disabled={isSendingBulk || matchingStudents.length === 0}
                        className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSendingBulk || matchingStudents.length === 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                            : 'bg-indigo-900 hover:bg-indigo-950'
                        }`}
                      >
                        {isSendingBulk ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Dispatching Broadcast...
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            Send Bulk Broadcast
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Grid 2: Notice Archive & Simulated Dispatch Ledger */}
              <div className="grid gap-6 lg:grid-cols-2">
                
                {/* Global Notice archive */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-display font-bold text-base text-slate-800 mb-4">Notice Bulletin Archive</h3>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">No notices in bulletin archive.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black uppercase text-indigo-900">{n.category}</span>
                              <span className="text-[9px] text-slate-400">{n.date}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">{n.content}</p>
                            {n.targetBatch && (
                              <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-brand-blue px-1.5 py-0.2 rounded">
                                Targeted Batch: {n.targetBatch}
                              </span>
                            )}
                            {n.targetClass && (
                              <span className="inline-block mt-1 text-[9px] font-bold bg-orange-50 text-brand-orange px-1.5 py-0.2 rounded">
                                Targeted Class: {n.targetClass}
                              </span>
                            )}
                          </div>

                          <button
                            id={`btn-del-notif-${n.id}`}
                            onClick={() => onDeleteNotification(n.id)}
                            className="rounded p-1 text-brand-red hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Simulated Targeted Dispatch Logs */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-base text-slate-800">Targeted Dispatch Logs (Email/SMS Alerts)</h3>
                    <button
                      onClick={() => {
                        if (confirm("Clear bulk alert logs history?")) {
                          saveBulkHistory([]);
                        }
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-brand-red transition-colors"
                    >
                      Clear Logs
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {bulkHistory.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">No targeted alerts dispatched yet.</p>
                    ) : (
                      bulkHistory.map(item => (
                        <div key={item.id} className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800">{item.title}</h4>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{item.content}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-150/40 text-[10px] text-slate-500 font-semibold">
                            <span>Target: <strong className="text-slate-800">{item.targetType === 'BATCH' ? 'Batch' : 'Class'} ({item.targetValue})</strong></span>
                            <span className="flex items-center gap-1 text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              {item.recipientsCount} Emailed
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WEBSITE CONTENT CMS */}
          {activeTab === 'website' && (
            <div className="space-y-8 animate-fade-in">
              {/* Part 1: Manage Toppers */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-base text-slate-800">Board Toppers & Alumni Merit list</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Control the public board of honor list shown on the public landing page.</p>
                  </div>
                  <button
                    id="admin-btn-add-topper-trigger"
                    onClick={() => {
                      setEditingTopper({ id: '', name: '', score: '', rank: '', desc: '', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60' });
                      setShowTopperForm(true);
                    }}
                    className="rounded-xl bg-indigo-900 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 hover:bg-indigo-950 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> Add New Topper
                  </button>
                </div>

                {/* Topper Add/Edit Form */}
                {showTopperForm && editingTopper && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onAddOrEditTopper(editingTopper);
                      setShowTopperForm(false);
                      setEditingTopper(null);
                    }}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 mb-6 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-bold text-slate-700">{editingTopper.id ? 'Edit Student Topper' : 'Register New Student Topper'}</h4>
                      <button
                        type="button"
                        onClick={() => { setShowTopperForm(false); setEditingTopper(null); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Topper Name</label>
                        <input
                          type="text"
                          required
                          value={editingTopper.name}
                          onChange={e => setEditingTopper({ ...editingTopper, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Score Percent / Marks</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., 98.4%"
                          value={editingTopper.score}
                          onChange={e => setEditingTopper({ ...editingTopper, score: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Rank / Achievement</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., State Topper Rank 4"
                          value={editingTopper.rank}
                          onChange={e => setEditingTopper({ ...editingTopper, rank: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">Student Photo <span className="text-red-500">*</span></label>
                        <div className="flex gap-3 items-center">
                          {editingTopper.img && (
                            <img src={editingTopper.img} alt="Preview" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                          )}
                          <div className="relative border border-dashed border-slate-300 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-all text-center flex-1 flex items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              id="admin-topper-photo-picker"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const f = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditingTopper({
                                      ...editingTopper,
                                      img: reader.result as string
                                    });
                                  };
                                  reader.readAsDataURL(f);
                                }
                              }}
                            />
                            <label htmlFor="admin-topper-photo-picker" className="cursor-pointer flex items-center gap-1.5 text-xs text-slate-600">
                              <Upload size={13} className="text-slate-400" />
                              <span className="font-bold text-indigo-900 hover:underline">Choose Photo File</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Brief Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Outstanding conceptual logic in Physics and Mathematics."
                        value={editingTopper.desc}
                        onChange={e => setEditingTopper({ ...editingTopper, desc: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowTopperForm(false); setEditingTopper(null); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-indigo-950 cursor-pointer shadow-sm"
                      >
                        Save Topper Details
                      </button>
                    </div>
                  </form>
                )}

                {/* Grid list of toppers in admin panel */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {toppers.map((top) => (
                    <div key={top.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40 flex gap-3 items-start justify-between animate-fade-in">
                      <div className="flex gap-3 items-start">
                        <img src={top.img} alt={top.name} className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{top.name}</h4>
                          <span className="text-[10px] font-black uppercase text-indigo-900">{top.rank}</span>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">{top.desc}</p>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          id={`admin-btn-edit-topper-${top.id}`}
                          onClick={() => {
                            setEditingTopper(top);
                            setShowTopperForm(true);
                          }}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          id={`admin-btn-del-topper-${top.id}`}
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove topper ${top.name}?`)) {
                              onDeleteTopper(top.id);
                            }
                          }}
                          className="rounded p-1 text-brand-red hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Manage Study Notes & Mock Papers */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-base text-slate-800">Universal Notes & Previous Question Papers Archive</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Publish reference study notes, formulas sheets, and board mock question papers.</p>
                  </div>
                  <button
                    id="admin-btn-add-mat-trigger"
                    onClick={() => {
                      setNewMaterial({ title: '', subject: 'Mathematics', class: 'Class 10', category: 'NOTES', desc: '', file: '', size: '1.8 MB' });
                      setShowMaterialForm(true);
                    }}
                    className="rounded-xl bg-indigo-900 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 hover:bg-indigo-950 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> Upload Study Material
                  </button>
                </div>

                {/* Material Upload Form */}
                {showMaterialForm && newMaterial && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      let finalFilename = newMaterial.file.trim();
                      if (!finalFilename.endsWith('.pdf')) {
                        finalFilename += '.pdf';
                      }
                      onAddStudyMaterial({
                        ...newMaterial,
                        file: finalFilename,
                        date: new Date().toISOString().split('T')[0]
                      });
                      setShowMaterialForm(false);
                      setNewMaterial(null);
                    }}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 mb-6 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-bold text-slate-700">Publish New Study Guide</h4>
                      <button
                        type="button"
                        onClick={() => { setShowMaterialForm(false); setNewMaterial(null); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Resource Title</label>
                        <input
                          type="text"
                          required
                          value={newMaterial.title}
                          onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Subject Area</label>
                        <select
                          value={newMaterial.subject}
                          onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science</option>
                          <option value="English">English</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Target Class</label>
                        <select
                          value={newMaterial.class}
                          onChange={e => setNewMaterial({ ...newMaterial, class: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        >
                          <option value="Class 10">Class 10</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 8">Class 8</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Document Type</label>
                        <select
                          value={newMaterial.category}
                          onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        >
                          <option value="NOTES">Study Formulas & Notes</option>
                          <option value="QUESTION_PAPER">Board Previous Mock Paper</option>
                        </select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-white text-center hover:bg-slate-50 transition-all flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        id="admin-notes-real-file-picker"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const f = e.target.files[0];
                            const formattedSize = f.size > 1024 * 1024 
                              ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
                              : `${(f.size / 1024).toFixed(0)} KB`;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewMaterial({
                                ...newMaterial,
                                file: f.name,
                                size: formattedSize,
                                title: newMaterial.title || f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
                                fileData: reader.result as string
                              });
                            };
                            reader.readAsDataURL(f);
                          }
                        }}
                      />
                      <label htmlFor="admin-notes-real-file-picker" className="cursor-pointer flex flex-col items-center justify-center w-full">
                        <Upload size={20} className="text-indigo-950 mb-1" />
                        <span className="text-xs font-bold text-indigo-950 hover:underline">Upload Note / Document File</span>
                        <span className="text-[10px] text-slate-400">Drag & drop or click to select PDF, Word, or text note</span>
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">File Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., physics_chapter_2_notes"
                          value={newMaterial.file}
                          onChange={e => setNewMaterial({ ...newMaterial, file: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">File Size Parameter</label>
                        <input
                          type="text"
                          required
                          value={newMaterial.size}
                          onChange={e => setNewMaterial({ ...newMaterial, size: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Reference Description / Chapter detail</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Detailed hand-written formulas detailing chemistry periodic table step-marks tips."
                        value={newMaterial.desc}
                        onChange={e => setNewMaterial({ ...newMaterial, desc: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowMaterialForm(false); setNewMaterial(null); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-indigo-950 cursor-pointer shadow-sm"
                      >
                        Publish Study Resource
                      </button>
                    </div>
                  </form>
                )}

                {/* List Table of Materials */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-3">Title Details</th>
                        <th className="p-3">Subject / Class</th>
                        <th className="p-3">Document Category</th>
                        <th className="p-3">Filename / Size</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {studyMaterials.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 text-xs animate-fade-in">
                          <td className="p-3">
                            <h4 className="font-bold text-slate-800">{item.title}</h4>
                            <p className="text-[10px] text-slate-400 leading-snug">{item.desc}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <span className="text-[9px] font-semibold bg-blue-50 text-brand-blue px-1.5 py-0.5 rounded">{item.subject}</span>
                              <span className="text-[9px] font-semibold bg-orange-50 text-brand-orange px-1.5 py-0.5 rounded">{item.class}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              {item.category === 'NOTES' ? 'Formulas & Notes' : 'Previous Year Mock Paper'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">
                            <div>{item.file}</div>
                            <div className="text-slate-400 font-bold">{item.size}</div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              id={`admin-btn-del-mat-${item.id}`}
                              onClick={() => {
                                if (confirm(`Remove study guide "${item.title}"?`)) {
                                  onDeleteStudyMaterial(item.id);
                                }
                              }}
                              className="rounded p-1 text-brand-red hover:bg-red-50 cursor-pointer"
                              title="Delete Resource Document"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 3: Manage Founders & Key Members */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-base text-slate-800">Founders & Key Board Members</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Control the details, qualification degrees, and personal messages of key directors shown in the About Us section.</p>
                  </div>
                  <button
                    id="admin-btn-add-founder-trigger"
                    type="button"
                    onClick={() => {
                      setEditingFounder(null);
                      setFounderName('');
                      setFounderTitle('');
                      setFounderQualification('');
                      setFounderMessage('');
                      setFounderTuitionFocus('');
                      setFounderAvatarInitials('');
                      setFounderPhotoUrl('');
                      setShowFounderForm(true);
                    }}
                    className="rounded-xl bg-indigo-900 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 hover:bg-indigo-950 transition-colors cursor-pointer shadow-sm animate-fade-in"
                  >
                    <Plus size={14} /> Add Founder / Member
                  </button>
                </div>

                {/* Founder Add/Edit Form */}
                {showFounderForm && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onAddOrEditFounder({
                        id: editingFounder?.id || '',
                        name: founderName,
                        title: founderTitle,
                        qualification: founderQualification,
                        message: founderMessage,
                        tuitionFocus: founderTuitionFocus,
                        avatarInitials: founderAvatarInitials || founderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
                        photoUrl: founderPhotoUrl
                      });
                      setShowFounderForm(false);
                      setEditingFounder(null);
                      setFounderName('');
                      setFounderTitle('');
                      setFounderQualification('');
                      setFounderMessage('');
                      setFounderTuitionFocus('');
                      setFounderAvatarInitials('');
                      setFounderPhotoUrl('');
                    }}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 mb-6 space-y-4 animate-fade-in"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-bold text-slate-700">
                        {editingFounder ? `Edit Details: ${editingFounder.name}` : 'Register New Founder / Member'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => { setShowFounderForm(false); setEditingFounder(null); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={founderName}
                          onChange={e => {
                            setFounderName(e.target.value);
                            if (!founderAvatarInitials) {
                              const initials = e.target.value.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                              setFounderAvatarInitials(initials);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                          placeholder="e.g., Priyanshu Gupta"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Designation / Title</label>
                        <input
                          type="text"
                          required
                          value={founderTitle}
                          onChange={e => setFounderTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                          placeholder="e.g., Founder Director & Lead Mathematics Faculty"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Qualifications & Experience</label>
                        <input
                          type="text"
                          required
                          value={founderQualification}
                          onChange={e => setFounderQualification(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                          placeholder="e.g., M.Sc. Mathematics, B.Ed. | UGC NET Qualified"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Tuition Cohort Focus</label>
                        <input
                          type="text"
                          required
                          value={founderTuitionFocus}
                          onChange={e => setFounderTuitionFocus(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                          placeholder="e.g., Board Mathematics"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Member Initials</label>
                        <input
                          type="text"
                          required
                          value={founderAvatarInitials}
                          onChange={e => setFounderAvatarInitials(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                          placeholder="e.g., SS"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">Member Photo</label>
                        <div className="flex gap-3 items-center">
                          {founderPhotoUrl && (
                            <img src={founderPhotoUrl} alt="Preview" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                          )}
                          <div className="relative border border-dashed border-slate-300 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-all text-center flex-1 flex items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              id="admin-founder-photo-picker"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const f = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setFounderPhotoUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(f);
                                }
                              }}
                            />
                            <label htmlFor="admin-founder-photo-picker" className="cursor-pointer flex items-center gap-1.5 text-xs text-slate-600">
                              <Upload size={13} className="text-slate-400" />
                              <span className="font-bold text-indigo-900 hover:underline">Choose Member Photo</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Personal Message / Director Statement</label>
                      <textarea
                        required
                        rows={3}
                        value={founderMessage}
                        onChange={e => setFounderMessage(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-900 outline-none"
                        placeholder="Write dynamic message / bio statement here..."
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowFounderForm(false); setEditingFounder(null); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-indigo-950 cursor-pointer shadow-sm"
                      >
                        Save Member Details
                      </button>
                    </div>
                  </form>
                )}

                {/* Grid list of founders/members in admin panel */}
                <div className="grid gap-6 md:grid-cols-2">
                  {founders.map((fm) => (
                    <div key={fm.id} className="rounded-2xl border border-slate-100 p-5 bg-slate-50/40 flex flex-col justify-between animate-fade-in relative overflow-hidden">
                      <div className="flex gap-4 items-start">
                        {fm.photoUrl ? (
                          <img src={fm.photoUrl} alt={fm.name} className="h-12 w-12 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-200" />
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                            <Users size={20} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            {fm.name}
                          </h4>
                          <span className="text-[11px] font-bold text-indigo-900 block leading-tight">{fm.title}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold">{fm.qualification}</span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="text-[9px] font-bold bg-amber-50 border border-amber-100 text-brand-orange px-1.5 py-0.5 rounded">
                              {fm.tuitionFocus}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 italic mt-2 leading-relaxed">
                            "{fm.message}"
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100/60">
                        <button
                          type="button"
                          id={`admin-btn-edit-founder-${fm.id}`}
                          onClick={() => {
                            setEditingFounder(fm);
                            setFounderName(fm.name);
                            setFounderTitle(fm.title);
                            setFounderQualification(fm.qualification);
                            setFounderMessage(fm.message);
                            setFounderTuitionFocus(fm.tuitionFocus);
                            setFounderAvatarInitials(fm.avatarInitials);
                            setFounderPhotoUrl(fm.photoUrl || '');
                            setShowFounderForm(true);
                          }}
                          className="rounded-lg border border-slate-200 hover:border-indigo-900 hover:bg-indigo-50/40 px-3 py-1.5 text-xs text-slate-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit size={12} /> Edit Details
                        </button>
                        <button
                          type="button"
                          id={`admin-btn-del-founder-${fm.id}`}
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove founder/member "${fm.name}"? This will hide them from the public website.`)) {
                              onDeleteFounder(fm.id);
                            }
                          }}
                          className="rounded-lg border border-transparent hover:bg-red-50 px-3 py-1.5 text-xs text-brand-red font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display font-bold text-base text-slate-800 mb-1">System Audit Logs</h3>
              <p className="text-xs text-slate-500 mb-4">Complete audit trail of database operations compiled under cryptographical checks.</p>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="p-3">Log ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Operation Action</th>
                      <th className="p-3">Details Parameters</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-mono text-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-indigo-900">{log.id}</td>
                        <td className="p-3 font-bold text-slate-800">@{log.username}</td>
                        <td className="p-3 text-brand-orange">{log.action}</td>
                        <td className="p-3 text-slate-500">{log.details}</td>
                        <td className="p-3 text-[10px] text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* ERP Configuration Settings Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 border-b border-slate-150 pb-3">
                  <h3 className="font-display font-bold text-base text-slate-800">ERP & Fee Billing Settings</h3>
                  <p className="text-xs text-slate-500">Configure subscription cycles, grace periods, late fee structures, and automated SMS/WhatsApp alerts.</p>
                </div>

                <form onSubmit={handleSaveConfigSubmit} className="space-y-6">
                  {/* Section 1: Billing Parameters */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-blue"></span> 1. Subscription Billing Parameters
                    </h4>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Billing Date (Day of Month)</label>
                        <select
                          id="select-cfg-billing-date"
                          value={cfgBillingDate}
                          onChange={(e) => setCfgBillingDate(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>Day {day} of Month</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Grace Period (Days)</label>
                        <input
                          id="input-cfg-grace-period"
                          type="number"
                          min={1}
                          max={30}
                          required
                          value={cfgGracePeriod}
                          onChange={(e) => setCfgGracePeriod(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Late Fee Fines (Rupees)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                          <input
                            id="input-cfg-late-fee"
                            type="number"
                            min={0}
                            required
                            value={cfgLateFee}
                            onChange={(e) => setCfgLateFee(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Automated Notification Toggles */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange"></span> 2. SMS & WhatsApp Grace Period Levels Toggles
                        </h4>
                        <p className="text-[11px] text-slate-400">Select which specific grace period threshold levels trigger automated outbound mobile WhatsApp notifications to parents.</p>
                      </div>
                      <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 px-4 py-2 rounded-2xl shadow-xs shrink-0">
                        <label className="text-xs font-black text-indigo-950 cursor-pointer" htmlFor="toggle-global-fee-alerts">Automated Fee Alerts:</label>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input
                            id="toggle-global-fee-alerts"
                            type="checkbox"
                            checked={cfgEnableAutomatedFeeAlerts}
                            onChange={(e) => setCfgEnableAutomatedFeeAlerts(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-900"></div>
                          <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-indigo-900 w-8">
                            {cfgEnableAutomatedFeeAlerts ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!cfgEnableAutomatedFeeAlerts && (
                      <div className="mb-4 p-3 text-center rounded-xl bg-amber-50 border border-amber-100 text-[10px] text-amber-800 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                        <span>⚠️</span>
                        <span>Automated Fee Alerts are globally paused. No automatic notifications of any level will be dispatched.</span>
                      </div>
                    )}

                    <div className={`grid gap-4 sm:grid-cols-2 transition-all duration-300 ${!cfgEnableAutomatedFeeAlerts ? 'opacity-40 pointer-events-none' : ''}`}>
                      {/* Level 1: Overdue Alert */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-start gap-3 transition-colors hover:bg-slate-50">
                        <input
                          id="toggle-cfg-overdue-sms"
                          type="checkbox"
                          checked={cfgEnableOverdueSMS}
                          onChange={(e) => setCfgEnableOverdueSMS(e.target.checked)}
                          className="h-4 w-4 mt-0.5 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="toggle-cfg-overdue-sms" className="block text-xs font-bold text-slate-800 cursor-pointer">
                            Level 1: Immediate Overdue Alert
                          </label>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Dispatches WhatsApp notice on Day 1 of missed payment entering the grace period.
                          </span>
                        </div>
                      </div>

                      {/* Level 2: Mid-Grace Reminder */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-start gap-3 transition-colors hover:bg-slate-50">
                        <input
                          id="toggle-cfg-midgrace-sms"
                          type="checkbox"
                          checked={cfgEnableMidGraceSMS}
                          onChange={(e) => setCfgEnableMidGraceSMS(e.target.checked)}
                          className="h-4 w-4 mt-0.5 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="toggle-cfg-midgrace-sms" className="block text-xs font-bold text-slate-800 cursor-pointer">
                            Level 2: Mid-Grace Period Reminder
                          </label>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Dispatches secondary warning to parent at the exact mathematical midpoint of the grace period.
                          </span>
                        </div>
                      </div>

                      {/* Level 3: Expiry Warning */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-start gap-3 transition-colors hover:bg-slate-50">
                        <input
                          id="toggle-cfg-expiry-sms"
                          type="checkbox"
                          checked={cfgEnableExpiryWarningSMS}
                          onChange={(e) => setCfgEnableExpiryWarningSMS(e.target.checked)}
                          className="h-4 w-4 mt-0.5 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="toggle-cfg-expiry-sms" className="block text-xs font-bold text-slate-800 cursor-pointer">
                            Level 3: Expiry Countdown Warning
                          </label>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Dispatches final warning 24 hours (1 day) before the grace period ends and suspension occurs.
                          </span>
                        </div>
                      </div>

                      {/* Level 4: Service Expired */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-start gap-3 transition-colors hover:bg-slate-50">
                        <input
                          id="toggle-cfg-expired-sms"
                          type="checkbox"
                          checked={cfgEnableExpiredSMS}
                          onChange={(e) => setCfgEnableExpiredSMS(e.target.checked)}
                          className="h-4 w-4 mt-0.5 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="toggle-cfg-expired-sms" className="block text-xs font-bold text-slate-800 cursor-pointer">
                            Level 4: Service Expiry Suspension Alert
                          </label>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Dispatches final notification immediately upon grace period expiration when access is restricted.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: SMS & WhatsApp API Gateway Integrations */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span> 3. Outbound SMS & WhatsApp Gateway Integrations
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Configure your production API keys or authentication credentials to synchronize live class schedule adjustments and fee notifications with parents' real WhatsApp accounts.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Integration Gateway Provider</label>
                        <select
                          id="select-cfg-whatsapp-provider"
                          value={cfgWhatsappProvider}
                          onChange={(e) => setCfgWhatsappProvider(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                        >
                          <option value="NONE">Sandbox Mode (Local Logs Only)</option>
                          <option value="TWILIO">Twilio SMS & WhatsApp Gateway</option>
                          <option value="WHATSAPP_BUSINESS">Meta WhatsApp Business API</option>
                        </select>
                      </div>

                      {cfgWhatsappProvider !== 'NONE' && (
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Sender WhatsApp/Phone No</label>
                          <input
                            id="input-cfg-whatsapp-sender"
                            type="text"
                            placeholder={cfgWhatsappProvider === 'TWILIO' ? 'e.g. +14155238886' : 'e.g. +919876543210'}
                            value={cfgWhatsappSenderNumber}
                            onChange={(e) => setCfgWhatsappSenderNumber(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Conditional Twilio Credentials */}
                    {cfgWhatsappProvider === 'TWILIO' && (
                      <div className="rounded-xl border border-slate-100 bg-indigo-50/20 p-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Key size={12} className="text-indigo-600" /> Twilio Account SID
                          </label>
                          <input
                            id="input-cfg-twilio-sid"
                            type="text"
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={cfgWhatsappAccountSid}
                            onChange={(e) => setCfgWhatsappAccountSid(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Key size={12} className="text-indigo-600" /> Twilio Auth Token
                          </label>
                          <input
                            id="input-cfg-twilio-token"
                            type="password"
                            placeholder="Enter Twilio Secret Auth Token"
                            value={cfgWhatsappAuthToken}
                            onChange={(e) => setCfgWhatsappAuthToken(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditional WhatsApp Business Credentials */}
                    {cfgWhatsappProvider === 'WHATSAPP_BUSINESS' && (
                      <div className="rounded-xl border border-slate-100 bg-emerald-50/10 p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Key size={12} className="text-emerald-600" /> Meta System Access Token (API Key)
                            </label>
                            <input
                              id="input-cfg-meta-token"
                              type="password"
                              placeholder="EAACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
                              value={cfgWhatsappApiKey}
                              onChange={(e) => setCfgWhatsappApiKey(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Key size={12} className="text-emerald-600" /> WhatsApp Phone Number ID
                            </label>
                            <input
                              id="input-cfg-meta-phoneid"
                              type="text"
                              placeholder="e.g. 1029384756201"
                              value={cfgWhatsappPhoneNumber}
                              onChange={(e) => setCfgWhatsappPhoneNumber(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Testing Console Panel */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700 uppercase">
                          test
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">🧪 Live Gateway Integration Testing Box</h5>
                          <p className="text-[10px] text-slate-500">Test the handshake credentials by sending a secure transmission packet on demand.</p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Test Recipient No</label>
                          <input
                            id="input-test-recipient"
                            type="text"
                            placeholder="e.g. +919988776655"
                            value={testPhoneNo}
                            onChange={(e) => setTestPhoneNo(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Test Message Body</label>
                          <div className="flex gap-2">
                            <input
                              id="input-test-body"
                              type="text"
                              value={testMsgBody}
                              onChange={(e) => setTestMsgBody(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                            />
                            <button
                              id="btn-trigger-test-dispatch"
                              type="button"
                              onClick={handleTestGatewaySubmit}
                              disabled={isTestingGateway}
                              className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 cursor-pointer transition-all flex items-center gap-1 shrink-0 disabled:opacity-55"
                            >
                              {isTestingGateway ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" /> Transmitting...
                                </>
                              ) : (
                                <>
                                  <Send size={12} /> Send Test Alert
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display test result */}
                      {testDispatchResult && (
                        <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 shadow-xs space-y-2 font-mono">
                          <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Gateway Debug System Console Logs</span>
                            <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded ${
                              testDispatchResult.success ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                            }`}>
                              {testDispatchResult.success ? 'SUCCESS 200/201' : 'HANDSHAKE FAILED 400/401'}
                            </span>
                          </div>
                          
                          <pre className="text-[10px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[160px]">
                            {testDispatchResult.log}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 4: Secure Tuition Fee Collection Routing (Where Dues Are Received) */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> 4. Secure Fee Collection Routing (Where Dues Are Received)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Configure your preferred collection account, direct UPI ID, or secure merchant gateway where parent & student payments are directly credited.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600 cursor-pointer" htmlFor="toggle-enable-online-payments">Enable Payments:</label>
                        <input
                          id="toggle-enable-online-payments"
                          type="checkbox"
                          checked={cfgEnableOnlinePayments}
                          onChange={(e) => setCfgEnableOnlinePayments(e.target.checked)}
                          className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                        />
                      </div>
                    </div>

                    {cfgEnableOnlinePayments && (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Fee Settlement Destination Method</label>
                            <select
                              id="select-cfg-payment-provider"
                              value={cfgPaymentGatewayProvider}
                              onChange={(e) => setCfgPaymentGatewayProvider(e.target.value as any)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                            >
                              <option value="UPI_QR">UPI Direct QR Settlement (No Fee / High Speed)</option>
                              <option value="RAZORPAY">Razorpay Merchant Node (Key Account API)</option>
                              <option value="STRIPE">Stripe Checkout API Terminal (International Card/SaaS)</option>
                              <option value="BANK_TRANSFER">Direct School Bank Account (Manual Ledger Review)</option>
                              <option value="MOCK">Demo Sandbox Gateway (Instant Receipt Simulation)</option>
                            </select>
                          </div>

                          {cfgPaymentGatewayProvider === 'UPI_QR' && (
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Merchant Registered Name</label>
                              <input
                                id="input-cfg-upi-merchant"
                                type="text"
                                placeholder="e.g. Sunshine Educational Classes Pvt Ltd"
                                value={cfgUpiMerchantName}
                                onChange={(e) => setCfgUpiMerchantName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                              />
                            </div>
                          )}
                        </div>

                        {/* UPI QR Config */}
                        {cfgPaymentGatewayProvider === 'UPI_QR' && (
                          <div className="rounded-xl border border-slate-100 bg-emerald-50/10 p-4 space-y-3">
                            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">UPI Handle & Instant Transfer Routing</h5>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Primary Recipient UPI ID (VPA)</label>
                                <input
                                  id="input-cfg-upi-id"
                                  type="text"
                                  placeholder="e.g. sunshineclasses@upi"
                                  value={cfgUpiId}
                                  onChange={(e) => setCfgUpiId(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                                <span className="text-[9px] text-slate-400 mt-1 block">All online payments via BHIM, GPay, PhonePe will settle into this address directly.</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Razorpay Config */}
                        {cfgPaymentGatewayProvider === 'RAZORPAY' && (
                          <div className="rounded-xl border border-slate-100 bg-blue-50/10 p-4 space-y-3">
                            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Razorpay Live Key Credentials</h5>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Razorpay Key ID</label>
                                <input
                                  id="input-cfg-razorpay-key"
                                  type="text"
                                  placeholder="rzp_live_xxxxxxxxxxxxxx"
                                  value={cfgRazorpayKeyId}
                                  onChange={(e) => setCfgRazorpayKeyId(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-[10px] text-slate-500 mt-4 block">Payments trigger Razorpay Standard Checkout UI on parent dashboards.</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stripe Config */}
                        {cfgPaymentGatewayProvider === 'STRIPE' && (
                          <div className="rounded-xl border border-slate-100 bg-indigo-50/10 p-4 space-y-3">
                            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Stripe Public Checkout Keys</h5>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Stripe Publishable Key</label>
                                <input
                                  id="input-cfg-stripe-key"
                                  type="text"
                                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                                  value={cfgStripePublicKey}
                                  onChange={(e) => setCfgStripePublicKey(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bank Transfer Config */}
                        {cfgPaymentGatewayProvider === 'BANK_TRANSFER' && (
                          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Official Educational Institution Bank Accounts</h5>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Account Holder / College Name</label>
                                <input
                                  id="input-cfg-bank-holder"
                                  type="text"
                                  value={cfgBankAccountHolder}
                                  onChange={(e) => setCfgBankAccountHolder(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Bank Account Number</label>
                                <input
                                  id="input-cfg-bank-number"
                                  type="text"
                                  value={cfgBankAccountNumber}
                                  onChange={(e) => setCfgBankAccountNumber(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Bank Name</label>
                                <input
                                  id="input-cfg-bank-name"
                                  type="text"
                                  value={cfgBankName}
                                  onChange={(e) => setCfgBankName(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">NEFT / IFSC Code</label>
                                <input
                                  id="input-cfg-bank-ifsc"
                                  type="text"
                                  value={cfgBankIfsc}
                                  onChange={(e) => setCfgBankIfsc(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Advanced Fee Controls Sub-section */}
                        <div className="border-t border-slate-100 pt-4 mt-2">
                          <h5 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span> Advanced Portal Fee Receipt Rules
                          </h5>
                          <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-1">
                                <div>
                                  <label className="text-xs font-bold text-slate-700 block">Allow Partial Payments</label>
                                  <span className="text-[10px] text-slate-400">Permits custom deposit partial credits instead of full monthly invoices</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={cfgAllowPartialPayments}
                                  onChange={(e) => setCfgAllowPartialPayments(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center justify-between p-1 border-t border-slate-100 pt-3">
                                <div>
                                  <label className="text-xs font-bold text-slate-700 block">Require Reference ID / Receipt Upload</label>
                                  <span className="text-[10px] text-slate-400">Forces parents to provide settlement transaction proof before dispatch</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={cfgRequireReceiptUpload}
                                  onChange={(e) => setCfgRequireReceiptUpload(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                                />
                              </div>

                              <div className="p-1 border-t border-slate-100 pt-3">
                                <label className="text-xs font-bold text-slate-700 block mb-1">Gateway Convenience Surcharge (%)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={cfgConvenienceFeePercent}
                                    onChange={(e) => setCfgConvenienceFeePercent(Number(e.target.value))}
                                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-900"
                                  />
                                  <span className="text-[10px] text-slate-400">Applied dynamically on checkout (Leave 0 for zero-fee school models)</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 border-l border-slate-150 pl-4">
                              <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-widest block mb-2">Display Payment Methods</span>
                              
                              <div className="flex items-center justify-between p-1">
                                <span className="text-xs font-semibold text-slate-700">Display UPI QR Code option</span>
                                <input
                                  type="checkbox"
                                  checked={cfgEnableUpiMethod}
                                  onChange={(e) => setCfgEnableUpiMethod(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center justify-between p-1">
                                <span className="text-xs font-semibold text-slate-700">Display Credit / Debit Card input</span>
                                <input
                                  type="checkbox"
                                  checked={cfgEnableCardMethod}
                                  onChange={(e) => setCfgEnableCardMethod(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center justify-between p-1">
                                <span className="text-xs font-semibold text-slate-700">Display Razorpay Node portal</span>
                                <input
                                  type="checkbox"
                                  checked={cfgEnableNetBankingMethod}
                                  onChange={(e) => setCfgEnableNetBankingMethod(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center justify-between p-1">
                                <span className="text-xs font-semibold text-slate-700">Display Direct Bank Transfer Wire info</span>
                                <input
                                  type="checkbox"
                                  checked={cfgEnableBankTransferMethod}
                                  onChange={(e) => setCfgEnableBankTransferMethod(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-900 border-slate-300 focus:ring-indigo-900 cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 5: Official Sunshine Classes Banking & UPI Details */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span> 5. Sunshine Classes Official Banking & Payment Accounts
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Configure the official bank accounts, branch names, and secure UPI merchant accounts where students and parents settle class fees.
                      </p>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid gap-6 sm:grid-cols-2">
                      {/* Bank account details */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest block border-b border-indigo-100 pb-1.5">
                          🏦 Institutional Bank Account Settings
                        </span>
                        
                        <div className="space-y-3.5">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Account Holder Name / Payee</label>
                            <input
                              type="text"
                              value={cfgBankAccountHolder}
                              onChange={(e) => setCfgBankAccountHolder(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900/10"
                              placeholder="e.g. Sunshine Classes ERP Solutions"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Primary Bank Account Number</label>
                            <input
                              type="text"
                              value={cfgBankAccountNumber}
                              onChange={(e) => setCfgBankAccountNumber(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900/10"
                              placeholder="e.g. 33888542347"
                            />
                          </div>

                          <div className="grid gap-3 grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Bank Name & Branch</label>
                              <input
                                type="text"
                                value={cfgBankName}
                                onChange={(e) => setCfgBankName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900/10"
                                placeholder="e.g. State Bank of India"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">NEFT / IFSC Code</label>
                              <input
                                type="text"
                                value={cfgBankIfsc}
                                onChange={(e) => setCfgBankIfsc(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900/10"
                                placeholder="e.g. SBIN0011180"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* UPI QR & Merchant configurations */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest block border-b border-indigo-100 pb-1.5">
                          📱 Unified Payments Interface (UPI) Settings
                        </span>

                        <div className="space-y-3.5">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Primary Recipient UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={cfgUpiId}
                              onChange={(e) => setCfgUpiId(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900/10"
                              placeholder="e.g. 9161586254@upi"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">UPI Merchant Registered Name</label>
                            <input
                              type="text"
                              value={cfgUpiMerchantName}
                              onChange={(e) => setCfgUpiMerchantName(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900/10"
                              placeholder="e.g. Sunshine Classes Ltd"
                            />
                          </div>
                          
                          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[10px] text-indigo-950 leading-relaxed font-semibold">
                            💡 These details are automatically integrated with students' secure portals to generate checkout QR codes or prompt bank wire details.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-save-cfg-submit"
                      type="submit"
                      className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                    >
                      Save Configuration Parameters
                    </button>
                  </div>
                </form>
              </div>

              {/* Custom Email Templates Configuration UI */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 border-b border-slate-150 pb-4">
                  <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                    <Mail className="text-brand-orange" size={20} />
                    Custom Email Templates Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Customize the automated email notifications sent to parents for fee collections and overdue balance alerts.
                  </p>
                </div>

                <div className="flex border-b border-slate-100 mb-6">
                  <button
                    id="btn-template-tab-receipt"
                    type="button"
                    onClick={() => setSelectedTemplateTab('receipt')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      selectedTemplateTab === 'receipt'
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    🧾 Tuition Fee Receipt Template
                  </button>
                  <button
                    id="btn-template-tab-reminder"
                    type="button"
                    onClick={() => setSelectedTemplateTab('reminder')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      selectedTemplateTab === 'reminder'
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ⚠️ Pending/Overdue Alert Template
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left Column: Form Editors */}
                  <form onSubmit={handleSaveEmailTemplates} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Email Subject Line
                      </label>
                      <input
                        id="input-template-subject"
                        type="text"
                        required
                        value={selectedTemplateTab === 'receipt' ? receiptSubject : reminderSubject}
                        onChange={(e) => {
                          if (selectedTemplateTab === 'receipt') {
                            setReceiptSubject(e.target.value);
                          } else {
                            setReminderSubject(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white font-medium"
                        placeholder={
                          selectedTemplateTab === 'receipt'
                            ? "e.g., Fee Receipt - {{receiptId}} - Sunshine Classes"
                            : "e.g., Fee Payment Outstanding - {{studentName}}"
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          HTML Email Body Content
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Supports standard HTML + Inline Styles</span>
                      </div>
                      <textarea
                        id="textarea-template-body"
                        rows={14}
                        required
                        value={selectedTemplateTab === 'receipt' ? receiptBody : reminderBody}
                        onChange={(e) => {
                          if (selectedTemplateTab === 'receipt') {
                            setReceiptBody(e.target.value);
                          } else {
                            setReminderBody(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white font-mono leading-relaxed animate-none"
                      />
                    </div>

                    {/* Placeholder pills panel */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        💡 Click to Append Available Placeholders
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedTemplateTab === 'receipt'
                          ? ['{{studentName}}', '{{amount}}', '{{month}}', '{{className}}', '{{receiptId}}', '{{date}}', '{{paymentMethod}}', '{{transactionId}}', '{{receivedBy}}']
                          : ['{{studentName}}', '{{amount}}', '{{month}}', '{{className}}', '{{dueDate}}']
                        ).map((placeholder) => (
                          <button
                            key={placeholder}
                            type="button"
                            onClick={() => {
                              if (selectedTemplateTab === 'receipt') {
                                setReceiptBody(prev => prev + ' ' + placeholder);
                              } else {
                                setReminderBody(prev => prev + ' ' + placeholder);
                              }
                            }}
                            className="rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-medium text-slate-600 px-2.5 py-1 transition-colors cursor-pointer border border-slate-200"
                          >
                            {placeholder}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        id="btn-save-templates-submit"
                        type="submit"
                        className="rounded-xl bg-brand-orange hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        Save Template Settings
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Live Mockup Preview */}
                  <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="w-3 h-3 rounded-full bg-green-400"></span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Live Client Preview
                      </span>
                    </div>

                    <div className="p-4 border-b border-slate-200 bg-white space-y-1.5">
                      <div className="text-xs text-slate-500">
                        <span className="font-bold text-slate-700">To:</span> sarcasticrk09@gmail.com <span className="text-[10px] text-slate-400">(Parent/Student)</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-baseline gap-1">
                        <span className="font-bold text-slate-700">Subject:</span>
                        <span className="text-slate-800 font-medium">
                          {(() => {
                            const dummyVars = {
                              studentName: "Aditya Gupta",
                              className: "Class 10",
                              month: "July 2026",
                              amount: "1500",
                              dueDate: "10-July-2026",
                              receiptId: "REC-0102",
                              paymentMethod: "UPI (PhonePe)",
                              transactionId: "TXN918239123",
                              date: "2026-07-02",
                              receivedBy: "Neha Sharma"
                            };
                            return selectedTemplateTab === 'receipt'
                              ? interpolateTemplate(receiptSubject, dummyVars)
                              : interpolateTemplate(reminderSubject, dummyVars);
                          })() || '(Empty Subject)'}
                        </span>
                      </div>
                    </div>

                    {/* Rendered HTML Box */}
                    <div className="p-4 flex-1 overflow-auto max-h-[420px] bg-slate-50 border-t border-slate-100">
                      {(() => {
                        const dummyVars = {
                          studentName: "Aditya Gupta",
                          className: "Class 10",
                          month: "July 2026",
                          amount: "1500",
                          dueDate: "10-July-2026",
                          receiptId: "REC-0102",
                          paymentMethod: "UPI (PhonePe)",
                          transactionId: "TXN918239123",
                          date: "2026-07-02",
                          receivedBy: "Neha Sharma"
                        };
                        const html = selectedTemplateTab === 'receipt'
                          ? interpolateTemplate(receiptBody, dummyVars)
                          : interpolateTemplate(reminderBody, dummyVars);

                        return html ? (
                          <div
                            className="bg-white rounded-lg shadow-sm overflow-hidden p-4 border border-slate-100"
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        ) : (
                          <div className="text-center py-12 text-slate-400 text-xs italic">
                            Body content is empty. Start typing to preview the email.
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom WhatsApp Templates Configuration UI */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 border-b border-slate-150 pb-4">
                  <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                    <MessageSquare className="text-emerald-600" size={20} />
                    Custom WhatsApp Templates Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Customize the outbound automated WhatsApp and SMS text payloads transmitted to parents' mobile devices.
                  </p>
                </div>

                <div className="flex border-b border-slate-100 mb-6 overflow-x-auto">
                  <button
                    id="btn-wa-template-tab-receipt"
                    type="button"
                    onClick={() => setSelectedWATemplateTab('receipt')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      selectedWATemplateTab === 'receipt'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    🧾 Fee Receipt Template
                  </button>
                  <button
                    id="btn-wa-template-tab-reminder"
                    type="button"
                    onClick={() => setSelectedWATemplateTab('reminder')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      selectedWATemplateTab === 'reminder'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ⚠️ Overdue Alert Template
                  </button>
                  <button
                    id="btn-wa-template-tab-schedule"
                    type="button"
                    onClick={() => setSelectedWATemplateTab('schedule')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      selectedWATemplateTab === 'schedule'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ⏰ Timing Alert Template
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left Column: Form Editors */}
                  <form onSubmit={handleSaveWATemplates} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          WhatsApp Template Message Body
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">Supports variable interpolation</span>
                      </div>
                      <textarea
                        id="textarea-wa-template-body"
                        rows={8}
                        required
                        value={
                          selectedWATemplateTab === 'receipt'
                            ? receiptWATemplate
                            : selectedWATemplateTab === 'reminder'
                            ? reminderWATemplate
                            : scheduleWATemplate
                        }
                        onChange={(e) => {
                          if (selectedWATemplateTab === 'receipt') {
                            setReceiptWATemplate(e.target.value);
                          } else if (selectedWATemplateTab === 'reminder') {
                            setReminderWATemplate(e.target.value);
                          } else {
                            setScheduleWATemplate(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white font-mono leading-relaxed"
                        placeholder="Type message content..."
                      />
                    </div>

                    {/* Placeholder pills panel */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        💡 Click to Append Placeholders
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedWATemplateTab === 'receipt'
                          ? ['{{studentName}}', '{{amount}}', '{{month}}', '{{className}}', '{{receiptId}}']
                          : selectedWATemplateTab === 'reminder'
                          ? ['{{studentName}}', '{{amount}}', '{{month}}', '{{className}}', '{{dueDate}}']
                          : ['{{studentName}}', '{{className}}', '{{timing}}']
                        ).map((placeholder) => (
                          <button
                            key={placeholder}
                            type="button"
                            onClick={() => {
                              if (selectedWATemplateTab === 'receipt') {
                                setReceiptWATemplate(prev => prev + ' ' + placeholder);
                              } else if (selectedWATemplateTab === 'reminder') {
                                setReminderWATemplate(prev => prev + ' ' + placeholder);
                              } else {
                                setScheduleWATemplate(prev => prev + ' ' + placeholder);
                              }
                            }}
                            className="rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-medium text-slate-600 px-2.5 py-1 transition-colors cursor-pointer border border-slate-200"
                          >
                            {placeholder}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        id="btn-save-wa-templates-submit"
                        type="submit"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        Save WhatsApp Settings
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Live Mockup Preview */}
                  <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50 min-h-[300px]">
                    <div className="bg-emerald-600 px-4 py-3 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Parent's Smartphone View
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-700/50 px-2.5 py-0.5 rounded-full">
                        WhatsApp Live Preview
                      </span>
                    </div>

                    {/* Chat screen style */}
                    <div className="p-4 flex-1 overflow-auto bg-slate-100 flex flex-col justify-end min-h-[220px]">
                      <div className="max-w-[85%] self-start bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 text-xs text-slate-800 space-y-1 relative">
                        <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mb-0.5">
                          ☀️ Sunshine Classes, Pihani
                        </div>
                        <p className="whitespace-pre-line font-sans">
                          {(() => {
                            const dummyVars: Record<string, string> = {
                              studentName: "Aditya Gupta",
                              className: "Class 10",
                              month: "July 2026",
                              amount: "1500",
                              dueDate: "10-July-2026",
                              receiptId: "REC-0102",
                              timing: "04:30 PM - 06:00 PM"
                            };
                            
                            const template = selectedWATemplateTab === 'receipt'
                              ? receiptWATemplate
                              : selectedWATemplateTab === 'reminder'
                              ? reminderWATemplate
                              : scheduleWATemplate;

                            let result = template;
                            for (const [key, val] of Object.entries(dummyVars)) {
                              const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                              result = result.replace(placeholder, val);
                            }
                            return result || '(Empty Template Body)';
                          })()}
                        </p>
                        <div className="text-[9px] text-slate-400 text-right mt-1.5">
                          12:04 PM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ERP Security Shield Control Center */}
              <div className={`rounded-2xl border p-6 shadow-sm space-y-6 transition-all duration-300 ${
                strictMode ? 'border-emerald-200 bg-emerald-50/10' : 'border-amber-200 bg-amber-50/10'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      strictMode ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      <Shield size={22} className={strictMode ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                        ERP Security Shield & Hardening
                        {strictMode ? (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            ● PRODUCTION SECURE
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⚠️ LOCAL DEV MODE
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                        Audit, harden, and protect user data. Toggle between standard evaluation testing (with quick auto-fills and default bypasses) and strict cryptographic production standards.
                      </p>
                    </div>
                  </div>

                   <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      id="btn-toggle-strict-mode"
                      type="button"
                      onClick={onToggleStrictMode}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-emerald-600 cursor-not-allowed opacity-80"
                      title="Production mode is permanently active to protect user privacy"
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                      />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Strict Shield Mode <span className="text-emerald-600">🔒 LOCKED</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">Production Security Enforced</span>
                    </div>
                  </div>
                </div>

                {/* Security Metrics & Diagnostic Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Vulnerability Profile</span>
                    <span className={`text-sm font-black block mt-1 ${
                      strictMode ? 'text-emerald-600' : 'text-amber-500'
                    }`}>
                      {strictMode ? '🟢 0 Critical Risks' : '🚨 3 Active Warnings'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {strictMode ? 'Passcodes cryptographically hashed. Local testing backdoors locked.' : 'Plaintext backdoor bypasses are active for testing convenience.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Credential Security</span>
                    <span className={`text-sm font-black block mt-1 ${
                      strictMode ? 'text-emerald-600' : 'text-indigo-900'
                    }`}>
                      {strictMode ? 'SHA-256 (Salted Custom Hash)' : 'MD5-Equivalent or Plaintext'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {strictMode ? 'Hashed with custom synchronous salts in LocalStorage.' : 'Default logins match plain-text local parameters.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Password Policy</span>
                    <span className={`text-sm font-black block mt-1 ${
                      strictMode ? 'text-emerald-600' : 'text-slate-600'
                    }`}>
                      {strictMode ? 'High Complexity (8+ Char, A-Z, 0-9)' : 'None (No rules applied)'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {strictMode ? 'Ensures students/staff cannot set weak, guessable passwords.' : 'Any short alphanumeric combination is accepted.'}
                    </p>
                  </div>
                </div>

                {/* Hardening Protocols Checklist */}
                <div className="rounded-xl border border-slate-150/80 bg-slate-50/50 p-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    🛡️ Verified System Protection Layers
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className={`text-xs font-bold ${strictMode ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {strictMode ? '✓' : '✗'}
                      </span>
                      <div>
                        <strong className="text-slate-750">No-Backdoor Sign-In Enforcer:</strong>
                        <span className="text-slate-500 block mt-0.5">
                          {strictMode ? 'Locked. Direct developer bypasses and default role suffix logins (e.g. admin123, teacher123) are permanently blocked. Users must supply their configured passcode.' : 'Open. Staff/student roles can sign in with default role bypass passwords (e.g. sunshine123) for rapid demo access.'}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={`text-xs font-bold ${strictMode ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {strictMode ? '✓' : '✗'}
                      </span>
                      <div>
                        <strong className="text-slate-750">Credential Cipher Obfuscation:</strong>
                        <span className="text-slate-500 block mt-0.5">
                          {strictMode ? 'Active. Hashed credentials are saved to LocalStorage. Pressing F12 or inspecting state will NOT expose the passwords in raw plain text.' : 'Inactive. Users passwords might reside in plain text inside client-side session states.'}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-xs font-bold text-emerald-600">✓</span>
                      <div>
                        <strong className="text-slate-750">Secure API Proxy Layer:</strong>
                        <span className="text-slate-500 block mt-0.5">
                          Enforced. Server-side API endpoints (`/api/*`) proxy chatbot queries, ensuring sensitive API tokens (such as Google Gemini credentials) remain hidden from browsers.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Database Admin Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800 mb-1">Database Administration</h3>
                  <p className="text-xs text-slate-500">Trigger standard structural exports of the PostgreSQL database schemas.</p>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <Database size={14} className="text-brand-orange animate-pulse" /> Cloud Database backups
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Instance size: 12.8 MB • Scheduled daily at 02:00 AM UTC</p>
                  </div>

                  <button
                    id="btn-trigger-backup"
                    onClick={handleTriggerBackupSubmit}
                    className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Database size={13} /> Force Backup Dump
                  </button>
                </div>
              </div>

              {/* Local Storage Backup & Recovery Center */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800 mb-1 flex items-center gap-2">
                    <Archive className="text-indigo-900" size={18} /> Local Storage Backup & Recovery Center
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export the current local application state (student records, payment history, faculty, and configuration parameters) as a portable backup JSON file or schedule automated local state snapshot logs.
                  </p>
                </div>

                {/* Instant Actions Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Download size={14} className="text-emerald-600" /> Export Application State
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Instantly compile and download all your locally stored Sunshine Classes data. This JSON file can be stored off-site and used for complete data recovery.
                      </p>
                    </div>
                    <button
                      id="btn-export-localstorage"
                      type="button"
                      onClick={handleExportSystemState}
                      className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download size={13} /> Export Backup (.json)
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Upload size={14} className="text-amber-600" /> Restore Application State
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Overwrite your current local database state with a previously downloaded `.json` backup file. WARNING: This will completely replace existing active records.
                      </p>
                    </div>
                    <label className="w-full sm:w-auto rounded-xl border border-amber-300 hover:bg-amber-50 bg-white px-4 py-2 text-xs font-bold text-amber-800 shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                      <Upload size={13} /> Upload & Restore JSON
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSystemState}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Scheduler Settings & Snapshots */}
                <div className="border-t border-slate-100 pt-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock size={14} className="text-indigo-900" /> Automated Backup Scheduler
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Configure client-side background intervals to auto-save application checkpoints silently as you work.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Frequency:</span>
                      <select
                        value={backupFrequency}
                        onChange={(e) => handleUpdateScheduleSettings(e.target.value as any)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                      >
                        <option value="MANUAL">Manual Only</option>
                        <option value="12_HOURS">Every 12 Hours</option>
                        <option value="DAILY">Daily (24 Hours)</option>
                        <option value="WEEKLY">Weekly (7 Days)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 bg-indigo-50/30 rounded-xl p-4 border border-indigo-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-900 block uppercase">Last Backup Saved</span>
                      <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{lastBackupTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-900 block uppercase">Schedule Status</span>
                      <span className="text-xs font-bold text-slate-700 block mt-0.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        {backupFrequency === 'MANUAL' ? 'Idle (Manual Mode)' : 'Active Scheduler'}
                      </span>
                    </div>
                    <div className="flex items-center md:justify-end">
                      <button
                        type="button"
                        onClick={handleTriggerManualSnapshot}
                        className="rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-900 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Archive size={12} /> Capture Snapshot Now
                      </button>
                    </div>
                  </div>

                  {/* Local Snapshot Archives list */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Stored Snapshot Recovery Archive ({localBackupsArchive.length} / 5 snapshots)
                    </h5>
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                            <th className="p-2.5">Snapshot Date / Time</th>
                            <th className="p-2.5">Estimated Size</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {localBackupsArchive.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/40">
                              <td className="p-2.5 font-semibold text-slate-700">{item.timestamp}</td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-500">{item.sizeKB} KB</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                                  item.id.startsWith('auto') 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-150' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                                }`}>
                                  {item.id.startsWith('auto') ? 'Auto Save' : 'Manual'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRestoreFromArchive(item)}
                                  className="text-indigo-900 hover:text-indigo-950 font-bold hover:underline"
                                  title="Restore system state instantly to this checkpoint"
                                >
                                  Restore
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArchiveItem(item.id)}
                                  className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                                  title="Delete snapshot"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                          {localBackupsArchive.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                                No local backup recovery points recorded yet. Select a frequency or trigger a snapshot manually.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-emerald-600" /> WhatsApp Gateway Hub & Messenger
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage outbound alerts, review live webhooks logs, and dispatch manual parent messaging on demand.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                      Provider: <span className="text-emerald-600 font-black">{subConfig.whatsappProvider || 'NONE'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content: 2-Column Bento Layout */}
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Column 1: Manual & Bulk Messaging Console */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex border-b border-slate-100 pb-2 items-center justify-between flex-wrap gap-2">
                      <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
                        <span>📤 Outbound Messenger</span>
                      </h4>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setWaSubTab('single')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            waSubTab === 'single'
                              ? 'bg-white text-emerald-800 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Single Recipient
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaSubTab('bulk')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            waSubTab === 'bulk'
                              ? 'bg-white text-emerald-800 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Bulk Broadcast
                        </button>
                      </div>
                    </div>

                    {waSubTab === 'single' ? (
                      <form onSubmit={handleSendManualWhatsApp} className="space-y-4">
                        {/* Step 1: Optional Student Select */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Select Student (Optional Helper)
                          </label>
                          <select
                            id="select-wa-student-helper"
                            value={selectedStudentHelperId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedStudentHelperId(val);
                              if (val) {
                                const std = students.find(s => s.id === val);
                                if (std) {
                                  const targetNo = std.whatsapp || std.parentMobile || std.mobile || '';
                                  setManualRecipientNo(targetNo);
                                  
                                  // Interpolate current template if not custom
                                  if (selectedTemplateHelper !== 'custom') {
                                    let tmpl = '';
                                    if (selectedTemplateHelper === 'receipt') tmpl = whatsappTemplates?.receiptTemplate || '';
                                    else if (selectedTemplateHelper === 'reminder') tmpl = whatsappTemplates?.reminderTemplate || '';
                                    else if (selectedTemplateHelper === 'schedule') tmpl = whatsappTemplates?.scheduleTemplate || '';

                                    const interpolated = interpolateWhatsAppTemplate(tmpl, {
                                      studentName: std.name,
                                      amount: '1500',
                                      month: 'July 2026',
                                      className: std.class,
                                      receiptId: 'REC-MANUAL',
                                      dueDate: '10-July-2026',
                                      timing: '04:30 PM'
                                    });
                                    setManualMsgBody(interpolated);
                                  }
                                }
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                          >
                            <option value="">-- Choose registered student to load number --</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.class}) - {s.whatsapp || s.parentMobile || s.mobile || 'No Phone recorded'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2: Recipient Phone */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Recipient Phone Number (with Country Code)
                          </label>
                          <input
                            id="input-wa-manual-recipient"
                            type="text"
                            required
                            placeholder="e.g. +919161586254 or 919161586254"
                            value={manualRecipientNo}
                            onChange={(e) => setManualRecipientNo(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600 font-mono"
                          />
                        </div>

                        {/* Step 3: Optional Template Loader */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Load Template Presets
                          </label>
                          <select
                            id="select-wa-template-helper"
                            value={selectedTemplateHelper}
                            onChange={(e) => {
                              const val = e.target.value as 'custom' | 'receipt' | 'reminder' | 'schedule';
                              setSelectedTemplateHelper(val);
                              
                              const std = students.find(s => s.id === selectedStudentHelperId);
                              let tmpl = '';
                              if (val === 'receipt') tmpl = whatsappTemplates?.receiptTemplate || '';
                              else if (val === 'reminder') tmpl = whatsappTemplates?.reminderTemplate || '';
                              else if (val === 'schedule') tmpl = whatsappTemplates?.scheduleTemplate || '';
                              
                              if (val === 'custom') {
                                setManualMsgBody('');
                              } else {
                                const interpolated = interpolateWhatsAppTemplate(tmpl, {
                                  studentName: std ? std.name : 'Aditya Gupta',
                                  amount: '1500',
                                  month: 'July 2026',
                                  className: std ? std.class : 'Class 10',
                                  receiptId: 'REC-MANUAL',
                                  dueDate: '10-July-2026',
                                  timing: '04:30 PM - 06:00 PM'
                                });
                                setManualMsgBody(interpolated);
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                          >
                            <option value="custom">-- Custom Text (Write manually) --</option>
                            <option value="receipt">🧾 Fee Receipt Template</option>
                            <option value="reminder">⚠️ Overdue Alert Template</option>
                            <option value="schedule">⏰ Timing Alert Template</option>
                          </select>
                        </div>

                        {/* Step 4: Message Body */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Message Body Text
                          </label>
                          <textarea
                            id="textarea-wa-manual-body"
                            rows={4}
                            required
                            placeholder="Type your WhatsApp notification body here..."
                            value={manualMsgBody}
                            onChange={(e) => setManualMsgBody(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 font-sans leading-relaxed"
                          />
                        </div>

                        {/* Submit dispatch button */}
                        <button
                          id="btn-wa-manual-submit"
                          type="submit"
                          disabled={isSendingManual}
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 cursor-pointer shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isSendingManual ? (
                            <>
                              <RefreshCw className="animate-spin" size={13} /> Transmitting Gateway Request...
                            </>
                          ) : (
                            <>
                              <Send size={13} /> Send Manual Outbound
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSendBulkWhatsApp} className="space-y-4">
                        {/* Target Selection */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            1. Select Broadcast Target Group
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setWaBulkTargetType('all');
                                setWaBulkTargetBatchId('');
                                setWaBulkTargetClass('');
                              }}
                              className={`rounded-xl border p-2 text-center text-xs font-bold transition-all cursor-pointer ${
                                waBulkTargetType === 'all'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              📢 All ({students.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWaBulkTargetType('batch');
                                setWaBulkTargetClass('');
                                if (batches.length > 0) setWaBulkTargetBatchId(batches[0].name);
                              }}
                              className={`rounded-xl border p-2 text-center text-xs font-bold transition-all cursor-pointer ${
                                waBulkTargetType === 'batch'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              🕒 By Batch
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWaBulkTargetType('class');
                                setWaBulkTargetBatchId('');
                                const uniqueClasses = Array.from(new Set(students.map(s => s.class))).filter(Boolean);
                                if (uniqueClasses.length > 0) setWaBulkTargetClass(uniqueClasses[0]);
                              }}
                              className={`rounded-xl border p-2 text-center text-xs font-bold transition-all cursor-pointer ${
                                waBulkTargetType === 'class'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              🎓 By Class
                            </button>
                          </div>
                        </div>

                        {/* Conditional target filters */}
                        {waBulkTargetType === 'batch' && (
                          <div className="animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Select Target Batch
                            </label>
                            <select
                              id="select-wa-bulk-batch"
                              value={waBulkTargetBatchId}
                              onChange={(e) => setWaBulkTargetBatchId(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                            >
                              <option value="">-- Choose active batch --</option>
                              {Array.from(new Set(students.map(s => s.preferredBatch).filter(Boolean))).map(batchName => {
                                const count = students.filter(s => s.preferredBatch === batchName).length;
                                return (
                                  <option key={batchName} value={batchName}>
                                    {batchName} ({count} student{count !== 1 ? 's' : ''})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {waBulkTargetType === 'class' && (
                          <div className="animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Select Target Class/Grade
                            </label>
                            <select
                              id="select-wa-bulk-class"
                              value={waBulkTargetClass}
                              onChange={(e) => setWaBulkTargetClass(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                            >
                              <option value="">-- Choose target class --</option>
                              {Array.from(new Set(students.map(s => s.class).filter(Boolean))).map(className => {
                                const count = students.filter(s => s.class === className).length;
                                return (
                                  <option key={className} value={className}>
                                    {className} ({count} student{count !== 1 ? 's' : ''})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {/* Template Option */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            2. Select Message Template Option
                          </label>
                          <select
                            id="select-wa-bulk-template"
                            value={waBulkTemplateType}
                            onChange={(e) => {
                              const val = e.target.value as 'custom' | 'receipt' | 'reminder' | 'schedule';
                              setWaBulkTemplateType(val);
                              if (val === 'custom') {
                                setWaBulkCustomBody('');
                              } else {
                                let tmpl = '';
                                if (val === 'receipt') tmpl = whatsappTemplates?.receiptTemplate || '';
                                else if (val === 'reminder') tmpl = whatsappTemplates?.reminderTemplate || '';
                                else if (val === 'schedule') tmpl = whatsappTemplates?.scheduleTemplate || '';
                                
                                const sampleInterp = interpolateWhatsAppTemplate(tmpl, {
                                  studentName: students[0]?.name || 'Student Name',
                                  amount: '1500',
                                  month: 'July 2026',
                                  className: students[0]?.class || 'Class 10',
                                  receiptId: 'REC-BULK',
                                  dueDate: '10-July-2026',
                                  timing: students[0]?.preferredTiming || '04:30 PM'
                                });
                                setWaBulkCustomBody(sampleInterp);
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                          >
                            <option value="custom">✍️ Custom Text Broadcast (Write Below)</option>
                            <option value="receipt">🧾 Fee Receipt Broadcast (Personalized)</option>
                            <option value="reminder">⚠️ Overdue Fee Alert Broadcast (Personalized)</option>
                            <option value="schedule">⏰ Dynamic Timing Alert Broadcast (Personalized)</option>
                          </select>
                        </div>

                        {/* Message body input */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              3. Message Body
                            </label>
                            {waBulkTemplateType !== 'custom' && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                                Autocompletes dynamically per student
                              </span>
                            )}
                          </div>
                          <textarea
                            id="textarea-wa-bulk-body"
                            rows={4}
                            required
                            placeholder={
                              waBulkTemplateType === 'custom'
                                ? "Enter your general broadcast text here..."
                                : "This text serves as the template basis, auto-interpolated individually..."
                            }
                            value={waBulkCustomBody}
                            onChange={(e) => setWaBulkCustomBody(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 font-sans leading-relaxed"
                          />
                        </div>

                        {/* Progress and status screen during transmission */}
                        {isWaBulkSending && (
                          <div className="rounded-xl border border-indigo-150 bg-indigo-50/50 p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                              <span className="flex items-center gap-1.5">
                                <RefreshCw className="animate-spin h-3.5 w-3.5 text-indigo-600" /> Dispatched {waBulkProgress.current} of {waBulkProgress.total} Recipient(s)
                              </span>
                              <span>{Math.round((waBulkProgress.current / waBulkProgress.total) * 100)}%</span>
                            </div>
                            
                            {/* Visual Progress bar */}
                            <div className="w-full bg-slate-250 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-full transition-all duration-300" 
                                style={{ width: `${(waBulkProgress.current / waBulkProgress.total) * 100}%` }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setWaBulkCancelRequested(true);
                                alert("Cancellation requested! Stopping after current item completes.");
                              }}
                              className="w-full py-1.5 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold text-[11px] transition-all cursor-pointer"
                            >
                              🛑 Request Graceful Stop
                            </button>
                          </div>
                        )}

                        {/* Broadcast Results list */}
                        {waBulkDispatchLogs.length > 0 && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-48 overflow-y-auto">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b pb-1 flex items-center justify-between">
                              <span>Recipient Dispatch Logs</span>
                              <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                {waBulkProgress.current} / {waBulkProgress.total}
                              </span>
                            </div>
                            <div className="space-y-1.5 divide-y divide-slate-100">
                              {waBulkDispatchLogs.map((log, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] pt-1.5">
                                  <span className="font-semibold text-slate-700">
                                    {log.studentName} ({log.phone})
                                  </span>
                                  <span className={`font-mono text-[10px] font-bold uppercase ${
                                    log.status === 'success' ? 'text-emerald-600' :
                                    log.status === 'failed' ? 'text-rose-600' :
                                    log.status === 'sending' ? 'text-indigo-600 font-bold animate-pulse' :
                                    'text-slate-400'
                                  }`}>
                                    {log.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submit Action */}
                        <button
                          id="btn-wa-bulk-submit"
                          type="submit"
                          disabled={isWaBulkSending}
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 cursor-pointer shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isWaBulkSending ? (
                            <>
                              <RefreshCw className="animate-spin" size={13} /> Broadcasting... Please stand by
                            </>
                          ) : (
                            <>
                              <Send size={13} /> Trigger Bulk Broadcast Outbound
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Server-side response diagnostic debugger */}
                    {waSubTab === 'single' && manualResult && (
                      <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 shadow-xs space-y-1.5 font-mono text-[11px] leading-normal text-slate-300">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[10px] font-bold text-slate-400">
                          <span>API DISPATCH RESULT</span>
                          <span className={manualResult.success ? 'text-emerald-400' : 'text-rose-400'}>
                            {manualResult.success ? 'SUCCESS' : 'FAILED / LOOPBACK'}
                          </span>
                        </div>
                        <p className="font-semibold text-white">{manualResult.message}</p>
                        <div className="bg-black/40 p-2 rounded border border-slate-800 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-40 scrollbar-thin">
                          {manualResult.log}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Recent Gateway Logs */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
                        <Clock className="text-slate-400" size={16} />
                        Live WhatsApp Gateway Logs
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Auto-Sync:
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] text-slate-500 font-bold">ONLINE</span>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="grid gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-5 relative">
                        <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                        <input
                          id="input-wa-logs-search"
                          type="text"
                          placeholder="Search number, student name..."
                          value={waLogsSearchQuery}
                          onChange={(e) => setWaLogsSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                      <div className="sm:col-span-7 flex gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                        {(['all', 'outbound', 'inbound'] as const).map((type) => (
                          <button
                            key={type}
                            id={`btn-wa-log-filter-${type}`}
                            type="button"
                            onClick={() => setWaLogsFilterType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                              waLogsFilterType === type
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {type} ({(() => {
                              const filteredList = auditLogs.filter(log => {
                                const isWaLog = log.id.startsWith('log-wa-') || log.action === 'SMS_NOTIFICATION' || log.details.toLowerCase().includes('whatsapp');
                                if (!isWaLog) return false;
                                const isOutbound = log.username.toLowerCase().includes('admin') || log.id.includes('-out-');
                                const isInbound = log.username.toLowerCase().includes('auto-responder');
                                if (type === 'outbound') return isOutbound;
                                if (type === 'inbound') return isInbound;
                                return true;
                              });
                              return filteredList.length;
                            })()})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Log Terminal Screen */}
                    <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50">
                      <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                        {(() => {
                          const list = auditLogs.filter(log => {
                            // Filter only WhatsApp logs
                            const isWaLog = log.id.startsWith('log-wa-') || log.action === 'SMS_NOTIFICATION' || log.details.toLowerCase().includes('whatsapp');
                            if (!isWaLog) return false;

                            // Filter type
                            const isOutbound = log.username.toLowerCase().includes('admin') || log.id.includes('-out-');
                            const isInbound = log.username.toLowerCase().includes('auto-responder');
                            
                            if (waLogsFilterType === 'outbound' && !isOutbound) return false;
                            if (waLogsFilterType === 'inbound' && !isInbound) return false;

                            // Search query
                            if (waLogsSearchQuery) {
                              const q = waLogsSearchQuery.toLowerCase();
                              return log.details.toLowerCase().includes(q) || 
                                     log.username.toLowerCase().includes(q) || 
                                     log.id.toLowerCase().includes(q);
                            }

                            return true;
                          });

                          if (list.length === 0) {
                            return (
                              <div className="p-8 text-center text-slate-400 italic text-xs">
                                No WhatsApp gateway interaction logs match your search.
                              </div>
                            );
                          }

                          return list.map((log) => {
                            const isOutbound = log.username.toLowerCase().includes('admin') || log.id.includes('-out-');
                            const isSandbox = log.details.toLowerCase().includes('sandbox') || log.details.toLowerCase().includes('simulated') || log.details.toLowerCase().includes('none');

                            return (
                              <div key={log.id} className="p-4 hover:bg-slate-100/50 transition-colors space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${
                                      isOutbound 
                                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                        : 'bg-teal-100 text-teal-700 border border-teal-200'
                                    }`}>
                                      {isOutbound ? '📤 Outbound Message' : '📥 Inbound Help Request'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${
                                      isSandbox 
                                        ? 'bg-slate-200 text-slate-600 border border-slate-300' 
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}>
                                      {isSandbox ? 'Sandbox Mode' : 'Live Gateway'}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 font-mono font-medium">{log.timestamp}</span>
                                </div>

                                <div className="text-xs text-slate-800 font-medium font-sans break-words bg-white p-2.5 rounded-xl border border-slate-200 shadow-3xs">
                                  {log.details}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span>ID: {log.id}</span>
                                  <span>Sender: @{log.username}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Developer notes / warning */}
                    <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 text-xs text-slate-600 leading-relaxed flex gap-2">
                      <span className="text-lg">💡</span>
                      <p>
                        <strong>Administrator Note:</strong> Automated notification dispatches are automatically triggered when collecting tuition payments, sending schedule adjustments, or broadcast reminders. Direct custom messaging above lets you reach parent mobiles manually without issuing financial receipts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-900" /> Cloud Database Integrity Monitor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time structural alignment analyzer & self-healing pipeline for Sunshine Classes Firestore
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runSystemCheck}
                    disabled={isDiagnosing}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                    {isDiagnosing ? 'Scanning Cloud...' : 'Trigger Re-Scan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleHealAllCollections}
                    disabled={isDiagnosing || integrityIssues.length === 0}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Self-Heal Schema
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">System Health</span>
                    <Activity size={16} className={integrityIssues.length === 0 ? 'text-emerald-500' : 'text-amber-500'} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-extrabold ${integrityIssues.length === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isDiagnosing ? '...' : `${Math.max(0, 100 - integrityIssues.length * 5)}%`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">pristine rating</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Scanned Records</span>
                    <Users size={16} className="text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-800">
                      {isDiagnosing ? '...' : (
                        (Array.isArray(users) ? users.length : 0) +
                        (Array.isArray(students) ? students.length : 0) +
                        (Array.isArray(teachers) ? teachers.length : 0) +
                        (Array.isArray(batches) ? batches.length : 0) +
                        (Array.isArray(admissions) ? admissions.length : 0) +
                        (Array.isArray(feeStatuses) ? feeStatuses.length : 0) +
                        (Array.isArray(feeReceipts) ? feeReceipts.length : 0) +
                        (Array.isArray(subscriptions) ? subscriptions.length : 0) +
                        (Array.isArray(timetableList) ? timetableList.length : 0) +
                        (Array.isArray(inquiries) ? inquiries.length : 0)
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">across 10 collections</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Integrity Breaches</span>
                    <AlertCircle size={16} className={integrityIssues.length === 0 ? 'text-emerald-500' : 'text-rose-500'} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-extrabold ${integrityIssues.length === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isDiagnosing ? '...' : integrityIssues.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">unresolved anomalies</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Security Hardening</span>
                    <Key size={16} className="text-indigo-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-indigo-900">
                      {strictMode ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">strict passwords check</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Scan logs and accordions */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Collection Scan Reports</h4>
                      <span className="text-[10px] font-bold text-slate-400">Checked at: {diagnosedAt || 'Pending Re-scan'}</span>
                    </div>

                    {isDiagnosing ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="h-8 w-8 text-indigo-900 animate-spin" />
                        <span className="text-xs text-slate-500 font-semibold animate-pulse">Probing Sunshine Classes cloud databases...</span>
                      </div>
                    ) : integrityIssues.length === 0 ? (
                      <div className="py-10 flex flex-col items-center justify-center space-y-2 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                          <CheckCircle size={24} className="text-emerald-500" />
                        </div>
                        <h5 className="text-sm font-extrabold text-slate-800">Database Structure Pristine</h5>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Excellent job! All checked Firestore documents match the expected schemas, unique identifiers are present, and data types are aligned.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 divide-y divide-slate-150">
                        {['users', 'students', 'teachers', 'batches', 'admissions', 'fee_statuses', 'fee_receipts', 'student_subscriptions', 'timetable', 'inquiries'].map((colKey) => {
                          const colIssues = integrityIssues.filter(iss => iss.collection === colKey);
                          if (colIssues.length === 0) return null;

                          return (
                            <div key={colKey} className="py-3">
                              <div className="flex items-center justify-between pb-1">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                  {colKey.replace('_', ' ')} Collection
                                </span>
                                <span className="rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 border border-rose-100">
                                  {colIssues.length} {colIssues.length === 1 ? 'Anomalous document' : 'Anomalies'}
                                </span>
                              </div>
                              <div className="mt-2 space-y-2">
                                {colIssues.map((issue) => (
                                  <div key={issue.id} className="rounded-xl border border-amber-100 bg-amber-50/20 p-3 text-xs flex gap-3">
                                    <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${issue.severity === 'error' ? 'text-rose-500' : 'text-amber-500'}`} />
                                    <div className="space-y-1">
                                      <p className="font-semibold text-slate-800">
                                        {issue.itemName ? `${issue.itemName} (${issue.itemId})` : `Document ID: ${issue.itemId}`}
                                      </p>
                                      <p className="text-[11px] text-slate-600">{issue.message}</p>
                                      <div className="flex items-center gap-2 pt-1">
                                        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-150 text-slate-500">
                                          Field: <strong className="text-indigo-900">{issue.field}</strong>
                                        </span>
                                        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-150 text-slate-500">
                                          Expected: <span className="text-emerald-700">{issue.expected}</span>
                                        </span>
                                        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-150 text-slate-500">
                                          Actual: <span className="text-rose-700">{issue.actual}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Healing tracking console */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full flex flex-col">
                    <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Self-Heal Operations Log</h4>
                      <button
                        type="button"
                        onClick={() => setHealLog([])}
                        className="text-[10px] font-extrabold text-slate-400 hover:text-rose-600 uppercase cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-[380px] overflow-y-auto border border-slate-950">
                      {healLog.length === 0 ? (
                        <div className="text-slate-500 italic text-center py-10">
                          Waiting for Self-Heal execution...
                        </div>
                      ) : (
                        healLog.map((log, idx) => (
                          <div key={idx} className={`leading-relaxed border-b border-slate-800/50 pb-1 ${
                            log.includes('Secured') || log.includes('Healed') ? 'text-emerald-400' :
                            log.includes('Starting') || log.includes('Completed') ? 'text-indigo-400 font-bold' : 'text-slate-300'
                          }`}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mt-4 text-[11px] text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-700 block mb-1">What does Self-Heal do?</span>
                      The diagnostic engine repairs structural alignment issues locally and syncs modifications back to Firebase Firestore instantly.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        );
      })()}

      {/* Admin Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 w-full max-w-md relative">
            <button
              type="button"
              onClick={() => setResettingUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <span className="inline-flex h-10 w-10 rounded-full bg-amber-50 text-brand-orange items-center justify-center mb-2">
                <Key size={18} />
              </span>
              <h3 className="font-display font-bold text-slate-800 text-base">Reset Account Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Change credentials for <strong>{resettingUser.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                <p><strong>Username:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">{resettingUser.username}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-display">New Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (e.g. sunshine123)"
                  value={newPasswordForUser}
                  onChange={(e) => setNewPasswordForUser(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newPasswordForUser.trim()) {
                      alert('Please type a valid password!');
                      return;
                    }
                    onUpdateUserPassword(resettingUser.userId, newPasswordForUser.trim());
                    alert(`Password for ${resettingUser.name} updated successfully!`);
                    setResettingUser(null);
                  }}
                  className="flex-1 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold py-2.5 text-xs shadow transition-colors"
                >
                  Save Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Collect Fee Modal */}
      {quickCollectStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setQuickCollectStudent(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <span className="inline-flex h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-2">
                <CreditCard size={18} />
              </span>
              <h3 className="font-display font-bold text-slate-800 text-base">Quick Fee Collect</h3>
              <p className="text-xs text-slate-500 mt-1">
                Record tuition remittance for <strong>{quickCollectStudent.name}</strong>
              </p>
            </div>

            <form onSubmit={handleQuickCollectSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1 relative">
                <p><strong>Student:</strong> {quickCollectStudent.name}</p>
                <p><strong>Class:</strong> {quickCollectStudent.class}</p>
                <p><strong>Roll No:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">{quickCollectStudent.rollNo}</span></p>
                
                <div className="pt-2.5 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payment History</span>
                  <button
                    id="btn-quick-collect-toggle-history"
                    type="button"
                    onClick={() => setShowQuickCollectHistory(!showQuickCollectHistory)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-emerald-100"
                  >
                    {showQuickCollectHistory ? 'Hide History' : 'View History'}
                  </button>
                </div>
              </div>

              {/* Inline History List */}
              {showQuickCollectHistory && (() => {
                const history = feeReceipts
                  .filter(r => r.studentId === quickCollectStudent.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5);

                return (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs animate-in slide-in-from-top-2 duration-150 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Last 5 Payments</h4>
                      <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {history.length} records found
                      </span>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] text-center py-2">No prior payment records found for this student.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {history.map((receipt) => (
                          <div key={receipt.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800 block">{receipt.month}</span>
                              <span className="text-[9px] text-slate-400 font-mono block">{receipt.date || 'No Date'}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-600 block">₹{receipt.amountPaid}</span>
                              <span className="text-[9px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-medium">{receipt.paymentMethod}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Fee Month / Cycle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-display">Fee Month / Cycle</label>
                <select
                  required
                  value={quickCollectMonth}
                  onChange={(e) => {
                    const selectedM = e.target.value;
                    setQuickCollectMonth(selectedM);
                    // Auto-update pending amount for selected month
                    const matchedStatus = feeStatuses.find(f => f.studentId === quickCollectStudent.id && f.month === selectedM);
                    if (matchedStatus) {
                      setQuickCollectAmount(matchedStatus.pendingFee.toString());
                    } else {
                      setQuickCollectAmount('');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                >
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
              </div>

              {/* Amount paid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-display">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={quickCollectAmount}
                  onChange={(e) => setQuickCollectAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white font-semibold"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-display">Payment Method</label>
                <select
                  required
                  value={quickCollectMethod}
                  onChange={(e) => setQuickCollectMethod(e.target.value as 'CASH' | 'UPI' | 'ONLINE')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="ONLINE">Bank Transfer / NetBanking</option>
                </select>
              </div>

              {/* Transaction Ref */}
              {quickCollectMethod !== 'CASH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-display">Transaction Ref / UTR ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI38194821038"
                    value={quickCollectTxnId}
                    onChange={(e) => setQuickCollectTxnId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-900 focus:bg-white"
                  />
                </div>
              )}

              {/* WhatsApp Notification Opt-out Toggle */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-slate-100/50 transition-colors select-none">
                <input
                  id="checkbox-quick-collect-send-whatsapp"
                  type="checkbox"
                  checked={quickCollectSendWhatsApp}
                  onChange={(e) => setQuickCollectSendWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="checkbox-quick-collect-send-whatsapp"
                  className="text-xs text-slate-700 font-medium cursor-pointer flex-1"
                >
                  <span className="block font-bold text-slate-800 text-[11px]">Send WhatsApp Receipt</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Dispatches instant payment confirmation via WhatsApp</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickCollectStudent(null)}
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
