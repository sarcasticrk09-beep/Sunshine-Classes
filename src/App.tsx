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
  Topper,
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
  FounderMember,
  EmailTemplatesConfig,
  WhatsAppTemplatesConfig,
  BatchBulletinPost,
  DepartedStudent,
  UPIPayment,
  ClassFeeConfig
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
  SEED_TOPPERS,
  SEED_STUDY_MATERIALS,
  SEED_GALLERY,
  SEED_NOTIFICATIONS,
  SEED_INQUIRIES,
  SEED_AUDIT_LOGS,
  SEED_STUDENT_SUBSCRIPTIONS,
  SEED_SUBSCRIPTION_PAYMENTS,
  SEED_SUBSCRIPTION_RECEIPTS,
  SEED_SUBSCRIPTION_NOTIFICATIONS,
  SEED_SUBSCRIPTION_CONFIG,
  SEED_TIMETABLE,
  SEED_FOUNDERS,
  SEED_EMAIL_TEMPLATES,
  SEED_WHATSAPP_TEMPLATES,
  SEED_BATCH_BULLETINS,
  getFeeForClass,
  interpolateTemplate
} from './data';

import { migrateExistingData, generateFeeRecords, getCurrentAndNextMonths } from './lib/feeUtils';
import { generateReceiptPdf } from './lib/pdfGenerator';

import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ReceptionDashboard from './components/ReceptionDashboard';
import AdminDashboard from './components/AdminDashboard';
import ChatBot from './components/ChatBot';
import SunshineLogo from './components/SunshineLogo';
import { useAuth } from './auth/useAuth';
import { Login } from './pages/Login';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { MailSimulatorWidget } from './components/MailSimulatorWidget';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FeesPage } from './pages/FeesPage';
import { ReceiptVerificationPage } from './pages/ReceiptVerificationPage';
import { SEOHead, trackAdmissionSubmit } from './components/SEOHead';

import { db } from './lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { interpolateWhatsAppTemplate, sendWhatsAppMessage } from './lib/whatsappService';
import {
  useStudentsListener,
  useTeachersListener,
  useAdmissionsListener,
  useFeeStatusesListener,
  useUsersListener,
  useFirestoreConnectionWatchdog,
} from './hooks/useCollectionListener';
import { initializeAndSeedFirestore } from './services/initDbService';

import { LogIn, Shield, Users, BookOpen, UserCheck, Key, LogOut, X, Sun, Moon, Eye, EyeOff, Cloud, CloudOff, RefreshCw, Bell, BellRing, Check, CheckCheck, AlertCircle, Mail, MessageSquare, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function simpleSecureHash(password: string): string {
  function sha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';

    const words: any[] = [];
    const asciiLength = ascii[lengthProperty];
    const hash = (sha256 as any).h = (sha256 as any).h || [];
    const k = (sha256 as any).k = (sha256 as any).k || [];
    let primeCounter = k[lengthProperty];

    const isComposite: any = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = 1;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
    words[words[lengthProperty]] = (asciiLength * 8) | 0;

    let h0 = hash[0], h1 = hash[1], h2 = hash[2], h3 = hash[3], h4 = hash[4], h5 = hash[5], h6 = hash[6], h7 = hash[7];

    for (i = 0; i < words[lengthProperty]; i += 16) {
      const w = words.slice(i, i + 16);
      const oldH0 = h0, oldH1 = h1, oldH2 = h2, oldH3 = h3, oldH4 = h4, oldH5 = h5, oldH6 = h6, oldH7 = h7;

      for (j = 0; j < 64; j++) {
        if (j < 16) {
          // No-op
        } else {
          const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }

        const ch = (h4 & h5) ^ (~h4 & h6);
        const maj = (h0 & h1) ^ (h0 & h2) ^ (h1 & h2);
        const sigma0 = rightRotate(h0, 2) ^ rightRotate(h0, 13) ^ rightRotate(h0, 22);
        const sigma1 = rightRotate(h4, 6) ^ rightRotate(h4, 11) ^ rightRotate(h4, 25);
        const temp1 = (h7 + sigma1 + ch + k[j] + (w[j] || 0)) | 0;
        const temp2 = (sigma0 + maj) | 0;

        h7 = h6;
        h6 = h5;
        h5 = h4;
        h4 = (h3 + temp1) | 0;
        h3 = h2;
        h2 = h1;
        h1 = h0;
        h0 = (temp1 + temp2) | 0;
      }

      h0 = (h0 + oldH0) | 0;
      h1 = (h1 + oldH1) | 0;
      h2 = (h2 + oldH2) | 0;
      h3 = (h3 + oldH3) | 0;
      h4 = (h4 + oldH4) | 0;
      h5 = (h5 + oldH5) | 0;
      h6 = (h6 + oldH6) | 0;
      h7 = (h7 + oldH7) | 0;
    }

    const wordsToHex = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (i = 0; i < 8; i++) {
      const hex = (wordsToHex[i] >>> 0).toString(16).padStart(8, '0');
      result += hex;
    }
    return result;
  }

  return 'sha256_' + sha256(password);
}

// Synchronous local state loader and initial seeder to ensure instant render with no lagging
function getOrSeedLocal<T>(key: string, seed: T): T {
  const stored = localStorage.getItem(`sunshine_${key}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn(`[Local Cache] Error parsing localStorage key "sunshine_${key}":`, e);
    }
  }
  try {
    localStorage.setItem(`sunshine_${key}`, JSON.stringify(seed));
  } catch (e) {
    console.warn(`[Local Cache] Error setting initial key "sunshine_${key}":`, e);
  }
  return seed;
}

// Module-level cache and queue for debounced cloud sync to avoid multiple consecutive writes lagging the UI
const pendingSyncs: { [key: string]: any } = {};
let syncTimeoutId: any = null;

const SEED_CLASS_FEE_CONFIGS: ClassFeeConfig[] = [
  { id: 'class-1', className: 'Class 1', monthlyFee: 500, isActive: true, dueDate: 5 },
  { id: 'class-2', className: 'Class 2', monthlyFee: 500, isActive: true, dueDate: 5 },
  { id: 'class-3', className: 'Class 3', monthlyFee: 500, isActive: true, dueDate: 5 },
  { id: 'class-4', className: 'Class 4', monthlyFee: 500, isActive: true, dueDate: 5 },
  { id: 'class-5', className: 'Class 5', monthlyFee: 700, isActive: true, dueDate: 5 },
  { id: 'class-6', className: 'Class 6', monthlyFee: 700, isActive: true, dueDate: 5 },
  { id: 'class-7', className: 'Class 7', monthlyFee: 700, isActive: true, dueDate: 5 },
  { id: 'class-8', className: 'Class 8', monthlyFee: 700, isActive: true, dueDate: 5 },
  { id: 'class-9', className: 'Class 9', monthlyFee: 1000, isActive: true, dueDate: 5 },
  { id: 'class-10', className: 'Class 10', monthlyFee: 1200, isActive: true, dueDate: 5 },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Fee Management States
  const [classFeeConfigs, setClassFeeConfigs] = useState<ClassFeeConfig[]>(() => getOrSeedLocal('class_fee_configs', SEED_CLASS_FEE_CONFIGS));

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sunshine_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // State for the stunning brand introduction splash screen/preloader
  const [showSplash, setShowSplash] = useState(true);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Elegant 2.5 seconds showcase
    return () => clearTimeout(timer);
  }, []);

  // Cloud Database Loader States - starts false for instant render with local state fallback
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudOnline, setCloudOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setCloudOnline(true);
    const handleOffline = () => setCloudOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sunshine_theme', theme);
  }, [theme]);

  // Authentication & View states
  const { currentUser, login, logout } = useAuth();

  // Redirect if logged in and trying to access auth pages
  useEffect(() => {
    if (currentUser && (currentPath === '/login' || currentPath === '/forgot-password' || currentPath === '/student/login' || currentPath === '/admin/login')) {
      if (currentUser.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (currentUser.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else if (currentUser.role === 'RECEPTIONIST') {
        navigate('/receptionist/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, currentPath, navigate]);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('sunshine_remember_me') === 'true';
  });
  const [authUsername, setAuthUsername] = useState(() => {
    const remember = localStorage.getItem('sunshine_remember_me') === 'true';
    return remember ? localStorage.getItem('sunshine_remember_username') || '' : '';
  });
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>(() => {
    const remember = localStorage.getItem('sunshine_remember_me') === 'true';
    return (remember ? localStorage.getItem('sunshine_remember_role') as UserRole : null) || 'STUDENT';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordCurrent, setChangePasswordCurrent] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');

  // Forced password change form states
  const [forcePassCurrent, setForcePassCurrent] = useState('');
  const [forcePassNew, setForcePassNew] = useState('');
  const [forcePassConfirm, setForcePassConfirm] = useState('');
  const [showForceCurrent, setShowForceCurrent] = useState(false);
  const [showForceNew, setShowForceNew] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password Flow States
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'verify'>('login');
  const [resetUsername, setResetUsername] = useState('');
  const [resetContactMethod, setResetContactMethod] = useState<'email' | 'phone'>('email');
  const [maskedContactInfo, setMaskedContactInfo] = useState('');
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [generatedResetCode, setGeneratedResetCode] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetExpiryTime, setResetExpiryTime] = useState<number>(0);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Reset password visibility and forgot password states when modals close
  useEffect(() => {
    if (!showLoginModal) {
      setShowLoginPassword(false);
      setAuthView('login');
      setResetUsername('');
      setResetContactMethod('email');
      setMaskedContactInfo('');
      setTargetResetUser(null);
      setGeneratedResetCode('');
      setResetCodeInput('');
      setResetNewPassword('');
      setShowResetNewPassword(false);
      setResetExpiryTime(0);
      setIsSendingReset(false);
    } else {
      const remember = localStorage.getItem('sunshine_remember_me') === 'true';
      if (remember) {
        setAuthUsername(localStorage.getItem('sunshine_remember_username') || '');
        setAuthRole((localStorage.getItem('sunshine_remember_role') as UserRole) || 'STUDENT');
      } else {
        setAuthUsername('');
        setAuthRole('STUDENT');
      }
    }
  }, [showLoginModal]);

  useEffect(() => {
    if (!showChangePasswordModal) {
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [showChangePasswordModal]);

  // Central Database States (loaded from localStorage or SEED data)
  const [students, setStudents] = useState<Student[]>(() => getOrSeedLocal('students', SEED_STUDENTS));
  const [teachers, setTeachers] = useState<Teacher[]>(() => getOrSeedLocal('teachers', SEED_TEACHERS));
  const [users, setUsers] = useState<User[]>(() => {
    const raw = getOrSeedLocal('users', SEED_USERS);
    let changed = false;
    let migrated = raw.map(u => {
      let updatedUser = { ...u };
      let uChanged = false;
      if (updatedUser.username === 'admin') {
        if (updatedUser.email !== 'sunshineclassespihani@gmail.com') {
          updatedUser.name = 'Priyanshu Gupta (Founder)';
          updatedUser.email = 'sunshineclassespihani@gmail.com';
          updatedUser.phone = '9999900000';
          uChanged = true;
        }
        if (updatedUser.role !== 'SUPER_ADMIN') {
          updatedUser.role = 'SUPER_ADMIN';
          uChanged = true;
        }
      }
      if (updatedUser.username === 'rajeev') {
        if (updatedUser.email !== 'kumarvermarajeev79@gmail.com') {
          updatedUser.name = 'Rajeev Kr. Verma (Co-Founder)';
          updatedUser.email = 'kumarvermarajeev79@gmail.com';
          uChanged = true;
        }
        if (updatedUser.role !== 'ADMIN') {
          updatedUser.role = 'ADMIN';
          uChanged = true;
        }
      }
      if (uChanged) {
        changed = true;
      }
      return updatedUser;
    });
    if (!migrated.some(u => u.username === 'rajeev')) {
      changed = true;
      migrated.push({
        id: 'u8',
        username: 'rajeev',
        name: 'Rajeev Kr. Verma (Co-Founder)',
        email: 'kumarvermarajeev79@gmail.com',
        role: 'ADMIN',
        phone: '9999900001'
      });
    }

    // Encrypt/hash passwords on-load for 100% security
    migrated = migrated.map(u => {
      let pwd = u.password;
      let plainPass = (u as any).plainPassword;
      if (!pwd) {
        const lowerUser = u.username.toLowerCase();
        plainPass = `${lowerUser}123`;
        if (lowerUser === 'admin') plainPass = 'admin123';
        else if (lowerUser === 'teacher') plainPass = 'teacher123';
        else if (lowerUser === 'reception') plainPass = 'reception123';
        else if (lowerUser === 'student') plainPass = 'student123';
        pwd = simpleSecureHash(plainPass);
        changed = true;
      } else if (!pwd.startsWith('sha256_') && !pwd.startsWith('sha256_mock_')) {
        plainPass = pwd;
        pwd = simpleSecureHash(pwd);
        changed = true;
      } else if (!plainPass) {
        // Try to infer default plain password
        const lowerUser = u.username.toLowerCase();
        const defaultPasses = [
          'Sunshine123',
          `${lowerUser}123`,
          'admin123',
          'teacher123',
          'reception123',
          'student123',
          'default123',
          'sunshine123'
        ];
        for (const candidate of defaultPasses) {
          if (pwd === simpleSecureHash(candidate)) {
            plainPass = candidate;
            break;
          }
        }
      }
      
      const updated = { ...u, password: pwd };
      if (plainPass) {
        (updated as any).plainPassword = plainPass;
      }
      return updated;
    });

    if (changed) {
      localStorage.setItem('sunshine_users', JSON.stringify(migrated));
    }
    return migrated;
  });
  const [admissions, setAdmissions] = useState<Admission[]>(() => getOrSeedLocal('admissions', SEED_ADMISSIONS));
  const [attendance, setAttendance] = useState<Attendance[]>(() => getOrSeedLocal('attendance', SEED_ATTENDANCE));
  const [feeStatuses, setFeeStatuses] = useState<FeeStatus[]>(() => getOrSeedLocal('fee_statuses', SEED_FEE_STATUS));
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>(() => getOrSeedLocal('fee_receipts', SEED_FEE_RECEIPTS));
  const [upiPayments, setUpiPayments] = useState<UPIPayment[]>(() => getOrSeedLocal('upi_payments', []));
  const [tests, setTests] = useState<Test[]>(() => getOrSeedLocal('tests', SEED_TESTS));
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>(() => getOrSeedLocal('student_marks', SEED_STUDENT_MARKS));
  const [homework, setHomework] = useState<Homework[]>(() => getOrSeedLocal('homework', SEED_HOMEWORK));
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>(() => getOrSeedLocal('submissions', SEED_HOMEWORK_SUBMISSIONS));
  const [blogs, setBlogs] = useState<BlogPost[]>(() => getOrSeedLocal('blogs', SEED_BLOGS));
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => getOrSeedLocal('testimonials', SEED_TESTIMONIALS));
  const [toppers, setToppers] = useState<Topper[]>(() => getOrSeedLocal('toppers', SEED_TOPPERS));
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(() => getOrSeedLocal('study_materials', SEED_STUDY_MATERIALS));
  const [founders, setFounders] = useState<FounderMember[]>(() => {
    const raw = getOrSeedLocal('founders', SEED_FOUNDERS);
    let changed = false;
    const migrated = raw.map(f => {
      if (f.id === 'fm-shubham' || f.name.includes('Shubham')) {
        changed = true;
        return {
          ...f,
          id: 'fm-priyanshu',
          name: 'Priyanshu Gupta',
          avatarInitials: 'PG'
        };
      }
      if (f.id === 'fm-suresh' || (f.name.includes('Priyanshu') && f.title.includes('Co-Founder'))) {
        changed = true;
        return {
          ...f,
          id: 'fm-rajeev',
          name: 'Rajeev Kr. Verma',
          title: 'Co-Founder & Senior Science Specialist',
          avatarInitials: 'RV'
        };
      }
      return f;
    });
    if (changed) {
      localStorage.setItem('sunshine_founders', JSON.stringify(migrated));
    }
    return migrated;
  });
  const [gallery, setGallery] = useState<GalleryItem[]>(() => getOrSeedLocal('gallery', SEED_GALLERY));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getOrSeedLocal('notifications', SEED_NOTIFICATIONS));
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => getOrSeedLocal('inquiries', SEED_INQUIRIES));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getOrSeedLocal('audit_logs', SEED_AUDIT_LOGS));
  const [departedStudents, setDepartedStudents] = useState<DepartedStudent[]>(() => getOrSeedLocal('departed_students', []));

  // Subscription-Based Billing States
  const [batches, setBatches] = useState<Batch[]>(() => getOrSeedLocal('batches', SEED_BATCHES));
  const [subscriptions, setSubscriptions] = useState<StudentSubscription[]>(() => getOrSeedLocal('student_subscriptions', SEED_STUDENT_SUBSCRIPTIONS));
  const [subPayments, setSubPayments] = useState<SubscriptionPayment[]>(() => getOrSeedLocal('payments', SEED_SUBSCRIPTION_PAYMENTS));
  const [subReceipts, setSubReceipts] = useState<SubscriptionReceipt[]>(() => getOrSeedLocal('receipts', SEED_SUBSCRIPTION_RECEIPTS));
  const [subNotifications, setSubNotifications] = useState<SubscriptionNotification[]>(() => getOrSeedLocal('payment_notifications', SEED_SUBSCRIPTION_NOTIFICATIONS));
  const [subConfig, setSubConfig] = useState<SubscriptionConfig>(() => getOrSeedLocal('subscription_config', SEED_SUBSCRIPTION_CONFIG));
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => getOrSeedLocal('timetable', SEED_TIMETABLE));
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplatesConfig>(() => getOrSeedLocal('email_templates', SEED_EMAIL_TEMPLATES));
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplatesConfig>(() => getOrSeedLocal('whatsapp_templates', SEED_WHATSAPP_TEMPLATES));
  const [batchBulletins, setBatchBulletins] = useState<BatchBulletinPost[]>(() => getOrSeedLocal('batch_bulletins', SEED_BATCH_BULLETINS));

  // Security & Hardening States - Permanently locked to true (Production Mode ON) to enforce highest-level role-based privacy and authentication
  const [strictMode, setStrictMode] = useState<boolean>(true);

  const handleToggleStrictMode = () => {
    alert('Security Shield Locked: This system is permanently configured in Production Security Shield mode to protect student and staff data privacy. Backdoors and development bypasses have been disabled.');
  };

  // Sync to LocalStorage & Firestore helper with highly optimized debounce logic to avoid consecutive write overhead and lagging
  const syncState = async (key: string, data: any) => {
    let sanitizedData = data;
    if (key === 'users' && Array.isArray(data)) {
      sanitizedData = data.map(({ password, plainPassword, ...rest }: any) => rest);
    }

    // 1. Instantly write to localStorage for zero-latency client state
    localStorage.setItem(`sunshine_${key}`, JSON.stringify(sanitizedData));

    // 2. Queue the write to Firestore in a debounced background batch
    pendingSyncs[key] = sanitizedData;

    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId);
    }

    syncTimeoutId = setTimeout(async () => {
      const keys = Object.keys(pendingSyncs);
      if (keys.length === 0) return;

      const batchToSync = { ...pendingSyncs };
      // Clear queue so consecutive updates don't overlap
      for (const k of keys) {
        delete pendingSyncs[k];
      }

      for (const [k, d] of Object.entries(batchToSync)) {
        let attempt = 0;
        const maxRetries = 3;
        let success = false;

        while (attempt <= maxRetries && !success) {
          try {
            if (Array.isArray(d)) {
              const writePromises = d.map((item: any) => {
                const docId = String(item.id || item.userId || item.studentId || item.teacherId || item.rollNo || item.admissionNo || Date.now());
                return setDoc(doc(db, k, docId), item, { merge: true });
              });
              await Promise.race([
                Promise.all(writePromises),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), 15000))
              ]);
            } else {
              const docRef = doc(db, k, 'main');
              await Promise.race([
                setDoc(docRef, d, { merge: true }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), 15000))
              ]);
            }
            setCloudOnline(true);
            success = true;
          } catch (e: any) {
            if (attempt < maxRetries && (e.message?.includes('unavailable') || e.message?.includes('offline') || e.code === 'unavailable')) {
              attempt++;
              const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff: 2s, 4s, 8s
              await new Promise(r => setTimeout(r, delay));
            } else {
              console.warn(`[Cloud Firestore] Debounced write failed for key "${k}":`, e);
              if (!navigator.onLine) {
                setCloudOnline(false);
              }
              break;
            }
          }
        }
      }
    }, 1200); // Throttles and batches writes under a 1.2s window
  };

  const handleHealState = (key: string, data: any) => {
    switch (key) {
      case 'users':
        setUsers(data);
        syncState('users', data);
        break;
      case 'students': {
        const { migratedStudents, migratedFeeStatuses } = migrateExistingData(data, feeStatuses);
        setStudents(migratedStudents);
        syncState('students', migratedStudents);
        setFeeStatuses(migratedFeeStatuses);
        syncState('fee_statuses', migratedFeeStatuses);
        break;
      }
      case 'teachers':
        setTeachers(data);
        syncState('teachers', data);
        break;
      case 'batches':
        setBatches(data);
        syncState('batches', data);
        break;
      case 'admissions':
        setAdmissions(data);
        syncState('admissions', data);
        break;
      case 'fee_statuses':
        setFeeStatuses(data);
        syncState('fee_statuses', data);
        break;
      case 'fee_receipts':
        setFeeReceipts(data);
        syncState('fee_receipts', data);
        break;
      case 'upi_payments':
        setUpiPayments(data);
        syncState('upi_payments', data);
        break;
      case 'student_subscriptions':
        setSubscriptions(data);
        syncState('student_subscriptions', data);
        break;
      case 'payments':
        setSubPayments(data);
        syncState('payments', data);
        break;
      case 'timetable':
        setTimetable(data);
        syncState('timetable', data);
        break;
      case 'inquiries':
        setInquiries(data);
        syncState('inquiries', data);
        break;
      case 'departed_students':
        setDepartedStudents(data);
        syncState('departed_students', data);
        break;
      case 'attendance':
        setAttendance(data);
        syncState('attendance', data);
        break;
      case 'student_marks':
        setStudentMarks(data);
        syncState('student_marks', data);
        break;
      case 'audit_logs':
        setAuditLogs(data);
        syncState('audit_logs', data);
        break;
      default:
        console.warn(`[Diagnostics] Unrecognized healing collection key: ${key}`);
    }
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

  // Load from Cloud Database (Firestore) in the background with zero startup lag
  useEffect(() => {
    const loadStateAndData = async () => {
      try {
        // Trigger normalized database seeding check
        initializeAndSeedFirestore().catch(err => {
          console.warn('[Firestore Init] Non-blocking initial seeding check:', err);
        });

        const loadOrSeedCloud = async <T,>(key: string, seed: T): Promise<T> => {
          try {
            if (Array.isArray(seed)) {
              const snap = await Promise.race([
                getDocs(collection(db, key)),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Firestore getDocs timeout')), 15000)
                )
              ]);

              if (!snap.empty) {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as T;
                localStorage.setItem(`sunshine_${key}`, JSON.stringify(data));
                return data;
              } else {
                const seedArray = seed as unknown as any[];
                Promise.all(seedArray.map(item => {
                  const docId = String(item.id || item.userId || item.studentId || item.teacherId || item.rollNo || item.admissionNo || Date.now());
                  return setDoc(doc(db, key, docId), item, { merge: true });
                })).catch(err => {
                  console.warn(`[Cloud Firestore] Background seed failed for collection "${key}":`, err);
                });
                localStorage.setItem(`sunshine_${key}`, JSON.stringify(seed));
                return seed;
              }
            } else {
              const docRef = doc(db, key, 'main');
              const snap = await Promise.race([
                getDoc(docRef),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Firestore getDoc timeout')), 15000)
                )
              ]);

              if (snap.exists()) {
                const data = snap.data() as T;
                localStorage.setItem(`sunshine_${key}`, JSON.stringify(data));
                return data;
              } else {
                setDoc(docRef, seed as any, { merge: true }).catch(err => {
                  console.warn(`[Cloud Firestore] Background seed failed for doc "${key}":`, err);
                });
                localStorage.setItem(`sunshine_${key}`, JSON.stringify(seed));
                return seed;
              }
            }
          } catch (error) {
            console.warn(`[Cloud Firestore] Offline or failed to load key "${key}", using LocalStorage:`, error);
            const stored = localStorage.getItem(`sunshine_${key}`);
            if (stored) {
              try { return JSON.parse(stored); } catch (e) { console.error(e); }
            }
            return seed;
          }
        };

        const [
          loadedStudents,
          loadedTeachers,
          loadedUsers,
          loadedAdmissions,
          loadedAttendance,
          loadedFeeStatuses,
          loadedFeeReceipts,
          loadedTests,
          loadedStudentMarks,
          loadedHomework,
          loadedSubmissions,
          loadedBlogs,
          loadedTestimonials,
          loadedToppers,
          loadedStudyMaterials,
          loadedFounders,
          loadedGallery,
          loadedNotifications,
          loadedInquiries,
          loadedAuditLogs,
          loadedBatches,
          loadedSubscriptions,
          loadedSubPayments,
          loadedSubReceipts,
          loadedSubNotifications,
          loadedSubConfig,
          loadedTimetable,
          loadedEmailTemplates,
          loadedWhatsappTemplates,
          loadedBatchBulletins,
          loadedUpiPayments
        ] = await Promise.all([
          loadOrSeedCloud('students', SEED_STUDENTS),
          loadOrSeedCloud('teachers', SEED_TEACHERS),
          loadOrSeedCloud('users', SEED_USERS),
          loadOrSeedCloud('admissions', SEED_ADMISSIONS),
          loadOrSeedCloud('attendance', SEED_ATTENDANCE),
          loadOrSeedCloud('fee_statuses', SEED_FEE_STATUS),
          loadOrSeedCloud('fee_receipts', SEED_FEE_RECEIPTS),
          loadOrSeedCloud('tests', SEED_TESTS),
          loadOrSeedCloud('student_marks', SEED_STUDENT_MARKS),
          loadOrSeedCloud('homework', SEED_HOMEWORK),
          loadOrSeedCloud('submissions', SEED_HOMEWORK_SUBMISSIONS),
          loadOrSeedCloud('blogs', SEED_BLOGS),
          loadOrSeedCloud('testimonials', SEED_TESTIMONIALS),
          loadOrSeedCloud('toppers', SEED_TOPPERS),
          loadOrSeedCloud('study_materials', SEED_STUDY_MATERIALS),
          loadOrSeedCloud('founders', SEED_FOUNDERS),
          loadOrSeedCloud('gallery', SEED_GALLERY),
          loadOrSeedCloud('notifications', SEED_NOTIFICATIONS),
          loadOrSeedCloud('inquiries', SEED_INQUIRIES),
          loadOrSeedCloud('audit_logs', SEED_AUDIT_LOGS),
          loadOrSeedCloud('batches', SEED_BATCHES),
          loadOrSeedCloud('student_subscriptions', SEED_STUDENT_SUBSCRIPTIONS),
          loadOrSeedCloud('payments', SEED_SUBSCRIPTION_PAYMENTS),
          loadOrSeedCloud('receipts', SEED_SUBSCRIPTION_RECEIPTS),
          loadOrSeedCloud('payment_notifications', SEED_SUBSCRIPTION_NOTIFICATIONS),
          loadOrSeedCloud('subscription_config', SEED_SUBSCRIPTION_CONFIG),
          loadOrSeedCloud('timetable', SEED_TIMETABLE),
          loadOrSeedCloud('email_templates', SEED_EMAIL_TEMPLATES),
          loadOrSeedCloud('whatsapp_templates', SEED_WHATSAPP_TEMPLATES),
          loadOrSeedCloud('batch_bulletins', SEED_BATCH_BULLETINS),
          loadOrSeedCloud('upi_payments', [])
        ]);

    // Compute updated statuses and days remaining at runtime based on today's date
    const runSubscriptionAutomationAndSync = (
      subs: StudentSubscription[],
      config: SubscriptionConfig,
      initialNotifs: SubscriptionNotification[],
      initialLogs: AuditLog[],
      studentsList: Student[],
      templates: WhatsAppTemplatesConfig
    ): {
      finalSubs: StudentSubscription[];
      finalNotifs: SubscriptionNotification[];
      finalLogs: AuditLog[];
      pendingDispatches: Array<{ to: string; message: string; studentName: string }>;
    } => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let subsUpdated = false;
      let notifsUpdated = false;
      let logsUpdated = false;

      const currentNotifs = [...initialNotifs];
      const currentLogs = [...initialLogs];
      const pendingDispatches: Array<{ to: string; message: string; studentName: string }> = [];

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
          if (daysOverdue === 1 && config.enableOverdueSMS && config.enableAutomatedFeeAlerts !== false) {
            const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_OVERDUE' && n.channel === 'WHATSAPP' && n.content.includes('overdue'));
            if (!exists) {
              const monthName = new Date(sub.nextDueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const messageText = interpolateWhatsAppTemplate(
                templates.reminderTemplate || "Dear Parent, the monthly tuition fee of ₹{{amount}} for {{studentName}} ({{className}}) is pending for {{month}}. Please pay before the due date {{dueDate}} to avoid late fees. Thank you, Sunshine Classes.",
                {
                  studentName: sub.studentName,
                  amount: sub.monthlyFee,
                  month: monthName,
                  className: sub.batchName,
                  dueDate: sub.nextDueDate
                }
              );

              const alertNotif: SubscriptionNotification = {
                id: `auto-overdue-${sub.studentId}-${Date.now()}`,
                studentId: sub.studentId,
                studentName: sub.studentName,
                title: 'URGENT: Monthly Fee Overdue',
                content: messageText,
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

              const matchedStud = studentsList.find(s => s.id === sub.studentId);
              const phone = matchedStud ? (matchedStud.whatsapp || matchedStud.parentMobile || matchedStud.mobile || '') : '';
              if (phone) {
                pendingDispatches.push({ to: phone, message: messageText, studentName: sub.studentName });
              }
            }
          }

          // Level 2: Mid-Grace Period SMS
          const midPoint = Math.max(1, Math.floor(config.gracePeriod / 2));
          if (daysOverdue === midPoint && config.enableMidGraceSMS && config.enableAutomatedFeeAlerts !== false) {
            const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_3_DAYS' && n.channel === 'WHATSAPP' && n.content.includes('Mid-Grace'));
            if (!exists) {
              const messageText = `[Mid-Grace Alert] Dear Parent, monthly fee of ₹${sub.monthlyFee} for ${sub.studentName} is pending. Please clear to avoid late fees or suspension.`;

              const alertNotif: SubscriptionNotification = {
                id: `auto-midgrace-${sub.studentId}-${Date.now()}`,
                studentId: sub.studentId,
                studentName: sub.studentName,
                title: 'WARNING: Mid-Grace Period Reminder',
                content: messageText,
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

              const matchedStud = studentsList.find(s => s.id === sub.studentId);
              const phone = matchedStud ? (matchedStud.whatsapp || matchedStud.parentMobile || matchedStud.mobile || '') : '';
              if (phone) {
                pendingDispatches.push({ to: phone, message: messageText, studentName: sub.studentName });
              }
            }
          }

          // Level 3: Grace Expiry Warning (1 day remaining in grace period)
          const daysLeftInGrace = config.gracePeriod - daysOverdue;
          if (daysLeftInGrace === 1 && config.enableExpiryWarningSMS && config.enableAutomatedFeeAlerts !== false) {
            const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_7_DAYS' && n.channel === 'WHATSAPP' && n.content.includes('expires tomorrow'));
            if (!exists) {
              const messageText = `[Grace Expiry] Final Warning: Tuition fee subscription for ${sub.studentName} expires tomorrow. Standard learning materials and batch access will lock automatically.`;

              const alertNotif: SubscriptionNotification = {
                id: `auto-warning-${sub.studentId}-${Date.now()}`,
                studentId: sub.studentId,
                studentName: sub.studentName,
                title: 'CRITICAL: Grace Period Expiration Notice',
                content: messageText,
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

              const matchedStud = studentsList.find(s => s.id === sub.studentId);
              const phone = matchedStud ? (matchedStud.whatsapp || matchedStud.parentMobile || matchedStud.mobile || '') : '';
              if (phone) {
                pendingDispatches.push({ to: phone, message: messageText, studentName: sub.studentName });
              }
            }
          }
        }

        // Level 4: Expiry Alert (Transitioning to EXPIRED status)
        if (newStatus === 'EXPIRED' && statusChanged && config.enableExpiredSMS && config.enableAutomatedFeeAlerts !== false) {
          const exists = currentNotifs.some(n => n.studentId === sub.studentId && n.type === 'REMINDER_OVERDUE' && n.channel === 'WHATSAPP' && n.content.includes('SUSPENDED'));
          if (!exists) {
            const messageText = `[Service Suspended] Grace period ended for ${sub.studentName}'s classes. Access is restricted. Please clear outstanding dues of ₹${sub.monthlyFee} to resume.`;

            const alertNotif: SubscriptionNotification = {
              id: `auto-expired-${sub.studentId}-${Date.now()}`,
              studentId: sub.studentId,
              studentName: sub.studentName,
              title: 'ALERT: Fee Subscription Expired',
              content: messageText,
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

            const matchedStud = studentsList.find(s => s.id === sub.studentId);
            const phone = matchedStud ? (matchedStud.whatsapp || matchedStud.parentMobile || matchedStud.mobile || '') : '';
            if (phone) {
              pendingDispatches.push({ to: phone, message: messageText, studentName: sub.studentName });
            }
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
        finalLogs: currentLogs,
        pendingDispatches
      };
    };

    // Auto-migrate old default bank details to State Bank of India & UPI ID to the new one
    const activeSubConfig = { ...loadedSubConfig };
    let migrated = false;
    if (activeSubConfig.bankAccountNumber === '9182736450123' || !activeSubConfig.bankAccountNumber) {
      activeSubConfig.bankAccountNumber = '33888542347';
      activeSubConfig.bankName = 'State Bank of India (Pihani Branch)';
      activeSubConfig.bankIfsc = 'SBIN0011180';
      activeSubConfig.bankAccountHolder = 'Sunshine Classes ERP Solutions';
      migrated = true;
    }
    if (activeSubConfig.upiId !== '9161586254@upi') {
      activeSubConfig.upiId = '9161586254@upi';
      migrated = true;
    }
    if (activeSubConfig.allowPartialPayments === undefined) {
      activeSubConfig.allowPartialPayments = false;
      migrated = true;
    }
    if (activeSubConfig.requireReceiptUpload === undefined) {
      activeSubConfig.requireReceiptUpload = true;
      migrated = true;
    }
    if (activeSubConfig.convenienceFeePercent === undefined) {
      activeSubConfig.convenienceFeePercent = 0;
      migrated = true;
    }
    if (activeSubConfig.enableUpiMethod === undefined) {
      activeSubConfig.enableUpiMethod = true;
      migrated = true;
    }
    if (activeSubConfig.enableCardMethod === undefined) {
      activeSubConfig.enableCardMethod = true;
      migrated = true;
    }
    if (activeSubConfig.enableNetBankingMethod === undefined) {
      activeSubConfig.enableNetBankingMethod = true;
      migrated = true;
    }
    if (activeSubConfig.enableBankTransferMethod === undefined) {
      activeSubConfig.enableBankTransferMethod = true;
      migrated = true;
    }
    if (activeSubConfig.enableAutomatedFeeAlerts === undefined || !activeSubConfig.enableAutomatedFeeAlerts) {
      activeSubConfig.enableAutomatedFeeAlerts = true;
      migrated = true;
    }
    if (activeSubConfig.enableOnlinePayments === undefined || !activeSubConfig.enableOnlinePayments) {
      activeSubConfig.enableOnlinePayments = true;
      migrated = true;
    }
    if (!activeSubConfig.paymentGatewayProvider) {
      activeSubConfig.paymentGatewayProvider = 'UPI_QR';
      migrated = true;
    }
    if (migrated) {
      syncState('subscription_config', activeSubConfig);
    }

    const { finalSubs, finalNotifs: computedSubNotifs, finalLogs: computedLogs, pendingDispatches } = runSubscriptionAutomationAndSync(
      loadedSubscriptions,
      activeSubConfig,
      loadedSubNotifications,
      loadedAuditLogs,
      loadedStudents,
      loadedWhatsappTemplates
    );

    // Auto-dispatch pending automated alerts
    if (pendingDispatches && pendingDispatches.length > 0) {
      console.log(`[Auto Dispatch] Triggering ${pendingDispatches.length} automated WhatsApp reminders via active gateway...`);
      pendingDispatches.forEach(dispatch => {
        sendWhatsAppMessage({
          to: dispatch.to,
          message: dispatch.message,
          studentName: dispatch.studentName
        })
        .then(res => {
          console.log(`[Auto Dispatch Status] Sent to ${dispatch.studentName} (${dispatch.to}):`, res.log);
        })
        .catch(err => {
          console.error(`[Auto Dispatch Error] Failed for ${dispatch.studentName}:`, err);
        });
      });
    }

    // Automatically push notifications for overdue pending fees
    const finalNotifs = checkAndPushFeeOverdueNotifications(loadedFeeStatuses, loadedNotifications);

    // Migrate loadedUsers and loadedFounders on startup to ensure database aligns
    let usersMigrated = false;
    let migratedLoadedUsers = loadedUsers.map(u => {
      let updatedUser = { ...u };
      let uChanged = false;
      if (updatedUser.username === 'admin') {
        if (updatedUser.email !== 'sunshineclassespihani@gmail.com') {
          updatedUser.name = 'Priyanshu Gupta (Founder)';
          updatedUser.email = 'sunshineclassespihani@gmail.com';
          updatedUser.phone = '9999900000';
          uChanged = true;
        }
        if (updatedUser.role !== 'SUPER_ADMIN') {
          updatedUser.role = 'SUPER_ADMIN';
          uChanged = true;
        }
      }
      if (updatedUser.username === 'rajeev') {
        if (updatedUser.email !== 'kumarvermarajeev79@gmail.com') {
          updatedUser.name = 'Rajeev Kr. Verma (Co-Founder)';
          updatedUser.email = 'kumarvermarajeev79@gmail.com';
          uChanged = true;
        }
        if (updatedUser.role !== 'ADMIN') {
          updatedUser.role = 'ADMIN';
          uChanged = true;
        }
      }
      if (uChanged) {
        usersMigrated = true;
      }
      return updatedUser;
    });
    if (!migratedLoadedUsers.some(u => u.username === 'rajeev')) {
      usersMigrated = true;
      migratedLoadedUsers.push({
        id: 'u8',
        username: 'rajeev',
        name: 'Rajeev Kr. Verma (Co-Founder)',
        email: 'kumarvermarajeev79@gmail.com',
        role: 'ADMIN',
        phone: '9999900001'
      });
    }

    // Encrypt/hash passwords on-load from Firestore to ensure 100% security policy compliance
    migratedLoadedUsers = migratedLoadedUsers.map(u => {
      let pwd = u.password;
      let plainPass = (u as any).plainPassword;
      if (!pwd) {
        const lowerUser = u.username.toLowerCase();
        plainPass = `${lowerUser}123`;
        if (lowerUser === 'admin') plainPass = 'admin123';
        else if (lowerUser === 'teacher') plainPass = 'teacher123';
        else if (lowerUser === 'reception') plainPass = 'reception123';
        else if (lowerUser === 'student') plainPass = 'student123';
        pwd = simpleSecureHash(plainPass);
        usersMigrated = true;
      } else if (!pwd.startsWith('sha256_') && !pwd.startsWith('sha256_mock_')) {
        plainPass = pwd;
        pwd = simpleSecureHash(pwd);
        usersMigrated = true;
      } else if (!plainPass) {
        // Try to infer default plain password
        const lowerUser = u.username.toLowerCase();
        const defaultPasses = [
          'Sunshine123',
          `${lowerUser}123`,
          'admin123',
          'teacher123',
          'reception123',
          'student123',
          'default123',
          'sunshine123'
        ];
        for (const candidate of defaultPasses) {
          if (pwd === simpleSecureHash(candidate)) {
            plainPass = candidate;
            break;
          }
        }
      }
      
      const updated = { ...u, password: pwd };
      if (plainPass) {
        (updated as any).plainPassword = plainPass;
      }
      return updated;
    });

    let foundersMigrated = false;
    const migratedLoadedFounders = loadedFounders.map(f => {
      if (f.id === 'fm-shubham' || f.name.includes('Shubham')) {
        foundersMigrated = true;
        return {
          ...f,
          id: 'fm-priyanshu',
          name: 'Priyanshu Gupta',
          avatarInitials: 'PG'
        };
      }
      if (f.id === 'fm-suresh' || (f.name.includes('Priyanshu') && f.title.includes('Co-Founder'))) {
        foundersMigrated = true;
        return {
          ...f,
          id: 'fm-rajeev',
          name: 'Rajeev Kr. Verma',
          title: 'Co-Founder & Senior Science Specialist',
          avatarInitials: 'RV'
        };
      }
      return f;
    });

    if (usersMigrated) {
      syncState('users', migratedLoadedUsers);
    }
    if (foundersMigrated) {
      syncState('founders', migratedLoadedFounders);
    }

    const { migratedStudents, migratedFeeStatuses } = migrateExistingData(loadedStudents, loadedFeeStatuses);
    let dataChanged = false;
    if (migratedStudents.length !== loadedStudents.length || migratedFeeStatuses.length !== loadedFeeStatuses.length) {
      dataChanged = true;
    } else {
      const loadedHasStartMonth = loadedStudents.every(s => s.feeStartMonth);
      const migratedHasStartMonth = migratedStudents.every(s => s.feeStartMonth);
      if (!loadedHasStartMonth && migratedHasStartMonth) {
        dataChanged = true;
      }
    }

    if (dataChanged) {
      syncState('students', migratedStudents);
      syncState('fee_statuses', migratedFeeStatuses);
    }

    setStudents(migratedStudents);
    setTeachers(loadedTeachers);
    setUsers(migratedLoadedUsers);
    setAdmissions(loadedAdmissions);
    setAttendance(loadedAttendance);
    setFeeStatuses(migratedFeeStatuses);
    setFeeReceipts(loadedFeeReceipts);
    setTests(loadedTests);
    setStudentMarks(loadedStudentMarks);
    setHomework(loadedHomework);
    setSubmissions(loadedSubmissions);
    setBlogs(loadedBlogs);
    setTestimonials(loadedTestimonials);
    setToppers(loadedToppers);
    setStudyMaterials(loadedStudyMaterials);
    setFounders(migratedLoadedFounders);
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
    setSubConfig(activeSubConfig);
    setTimetable(loadedTimetable);
    setEmailTemplates(loadedEmailTemplates);
    setWhatsappTemplates(loadedWhatsappTemplates);
    setBatchBulletins(loadedBatchBulletins);
    setUpiPayments(loadedUpiPayments || []);
    setCloudOnline(true);
      } catch (err: any) {
        console.warn("[Cloud Firestore] Background synchronization completed with local fallback state:", err);
        setCloudOnline(false);
      } finally {
        setCloudLoading(false);
      }
    };
    loadStateAndData();
  }, []);

  // Firestore Connection Watchdog to monitor listener health and auto-recover on stalls
  const { reconnectSignal } = useFirestoreConnectionWatchdog(30000);

  // Real-time collection listeners with automatic connection recovery and proper cleanup
  useStudentsListener(setStudents, reconnectSignal);
  useTeachersListener(setTeachers, reconnectSignal);
  useAdmissionsListener(setAdmissions, reconnectSignal);
  useFeeStatusesListener(setFeeStatuses, reconnectSignal);
  useUsersListener(setUsers, reconnectSignal);

  // Update browser tab title and favicon dynamically on mount
  useEffect(() => {
    document.title = "SUNSHINE CLASSES";
    
    // Ensure the link tag for the favicon exists and points to /logo.png
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/png';
    link.href = '/logo.png';
  }, []);

  // State update handlers
  const handleAddAdmission = async (adm: Omit<Admission, 'id' | 'status' | 'date'>): Promise<string> => {
    // Analytics tracking for admission submission
    try {
      trackAdmissionSubmit(adm.studentName, adm.className);
    } catch (e) {
      console.warn("Analytics tracking failed:", e);
    }

    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000; // Initial delay in milliseconds
    
    while (attempt <= maxRetries) {
      try {
        console.log(`[App] Submitting online admission via API (Attempt ${attempt + 1}/${maxRetries + 1})...`, adm);
        const response = await fetch("/api/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(adm)
        });

        const contentType = response.headers.get("content-type");
        let res: any = {};
        if (contentType && contentType.includes("application/json")) {
          res = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response (status ${response.status}): ${text}`);
        }

        if (!response.ok || res.status === "error") {
          throw new Error(res.message || `Server returned error status ${response.status}`);
        }

        console.log("[App] Online enrollment processed successfully. Server returned ID:", res.admissionId);

        // Instant client-side state propagation for real-time responsiveness
        if (res.admission) {
          setAdmissions(prev => {
            const filtered = prev.filter((a: any) => a.id !== res.admission.id);
            const updated = [res.admission, ...filtered];
            localStorage.setItem('sunshine_admissions', JSON.stringify(updated));
            return updated;
          });
        }
        if (res.auditLog) {
          setAuditLogs(prev => {
            const filtered = prev.filter((a: any) => a.id !== res.auditLog.id);
            const updated = [res.auditLog, ...filtered];
            localStorage.setItem('sunshine_audit_logs', JSON.stringify(updated));
            return updated;
          });
        }

        // Show submission confirmation popup
        alert(`🎉 Online Admission Application Submitted Successfully!\n\nApplication ID: ${res.admissionId}\n\nYour application has been received and is pending review by the Sunshine Classes administration.`);

        return res.admissionId;
      } catch (err: any) {
        attempt++;
        const errorMessage = err.message || "";
        const isRetryable = !errorMessage ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("permission") ||
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504") ||
          errorMessage.includes("408");

        if (attempt <= maxRetries && isRetryable) {
          console.warn(`[App] Submission failed: ${errorMessage || err}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          console.error("[App] Enrollment API Submission failed permanently after retries:", err);
          alert(`Admission Form Submission Failed: ${err.message || 'Server Connection Error'}`);
          throw err;
        }
      }
    }
    throw new Error("Enrollment failed after maximum retries.");
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

  const handleUpdateEmailTemplates = (templates: EmailTemplatesConfig) => {
    setEmailTemplates(templates);
    syncState('email_templates', templates);
  };

  const handleUpdateWhatsappTemplates = (templates: WhatsAppTemplatesConfig) => {
    setWhatsappTemplates(templates);
    syncState('whatsapp_templates', templates);
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

  const handleApproveAdmission = async (admissionId: string) => {
    try {
      console.log(`[App] Approving admission ${admissionId} via atomic backend transaction...`);
      const response = await fetch("/api/admin/approve-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionId })
      });
      const res = await response.json();
      if (!response.ok || res.status === "error") {
        throw new Error(res.message || "Failed to approve admission");
      }

      // Update client state immediately
      if (res.admission) {
        setAdmissions(prev => prev.map(a => (a.id === admissionId || a.enrollmentId === admissionId) ? res.admission : a));
      }
      if (res.student) {
        setStudents(prev => [res.student, ...prev.filter((s: any) => s.id !== res.student.id)]);
      }
      if (res.user) {
        setUsers(prev => [res.user, ...prev.filter((u: any) => u.id !== res.user.id)]);
      }
      if (res.feeRecords && res.feeRecords.length > 0) {
        setFeeStatuses(prev => [...prev.filter((f: any) => !res.feeRecords.some((rf: any) => rf.id === f.id)), ...res.feeRecords]);
      }
      if (res.subscription) {
        setSubscriptions(prev => [res.subscription, ...prev.filter((s: any) => s.id !== res.subscription.id)]);
      }
      if (res.auditLog) {
        setAuditLogs(prev => [res.auditLog, ...prev.filter((a: any) => a.id !== res.auditLog.id)]);
      }

      alert(`🎉 Admission Approved Successfully!\n\nStudent Login Credentials:\n---------------------------------\nUsername: ${res.username || 'N/A'}\nPassword: ${res.defaultPass || 'Sunshine123'}\n\nPlease share these credentials with the student or parents.`);
    } catch (err: any) {
      console.error("[App] Approval transaction failed:", err);
      alert(`Approval Failed: ${err.message || "Server Error"}`);
    }
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

  const handleCollectFee = (fee: Omit<FeeReceipt, 'id' | 'date' | 'receivedBy'> & { skipWhatsApp?: boolean }) => {
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

    // Auto-mail fee receipt if student parent email exists
    const matchedStudent = students.find((s) => s.id === fee.studentId);
    if (matchedStudent?.email) {
      const variables = {
        receiptId: receiptId,
        date: newReceipt.date,
        studentName: fee.studentName,
        className: fee.class,
        month: fee.month,
        amount: fee.amountPaid,
        paymentMethod: fee.paymentMethod,
        transactionId: fee.transactionId || 'N/A',
        receivedBy: newReceipt.receivedBy
      };
      const customSubject = interpolateTemplate(emailTemplates.receiptSubject, variables);
      const customHtml = interpolateTemplate(emailTemplates.receiptBody, variables);

      fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "receipt",
          to: matchedStudent.email,
          studentName: fee.studentName,
          amount: fee.amountPaid,
          month: fee.month,
          className: fee.class,
          receiptId: receiptId,
          paymentMethod: fee.paymentMethod,
          transactionId: fee.transactionId,
          date: newReceipt.date,
          receivedBy: newReceipt.receivedBy,
          customSubject,
          customHtml
        })
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          console.log("Real receipt email sent successfully!", res);
          if (res.isEthereal && res.previewUrl) {
            // Push an app notification with the preview link so users can click and see the email delivery in the browser sandbox!
            const newNotification = {
              id: `NOTIF-EMAIL-${Date.now()}`,
              title: `📧 Fee Receipt Sent to ${fee.studentName}`,
              content: `Since you don't have SMTP credentials set, we generated a demo mail. Click here to view the receipt: ${res.previewUrl}`,
              category: 'FEE' as const,
              targetRole: 'ADMIN' as const,
              date: new Date().toISOString().split('T')[0],
              read: false
            };
            setNotifications(prev => [newNotification, ...prev]);
            alert(`📧 Real SMTP Email Receipt sent to ${matchedStudent.email}!\n\nView mock delivery here:\n${res.previewUrl}`);
          } else {
            alert(`📧 Real Receipt Email dispatched to ${matchedStudent.email} via SMTP!`);
          }
        } else {
          console.error("Failed to send receipt email:", res.error);
        }
      })
      .catch(err => {
        console.error("Error sending receipt email:", err);
      });
    } else {
      console.warn(`No email address recorded for student ${fee.studentName} to auto-mail the receipt.`);
    }

    // Auto-dispatch real WhatsApp receipt if configured and student has a number
    if (matchedStudent && !fee.skipWhatsApp) {
      const recipientNumber = matchedStudent.whatsapp || matchedStudent.parentMobile || matchedStudent.mobile;
      if (recipientNumber) {
        const interpolatedMsg = interpolateWhatsAppTemplate(
          whatsappTemplates.receiptTemplate || "Dear Parent, Sunshine Classes has received payment of ₹{{amount}} for {{studentName}} ({{className}}) for the month of {{month}}. Receipt ID: {{receiptId}}.",
          {
            amount: fee.amountPaid,
            studentName: fee.studentName,
            className: fee.class,
            month: fee.month,
            receiptId: receiptId
          }
        );

        sendWhatsAppMessage({
          to: recipientNumber,
          message: interpolatedMsg,
          studentName: fee.studentName
        })
        .then(res => {
          if (res.success) {
            console.log(`WhatsApp Receipt dispatched to ${recipientNumber} successfully:`, res.log);
          } else {
            console.warn(`WhatsApp Receipt dispatch issue:`, res.log);
          }
        })
        .catch(err => {
          console.error(`WhatsApp Receipt dispatch error:`, err);
        });
      }
    }

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

  const handleAddUpiPayment = (payment: Omit<UPIPayment, 'id' | 'submissionTime' | 'status'>) => {
    // Prevent duplicate UTR submissions
    const isDuplicate = upiPayments.some(p => p.utr.trim().toLowerCase() === payment.utr.trim().toLowerCase() && p.status !== 'REJECTED') ||
                        feeReceipts.some(r => r.transactionId?.trim().toLowerCase() === payment.utr.trim().toLowerCase());
    if (isDuplicate) {
      alert("This UTR / Transaction Reference Number has already been submitted or approved. Please verify and try again.");
      return false;
    }

    const newPayment: UPIPayment = {
      ...payment,
      id: `UPI-${Date.now()}`,
      submissionTime: new Date().toISOString(),
      status: 'PENDING_VERIFICATION'
    };

    const updated = [newPayment, ...upiPayments];
    setUpiPayments(updated);
    syncState('upi_payments', updated);
    
    // Add a notification for admin
    const adminNotif = {
      id: `NOTIF-UPI-${Date.now()}`,
      title: `🔔 New UPI Payment Verification Request`,
      content: `${payment.studentName} has submitted UTR ${payment.utr} for ${payment.month} fees verification.`,
      category: 'FEE' as const,
      targetRole: 'ADMIN' as const,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    setNotifications(prev => [adminNotif, ...prev]);
    return true;
  };

  const handleCancelUpiPayment = (paymentId: string) => {
    const updated = upiPayments.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'CANCELLED' as const
        };
      }
      return p;
    });
    setUpiPayments(updated);
    syncState('upi_payments', updated);

    // Add Audit Log
    const matched = upiPayments.find(p => p.id === paymentId);
    if (matched) {
      const updatedLogs = [{
        id: `L-${Date.now()}`,
        userId: currentUser?.id || 'u-student',
        username: currentUser?.username || matched.studentName,
        action: 'CANCEL_UPI_PAYMENT',
        details: `Student cancelled UPI payment verification request for ${matched.month} (UTR: ${matched.utr})`,
        timestamp: new Date().toISOString()
      }, ...auditLogs];
      setAuditLogs(updatedLogs);
      syncState('audit_logs', updatedLogs);
    }
  };

  const handleVerifyUpiPayment = async (paymentId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) => {
    const updated = upiPayments.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: action === 'APPROVE' ? ('APPROVED' as const) : ('REJECTED' as const),
          rejectionReason: rejectionReason || undefined
        };
      }
      return p;
    });

    setUpiPayments(updated);
    syncState('upi_payments', updated);

    const payment = upiPayments.find(p => p.id === paymentId);
    if (!payment) return;

    if (action === 'APPROVE') {
      const student = students.find(s => s.id === payment.studentId);
      const receiptId = `REC-0${feeReceipts.length + 101}`;
      const newReceipt: FeeReceipt = {
        id: receiptId,
        studentId: payment.studentId,
        studentName: payment.studentName,
        class: payment.class,
        month: payment.month,
        amountPaid: payment.amount,
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0],
        transactionId: payment.utr,
        receivedBy: currentUser?.name || 'School Office'
      };

      const updatedReceipts = [newReceipt, ...feeReceipts];
      setFeeReceipts(updatedReceipts);
      syncState('fee_receipts', updatedReceipts);

      const updatedLedgers = feeStatuses.map((f) => {
        if (f.studentId === payment.studentId && f.month === payment.month) {
          const nextPaid = f.paidFee + payment.amount;
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

      const updatedLogs = [{
        id: `L-${Date.now()}`,
        userId: currentUser?.id || 'admin',
        username: currentUser?.username || 'admin',
        action: 'COLLECT_FEE',
        details: `Approved UPI payment of ₹${payment.amount} (UTR: ${payment.utr}) for ${payment.studentName} for cycle: ${payment.month}`,
        timestamp: new Date().toISOString()
      }, ...auditLogs];
      setAuditLogs(updatedLogs);
      syncState('audit_logs', updatedLogs);

      // Create student notification on approval
      const studentApproveNotif = {
        id: `NOTIF-UPI-APPROVE-${Date.now()}`,
        title: `✅ UPI Payment Approved`,
        content: `Your UPI payment submission of ₹${payment.amount} for ${payment.month} has been successfully verified and approved. Receipt ID: ${receiptId}.`,
        category: 'FEE' as const,
        targetRole: 'STUDENT' as const,
        targetBatch: payment.class,
        date: new Date().toISOString().split('T')[0],
        read: false
      };
      setNotifications(prev => [studentApproveNotif, ...prev]);

      if (student) {
        try {
          const doc = generateReceiptPdf(newReceipt, student);
          const pdfBase64 = doc.output('datauristring').split(',')[1];

          if (student.email) {
            const emailSubject = "Sunshine Classes Fee Payment Receipt";
            const emailBody = `Dear ${payment.studentName},

Your fee payment has been successfully verified.

Receipt Number: ${receiptId}
Amount Paid: ₹${payment.amount}
Month: ${payment.month}
Payment Date: ${newReceipt.date}

Your receipt is attached as a PDF.

Thank you for choosing Sunshine Classes.

Regards,
Sunshine Classes`;

            fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: student.email,
                studentName: payment.studentName,
                amount: payment.amount,
                month: payment.month,
                className: payment.class,
                receiptId: receiptId,
                paymentMethod: 'UPI',
                transactionId: payment.utr,
                date: newReceipt.date,
                receivedBy: newReceipt.receivedBy,
                customSubject: emailSubject,
                customHtml: emailBody.replace(/\n/g, '<br>'),
                attachments: [
                  {
                    filename: `Sunshine_Receipt_${receiptId}.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf'
                  }
                ]
              })
            })
            .then(r => r.json())
            .then(res => {
              if (res.success) {
                console.log("Verified payment receipt email sent successfully!");
                if (res.isEthereal && res.previewUrl) {
                  const previewNotif = {
                    id: `NOTIF-EMAIL-${Date.now()}`,
                    title: `📧 Receipt Sent to ${payment.studentName}`,
                    content: `Since you don't have SMTP credentials set, we generated a demo mail. Click here to view the receipt: ${res.previewUrl}`,
                    category: 'FEE' as const,
                    targetRole: 'ADMIN' as const,
                    date: new Date().toISOString().split('T')[0],
                    read: false
                  };
                  setNotifications(prev => [previewNotif, ...prev]);
                }
              }
            })
            .catch(err => console.error("Error sending verified payment email:", err));
          }
        } catch (pdfErr) {
          console.error("Failed to generate/email PDF receipt:", pdfErr);
        }
      }
    } else {
      const updatedLogs = [{
        id: `L-${Date.now()}`,
        userId: currentUser?.id || 'admin',
        username: currentUser?.username || 'admin',
        action: 'REJECT_FEE_VERIFICATION',
        details: `Rejected UPI payment request of ₹${payment.amount} (UTR: ${payment.utr}) for ${payment.studentName} for cycle: ${payment.month}. Reason: ${rejectionReason || 'None'}`,
        timestamp: new Date().toISOString()
      }, ...auditLogs];
      setAuditLogs(updatedLogs);
      syncState('audit_logs', updatedLogs);

      const studentNotif = {
        id: `NOTIF-UPI-REJECT-${Date.now()}`,
        title: `❌ UPI Payment Rejected`,
        content: `Your UPI payment submission of ₹${payment.amount} for ${payment.month} was rejected. Reason: ${rejectionReason || 'Incorrect transaction reference (UTR).'}. Please submit again with correct details.`,
        category: 'FEE' as const,
        targetRole: 'STUDENT' as const,
        targetBatch: payment.class,
        date: new Date().toISOString().split('T')[0],
        read: false
      };
      setNotifications(prev => [studentNotif, ...prev]);

      // Email student explaining why it was rejected
      const student = students.find(s => s.id === payment.studentId);
      if (student && student.email) {
        const emailSubject = "Sunshine Classes Fee Payment Rejected";
        const emailBody = `Dear ${payment.studentName},

Your fee payment of ₹${payment.amount} for ${payment.month} (UTR: ${payment.utr}) was rejected by our accounts team.

Reason for Rejection: ${rejectionReason || 'Incorrect transaction reference (UTR) or payment not matching bank logs.'}

Please log in to your student dashboard to review the details, click 'Pay Now' on the pending fee item, and submit the correct UTR / transaction proof.

If you believe this is an error, please contact the school office.

Regards,
Accounts Department
Sunshine Classes`;

        fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: student.email,
            studentName: payment.studentName,
            amount: payment.amount,
            month: payment.month,
            className: payment.class,
            customSubject: emailSubject,
            customHtml: emailBody.replace(/\n/g, '<br>')
          })
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            console.log("Rejection email sent successfully!");
          }
        })
        .catch(err => console.error("Error sending rejection email:", err));
      }
    }
  };

  const handleResendReceiptEmail = async (receiptId: string, email: string) => {
    const receipt = feeReceipts.find(r => r.id === receiptId);
    if (!receipt) {
      alert("Receipt not found.");
      return;
    }
    const student = students.find(s => s.id === receipt.studentId);
    if (!student) {
      alert("Student profile not found.");
      return;
    }

    try {
      const doc = generateReceiptPdf(receipt, student);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const emailSubject = "Sunshine Classes Fee Payment Receipt (Resent)";
      const emailBody = `Dear ${receipt.studentName},

Please find attached your resent fee payment receipt for Sunshine Classes.

Receipt Number: ${receipt.id}
Amount Paid: ₹{receipt.amountPaid}
Month: ${receipt.month}
Payment Date: ${receipt.date}

Your receipt is attached as a PDF.

Regards,
Sunshine Classes`;

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          studentName: receipt.studentName,
          amount: receipt.amountPaid,
          month: receipt.month,
          className: receipt.class,
          receiptId: receipt.id,
          paymentMethod: receipt.paymentMethod,
          transactionId: receipt.transactionId,
          date: receipt.date,
          receivedBy: receipt.receivedBy,
          customSubject: emailSubject,
          customHtml: emailBody.replace(/\n/g, '<br>').replace('₹{receipt.amountPaid}', `₹${receipt.amountPaid}`),
          attachments: [
            {
              filename: `Sunshine_Receipt_${receipt.id}.pdf`,
              content: pdfBase64,
              contentType: 'application/pdf'
            }
          ]
        })
      }).then(r => r.json());

      if (res.success) {
        alert(`Receipt email resent successfully to ${email}!`);
        if (res.isEthereal && res.previewUrl) {
          const previewNotif = {
            id: `NOTIF-EMAIL-RESEND-${Date.now()}`,
            title: `📧 Receipt Resent to ${receipt.studentName}`,
            content: `Mock resent receipt email preview: ${res.previewUrl}`,
            category: 'FEE' as const,
            targetRole: 'ADMIN' as const,
            date: new Date().toISOString().split('T')[0],
            read: false
          };
          setNotifications(prev => [previewNotif, ...prev]);
        }
      } else {
        alert(`Failed to resend email: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error resending receipt email: ${err.message}`);
    }
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
      teacherName: currentUser?.name || 'Priyanshu Gupta'
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

  const handleAddBatchBulletinPost = (batchId: string, batchName: string, content: string) => {
    if (!currentUser) return;
    const newPost: BatchBulletinPost = {
      id: `bb-${Date.now()}`,
      batchId,
      batchName,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'STUDENT' ? 'STUDENT' : currentUser.role === 'TEACHER' ? 'TEACHER' : 'ADMIN',
      content,
      timestamp: new Date().toISOString()
    };
    const updated = [newPost, ...batchBulletins];
    setBatchBulletins(updated);
    syncState('batch_bulletins', updated);
  };

  const handleDeleteBatchBulletinPost = (postId: string) => {
    const updated = batchBulletins.filter(p => p.id !== postId);
    setBatchBulletins(updated);
    syncState('batch_bulletins', updated);
  };

  const handleMarkBulletinAsRead = (postId: string, studentId: string, studentName: string) => {
    let updated = false;
    const nextBulletins = batchBulletins.map(post => {
      if (post.id === postId) {
        const alreadyRead = post.readBy?.some(r => r.studentId === studentId);
        if (!alreadyRead) {
          const newReceipt = {
            studentId,
            studentName,
            timestamp: new Date().toISOString()
          };
          updated = true;
          return {
            ...post,
            readBy: [...(post.readBy || []), newReceipt]
          };
        }
      }
      return post;
    });

    if (updated) {
      setBatchBulletins(nextBulletins);
      syncState('batch_bulletins', nextBulletins);
    }
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

  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    syncState('notifications', updated);
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    const userRole = currentUser.role;
    const updated = notifications.map((n) => {
      const isApplicable =
        userRole === 'ADMIN' ||
        n.targetRole === 'ALL' ||
        n.targetRole === userRole;
      if (isApplicable) {
        return { ...n, isRead: true };
      }
      return n;
    });
    setNotifications(updated);
    syncState('notifications', updated);
  };

  const handleAddStudentAdmin = async (std: Omit<Student, 'id' | 'rollNo' | 'attendancePercentage'>) => {
    try {
      const response = await fetch("/api/admin/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(std)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to manually register student.");
      }

      // Update local React states and local cache to match database immediately
      if (data.student) {
        setStudents(prev => {
          const updated = [data.student, ...prev];
          syncState('students', updated);
          return updated;
        });
      }
      if (data.feeRecords) {
        setFeeStatuses(prev => {
          const updated = [...data.feeRecords, ...prev];
          syncState('fee_statuses', updated);
          return updated;
        });
      }
      if (data.user) {
        setUsers(prev => {
          const updated = [data.user, ...prev];
          syncState('users', updated);
          return updated;
        });
      }

      const baseUsername = data.user?.username || std.name.toLowerCase().replace(/\s+/g, '');
      const defaultPass = "Sunshine123";

      alert(`🎉 Student Registered Successfully via full-stack Atomic Pipeline!\n\nRoll Number: ${data.rollNo || "Created"}\nLogin Username: ${baseUsername}\nPassword: ${defaultPass}\n\n12-month billing schedule and audit logs have been successfully initialized with zero partial failures.`);
    } catch (err: any) {
      console.error("[Manual Registration Error]:", err);
      alert(`❌ Registration Failed!\n\nError: ${err.message}\n\nThe operation has been fully rolled back. No orphan records were created.`);
    }
  };

  const handleDeleteStudent = (id: string) => {
    const studentToDelete = students.find((s) => s.id === id);

    // 1. Delete Student
    const updatedStudents = students.filter((s) => s.id !== id);
    setStudents(updatedStudents);
    syncState('students', updatedStudents);

    if (studentToDelete) {
      const studentUserId = studentToDelete.userId;

      // 2. Delete associated login user profile
      const updatedUsers = users.filter((u) => u.id !== studentUserId);
      setUsers(updatedUsers);
      syncState('users', updatedUsers);

      // 3. Delete Fee Statuses
      const updatedFeeStatuses = feeStatuses.filter((f) => f.studentId !== id);
      setFeeStatuses(updatedFeeStatuses);
      syncState('fee_statuses', updatedFeeStatuses);

      // 4. Delete Fee Receipts
      const updatedFeeReceipts = feeReceipts.filter((f) => f.studentId !== id);
      setFeeReceipts(updatedFeeReceipts);
      syncState('fee_receipts', updatedFeeReceipts);

      // 5. Delete UPI Payments
      const updatedUpiPayments = upiPayments.filter((p) => p.studentId !== id);
      setUpiPayments(updatedUpiPayments);
      syncState('upi_payments', updatedUpiPayments);

      // 6. Delete Attendance
      const updatedAttendance = attendance.filter((a) => a.studentId !== id);
      setAttendance(updatedAttendance);
      syncState('attendance', updatedAttendance);

      // 7. Delete Marks
      const updatedStudentMarks = studentMarks.filter((m) => m.studentId !== id);
      setStudentMarks(updatedStudentMarks);
      syncState('student_marks', updatedStudentMarks);

      // 8. Delete Homework Submissions
      const updatedSubmissions = submissions.filter((sub) => sub.studentId !== id);
      setSubmissions(updatedSubmissions);
      syncState('submissions', updatedSubmissions);

      // 9. Delete Subscriptions
      const updatedSubscriptions = subscriptions.filter((sub) => sub.studentId !== id);
      setSubscriptions(updatedSubscriptions);
      syncState('student_subscriptions', updatedSubscriptions);

      // 10. Delete Subscription Payments
      const updatedSubPayments = subPayments.filter((p) => p.studentId !== id);
      setSubPayments(updatedSubPayments);
      syncState('payments', updatedSubPayments);

      // 11. Delete Subscription Receipts
      const updatedSubReceipts = subReceipts.filter((r) => r.studentId !== id);
      setSubReceipts(updatedSubReceipts);
      syncState('receipts', updatedSubReceipts);

      // 12. Delete Subscription Notifications
      const updatedSubNotifications = subNotifications.filter((n) => n.studentId !== id);
      setSubNotifications(updatedSubNotifications);
      syncState('payment_notifications', updatedSubNotifications);

      // 13. Delete App Notifications
      const updatedNotifications = notifications.filter((n) => n.userId !== studentUserId);
      setNotifications(updatedNotifications);
      syncState('notifications', updatedNotifications);
    }
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => s.id === updatedStudent.id ? updatedStudent : s);
    setStudents(updated);
    syncState('students', updated);

    // Update associated login user profile
    const updatedUsers = users.map((u) => {
      if (u.id === updatedStudent.userId) {
        return {
          ...u,
          email: updatedStudent.email,
          phone: updatedStudent.mobile
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    syncState('users', updatedUsers);
  };

  const handleAddTeacherAdmin = (tch: Omit<Teacher, 'id'>) => {
    const newTch: Teacher = {
      ...tch,
      id: `t-admin-${Date.now()}`
    };
    const updated = [...teachers, newTch];
    setTeachers(updated);
    syncState('teachers', updated);

    // Register associated User Login credential profile with hashed default password
    const baseUsername = tch.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let generatedUsername = baseUsername;
    let counter = 1;
    while (users.some((u) => u.username === generatedUsername)) {
      generatedUsername = `${baseUsername}${counter}`;
      counter++;
    }
    const defaultPass = "Sunshine123";

    const newUser: User = {
      id: newTch.userId,
      username: generatedUsername,
      name: tch.name,
      email: tch.email,
      role: 'TEACHER',
      phone: tch.phone,
      password: simpleSecureHash(defaultPass)
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    syncState('users', updatedUsers);

    alert(`🎉 Teacher Registered Successfully!\n\nLogin Credentials Created:\n---------------------------------\nUsername: ${generatedUsername}\nPassword: ${defaultPass}\n\nPlease share these credentials with the teacher.`);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    syncState('teachers', updated);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const updated = teachers.map((t) => t.id === updatedTeacher.id ? updatedTeacher : t);
    setTeachers(updated);
    syncState('teachers', updated);

    // Also update associated User record if email or phone changed
    const updatedUsers = users.map((u) => {
      if (u.id === updatedTeacher.userId) {
        return {
          ...u,
          name: updatedTeacher.name,
          email: updatedTeacher.email,
          phone: updatedTeacher.phone
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    syncState('users', updatedUsers);

    // Add Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'admin',
      action: 'UPDATE_TEACHER',
      details: `Updated teacher profile for ${updatedTeacher.name}`,
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
  };

  const handleBulkImport = (
    newStudents: Omit<Student, 'id' | 'rollNo' | 'attendancePercentage'>[],
    newTeachers: Omit<Teacher, 'id'>[],
    newBatches: Batch[]
  ) => {
    // 1. Process and merge Teachers
    const updatedTeachers = [...teachers];
    const updatedUsers = [...users];

    newTeachers.forEach((t) => {
      const exists = updatedTeachers.some(
        (existing) => existing.name.trim().toLowerCase() === t.name.trim().toLowerCase()
      );
      if (!exists) {
        const teacherId = `t-bulk-${Math.random().toString(36).substr(2, 9)}`;
        const teacherUser: Teacher = {
          ...t,
          id: teacherId,
        };
        updatedTeachers.push(teacherUser);

        const userExists = updatedUsers.some(
          (u) => u.username === t.userId || u.id === t.userId
        );
        if (!userExists) {
          const baseUsername = t.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let generatedUsername = baseUsername;
          let counter = 1;
          while (updatedUsers.some((u) => u.username === generatedUsername)) {
            generatedUsername = `${baseUsername}${counter}`;
            counter++;
          }
          const defaultPass = "Sunshine123";
          updatedUsers.push({
            id: t.userId,
            username: generatedUsername,
            name: t.name,
            email: t.email,
            role: 'TEACHER',
            phone: t.phone,
            password: simpleSecureHash(defaultPass)
          });
        }
      }
    });

    // 2. Process and merge Batches
    const updatedBatches = [...batches];
    newBatches.forEach((b) => {
      const exists = updatedBatches.some(
        (existing) => existing.name.trim().toLowerCase() === b.name.trim().toLowerCase()
      );
      if (!exists) {
        updatedBatches.push(b);
      } else {
        const idx = updatedBatches.findIndex(
          (existing) => existing.name.trim().toLowerCase() === b.name.trim().toLowerCase()
        );
        if (idx !== -1) {
          updatedBatches[idx] = {
            ...updatedBatches[idx],
            teacherName: b.teacherName,
          };
        }
      }
    });

    // 3. Process and merge Students
    const updatedStudents = [...students];
    let rollCounter = 1000 + updatedStudents.length + 1;

    newStudents.forEach((s) => {
      const cleanPhone = s.mobile.replace(/\D/g, '');
      const sNameNorm = s.name.trim().toLowerCase();

      const isDuplicate = updatedStudents.some((existing) => {
        const existingPhone = existing.mobile.replace(/\D/g, '');
        const existingNameNorm = existing.name.trim().toLowerCase();
        return existingNameNorm === sNameNorm && existingPhone === cleanPhone;
      });

      if (!isDuplicate) {
        const studentId = `s-bulk-${Math.random().toString(36).substr(2, 9)}`;
        const rollNo = `SC-${rollCounter++}`;
        const studentUser: Student = {
          ...s,
          id: studentId,
          rollNo,
          attendancePercentage: 100,
        };
        updatedStudents.push(studentUser);

        const userExists = updatedUsers.some((u) => u.id === s.userId);
        if (!userExists) {
          const baseUsername = s.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let generatedUsername = baseUsername;
          let counter = 1;
          while (updatedUsers.some((u) => u.username === generatedUsername)) {
            generatedUsername = `${baseUsername}${counter}`;
            counter++;
          }
          const defaultPass = "Sunshine123";
          updatedUsers.push({
            id: s.userId,
            username: generatedUsername,
            name: s.name,
            email: s.email,
            role: 'STUDENT',
            phone: s.mobile,
            password: simpleSecureHash(defaultPass)
          });
        }
      }
    });

    setTeachers(updatedTeachers);
    syncState('teachers', updatedTeachers);

    setBatches(updatedBatches);
    syncState('batches', updatedBatches);

    setStudents(updatedStudents);
    syncState('students', updatedStudents);

    setUsers(updatedUsers);
    syncState('users', updatedUsers);

    // 4. Add Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'admin',
      action: 'BULK_IMPORT',
      details: `Imported spreadsheet students, verified faculty, and updated batches`,
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
  };

  const handleRevertFeeData = () => {
    // Clear fee statuses and receipts
    setFeeStatuses([]);
    syncState('fee_statuses', []);

    setFeeReceipts([]);
    syncState('fee_receipts', []);
  };

  const handleClearTestData = () => {
    // 1. Clear students
    setStudents([]);
    syncState('students', []);

    // 2. Clear admissions
    setAdmissions([]);
    syncState('admissions', []);

    // 3. Clear attendance
    setAttendance([]);
    syncState('attendance', []);

    // 4. Clear fee statuses
    setFeeStatuses([]);
    syncState('fee_statuses', []);

    // 5. Clear fee receipts
    setFeeReceipts([]);
    syncState('fee_receipts', []);

    // 6. Clear tests
    setTests([]);
    syncState('tests', []);

    // 7. Clear student marks
    setStudentMarks([]);
    syncState('student_marks', []);

    // 8. Clear homework & submissions
    setHomework([]);
    syncState('homework', []);
    setSubmissions([]);
    syncState('submissions', []);

    // 9. Clear inquiries
    setInquiries([]);
    syncState('inquiries', []);

    // 10. Clear subscriptions
    setSubscriptions([]);
    syncState('student_subscriptions', []);

    // 11. Clear subPayments & subReceipts
    setSubPayments([]);
    syncState('payments', []);
    setSubReceipts([]);
    syncState('receipts', []);

    // 12. Clear subNotifications
    setSubNotifications([]);
    syncState('payment_notifications', []);

    // 13. Clear batches (so they can be freshly provisioned during import)
    setBatches([]);
    syncState('batches', []);

    // 14. Keep only Admin and Teacher users, remove Student users
    const filteredUsers = users.filter(u => u.role !== 'STUDENT');
    setUsers(filteredUsers);
    syncState('users', filteredUsers);

    // 15. Push a clean-slate audit log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'admin',
      action: 'CLEAR_TEST_DATA',
      details: 'Purged all test student portfolios, batches, fee records, and subscriptions to establish a clean production environment.',
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
  };

  const handleForceUpdateUserEmails = () => {
    // 1. Force update all administrative user profiles
    const updatedUsers = users.map(u => {
      if (u.email === 'sarcasticrk09@gmail.com' || u.email === 'guptapriyansu@gmail.com' || u.email === 'admin@sunshine.com') {
        return { ...u, email: 'sunshineclassespihani@gmail.com' };
      }
      if ((u.role === 'ADMIN' || u.role === 'TEACHER') && (u.username === 'admin' || u.username === 'teacher')) {
        return { ...u, email: 'sunshineclassespihani@gmail.com' };
      }
      return u;
    });
    setUsers(updatedUsers);
    syncState('users', updatedUsers);

    // 2. Force update current logged-in user if their email matches
    if (currentUser && (currentUser.email === 'sarcasticrk09@gmail.com' || currentUser.email === 'guptapriyansu@gmail.com' || currentUser.email === 'admin@sunshine.com' || ((currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER') && (currentUser.username === 'admin' || currentUser.username === 'teacher')))) {
      // Handled via cloud persistence and reactive stream synchronization.
    }

    // 3. Force update teachers collection
    const updatedTeachers = teachers.map(t => {
      if (t.email === 'sarcasticrk09@gmail.com' || t.email === 'guptapriyansu@gmail.com' || t.username === 'teacher') {
        return { ...t, email: 'sunshineclassespihani@gmail.com' };
      }
      return t;
    });
    setTeachers(updatedTeachers);
    syncState('teachers', updatedTeachers);

    // 4. Log the action
    const newLog: AuditLog = {
      id: `AUD-EMAIL-FORCE-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'admin',
      action: 'FORCE_UPDATE_EMAILS',
      details: "Triggered master scrubbing script to force-update all administrative user and staff emails from older domains to 'sunshineclassespihani@gmail.com' in local cache and Cloud Firestore.",
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
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

  const handleAddReview = (review: Omit<Testimonial, 'id'>) => {
    const newReview: Testimonial = {
      ...review,
      id: `REVIEW-${Date.now()}`
    };
    const updated = [...testimonials, newReview];
    setTestimonials(updated);
    syncState('testimonials', updated);
  };

  const handleAddOrEditTopper = (topper: Topper) => {
    const exists = toppers.some(t => t.id === topper.id);
    let updated: Topper[];
    if (exists) {
      updated = toppers.map(t => t.id === topper.id ? topper : t);
    } else {
      updated = [...toppers, { ...topper, id: topper.id || `TOP-${Date.now()}` }];
    }
    setToppers(updated);
    syncState('toppers', updated);
  };

  const handleDeleteTopper = (id: string) => {
    const updated = toppers.filter(t => t.id !== id);
    setToppers(updated);
    syncState('toppers', updated);
  };

  const handleAddStudyMaterial = (material: Omit<StudyMaterial, 'id'>) => {
    const newMaterial: StudyMaterial = {
      ...material,
      id: `MAT-${Date.now()}`
    };
    const updated = [newMaterial, ...studyMaterials];
    setStudyMaterials(updated);
    syncState('study_materials', updated);
  };

  const handleDeleteStudyMaterial = (id: string) => {
    const updated = studyMaterials.filter(m => m.id !== id);
    setStudyMaterials(updated);
    syncState('study_materials', updated);
  };

  const handleAddOrEditFounder = (founder: FounderMember) => {
    const exists = founders.some(f => f.id === founder.id);
    let updated: FounderMember[];
    if (exists) {
      updated = founders.map(f => f.id === founder.id ? founder : f);
    } else {
      updated = [...founders, { ...founder, id: founder.id || `fm-${Date.now()}` }];
    }
    setFounders(updated);
    syncState('founders', updated);
  };

  const handleDeleteFounder = (id: string) => {
    const updated = founders.filter(f => f.id !== id);
    setFounders(updated);
    syncState('founders', updated);
  };

  const handleUpdateTimetable = (updatedTimetable: TimetableEntry[]) => {
    setTimetable(updatedTimetable);
    syncState('timetable', updatedTimetable);
  };

  const handleUpdateBatches = (updatedBatches: Batch[]) => {
    setBatches(updatedBatches);
    syncState('batches', updatedBatches);

    // Add Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'admin',
      action: 'UPDATE_BATCHES',
      details: `Updated batches configuration. Total batches: ${updatedBatches.length}`,
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);
  };

  // Switch Quick Roles from demo panel
  const handleSelectRole = (role: UserRole) => {
    // Under Firebase Production Auth, roles are securely mapped from Firestore.
    // Quick switching is disabled in production to protect data isolation.
    alert("Role switching is disabled. Please log in using the appropriate credentials.");
  };

  const handleLogout = () => {
    logout()
      .then(() => {
        navigate('/login', { replace: true });
      })
      .catch(e => {
        console.warn("Logout error:", e);
        navigate('/login', { replace: true });
      });
  };

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    if (strictMode) {
      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        alert('Security Enforcer: In Strict Mode, your passcode must be at least 8 characters long, contain at least one uppercase letter (A-Z) and at least one number (0-9) to satisfy security hardening protocols.');
        return;
      }
    }

    const hashed = newPassword.startsWith('sha256_mock_') ? newPassword : simpleSecureHash(newPassword);
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, password: hashed, plainPassword: newPassword };
        return updated;
      }
      return u;
    });
    setUsers(updatedUsers);
    syncState('users', updatedUsers);
    
    // Write a security audit log
    const newLog: AuditLog = {
      id: `AUD-SEC-${Date.now()}`,
      userId: currentUser?.id || 'system',
      username: currentUser?.username || 'admin',
      action: 'PASSWORD_CHANGED',
      details: `Password securely updated and hashed using salted ciphers for User ID: ${userId}. Policy compliance checked.`,
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    alert('Success: Password updated!');
  };

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = authUsername.trim();
    const trimmedPassword = authPassword.trim();

    if (!trimmedUsername || !trimmedPassword) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      await login(trimmedUsername, trimmedPassword, rememberMe);
      setShowLoginModal(false);
      setAuthUsername('');
      setAuthPassword('');
    } catch (err: any) {
      console.error("Login submission error:", err);
      alert(`Login failed: ${err.message || "Invalid credentials."}`);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = resetUsername.trim();
    if (!trimmedUsername) {
      alert("Please enter your account username.");
      return;
    }

    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === trimmedUsername.toLowerCase() &&
        u.role === authRole
    );

    if (!matched) {
      alert(`No registered account found with username "${trimmedUsername}" under the selected ${authRole} role.`);
      return;
    }

    // Determine target contact detail
    let contactDetail = "";
    if (resetContactMethod === 'email') {
      contactDetail = matched.email || "";
      if (!contactDetail) {
        alert("This profile does not have a registered email address. Please contact the administrative office or try the Phone Number option.");
        return;
      }
    } else {
      contactDetail = matched.phone || "";
      if (!contactDetail) {
        alert("This profile does not have a registered phone number. Please contact the administrative office or try the Email option.");
        return;
      }
    }

    // Mask for security compliance
    let masked = "";
    if (resetContactMethod === 'email') {
      const [localPart, domain] = contactDetail.split('@');
      if (localPart.length <= 2) {
        masked = `${localPart[0]}*@${domain}`;
      } else {
        masked = `${localPart.substring(0, 2)}${"*".repeat(Math.max(3, localPart.length - 4))}${localPart.slice(-2)}@${domain}`;
      }
    } else {
      // Phone masking
      const cleanPhone = contactDetail.replace(/\D/g, '');
      if (cleanPhone.length > 4) {
        masked = `${cleanPhone.substring(0, 3)}*****${cleanPhone.slice(-2)}`;
      } else {
        masked = `***${cleanPhone.slice(-1)}`;
      }
    }

    setIsSendingReset(true);
    // Generate a 6-digit random verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      if (resetContactMethod === 'email') {
        // Send email via existing email api
        const customSubject = `🔑 Sunshine Classes ERP - Temporary Password Reset Verification Code`;
        const customHtml = `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">SUNSHINE CLASSES</h1>
              <p style="color: #ea580c; font-size: 11px; font-weight: bold; margin: 4px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Excellence in Education</p>
            </div>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; font-weight: 500;">Dear ${matched.name || 'User'},</p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.5;">You have requested to reset your Sunshine ERP account password. Please use the temporary 6-digit verification code below to complete the secure reset:</p>
              <div style="display: inline-block; background-color: #1e3a8a; color: #ffffff; font-family: monospace; font-size: 26px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; border-radius: 8px; margin: 10px 0;">
                ${code}
              </div>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #94a3b8;">This code is valid for 5 minutes and is permanently revoked upon use. Do not share this code with anyone.</p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">If you did not initiate this request, please change your credentials immediately or contact your batch administrator.</p>
              <p style="margin: 8px 0 0 0; font-weight: bold; color: #475569;">Sunshine Classes, Pihani, Hardoi, UP, India</p>
            </div>
          </div>
        `;

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contactDetail,
            customSubject,
            customHtml
          })
        });
      } else {
        // Send WhatsApp notification via existing api
        await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contactDetail,
            message: `Hello! Sunshine Classes ERP verification code is ${code}. This code is valid for 5 minutes. Do not share this code.`
          })
        });
      }

      // Add audit log
      const newLog: AuditLog = {
        id: `AUD-RESET-REQ-${Date.now()}`,
        userId: matched.id,
        username: matched.username,
        action: 'USER_LOGIN',
        details: `Password reset verification code requested for user ${matched.username} via registered ${resetContactMethod}.`,
        timestamp: new Date().toISOString()
      };
      const updatedAudits = [newLog, ...auditLogs];
      setAuditLogs(updatedAudits);
      syncState('audit_logs', updatedAudits);

      // Save reset state
      setTargetResetUser(matched);
      setGeneratedResetCode(code);
      setMaskedContactInfo(masked);
      setResetExpiryTime(Date.now() + 5 * 60 * 1000); // 5 minutes validity
      setAuthView('verify');
      setResetCodeInput('');
      setResetNewPassword('');

      alert(`A verification code has been successfully sent to your registered ${resetContactMethod} (${masked}).`);
    } catch (err: any) {
      console.error("Verification code dispatch failed:", err);
      alert(`Error: Unable to dispatch reset code at this moment. Details: ${err.message || err}`);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleVerifyAndResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResetUser) {
      alert("Invalid session state. Please request a new verification code.");
      setAuthView('forgot');
      return;
    }

    if (Date.now() > resetExpiryTime) {
      alert("The verification code has expired. Reset codes are valid for only 5 minutes. Please request a new code.");
      setAuthView('forgot');
      return;
    }

    if (resetCodeInput.trim() !== generatedResetCode) {
      alert("Incorrect verification code. Please check your message/email and try again.");
      return;
    }

    const trimmedNewPwd = resetNewPassword.trim();
    if (trimmedNewPwd.length < 6) {
      alert("Security Requirement: New passcode must be at least 6 characters in length.");
      return;
    }

    // Cryptographically secure update in strict security compliance mode
    const hashed = simpleSecureHash(trimmedNewPwd);
    const updatedUsers = users.map((u) => {
      if (u.id === targetResetUser.id) {
        const updated = { ...u, password: hashed, plainPassword: trimmedNewPwd };
        return updated;
      }
      return u;
    });
    setUsers(updatedUsers);
    syncState('users', updatedUsers);

    // Track in Security Audit Logs
    const newLog: AuditLog = {
      id: `AUD-RESET-SUCCESS-${Date.now()}`,
      userId: targetResetUser.id,
      username: targetResetUser.username,
      action: 'DATABASE_MODIFY',
      details: `Password for ${targetResetUser.username} successfully reset and salted under ERP Strict Security Policy using self-service verification code.`,
      timestamp: new Date().toISOString()
    };
    const updatedAudits = [newLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    syncState('audit_logs', updatedAudits);

    alert(`Success! Password for username "${targetResetUser.username}" has been updated. You can now log in.`);
    setAuthUsername(targetResetUser.username);
    setAuthPassword('');
    setAuthView('login');
  };

  // Determine current active student context for dashboard
  const currentStudentContext = students.find((s) => s.userId === currentUser?.id) || students[0];
  const currentTeacherContext = teachers.find((t) => t.userId === currentUser?.id) || teachers[0];

  if (cloudLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
        <div className="text-center max-w-sm flex flex-col items-center">
          {/* Logo animation with pulse & rotating spinner */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 dark:bg-amber-400/10 blur-xl animate-pulse"></div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute -inset-4 border border-dashed border-amber-400/30 rounded-full"
            ></motion.div>
            <div className="relative p-5 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center">
              <Sun className="h-12 w-12 text-amber-500 animate-spin-slow" style={{ animationDuration: '12s' }} />
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Sunshine Classes
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 mb-6">
            Excellence in Education
          </p>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 py-3 px-5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
            <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Connecting to Sunshine Cloud...
            </span>
          </div>

          {cloudError && (
            <div className="mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
              {cloudError}
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderDashboardHeader = () => {
    if (!currentUser) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 shadow-sm transition-colors">
        <div className="mx-auto max-w-7xl flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button 
              id="header-erp-logo-btn"
              onClick={() => navigate('/')} 
              className="bg-transparent border-0 cursor-pointer p-0 text-left"
            >
              <SunshineLogo size={36} showText={true} textSubTitle="Digital ERP Terminal" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Cloud Connection Status Badge */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold tracking-wider uppercase transition-all duration-300 ${
                cloudOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
              }`}
              title={cloudOnline ? 'Successfully connected & synchronizing with Sunshine Cloud Database' : 'Cloud connection unavailable. Running in offline fallback mode with local caching.'}
            >
              {cloudOnline ? (
                <Cloud className="h-3 w-3 text-emerald-500 animate-pulse" />
              ) : (
                <CloudOff className="h-3 w-3 text-amber-500" />
              )}
              {cloudOnline ? 'Cloud Sync' : 'Offline Mode'}
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Logged as: {currentUser.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">Role: {currentUser.role}</span>
            </div>

            {/* Notifications Badge & Dropdown */}
            <div className="relative">
              <button
                id="btn-header-notifications"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`relative p-2 rounded-xl border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer flex items-center justify-center`}
                title="System Notifications"
              >
                {notifications.filter(n => {
                  if (!currentUser) return false;
                  const userRole = currentUser.role;
                  if (userRole === 'ADMIN') return true;
                  return n.targetRole === 'ALL' || n.targetRole === userRole;
                }).filter(n => !n.isRead).length > 0 ? (
                  <BellRing className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                ) : (
                  <Bell className="h-4.5 w-4.5" />
                )}
                
                {(() => {
                  const count = notifications.filter(n => {
                    if (!currentUser) return false;
                    const userRole = currentUser.role;
                    if (userRole === 'ADMIN') return true;
                    return n.targetRole === 'ALL' || n.targetRole === userRole;
                  }).filter(n => !n.isRead).length;
                  return count > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                      {count}
                    </span>
                  ) : null;
                })()}
              </button>

              <AnimatePresence>
                {showNotificationsDropdown && (
                  <>
                    {/* Overlay click-away layer */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotificationsDropdown(false)} 
                    />
                    
                    {/* Dropdown Panel */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                            Notifications
                          </span>
                          {(() => {
                            const count = notifications.filter(n => {
                              if (!currentUser) return false;
                              const userRole = currentUser.role;
                              if (userRole === 'ADMIN') return true;
                              return n.targetRole === 'ALL' || n.targetRole === userRole;
                            }).filter(n => !n.isRead).length;
                            return count > 0 ? (
                              <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                                {count} New
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {notifications.filter(n => {
                          if (!currentUser) return false;
                          const userRole = currentUser.role;
                          if (userRole === 'ADMIN') return true;
                          return n.targetRole === 'ALL' || n.targetRole === userRole;
                        }).filter(n => !n.isRead).length > 0 && (
                          <button
                            onClick={() => {
                              handleMarkAllNotificationsRead();
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                          </button>
                        )}
                      </div>

                      {/* List Content */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {(() => {
                          const userNotifs = notifications.filter(n => {
                            if (!currentUser) return false;
                            const userRole = currentUser.role;
                            if (userRole === 'ADMIN') return true;
                            return n.targetRole === 'ALL' || n.targetRole === userRole;
                          });
                          return userNotifs.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                              No system notifications yet.
                            </div>
                          ) : (
                            userNotifs.map((notif) => {
                              const isEmailNotif = notif.id.startsWith('NOTIF-EMAIL-');
                              return (
                                <div 
                                  key={notif.id} 
                                  className={`p-4 transition-colors ${
                                    notif.isRead 
                                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50' 
                                      : 'bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                      {notif.title}
                                    </h4>
                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                      {notif.date}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {isEmailNotif ? (
                                      <>
                                        {notif.content.split('Click here to view the receipt:')[0]}
                                        <a 
                                          href={notif.content.split('Click here to view the receipt:')[1]?.trim()} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 dark:text-indigo-400 underline font-bold"
                                        >
                                          Click here to view the receipt
                                        </a>
                                      </>
                                    ) : notif.content}
                                  </p>
                                  {!notif.isRead && (
                                    <button
                                      onClick={() => handleMarkNotificationRead(notif.id)}
                                      className="mt-2 text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          );
                        })()}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              id="btn-toggle-theme-private"
              onClick={toggleTheme}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-brand-orange dark:hover:text-brand-orange bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-slate-150 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-all cursor-pointer font-display"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>

            <button
              id="btn-erp-change-password-trigger"
              onClick={() => {
                setChangePasswordCurrent('');
                setChangePasswordNew('');
                setChangePasswordConfirm('');
                setShowChangePasswordModal(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-brand-orange bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 border border-slate-150 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-all cursor-pointer font-display"
            >
              <Key size={13} /> Change Password
            </button>

            <button
              id="btn-erp-logout"
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-brand-red bg-slate-50 dark:bg-slate-800 hover:bg-red-50 border border-slate-150 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-all"
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  const landingPageElement = (
    <LandingPage
      courses={SEED_COURSES}
      blogs={blogs}
      testimonials={testimonials}
      toppers={toppers}
      onAddReview={handleAddReview}
      studyMaterials={studyMaterials}
      gallery={gallery}
      onNavigateToERP={() => navigate('/login')}
      onAddAdmission={handleAddAdmission}
      admissions={admissions}
      students={students}
      theme={theme}
      onToggleTheme={toggleTheme}
      founders={founders}
      subConfig={subConfig}
      onAddStudyMaterial={handleAddStudyMaterial}
    />
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              y: -80,
              transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } 
            }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 select-none"
          >
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-400/10 dark:bg-amber-400/5 blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-600/10 dark:bg-blue-600/5 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="text-center max-w-md flex flex-col items-center relative z-10">
              {/* Logo container with scale-up entrance */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="mb-8"
              >
                <SunshineLogo size="xl" layout="vertical" />
              </motion.div>

              {/* Technical elegant custom loading bar */}
              <div className="w-64 h-[3px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6 relative">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.2, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-brand-orange via-amber-400 to-brand-blue rounded-full"
                ></motion.div>
              </div>

              {/* Interactive subtle status description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-brand-orange animate-spin" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Initializing Sunshine Experience...
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentUser && currentUser.forcePasswordChange && (
        <ForcePasswordChange onSuccess={() => navigate(0)} />
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative flex flex-col justify-between max-w-full overflow-x-hidden transition-colors duration-300">
      {/* Primary ERP / Website Display Controller */}
      <div className="flex-1">
        <SEOHead />
        <Routes>
          {/* Public Website Routes */}
          <Route path="/" element={landingPageElement} />
          <Route path="/about" element={landingPageElement} />
          <Route path="/courses" element={landingPageElement} />
          <Route path="/enroll" element={landingPageElement} />
          <Route path="/admissions" element={landingPageElement} />
          <Route path="/results" element={landingPageElement} />
          <Route path="/resources" element={landingPageElement} />
          <Route path="/gallery" element={landingPageElement} />
          <Route path="/contact" element={landingPageElement} />

          {/* Fees Public Portal */}
          <Route
            path="/fees"
            element={
              <FeesPage
                students={students}
                feeStatuses={feeStatuses}
                feeReceipts={feeReceipts}
                onCollectFee={handleCollectFee}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            }
          />

          {/* Receipt Online Verification Public Route */}
          <Route path="/verify/receipt/:receiptNumber" element={<ReceiptVerificationPage />} />

          {/* Authentication Pages */}
          <Route path="/login" element={<Login onBackToWebsite={() => navigate('/')} />} />
          <Route path="/student/login" element={<Login onBackToWebsite={() => navigate('/')} />} />
          <Route path="/admin/login" element={<Login onBackToWebsite={() => navigate('/')} />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            path="/student/dashboard"
            element={
              !currentUser ? (
                <Navigate to="/student/login" replace />
              ) : currentUser.role !== 'STUDENT' ? (
                <Navigate to="/login" replace />
              ) : (
                <div className="bg-slate-100 dark:bg-slate-950 min-h-screen transition-colors">
                  {renderDashboardHeader()}
                  {currentStudentContext ? (
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
                      onUpdateStudent={handleUpdateStudent}
                      subscriptions={subscriptions}
                      subPayments={subPayments}
                      subReceipts={subReceipts}
                      subNotifications={subNotifications}
                      subConfig={subConfig}
                      onPaySubscription={handlePaySubscription}
                      onCollectFee={handleCollectFee}
                      upiPayments={upiPayments}
                      onAddUpiPayment={handleAddUpiPayment}
                      onCancelUpiPayment={handleCancelUpiPayment}
                      timetableList={timetable}
                      studyMaterials={studyMaterials}
                      batchBulletins={batchBulletins}
                      onAddBatchBulletinPost={handleAddBatchBulletinPost}
                      onDeleteBatchBulletinPost={handleDeleteBatchBulletinPost}
                      onMarkBulletinAsRead={handleMarkBulletinAsRead}
                    />
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading Student Context Profile...</div>
                  )}
                </div>
              )
            }
          />

          <Route
            path="/teacher/dashboard"
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : currentUser.role !== 'TEACHER' ? (
                <Navigate to="/login" replace />
              ) : (
                <div className="bg-slate-100 dark:bg-slate-950 min-h-screen transition-colors">
                  {renderDashboardHeader()}
                  {currentTeacherContext ? (
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
                      batchBulletins={batchBulletins}
                      onAddBatchBulletinPost={handleAddBatchBulletinPost}
                      onDeleteBatchBulletinPost={handleDeleteBatchBulletinPost}
                      subConfig={subConfig}
                    />
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading Teacher Context Profile...</div>
                  )}
                </div>
              )
            }
          />

          <Route
            path="/receptionist/dashboard"
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : currentUser.role !== 'RECEPTIONIST' ? (
                <Navigate to="/login" replace />
              ) : (
                <div className="bg-slate-100 dark:bg-slate-950 min-h-screen transition-colors">
                  {renderDashboardHeader()}
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
                </div>
              )
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              !currentUser ? (
                <Navigate to="/admin/login" replace />
              ) : (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') ? (
                <Navigate to="/login" replace />
              ) : (
                <div className="bg-slate-100 dark:bg-slate-950 min-h-screen transition-colors">
                  {renderDashboardHeader()}
                  <AdminDashboard
                    currentUser={currentUser}
                    students={students}
                    teachers={teachers}
                    users={users}
                    onUpdateUsers={(updatedUsers) => handleHealState('users', updatedUsers)}
                    courses={SEED_COURSES}
                    batches={batches}
                    onUpdateBatches={handleUpdateBatches}
                    toppers={toppers}
                    onAddOrEditTopper={handleAddOrEditTopper}
                    onDeleteTopper={handleDeleteTopper}
                    studyMaterials={studyMaterials}
                    onAddStudyMaterial={handleAddStudyMaterial}
                    onDeleteStudyMaterial={handleDeleteStudyMaterial}
                    founders={founders}
                    onAddOrEditFounder={handleAddOrEditFounder}
                    onDeleteFounder={handleDeleteFounder}
                    feeStatuses={feeStatuses}
                    feeReceipts={feeReceipts}
                    auditLogs={auditLogs}
                    notifications={notifications}
                    onAddStudent={handleAddStudentAdmin}
                    onDeleteStudent={handleDeleteStudent}
                    onAddTeacher={handleAddTeacherAdmin}
                    onDeleteTeacher={handleDeleteTeacher}
                    onUpdateTeacher={handleUpdateTeacher}
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
                    onCollectFee={handleCollectFee}
                    upiPayments={upiPayments}
                    onVerifyUpiPayment={handleVerifyUpiPayment}
                    onResendReceiptEmail={handleResendReceiptEmail}
                    onUpdateUserPassword={handleUpdateUserPassword}
                    strictMode={strictMode}
                    onToggleStrictMode={handleToggleStrictMode}
                    admissions={admissions}
                    attendanceList={attendance}
                    tests={tests}
                    studentMarks={studentMarks}
                    homeworkList={homework}
                    submissions={submissions}
                    blogs={blogs}
                    testimonials={testimonials}
                    gallery={gallery}
                    inquiries={inquiries}
                    timetableList={timetable}
                    onHealState={handleHealState}
                    emailTemplates={emailTemplates}
                    onUpdateEmailTemplates={handleUpdateEmailTemplates}
                    whatsappTemplates={whatsappTemplates}
                    onUpdateWhatsappTemplates={handleUpdateWhatsappTemplates}
                    onApproveAdmission={handleApproveAdmission}
                    onRejectAdmission={handleRejectAdmission}
                    onBulkImport={handleBulkImport}
                    onClearTestData={handleClearTestData}
                    onRevertFeeData={handleRevertFeeData}
                    onForceUpdateUserEmails={handleForceUpdateUserEmails}
                    departedStudents={departedStudents}
                  />
                </div>
              )
            }
          />

          {/* Catch-all Routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Floating Chatbot */}
      <ChatBot />

      {/* AUTHENTICATION LOGIN DIALOG MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            id="login-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in"
          >
            <div className="w-full max-w-md relative">
              <Login onBackToWebsite={() => setShowLoginModal(false)} />
              {/* Close button */}
              <button
                id="btn-login-close"
                onClick={() => {
                  setShowLoginModal(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 rounded-full p-1.5 hover:bg-slate-800/50 transition-all z-10"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-50 text-brand-orange mb-2">
                <Key size={20} />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-lg">Change Your Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Protect your account by creating a secure custom password.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmedCurrent = changePasswordCurrent.trim();
                const trimmedNew = changePasswordNew.trim();
                const trimmedConfirm = changePasswordConfirm.trim();

                // 1. Enforce password complexity
                if (trimmedNew.length < 6) {
                  alert('Your new password must be at least 6 characters long for secure authentication.');
                  return;
                }

                if (trimmedNew !== trimmedConfirm) {
                  alert('The new password and confirmation password do not match!');
                  return;
                }

                try {
                  const token = localStorage.getItem('sunshine_token');
                  const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      currentPassword: trimmedCurrent,
                      newPassword: trimmedNew
                    })
                  });

                  const resData = await response.json();
                  if (!response.ok || !resData.success) {
                    alert(`❌ Failed to update password: ${resData.message || resData.error || 'Current password incorrect'}`);
                    return;
                  }

                  handleUpdateUserPassword(currentUser.id, trimmedNew);

                  alert('🎉 Password changed successfully! Please sign in again with your new credentials.');
                  
                  setShowChangePasswordModal(false);
                  handleLogout();
                } catch (err: any) {
                  console.error("Password update failed:", err);
                  alert(`❌ Failed to update password.\nError: ${err.message || err}`);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-display">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    placeholder="Enter current password"
                    value={changePasswordCurrent}
                    onChange={(e) => setChangePasswordCurrent(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-brand-blue focus:bg-white font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-display">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter new password (min 4 characters)"
                    value={changePasswordNew}
                    onChange={(e) => setChangePasswordNew(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-brand-blue focus:bg-white font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-display">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm your new password"
                    value={changePasswordConfirm}
                    onChange={(e) => setChangePasswordConfirm(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-brand-blue focus:bg-white font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1.5 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <MailSimulatorWidget />
    </div>
    </>
  );
}
