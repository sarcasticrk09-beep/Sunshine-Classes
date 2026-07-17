/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  BookOpen,
  Download,
  Bell,
  User,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Award,
  QrCode,
  AlertTriangle,
  Wifi,
  WifiOff,
  Sparkles,
  Inbox,
  Tv,
  Check,
  Camera,
  Trash2,
  Send,
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { simpleSecureHash } from '../auth/AuthProvider';
import { Student, Attendance, FeeStatus, FeeReceipt, Test, StudentMark, Homework, HomeworkSubmission, AppNotification, StudentSubscription, SubscriptionPayment, SubscriptionReceipt, SubscriptionNotification, SubscriptionConfig, TimetableEntry, StudyMaterial, BatchBulletinPost, UPIPayment } from '../types';
import SunshineLogo from './SunshineLogo';
import { CloudinaryUpload } from './CloudinaryUpload';
import { getFeeStatusForRecord } from '../lib/feeUtils';
import { getPaymentProvider } from '../lib/paymentProviders';

interface StudentDashboardProps {
  student: Student;
  attendanceList: Attendance[];
  feeStatuses: FeeStatus[];
  feeReceipts: FeeReceipt[];
  tests: Test[];
  studentMarks: StudentMark[];
  homeworkList: Homework[];
  submissions: HomeworkSubmission[];
  notifications: AppNotification[];
  onAddSubmission: (sub: Omit<HomeworkSubmission, 'id'>) => void;
  subscriptions: StudentSubscription[];
  subPayments: SubscriptionPayment[];
  subReceipts: SubscriptionReceipt[];
  subNotifications: SubscriptionNotification[];
  subConfig: SubscriptionConfig;
  onPaySubscription: (subId: string, paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING', amount: number) => void;
  onCollectFee: (fee: Omit<FeeReceipt, 'id' | 'date' | 'receivedBy'> & { skipWhatsApp?: boolean }) => void;
  timetableList: TimetableEntry[];
  upiPayments?: UPIPayment[];
  onAddUpiPayment?: (payment: Omit<UPIPayment, 'id' | 'submissionTime' | 'status'>) => boolean;
  onCancelUpiPayment?: (paymentId: string) => void;
  studyMaterials: StudyMaterial[];
  onUpdateStudent?: (student: Student) => void;
  batchBulletins: BatchBulletinPost[];
  onAddBatchBulletinPost: (batchId: string, batchName: string, content: string) => void;
  onDeleteBatchBulletinPost: (postId: string) => void;
  onMarkBulletinAsRead: (postId: string, studentId: string, studentName: string) => void;
}

export default function StudentDashboard({
  student,
  attendanceList,
  feeStatuses,
  feeReceipts,
  tests,
  studentMarks,
  homeworkList,
  submissions,
  notifications,
  onAddSubmission,
  subscriptions,
  subPayments,
  subReceipts,
  subNotifications,
  subConfig,
  onPaySubscription,
  onCollectFee,
  upiPayments = [],
  onAddUpiPayment,
  onCancelUpiPayment,
  timetableList,
  studyMaterials,
  onUpdateStudent,
  batchBulletins,
  onAddBatchBulletinPost,
  onDeleteBatchBulletinPost,
  onMarkBulletinAsRead
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees' | 'performance' | 'homework' | 'study-material' | 'timetable' | 'notifications' | 'profile' | 'bulletin'>('overview');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [hwAnswerText, setHwAnswerText] = useState('');
  const [hwFileUrl, setHwFileUrl] = useState('');
  const [bulletinInputText, setBulletinInputText] = useState('');
  const [expandedBulletinReads, setExpandedBulletinReads] = useState<Record<string, boolean>>({});

  const toggleBulletinReadList = (postId: string) => {
    setExpandedBulletinReads(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  const [isSubmitHwOpen, setIsSubmitHwOpen] = useState(false);
  const [viewerFileUrl, setViewerFileUrl] = useState<string | null>(null);
  const [viewerFileTitle, setViewerFileTitle] = useState<string>('');
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Password change form states
  const { changePassword, currentUser } = useAuth();
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [pwdErrorMsg, setPwdErrorMsg] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Interactive Sticker Board State
  const [pinnedStickers, setPinnedStickers] = useState<Array<{
    id: string;
    stickerId: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    customNote?: string;
  }>>(() => {
    try {
      const stored = localStorage.getItem(`sunshine_stickers_${student.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed loading local stickers:", e);
    }
    return [
      { id: 'p1', stickerId: 'st8', x: 20, y: 30, scale: 1.1, rotation: -8, customNote: 'Sunshine Classes Rock!' },
      { id: 'p2', stickerId: 'st2', x: 50, y: 15, scale: 1.2, rotation: 10, customNote: 'Math Exam Cleared!' },
      { id: 'p3', stickerId: 'st3', x: 78, y: 40, scale: 1.0, rotation: 15, customNote: '7 Day Streak Active!' }
    ];
  });

  const [selectedStickerForEdit, setSelectedStickerForEdit] = useState<string | null>(null);
  const [stickerNoteInput, setStickerNoteInput] = useState('');
  const [confettiBurst, setConfettiBurst] = useState(false);

  const AVAILABLE_STICKERS = [
    { id: 'st1', emoji: '🎓', label: 'Academic Hero', bg: 'from-amber-400 to-yellow-500', text: 'text-amber-950', glow: 'shadow-yellow-100', desc: 'Syllabus Specialist' },
    { id: 'st2', emoji: '⭐', label: 'Super Star', bg: 'from-blue-400 to-indigo-500', text: 'text-blue-50', glow: 'shadow-blue-100', desc: 'Outstanding Effort' },
    { id: 'st3', emoji: '🔥', label: 'Daily Streak', bg: 'from-orange-400 to-rose-500', text: 'text-orange-95', glow: 'shadow-orange-100', desc: 'Sustained Daily Study' },
    { id: 'st4', emoji: '🚀', label: 'Launch Success', bg: 'from-purple-400 to-indigo-600', text: 'text-purple-50', glow: 'shadow-purple-100', desc: 'Aiming for 100% Boards' },
    { id: 'st5', emoji: '💡', label: 'Einstein Spark', bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-95', glow: 'shadow-emerald-100', desc: 'Creative Answers' },
    { id: 'st6', emoji: '🏆', label: 'First Ranker', bg: 'from-yellow-400 to-orange-600', text: 'text-yellow-95', glow: 'shadow-amber-100', desc: 'Test Topper Status' },
    { id: 'st7', emoji: '🧠', label: 'Deep Focus', bg: 'from-pink-400 to-rose-600', text: 'text-pink-50', glow: 'shadow-pink-100', desc: 'Full Concentration' },
    { id: 'st8', emoji: '☀️', label: 'Sunshine pride', bg: 'from-yellow-300 to-amber-500', text: 'text-amber-900', glow: 'shadow-yellow-200', desc: 'Proud Sunshine Student' },
    { id: 'st9', emoji: '🧪', label: 'Science Genius', bg: 'from-cyan-400 to-blue-500', text: 'text-cyan-50', glow: 'shadow-cyan-100', desc: 'NCERT Chemistry Master' },
    { id: 'st10', emoji: '📚', label: 'Bookworm', bg: 'from-fuchsia-400 to-pink-500', text: 'text-fuchsia-50', glow: 'shadow-fuchsia-100', desc: 'Avid Syllabus Reader' }
  ];

  const saveStickers = (updated: typeof pinnedStickers) => {
    setPinnedStickers(updated);
    try {
      localStorage.setItem(`sunshine_stickers_${student.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const addStickerToBoard = (stickerId: string) => {
    const id = `ps-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const randomRotation = Math.floor(Math.random() * 30) - 15; // -15 to +15
    const newSticker = {
      id,
      stickerId,
      x: 35 + Math.random() * 30, // 35% to 65%
      y: 25 + Math.random() * 30, // 25% to 55%
      scale: 1.0,
      rotation: randomRotation,
      customNote: 'Double-click to customize'
    };
    const updated = [...pinnedStickers, newSticker];
    saveStickers(updated);
    setSelectedStickerForEdit(id);
    setStickerNoteInput('Double-click to customize');

    // Trigger visual celebration spark
    setConfettiBurst(true);
    setTimeout(() => setConfettiBurst(false), 1200);
  };

  // Profile fields state
  const [profileEmail, setProfileEmail] = useState(student.email || '');
  const [profileMobile, setProfileMobile] = useState(student.mobile || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(student.photoUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedStickerForEdit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Safety boundaries
    const x = Math.max(5, Math.min(95, clickX));
    const y = Math.max(5, Math.min(95, clickY));

    const updated = pinnedStickers.map(s => s.id === selectedStickerForEdit ? { ...s, x, y } : s);
    saveStickers(updated);
  };

  React.useEffect(() => {
    setProfileEmail(student.email || '');
    setProfileMobile(student.mobile || '');
    setProfilePhotoUrl(student.photoUrl || '');
    setProfileSuccessMsg('');
  }, [student.id, student.email, student.mobile, student.photoUrl]);

  // Mark bulletin posts as read when student views the bulletin tab
  React.useEffect(() => {
    if (activeTab === 'bulletin') {
      const mySubscription = subscriptions.find(s => s.studentId === student.id);
      const studentBatchId = mySubscription?.batchId || 'b2';
      const studentBatchName = student.preferredBatch || mySubscription?.batchName || 'Class 10 - Evening Stars';
      
      const filtered = batchBulletins.filter(
        p => p.batchId === studentBatchId || 
        p.batchName.toLowerCase() === studentBatchName.toLowerCase()
      );

      filtered.forEach(post => {
        const alreadyRead = post.readBy?.some(r => r.studentId === student.id);
        if (!alreadyRead) {
          onMarkBulletinAsRead(post.id, student.id, student.name);
        }
      });
    }
  }, [activeTab, batchBulletins, student.id, student.name, student.preferredBatch, subscriptions, onMarkBulletinAsRead]);

  // Filter notifications based on target role, batch and class
  const filteredNotifications = notifications.filter(n => {
    // Check role matching
    const matchesRole = n.targetRole === 'ALL' || n.targetRole === 'STUDENT';
    if (!matchesRole) return false;

    // If targeted to a specific batch, verify
    if (n.targetBatch) {
      if (student.preferredBatch && n.targetBatch.toLowerCase() !== student.preferredBatch.toLowerCase()) {
        return false;
      }
    }

    // If targeted to a specific class, verify
    if (n.targetClass) {
      if (student.class && n.targetClass.toLowerCase() !== student.class.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // PWA Offline/Online & Install Simulator states
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem('sunshine_pwa_offline') === 'true';
  });
  const [downloadedHw, setDownloadedHw] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('sunshine_downloaded_hw') || '[]'); } catch { return []; }
  });
  const [downloadedMaterials, setDownloadedMaterials] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('sunshine_downloaded_materials') || '[]'); } catch { return []; }
  });
  const [pwaInstallState, setPwaInstallState] = useState<'NOT_INSTALLED' | 'INSTALLING' | 'INSTALLED'>(() => {
    return (localStorage.getItem('sunshine_pwa_install_state') as any) || 'NOT_INSTALLED';
  });
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const toggleOfflineMode = () => {
    const nextVal = !isOfflineMode;
    setIsOfflineMode(nextVal);
    localStorage.setItem('sunshine_pwa_offline', String(nextVal));
    alert(nextVal 
      ? "Offline Cache Mode ACTIVATED. You are now disconnected from the live Sunshine server. Cached study materials can still be viewed."
      : "Live Sync Mode RESTORED. Full connection with Sunshine Classes ERP databases is active."
    );
  };

  const handleDownloadHw = (id: string) => {
    const nextList = downloadedHw.includes(id) ? downloadedHw.filter(x => x !== id) : [...downloadedHw, id];
    setDownloadedHw(nextList);
    localStorage.setItem('sunshine_downloaded_hw', JSON.stringify(nextList));
    alert(downloadedHw.includes(id) 
      ? "Removed copy from local device cache." 
      : "Homework materials and questions cached on device. Available for offline studying."
    );
  };

  const handleDownloadMaterial = (item: StudyMaterial) => {
    const id = item.id;
    const isCurrentlyDownloaded = downloadedMaterials.includes(id);
    const nextList = isCurrentlyDownloaded ? downloadedMaterials.filter(x => x !== id) : [...downloadedMaterials, id];
    setDownloadedMaterials(nextList);
    localStorage.setItem('sunshine_downloaded_materials', JSON.stringify(nextList));
    
    if (!isCurrentlyDownloaded) {
      if (item.fileData) {
        const link = document.createElement('a');
        link.href = item.fileData;
        link.download = item.file;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Downloaded 'Offline Notes' successfully. High-speed reading enabled, no internet required!");
      }
    } else {
      alert("Removed study notes from offline cache.");
    }
  };

  const handleSimulateInstall = () => {
    setShowPwaInstallModal(true);
  };

  const triggerSimulatedInstallProgress = () => {
    setPwaInstallState('INSTALLING');
    setTimeout(() => {
      setPwaInstallState('INSTALLED');
      localStorage.setItem('sunshine_pwa_install_state', 'INSTALLED');
      setShowPwaInstallModal(false);
      alert("App installed! Sunshine Student Portal added to your application drawer. Enjoy instant offline-first access!");
    }, 1500);
  };

  // Subscription-based custom states
  const [paySubId, setPaySubId] = useState<string | null>(null);
  const [payFeeId, setPayFeeId] = useState<string | null>(null);
  const selectedFeeItem = feeStatuses.find((f) => f.id === payFeeId);
  const [selectedSubReceipt, setSelectedSubReceipt] = useState<SubscriptionReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [transactionRefNum, setTransactionRefNum] = useState<string>('');
  const [receiptProofAttached, setReceiptProofAttached] = useState<boolean>(false);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [paymentMethodSelected, setPaymentMethodSelected] = useState<'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING'>(() => {
    if (subConfig?.paymentGatewayProvider === 'RAZORPAY') return 'NET_BANKING';
    if (subConfig?.paymentGatewayProvider === 'STRIPE') return 'CARD';
    if (subConfig?.paymentGatewayProvider === 'BANK_TRANSFER') return 'ONLINE';
    return 'UPI';
  });
  const [upiStep, setUpiStep] = useState<'QR_DEEP_LINK' | 'CONFIRMATION'>('QR_DEEP_LINK');
  const [upiProofUrl, setUpiProofUrl] = useState<string>('');

  // Keep payment method & initial partial amount in sync when payFeeId is toggled
  React.useEffect(() => {
    if (payFeeId && subConfig) {
      let defaultMethod: 'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING' = 'UPI';
      if (subConfig.enableUpiMethod !== false) {
        defaultMethod = 'UPI';
      } else if (subConfig.enableCardMethod !== false) {
        defaultMethod = 'CARD';
      } else if (subConfig.enableBankTransferMethod !== false) {
        defaultMethod = 'ONLINE';
      } else if (subConfig.enableNetBankingMethod !== false) {
        defaultMethod = 'NET_BANKING';
      } else {
        // Fallback if somehow all are off
        defaultMethod = 'UPI';
      }
      setPaymentMethodSelected(defaultMethod);
      setTransactionRefNum('');
      setReceiptProofAttached(false);
      setReceiptFileName('');
      setScreenshotBase64('');
    }
  }, [payFeeId, subConfig]);

  React.useEffect(() => {
    if (selectedFeeItem) {
      setCustomPayAmount(String(selectedFeeItem.pendingFee));
    } else {
      setCustomPayAmount('');
    }
  }, [selectedFeeItem]);

  // Filter lists for this specific student
  const myAttendance = attendanceList.filter((a) => a.studentId === student.id);
  const myFees = feeStatuses.filter((f) => f.studentId === student.id);
  const myReceipts = feeReceipts.filter((r) => r.studentId === student.id);
  const myMarks = studentMarks.filter((m) => m.studentId === student.id);

  // Subscription filters
  const mySubscription = subscriptions.find((s) => s.studentId === student.id);
  const mySubPayments = subPayments.filter((p) => p.studentId === student.id);
  const mySubReceipts = subReceipts.filter((r) => r.studentId === student.id);
  const isSubscriptionExpired = mySubscription?.status === 'EXPIRED';
  
  // Calculate attendance percentages
  const totalDays = myAttendance.length;
  const presentDays = myAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const calculatedAttendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : student.attendancePercentage;

  // Active student homework list with submission statuses
  const homeworkWithStatus = homeworkList
    .filter((h) => h.class === student.class || h.class === 'All' || h.class.includes(student.class))
    .map((hw) => {
      const submission = submissions.find((s) => s.homeworkId === hw.id && s.studentId === student.id);
      return {
        ...hw,
        submission
      };
    });

  const handleOpenHwSubmit = (hw: Homework) => {
    setSelectedHomework(hw);
    setHwAnswerText('');
    setHwFileUrl('');
    setIsSubmitHwOpen(true);
  };

  const handleSubmitHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework) return;

    onAddSubmission({
      homeworkId: selectedHomework.id,
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      submissionDate: new Date().toISOString().split('T')[0],
      textAnswer: hwAnswerText,
      fileUrl: hwFileUrl || undefined,
      status: 'SUBMITTED'
    });

    setIsSubmitHwOpen(false);
    setSelectedHomework(null);
    setHwFileUrl('');
  };

  // SVG Chart generator for test results
  const renderPerformanceChart = () => {
    if (myMarks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
          <TrendingUp className="h-10 w-10 text-slate-400 mb-2 animate-pulse" />
          <p className="text-sm font-medium text-slate-500">No test marks entered yet for Class 10 boards syllabus.</p>
        </div>
      );
    }

    // Prepare chart coordinates
    const chartWidth = 600;
    const chartHeight = 250;
    const paddingLeft = 45;
    const paddingRight = 35;
    const paddingTop = 30;
    const paddingBottom = 40;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    const points = myMarks.map((m, idx) => {
      const testObj = tests.find((t) => t.id === m.testId);
      const pct = testObj ? (m.marksObtained / testObj.totalMarks) * 100 : 0;
      const x = paddingLeft + (idx / Math.max(1, myMarks.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (pct / 100) * graphHeight;
      return { x, y, pct, title: testObj?.title || 'Test', score: `${m.marksObtained}/${testObj?.totalMarks}` };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Area path closed under the curve
    const areaData = points.length > 0
      ? `${pathData} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`
      : '';

    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h4 className="font-display font-bold text-sm text-slate-800">Board Assessment Analytics (%)</h4>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
            Mock Exam History
          </span>
        </div>
        <div className="w-full h-[220px] relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            <defs>
              {/* Soft Area Gradient Under Curve */}
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D47A1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0D47A1" stopOpacity="0.00" />
              </linearGradient>
              {/* Premium Glow Effect on Line */}
              <filter id="glow-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0D47A1" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = paddingTop + graphHeight - (v / 100) * graphHeight;
              return (
                <g key={v}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth - paddingRight} 
                    y2={y} 
                    stroke="#F1F5F9" 
                    strokeWidth="1.5"
                    strokeDasharray={v === 0 ? "0" : "5 5"} 
                  />
                  <text 
                    x={paddingLeft - 12} 
                    y={y + 3.5} 
                    textAnchor="end" 
                    className="text-[10px] font-bold font-mono fill-slate-400"
                  >
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* Area under line */}
            {points.length > 1 && (
              <path d={areaData} fill="url(#area-gradient)" />
            )}

            {/* Line graph */}
            {points.length > 1 && (
              <path 
                d={pathData} 
                fill="none" 
                stroke="#0D47A1" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="url(#glow-shadow)"
              />
            )}

            {/* Data points */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                {/* Golden/Blue Glowing Circle */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="7" 
                  fill="#FFF" 
                  stroke="#0D47A1" 
                  strokeWidth="3.5" 
                  className="transition-all duration-200 hover:scale-125"
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="2" 
                  fill="#FF9800" 
                />

                {/* Score badge */}
                <g className="transition-transform duration-200 hover:-translate-y-0.5">
                  <rect 
                    x={p.x - 22} 
                    y={p.y - 28} 
                    width="44" 
                    height="16" 
                    rx="4" 
                    fill="#0F172A" 
                    className="opacity-90 shadow-sm"
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 17} 
                    textAnchor="middle" 
                    className="text-[9px] font-bold fill-white"
                  >
                    {p.score}
                  </text>
                </g>

                {/* Axis label */}
                <text 
                  x={p.x} 
                  y={chartHeight - 12} 
                  textAnchor="middle" 
                  className="text-[9px] font-extrabold fill-slate-500 tracking-tight"
                >
                  {p.title.length > 12 ? p.title.substring(0, 10) + '..' : p.title}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div id="student-portal" className="mx-auto max-w-7xl px-4 py-8">
      {/* Profile Welcome Header */}
      <div id="student-dashboard-header" className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0D47A1] to-[#1A237E] p-6 lg:p-8 text-white md:flex-row md:items-center border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative glowing overlay elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 lg:gap-6 relative z-10">
          {student.photoUrl ? (
            <div className="relative group">
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-20 w-20 rounded-full object-cover border-2 border-amber-400 shadow-lg shadow-amber-400/20 flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-slate-950 flex items-center justify-center" title="Online Sync Active">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              </span>
            </div>
          ) : (
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 text-3xl font-extrabold shadow-lg shadow-amber-400/20 flex-shrink-0">
                {student.name.charAt(0)}
              </div>
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-slate-950 flex items-center justify-center" title="Online Sync Active">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              </span>
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl lg:text-3xl font-black tracking-tight text-white">{student.name}</h2>
              <span className="rounded-full bg-amber-400/10 border border-amber-400/40 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300 shadow-2xs">
                {student.class} Scholar
              </span>
            </div>
            <p className="text-xs lg:text-sm text-slate-300 mt-1 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Roll No: <strong className="text-white font-bold">{student.rollNo}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Batch: <strong className="text-amber-400 font-bold">{student.preferredBatch}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sunshine ERP Secure
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-20">
          {/* Quick Actions Dropdown Menu */}
          <div className="relative">
            <button
              id="btn-quick-actions-trigger"
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-600 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles size={14} className="text-slate-950 animate-pulse" />
              <span>Quick Actions</span>
              <ChevronDown size={14} className={`text-slate-950 transition-transform duration-200 ${isQuickActionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isQuickActionsOpen && (
              <>
                {/* Backdrop overlay to dismiss dropdown */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsQuickActionsOpen(false)} 
                />
                
                {/* Dropdown Menu List */}
                <div 
                  id="quick-actions-dropdown" 
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-[#0F172A] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200 ring-1 ring-amber-500/10"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Fast-Track Shortcuts</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {/* Action 1: Submit Homework */}
                    <button
                      id="action-submit-homework"
                      onClick={() => {
                        setIsQuickActionsOpen(false);
                        const firstPendingHw = homeworkWithStatus.find(hw => !hw.submission);
                        if (firstPendingHw) {
                          handleOpenHwSubmit(firstPendingHw);
                        }
                        setActiveTab('homework');
                      }}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left w-full cursor-pointer"
                    >
                      <BookOpen size={14} className="text-amber-400" />
                      <span>Submit Homework</span>
                    </button>

                    {/* Action 2: View Schedule */}
                    <button
                      id="action-view-schedule"
                      onClick={() => {
                        setIsQuickActionsOpen(false);
                        setIsScheduleModalOpen(true);
                      }}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left w-full cursor-pointer"
                    >
                      <Clock size={14} className="text-[#38BDF8]" />
                      <span>View Schedule</span>
                    </button>

                    {/* Action 3: Pay Fees */}
                    <button
                      id="action-pay-fees"
                      onClick={() => {
                        setIsQuickActionsOpen(false);
                        const unpaidFee = myFees.find(f => f.pendingFee > 0);
                        if (unpaidFee) {
                          setPayFeeId(unpaidFee.id);
                        }
                        setActiveTab('fees');
                      }}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left w-full cursor-pointer"
                    >
                      <CreditCard size={14} className="text-emerald-400" />
                      <span>Pay Tuition Fees</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            id="btn-digital-id"
            onClick={() => setIdCardOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-600 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <QrCode size={15} className="text-slate-950" /> Digital Student ID Card
          </button>
        </div>
      </div>

      {/* Main ERP Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Hand Navigation Sidebar / Mobile Switcher */}
        <div className="lg:col-span-1">
          {(() => {
            const mySub = subscriptions.find(s => s.studentId === student.id);
            const studentBatchId = mySub?.batchId || 'b2';
            const studentBatchName = student.preferredBatch || mySub?.batchName || 'Class 10 - Evening Stars';
            
            const unreadBulletinsCount = batchBulletins.filter(
              p => (p.batchId === studentBatchId || p.batchName.toLowerCase() === studentBatchName.toLowerCase()) &&
                   !p.readBy?.some(r => r.studentId === student.id)
            ).length;

            const tabsList = [
              { id: 'overview', label: 'Dashboard Overview', icon: <FileText size={16} /> },
              { id: 'profile', label: 'My Student Profile', icon: <User size={16} /> },
              { id: 'attendance', label: `Attendance Log (${calculatedAttendancePct}%)`, icon: <Calendar size={16} /> },
              { id: 'fees', label: 'Tuition Fees & Receipts', icon: <CreditCard size={16} /> },
              { id: 'performance', label: 'Tests & Report Card', icon: <TrendingUp size={16} /> },
              { id: 'homework', label: 'Homework Assignments', icon: <BookOpen size={16} /> },
              { id: 'study-material', label: 'Study Material Center', icon: <Download size={16} /> },
              { id: 'bulletin', label: unreadBulletinsCount > 0 ? `Batch Bulletin Board (${unreadBulletinsCount} new)` : 'Batch Bulletin Board', icon: <MessageSquare size={16} /> },
              { id: 'notifications', label: 'Notification Center', icon: <Bell size={16} /> }
            ] as const;

            const activeTabObj = tabsList.find(t => t.id === activeTab);

            return (
              <>
                {/* Mobile Tab Dropdown Selector (Visible on < lg) */}
                <div className="block lg:hidden mb-4 relative">
                  <button
                    id="student-mobile-tab-dropdown-btn"
                    type="button"
                    onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-blue-200 active:bg-slate-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-brand-blue">
                        {activeTabObj?.icon}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {activeTabObj?.label}
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
                          Navigate Student ERP
                        </div>
                        <div className="pt-1.5 space-y-1">
                          {tabsList.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                id={`student-mobile-tab-opt-${tab.id}`}
                                type="button"
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setIsTabDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-brand-blue text-white shadow-sm font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                                  {tab.icon}
                                </span>
                                <span className="text-left font-semibold text-xs flex-1">{tab.label}</span>
                                {isSelected && (
                                  <Check size={14} className="text-amber-400 font-bold" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Desktop Navigation Sidebar (Visible on >= lg) */}
                <div className="hidden lg:block">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 mb-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Student ERP Menu</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {tabsList.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            id={`student-desktop-tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer ${
                              isSelected 
                                ? 'bg-gradient-to-r from-[#0D47A1] to-[#1A237E] text-white shadow-lg shadow-brand-blue/10 border-l-4 border-amber-400 scale-[1.02]' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:translate-x-1'
                            }`}
                          >
                            <span className={`transition-transform duration-200 ${isSelected ? 'text-amber-300 scale-110' : 'text-slate-400'}`}>
                              {tab.icon}
                            </span>
                            <span className="flex-1 text-left tracking-wide">{tab.label}</span>
                            {isSelected && (
                              <ChevronRight size={14} className="text-amber-300" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}



          {/* Quick Notice Board widget */}
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Bell size={15} className="text-brand-orange animate-bounce" /> Real-time Notice Board
            </h4>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[11px] font-medium text-slate-400">No active notices for today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0 group">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        n.category === 'EXAM' 
                          ? 'bg-rose-50 text-red-600 border-red-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {n.category}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">June 2026</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors duration-150 leading-snug">{n.title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1 font-medium">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand Dynamic Content Frame */}
        <div className="lg:col-span-3">
          {isOfflineMode && !['homework', 'study-material'].includes(activeTab) ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange mb-4 animate-bounce">
                <WifiOff size={32} />
              </div>
              <h3 className="font-display font-black text-xl text-slate-950 mb-2">OFFLINE ACCESS ACTIVE</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                You are currently browsing the portal in <strong>Offline Cache Mode</strong>. High-speed reading is enabled for downloaded assets while internet connection is disconnected.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                However, you can still seamlessly browse cached folders: <strong>Homework Assignments</strong> and <strong>Study Material Center</strong> to read downloaded materials offline!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('homework')}
                  className="rounded-xl bg-brand-blue text-white font-bold text-xs px-4 py-2 hover:bg-brand-blue-hover transition-all cursor-pointer"
                >
                  Browse Offline Homework
                </button>
                <button
                  onClick={() => setActiveTab('study-material')}
                  className="rounded-xl bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 hover:bg-slate-300 transition-all cursor-pointer"
                >
                  Browse Offline Notes
                </button>
              </div>
            </div>
          ) : isSubscriptionExpired && ['homework', 'performance', 'study-material'].includes(activeTab) ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 animate-bounce">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-display font-black text-xl text-slate-950 mb-2">ACCESS RESTRICTED: SUBSCRIPTION EXPIRED</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                Dear student, your monthly subscription for <strong>{student.preferredBatch}</strong> has expired. 
                Sunshine Classes policy requires an active subscription to access new homework, report cards, or test resources.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('fees')}
                  className="rounded-xl bg-brand-blue text-white font-bold text-xs px-5 py-2.5 shadow hover:bg-brand-blue-hover flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard size={14} /> View Subscription & Pay Now
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Analytics Quick Cards */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Card 1: Attendance */}
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#E3F2FD]/30 via-white to-white p-5 shadow-xs flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-blue-200">
                      <div className="rounded-2xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] p-3 text-white shadow-md shadow-blue-500/10">
                        <Calendar size={22} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">My Attendance Ratio</span>
                        <span className="font-display text-2xl font-black text-slate-900 tracking-tight">{calculatedAttendancePct}%</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] text-emerald-600 font-black">Highly Consistent</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 2: Average Grade */}
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#EDE7F6]/30 via-white to-white p-5 shadow-xs flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-indigo-200">
                      <div className="rounded-2xl bg-gradient-to-br from-[#311B92] to-[#4527A0] p-3 text-white shadow-md shadow-indigo-500/10">
                        <Award size={22} className="text-amber-300 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Academic Standing</span>
                        <span className="font-display text-2xl font-black text-slate-900 tracking-tight">88.4%</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-indigo-600 font-black">⭐ Top 10 Percentile</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Subscription */}
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#FFF8E1]/30 via-white to-white p-5 shadow-xs flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-amber-200">
                      <div className={`rounded-2xl p-3 text-white shadow-md ${
                        mySubscription?.status === 'ACTIVE' 
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/10' 
                          : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/10'
                      }`}>
                        <CreditCard size={22} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Course Subscription</span>
                        <span className={`font-display text-xs font-black block uppercase tracking-wide ${
                          mySubscription?.status === 'ACTIVE' ? 'text-emerald-600' :
                          mySubscription?.status === 'DUE_SOON' ? 'text-amber-600 animate-pulse' : 'text-rose-600 font-extrabold'
                        }`}>
                          {mySubscription?.status || 'NO ACTIVE SUB'}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">Due: {mySubscription?.nextDueDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Incomplete Warning Banner */}
                  {(!student.photoUrl || !student.mobile || !student.email) && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4.5 flex gap-3.5 items-start">
                      <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                      <div className="flex-1">
                        <h4 className="font-bold text-xs text-rose-900 uppercase tracking-wide">Action Required: Profile Incomplete</h4>
                        <p className="text-xs text-rose-700 leading-snug mt-1">
                          Dear {student.name}, Sunshine Classes requires all enrolled students to complete their student profile. 
                          Your profile is currently missing your **{(!student.photoUrl && !student.mobile && !student.email) ? 'passport photo, contact number, and email ID' :
                            [!student.photoUrl && 'official photo', !student.mobile && 'contact number', !student.email && 'email ID'].filter(Boolean).join(', ')}**.
                        </p>
                        <button 
                          onClick={() => setActiveTab('profile')}
                          className="mt-2 text-[10px] font-extrabold text-brand-blue hover:underline uppercase flex items-center gap-1 cursor-pointer"
                        >
                          Complete My Profile Now &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Announcement Panel for Overdue subscriptions */}
                  {mySubscription && mySubscription.status !== 'ACTIVE' && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4.5 flex gap-3.5 items-start">
                      <AlertTriangle size={20} className="text-brand-orange mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">Tuition Fees Due Reminder</h4>
                        <p className="text-xs text-amber-700 leading-snug mt-1">
                          Dear {student.name}, your monthly subscription for <strong>{mySubscription.batchName}</strong> is {mySubscription.status.replace('_', ' ')}. 
                          Please clear the balance of ₹{mySubscription.monthlyFee} by clicking "Pay Tuition Fees" to avoid any access interruptions.
                        </p>
                        <button 
                          onClick={() => setActiveTab('fees')}
                          className="mt-2 text-[10px] font-extrabold text-brand-blue hover:underline uppercase"
                        >
                          Resolve Payment Online &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Enrolled Batch Timings & Updates Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <Clock size={16} className="text-brand-blue" /> My Batch Timings & Lecture Updates
                      </h4>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                        Live Sync
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Regular Timing</span>
                        <span className="font-display text-sm font-bold text-slate-800 block mt-1.5">
                          {mySubscription?.batchName || student.preferredBatch || "General Batch"}
                        </span>
                        <span className="text-xs font-semibold text-brand-blue font-mono mt-1 inline-block">
                          ⏰ {mySubscription?.batchTime || student.preferredTiming || "04:00 PM - 06:30 PM"}
                        </span>
                      </div>

                      <div className={`rounded-xl p-4 border transition-all ${
                        mySubscription?.tempTimeChange 
                          ? 'bg-amber-50 border-amber-200 text-amber-900 animate-pulse' 
                          : 'bg-slate-50/50 border-slate-100 text-slate-600'
                      }`}>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Temporary Schedule Shifts</span>
                        {mySubscription?.tempTimeChange ? (
                          <div className="mt-1">
                            <span className="text-xs font-extrabold flex items-center gap-1 text-amber-800">
                              ⚠️ Adjusted Schedule Active
                            </span>
                            <p className="text-xs mt-1 font-semibold leading-relaxed text-amber-700">
                              {mySubscription.tempTimeChange}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            No temporary changes today. Standard timing is active.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Stickers & Rewards Study Desk */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 relative overflow-hidden">
                    {/* Background celebratory sparks if active */}
                    {confettiBurst && (
                      <div className="absolute inset-0 z-10 bg-indigo-900/5 flex items-center justify-center pointer-events-none transition-all">
                        <div className="text-center">
                          <span className="text-4xl animate-bounce inline-block">✨🎉⭐🎉✨</span>
                          <p className="text-xs font-bold text-indigo-950 uppercase tracking-widest mt-2">Sticker Placed!</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-display font-black text-slate-800 text-sm flex items-center gap-1.5">
                          <Sparkles size={16} className="text-amber-500 animate-pulse" /> Sunshine Stickers & Study Desk
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                          Click to select a sticker from the pack, then click on the board to position or move it!
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const defaults = [
                              { id: 'p1', stickerId: 'st8', x: 20, y: 30, scale: 1.1, rotation: -8, customNote: 'Sunshine Classes Rock!' },
                              { id: 'p2', stickerId: 'st2', x: 50, y: 15, scale: 1.2, rotation: 10, customNote: 'Math Exam Cleared!' },
                              { id: 'p3', stickerId: 'st3', x: 78, y: 40, scale: 1.0, rotation: 15, customNote: '7 Day Streak Active!' }
                            ];
                            saveStickers(defaults);
                            setSelectedStickerForEdit(null);
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                        >
                          Reset Board
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveStickers([]);
                            setSelectedStickerForEdit(null);
                          }}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* The Corkboard Workspace Container */}
                    <div 
                      onClick={handleBoardClick}
                      className="relative h-[290px] w-full rounded-2xl bg-gradient-to-br from-[#FAF7F2] via-[#FFFDF9] to-[#F5EFE6] border-4 border-[#8B5A2B]/10 shadow-inner overflow-hidden cursor-crosshair select-none bg-[radial-gradient(#d97706_0.8px,transparent_0.8px)] [background-size:12px_12px]"
                    >
                      {/* Corkboard visual instruction */}
                      {pinnedStickers.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                            <Sparkles size={20} />
                          </div>
                          <p className="text-xs font-black text-slate-800">Your Study Corkboard is Empty</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[240px] font-medium leading-relaxed">
                            Select any beautiful merit badge from the "Sticker Pack" below to place it here, then tap and drag to decorate!
                          </p>
                        </div>
                      )}

                      {/* Sticky instructional guide on top-left of corkboard */}
                      <div className="absolute top-2.5 left-2.5 bg-amber-50/95 border-l-4 border-amber-500 rounded-r-xl p-2 max-w-[190px] text-[8.5px] text-amber-900 leading-normal shadow-md pointer-events-none z-10 font-sans font-bold">
                        📌 <strong>Study Corkboard:</strong> Click a sticker in the tray below, then <strong>click on the board</strong> to place/reposition it!
                      </div>

                      {/* Render Pinned Stickers */}
                      {pinnedStickers.map((ps) => {
                        const stInfo = AVAILABLE_STICKERS.find(s => s.id === ps.stickerId);
                        if (!stInfo) return null;
                        const isSelected = selectedStickerForEdit === ps.id;

                        return (
                          <div
                            key={ps.id}
                            style={{
                              position: 'absolute',
                              left: `${ps.x}%`,
                              top: `${ps.y}%`,
                              transform: `translate(-50%, -50%) rotate(${ps.rotation}deg) scale(${ps.scale})`,
                              transition: isSelected ? 'none' : 'all 0.15s ease-out',
                              zIndex: isSelected ? 30 : 20
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // don't trigger board move click!
                              setSelectedStickerForEdit(ps.id);
                              setStickerNoteInput(ps.customNote || '');
                            }}
                            className={`flex flex-col items-center cursor-pointer group p-1.5 rounded-xl transition-all relative ${
                              isSelected ? 'ring-2 ring-indigo-600 ring-offset-2' : 'hover:scale-105'
                            }`}
                          >
                            {/* Realistic Red Push-Pin atop the sticker */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 drop-shadow-md select-none pointer-events-none text-[11px] transform -rotate-12 group-hover:scale-110 transition-transform">
                              📍
                            </div>

                            {/* Sticker Base Disc */}
                            <div className={`h-11 w-11 rounded-full bg-gradient-to-tr ${stInfo.bg} shadow-md ${stInfo.glow} flex items-center justify-center border-2 border-white text-lg relative`}>
                              {stInfo.emoji}
                              {/* Small shine badge inside sticker */}
                              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-white/40 rounded-full blur-3xs pointer-events-none" />
                            </div>

                            {/* Handwritten Custom Mini Note Pin-board look */}
                            {ps.customNote && (
                              <div className="mt-1 bg-white/95 border border-slate-200 text-[8px] font-black text-slate-800 px-1.5 py-0.5 rounded shadow-xs max-w-[90px] truncate text-center font-mono">
                                {ps.customNote}
                              </div>
                            )}

                            {/* Delete floating button when selected */}
                            {isSelected && (
                              <button
                                type="button"
                                title="Remove Sticker"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = pinnedStickers.filter(s => s.id !== ps.id);
                                  saveStickers(updated);
                                  setSelectedStickerForEdit(null);
                                }}
                                className="absolute -top-3.5 -right-3.5 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 transition-all cursor-pointer z-40 border border-white"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Sticker Controls Panel */}
                    {selectedStickerForEdit && (() => {
                      const selectedPs = pinnedStickers.find(s => s.id === selectedStickerForEdit);
                      const selectedStInfo = selectedPs ? AVAILABLE_STICKERS.find(s => s.id === selectedPs.stickerId) : null;
                      if (!selectedPs || !selectedStInfo) return null;

                      return (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 animate-in fade-in duration-100">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl bg-white h-10 w-10 rounded-full shadow-sm flex items-center justify-center border border-slate-200 animate-pulse">
                              {selectedStInfo.emoji}
                            </span>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Sticker Selected</span>
                              <h5 className="text-xs font-bold text-slate-800">{selectedStInfo.label}</h5>
                              <p className="text-[9px] text-slate-400 mt-0.5">{selectedStInfo.desc}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Label Input */}
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 flex-1 min-w-[150px]">
                              <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">Note:</span>
                              <input
                                type="text"
                                maxLength={24}
                                value={stickerNoteInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStickerNoteInput(val);
                                  const updated = pinnedStickers.map(s => s.id === selectedStickerForEdit ? { ...s, customNote: val } : s);
                                  saveStickers(updated);
                                }}
                                placeholder="NCERT study complete"
                                className="w-full bg-transparent outline-none text-[10px] text-slate-800 font-medium"
                              />
                            </div>

                            {/* Rotation Cycle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextRotation = (selectedPs.rotation + 15) > 45 ? -45 : (selectedPs.rotation + 15);
                                const updated = pinnedStickers.map(s => s.id === selectedStickerForEdit ? { ...s, rotation: nextRotation } : s);
                                saveStickers(updated);
                              }}
                              className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-2 py-1.5 rounded-xl border border-slate-200 text-[10px] flex items-center gap-1 transition-all cursor-pointer animate-scale-in"
                              title="Rotate Sticker"
                            >
                              🔄 Rotate
                            </button>

                            {/* Size Cycle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextScale = selectedPs.scale >= 1.4 ? 0.8 : (selectedPs.scale + 0.2);
                                const updated = pinnedStickers.map(s => s.id === selectedStickerForEdit ? { ...s, scale: Number(nextScale.toFixed(1)) } : s);
                                saveStickers(updated);
                              }}
                              className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-2 py-1.5 rounded-xl border border-slate-200 text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Resize Sticker"
                            >
                              📐 Size ({selectedPs.scale}x)
                            </button>

                            {/* Unselect */}
                            <button
                              type="button"
                              onClick={() => setSelectedStickerForEdit(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer"
                            >
                              Deselect
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sticker Pack Album Tray */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                        🎒 Available Stickers Pack (Click to Add to Corkboard)
                      </span>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                        {AVAILABLE_STICKERS.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => addStickerToBoard(st.id)}
                            className="flex flex-col items-center p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-200 hover:shadow-xs transition-all text-center relative group cursor-pointer animate-scale-in"
                          >
                            <span className="text-2xl block group-hover:scale-115 transition-transform duration-150">
                              {st.emoji}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 mt-1 font-mono tracking-tighter truncate w-full">
                              {st.label}
                            </span>

                            {/* Tooltip trigger */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[8px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 w-24 z-50">
                              <p className="font-bold">{st.label}</p>
                              <p className="text-[7px] text-slate-300 mt-0.5">{st.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Progress Graphs */}
                  {renderPerformanceChart()}

                  {/* Quick Homework Overview */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-display font-bold text-sm text-slate-800">Urgent Homework Tasks</h4>
                      <button onClick={() => setActiveTab('homework')} className="flex items-center text-xs font-bold text-brand-blue hover:underline">
                        View All <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {homeworkWithStatus.slice(0, 2).map((hw) => (
                        <div key={hw.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">{hw.subject}</span>
                            <h5 className="text-xs font-bold text-slate-800">{hw.title}</h5>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock size={11} /> Due: {hw.dueDate}
                            </p>
                          </div>
                          <div>
                            {hw.submission ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                                <CheckCircle size={10} /> Submitted
                              </span>
                            ) : (
                              <button
                                id={`btn-hw-quick-submit-${hw.id}`}
                                onClick={() => handleOpenHwSubmit(hw)}
                                className="rounded-lg bg-brand-orange px-3 py-1 text-[10px] font-bold text-white shadow hover:bg-amber-500"
                              >
                                Submit Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-800">Your Attendance History</h3>
                      <p className="text-xs text-slate-500">Regular attendance of 90%+ is highly recommended for board results</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-brand-blue">{calculatedAttendancePct}%</span>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Overall Ratio</span>
                    </div>
                  </div>

                  {/* Attendance logs table */}
                  <div className="border border-slate-100 rounded-xl bg-white">
                    <table className="w-full text-left border-collapse block md:table">
                      <thead className="hidden md:table-header-group">
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="p-3">Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Class Session</th>
                          <th className="p-3">Marked By</th>
                        </tr>
                      </thead>
                      <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                        {myAttendance.length === 0 ? (
                          <tr className="block md:table-row">
                            <td colSpan={4} className="p-8 text-center text-slate-400 font-medium block md:table-cell">No official attendance logs added yet.</td>
                          </tr>
                        ) : (
                          myAttendance.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                              <td className="py-1 px-3 font-semibold text-slate-700 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-24">Date:</span>{a.date}</td>
                              <td className="py-1 px-3 block md:table-cell md:p-3">
                                <span className="inline-block md:hidden font-bold text-slate-400 w-24">Status:</span>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  a.status === 'PRESENT' ? 'bg-green-50 text-green-700' :
                                  a.status === 'ABSENT' ? 'bg-red-50 text-brand-red' :
                                  a.status === 'LATE' ? 'bg-amber-50 text-brand-orange' : 'bg-blue-50 text-brand-blue'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="py-1 px-3 text-slate-500 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-24">Session:</span>{a.class}</td>
                              <td className="py-1 px-3 text-slate-500 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-24">Marked By:</span>{a.markedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: FEES & MONTHLY SUBSCRIPTION */}
              {activeTab === 'fees' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Subscription card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">My Current Course Batch</span>
                        <h3 className="font-display font-black text-xl text-slate-900">{mySubscription?.batchName || student.preferredBatch}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Monthly Fee Subscription: <strong className="text-slate-700 font-extrabold text-sm">₹{mySubscription?.monthlyFee || 1500}</strong> once every month
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Subscription:</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          mySubscription?.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-200' :
                          mySubscription?.status === 'DUE_SOON' ? 'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse' :
                          mySubscription?.status === 'OVERDUE' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                          'bg-red-50 text-brand-red border border-red-200'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            mySubscription?.status === 'ACTIVE' ? 'bg-green-500' :
                            mySubscription?.status === 'DUE_SOON' ? 'bg-amber-500' :
                            mySubscription?.status === 'OVERDUE' ? 'bg-orange-500' : 'bg-red-500'
                          }`}></span>
                          {mySubscription?.status || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 text-xs">
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Start Date</span>
                        <strong className="text-slate-700">{mySubscription?.startDate || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Billing Cycle</span>
                        <strong className="text-slate-700 uppercase">1 Month Recurring</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Next Due Date</span>
                        <strong className="text-slate-700">{mySubscription?.nextDueDate || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Days Remaining</span>
                        <strong className={`block ${
                          (mySubscription?.daysRemaining ?? 0) < 0 ? 'text-brand-red font-black' :
                          (mySubscription?.daysRemaining ?? 0) <= 7 ? 'text-brand-orange font-bold' : 'text-green-700'
                        }`}>
                          {mySubscription ? (
                            mySubscription.daysRemaining < 0 ? `${Math.abs(mySubscription.daysRemaining)} Days Overdue` : `${mySubscription.daysRemaining} Days Left`
                          ) : 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-blue-50/40 border border-blue-100 rounded-xl p-4.5">
                      <div className="text-xs">
                        <strong className="text-slate-800 block">Subscription Billing & Grace Periods</strong>
                        <p className="text-slate-500 mt-1">
                          Sunshine classes grants a <strong>{subConfig.gracePeriod} days grace period</strong> past the due date. 
                          If overdue exceeds this period, academic report cards, homework submissions, and study materials are locked automatically until payment is settled.
                        </p>
                      </div>

                      {mySubscription && (
                        <div>
                          {mySubscription.status === 'ACTIVE' ? (
                            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-center text-xs font-bold text-green-800">
                              ✓ Subscription Active & Paid
                            </div>
                          ) : (
                            <button
                              onClick={() => setPaySubId(mySubscription.id)}
                              className="w-full sm:w-auto rounded-xl bg-brand-orange px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-amber-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CreditCard size={14} /> Pay Monthly Fee Online (₹{mySubscription.monthlyFee})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monthly Tuition Fee Ledger card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-display font-black text-base text-slate-800">Monthly Tuition Fee Ledger</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Track your official monthly tuition dues, discounts, scholarships, and active balances.</p>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] bg-indigo-50 text-indigo-900 border border-indigo-100 font-extrabold uppercase px-2.5 py-1 rounded-lg">
                        {myFees.filter(f => f.status !== 'PAID').length} Outstanding Ledger Cycles
                      </span>
                    </div>

                    <div className="border border-slate-100 rounded-xl bg-white overflow-hidden">
                      <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="p-3">Month</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3 text-right">Class Fee</th>
                            <th className="p-3 text-right">Scholarship/Discount</th>
                            <th className="p-3 text-right">Total Paid</th>
                            <th className="p-3 text-right">Balance Due</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                          {myFees.length === 0 ? (
                            <tr className="block md:table-row">
                              <td colSpan={8} className="p-8 text-center text-slate-400 font-medium block md:table-cell">No fee ledger details recorded.</td>
                            </tr>
                          ) : (
                            myFees.map((f) => (
                              <tr key={f.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                                <td className="py-1 px-3 font-black text-slate-800 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Month:</span>{f.month}</td>
                                <td className="py-1 px-3 text-slate-500 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Due Date:</span>{f.dueDate || 'N/A'}</td>
                                <td className="py-1 px-3 text-slate-600 block md:table-cell md:p-3 md:text-right font-semibold"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Class Fee:</span>₹{f.totalFee}</td>
                                <td className="py-1 px-3 text-green-600 block md:table-cell md:p-3 md:text-right font-semibold"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Discounts:</span>₹{(f.discount ?? 0) + (f.scholarship ?? 0)}</td>
                                <td className="py-1 px-3 text-indigo-900 block md:table-cell md:p-3 md:text-right font-black"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Total Paid:</span>₹{f.paidFee}</td>
                                <td className="py-1 px-3 block md:table-cell md:p-3 md:text-right font-black text-slate-900"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Balance Due:</span>
                                  <span className={f.pendingFee > 0 ? "text-red-600 font-extrabold" : "text-emerald-700"}>₹{f.pendingFee}</span>
                                </td>
                                <td className="py-1 px-3 block md:table-cell md:p-3 text-center">
                                  <span className="inline-block md:hidden font-bold text-slate-400 w-28">Status:</span>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    f.status === 'PAID' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    f.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                    'bg-red-50 text-red-600 border border-red-200'
                                  }`}>
                                    {f.status}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 block md:table-cell md:p-3 text-center">
                                  <span className="inline-block md:hidden font-bold text-slate-400 w-28">Action:</span>
                                  {f.pendingFee > 0 ? (
                                    (() => {
                                      const pendingPayment = upiPayments.find(p => p.studentId === student.id && p.month === f.month && p.status === 'PENDING_VERIFICATION');
                                      const rejectedPayment = upiPayments.find(p => p.studentId === student.id && p.month === f.month && p.status === 'REJECTED');
                                      if (pendingPayment) {
                                        return (
                                          <div className="flex flex-col gap-1 items-center justify-center">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 font-bold text-[10px] shadow-sm">
                                              <Clock size={11} className="animate-pulse" /> Pending Verification
                                            </span>
                                            {onCancelUpiPayment && (
                                              <button
                                                id={`btn-cancel-payment-${pendingPayment.id}`}
                                                onClick={() => {
                                                  if (confirm(`Are you sure you want to cancel your payment submission of ₹${pendingPayment.amount} for ${pendingPayment.month}?`)) {
                                                    onCancelUpiPayment(pendingPayment.id);
                                                  }
                                                }}
                                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                              >
                                                Cancel Submission
                                              </button>
                                            )}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="flex flex-col gap-1 items-center justify-center">
                                          <button
                                            id={`btn-pay-${f.id}`}
                                            onClick={() => setPayFeeId(f.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange hover:bg-amber-500 text-white px-3 py-1.5 font-bold text-[10px] shadow-sm transition-all cursor-pointer hover:scale-105"
                                          >
                                            <CreditCard size={11} /> Pay with UPI (₹{f.pendingFee})
                                          </button>
                                          {rejectedPayment && (
                                            <span className="text-[9px] font-medium text-red-500 max-w-[150px] leading-tight text-center">
                                              Rejected: {rejectedPayment.rejectionReason || "UTR mismatch"}. Submit again.
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-700 inline-flex items-center gap-1 justify-center">✓ Settled</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Paid Tuition Fee Vouchers & Receipts */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="font-display font-bold text-base text-slate-800 mb-4">Official Tuition Fee Vouchers & Receipts</h3>

                    <div className="border border-slate-100 rounded-xl bg-white overflow-hidden">
                      <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="p-3">Receipt ID</th>
                            <th className="p-3">Billing Month</th>
                            <th className="p-3 text-right">Amount Paid</th>
                            <th className="p-3 text-center">Payment Method</th>
                            <th className="p-3">Transaction Date</th>
                            <th className="p-3">Reference Txn ID</th>
                            <th className="p-3 text-center">Receipts</th>
                          </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                          {myReceipts.length === 0 ? (
                            <tr className="block md:table-row">
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-medium block md:table-cell">No fee receipts found in the ledger database.</td>
                            </tr>
                          ) : (
                            myReceipts.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                                <td className="py-1 px-3 font-semibold text-brand-blue block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Receipt ID:</span>{rec.id}</td>
                                <td className="py-1 px-3 font-bold text-slate-700 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Billing Month:</span>{rec.month}</td>
                                <td className="py-1 px-3 font-black text-slate-900 block md:table-cell md:p-3 md:text-right"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Amount Paid:</span>₹{rec.amountPaid}</td>
                                <td className="py-1 px-3 text-slate-500 font-mono text-[10px] uppercase block md:table-cell md:p-3 text-center"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Method:</span>{rec.paymentMethod}</td>
                                <td className="py-1 px-3 text-slate-500 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Txn Date:</span>{rec.date}</td>
                                <td className="py-1 px-3 font-mono text-[10px] text-slate-400 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Ref Txn ID:</span>{rec.transactionId || 'N/A'}</td>
                                <td className="py-1.5 px-3 block md:table-cell md:p-3 text-center">
                                  <span className="inline-block md:hidden font-bold text-slate-400 w-28">Receipts:</span>
                                  <button
                                    onClick={() => setSelectedReceipt(rec)}
                                    className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-brand-blue hover:text-white px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                                  >
                                    <Download size={10} /> View / Print Invoice
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment History log */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="font-display font-bold text-base text-slate-800 mb-4">Subscription Payment History</h3>

                    <div className="border border-slate-100 rounded-xl bg-white">
                      <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="p-3">Payment ID</th>
                            <th className="p-3">Billing Month</th>
                            <th className="p-3">Amount Paid</th>
                            <th className="p-3">Method</th>
                            <th className="p-3">Txn Date</th>
                            <th className="p-3">Reference Txn ID</th>
                            <th className="p-3">Vouchers</th>
                          </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                          {mySubPayments.length === 0 ? (
                            <tr className="block md:table-row">
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-medium block md:table-cell">No paid subscription transactions generated yet.</td>
                            </tr>
                          ) : (
                            mySubPayments.map((p) => {
                              const matchingReceipt = mySubReceipts.find(r => r.paymentId === p.id);
                              return (
                                <tr key={p.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                                  <td className="py-1 px-3 font-semibold text-brand-blue block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Payment ID:</span>{p.id}</td>
                                  <td className="py-1 px-3 font-bold text-slate-700 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Billing Month:</span>{p.month}</td>
                                  <td className="py-1 px-3 font-black text-slate-900 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Amount Paid:</span>₹{p.amountPaid}</td>
                                  <td className="py-1 px-3 text-slate-500 font-mono text-[10px] uppercase block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Method:</span>{p.paymentMethod}</td>
                                  <td className="py-1 px-3 text-slate-500 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Txn Date:</span>{p.paymentDate}</td>
                                  <td className="py-1 px-3 font-mono text-[10px] text-slate-400 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Ref Txn ID:</span>{p.transactionId || 'N/A'}</td>
                                  <td className="py-1 px-3 block md:table-cell md:p-3">
                                    <span className="inline-block md:hidden font-bold text-slate-400 w-28">Vouchers:</span>
                                    {matchingReceipt ? (
                                      <button
                                        onClick={() => setSelectedSubReceipt(matchingReceipt)}
                                        className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-brand-blue hover:text-white px-2 py-1 text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                                      >
                                        <Download size={10} /> View Invoice Receipt
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Receipt Pending</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

          {/* TAB 4: PERFORMANCE REPORT */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {renderPerformanceChart()}

              {/* Performance Analytics Badges */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Attendance Trend */}
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-teal-50/50 to-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Attendance Trend</span>
                    <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Steady (+2.1%)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-slate-800">{calculatedAttendancePct}%</span>
                    <span className="text-[10px] text-slate-400">Monthly Avg</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Consistent class presence since June term. All physical doubt sessions completed!
                  </p>
                </div>

                {/* Rank History */}
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Rank History</span>
                    <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      ↑ Rank #3
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-slate-800">Top 3</span>
                    <span className="text-[10px] text-slate-400">Class Rank</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Steadily climbed from #7 to #3. Pre-board mock marks are on target.
                  </p>
                </div>

                {/* Improvement Tracker */}
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">Improvement Tracker</span>
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Active
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-slate-800">92%</span>
                    <span className="text-[10px] text-slate-400">Target Level</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Focus on: <em>Light Lens diagrams</em>. Strengths: <em>Trigonometric Identities</em>.
                  </p>
                </div>
              </div>

              {/* Subject wise marks breakout */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-4">Class 10 Board Assessment Log</h3>

                <div className="space-y-4">
                  {myMarks.map((m) => {
                    const testObj = tests.find((t) => t.id === m.testId);
                    if (!testObj) return null;
                    const pct = Math.round((m.marksObtained / testObj.totalMarks) * 100);

                    return (
                      <div key={m.id} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{testObj.subject}</span>
                            <h4 className="text-sm font-bold text-slate-800">{testObj.title}</h4>
                            <p className="text-[10px] text-slate-500">Topic: {testObj.chapter} • Date: {testObj.date}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-slate-800">{m.marksObtained} / {testObj.totalMarks}</span>
                            <span className={`block text-[10px] font-bold ${pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-indigo-600' : 'text-brand-orange'}`}>
                              {pct}% Marks ({pct >= 90 ? 'Class Leaderboard' : pct >= 75 ? 'First Division' : 'Needs Review'})
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-brand-blue' : 'bg-brand-orange'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>

                        {/* Teacher remarks */}
                        {m.remarks && (
                          <div className="mt-3 rounded-lg bg-blue-50/50 border border-blue-100 p-2.5 text-[11px] text-slate-600 leading-snug">
                            <strong>Teacher Remarks:</strong> {m.remarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HOMEWORK MODULE */}
          {activeTab === 'homework' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="font-display font-black text-lg text-slate-800">Homework & Homework Portfolios</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete assignments before their due dates to earn high academic credit scores. Cache assignments to view and answer offline.
                </p>
              </div>

              <div className="space-y-4">
                {homeworkWithStatus.map((hw) => {
                  const isCached = downloadedHw.includes(hw.id);
                  return (
                    <div key={hw.id} className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-slate-50/50 to-white hover:border-blue-200 transition-all duration-200 shadow-3xs">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest">
                              {hw.subject}
                            </span>
                            <button
                              id={`btn-cache-hw-${hw.id}`}
                              onClick={() => handleDownloadHw(hw.id)}
                              className={`inline-flex items-center gap-1 text-[9px] font-black rounded-lg px-2.5 py-1 border transition-all cursor-pointer ${
                                isCached 
                                  ? 'bg-green-50 text-green-700 border-green-200 shadow-2xs shadow-green-100' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:scale-[1.02]'
                              }`}
                            >
                              {isCached ? '✓ Offline Mode Ready' : '↓ Download to Local Storage'}
                            </button>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-850 tracking-tight">{hw.title}</h4>
                          <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">{hw.description}</p>

                          {hw.fileUrl && (
                            <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 max-w-lg text-left">
                              <span className="text-[10px] font-bold text-indigo-800 uppercase block mb-2">📂 Attached Question Sheets ({hw.fileUrl.split(',').filter(Boolean).length}):</span>
                              <div className="grid gap-2.5 sm:grid-cols-2">
                                {hw.fileUrl.split(',').filter(Boolean).map((url, idx) => {
                                  const ext = url.split('.').pop()?.toLowerCase() || '';
                                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                                  return (
                                    <div key={idx} className="bg-white p-2 rounded-xl border border-slate-150 flex flex-col justify-between gap-1 shadow-3xs">
                                      {isImage ? (
                                        <img
                                          id={`img-question-preview-${hw.id}-${idx}`}
                                          src={url}
                                          alt={`Sheet ${idx + 1}`}
                                          className="h-24 w-full object-contain rounded-lg bg-slate-50 border border-slate-100 cursor-pointer"
                                          referrerPolicy="no-referrer"
                                          onClick={() => {
                                            setViewerFileUrl(url);
                                            setViewerFileTitle(`Question Sheet ${idx + 1}: ${hw.subject} - ${hw.title}`);
                                          }}
                                        />
                                      ) : (
                                        <div className="h-24 w-full rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500">
                                          <FileText size={24} />
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between text-[9px] font-bold mt-1">
                                        <span className="text-slate-600 truncate max-w-[80px]">sheet_${idx + 1}.${ext}</span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            id={`btn-view-question-modal-${hw.id}-${idx}`}
                                            type="button"
                                            onClick={() => {
                                              setViewerFileUrl(url);
                                              setViewerFileTitle(`Question Sheet ${idx + 1}: ${hw.subject} - ${hw.title}`);
                                            }}
                                            className="text-indigo-700 hover:underline cursor-pointer"
                                          >
                                            View 👁
                                          </button>
                                          <a
                                            id={`link-question-photo-view-${hw.id}-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-slate-400 hover:text-slate-600"
                                          >
                                            ↗
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold text-slate-400">
                            <span>Teacher: {hw.teacherName}</span>
                            <span>Assigned: {hw.date}</span>
                            <span className="text-brand-orange">Due Date: {hw.dueDate}</span>
                          </div>
                        </div>
 
                        <div className="flex-shrink-0">
                          {hw.submission ? (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
                                <CheckCircle size={12} /> Submitted
                              </span>
                              <span className="block text-[9px] text-slate-400 mt-1">On: {hw.submission.submissionDate}</span>
                            </div>
                          ) : (
                            <button
                              id={`btn-hw-submit-${hw.id}`}
                              onClick={() => handleOpenHwSubmit(hw)}
                              className="rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-500 transition-all cursor-pointer"
                            >
                              Submit Homework
                            </button>
                          )}
                        </div>
                      </div>
 
                      {/* Submitted Solutions Block */}
                      {hw.submission && (
                        <div className="mt-4 p-4 rounded-xl border border-slate-150 bg-slate-50/40 text-left">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Your Submitted Solutions:</span>
                          {hw.submission.textAnswer && (
                            <p className="text-xs text-slate-700 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-100 mb-2">{hw.submission.textAnswer}</p>
                          )}
                          {hw.submission.fileUrl && (
                            <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-150 max-w-lg">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Attached answer sheets ({hw.submission.fileUrl.split(',').filter(Boolean).length}):</span>
                              <div className="grid gap-2.5 sm:grid-cols-2">
                                {hw.submission.fileUrl.split(',').filter(Boolean).map((url, idx) => {
                                  const ext = url.split('.').pop()?.toLowerCase() || '';
                                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                                  return (
                                    <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-150 flex flex-col justify-between gap-1 shadow-3xs">
                                      {isImage ? (
                                        <img
                                          id={`img-submitted-preview-${hw.id}-${idx}`}
                                          src={url}
                                          alt={`Answer Sheet ${idx + 1}`}
                                          className="h-24 w-full object-contain rounded-lg bg-white border border-slate-100 cursor-pointer"
                                          referrerPolicy="no-referrer"
                                          onClick={() => {
                                            setViewerFileUrl(url);
                                            setViewerFileTitle(`Your Submission Sheet ${idx + 1}: ${hw.subject} - ${hw.title}`);
                                          }}
                                        />
                                      ) : (
                                        <div className="h-24 w-full rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500">
                                          <FileText size={24} />
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between text-[9px] font-bold mt-1">
                                        <span className="text-slate-600 truncate max-w-[80px]">answer_${idx + 1}.${ext}</span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            id={`btn-view-submission-modal-${hw.id}-${idx}`}
                                            type="button"
                                            onClick={() => {
                                              setViewerFileUrl(url);
                                              setViewerFileTitle(`Your Submission Sheet ${idx + 1}: ${hw.subject} - ${hw.title}`);
                                            }}
                                            className="text-brand-orange hover:underline cursor-pointer"
                                          >
                                            View 👁
                                          </button>
                                          <a
                                            id={`link-submitted-photo-view-${hw.id}-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-slate-400 hover:text-slate-600"
                                          >
                                            ↗
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submission review status */}
                      {hw.submission && hw.submission.status === 'REVIEWED' && (
                        <div className="mt-4 rounded-xl border border-green-100 bg-green-50/35 p-3.5">
                          <div className="flex items-center justify-between text-xs font-bold text-green-800 mb-1">
                            <span>Teacher Evaluation Report:</span>
                            <span className="rounded bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                              Score: {hw.submission.score}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 italic">"{hw.submission.remarks}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: STUDY MATERIAL DOWNLOAD CENTER */}
          {activeTab === 'study-material' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Digital Study Library</h3>
              <p className="text-xs text-slate-500 mb-6">Expert revision pamphlets and chapter-wise question sheets created by senior faculty.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                {(studyMaterials && studyMaterials.length > 0 ? studyMaterials : [
                  { id: 'mat1', title: 'Class 10 Math Formula Cheat-Sheet', subject: 'Mathematics', desc: 'Complete algebraic, quadratic, and trigonometric formulas in 2 clean pages.', file: 'math_formulas.pdf', size: '1.2 MB', category: 'NOTES', class: 'Class 10 Board Specialists' },
                  { id: 'mat2', title: 'Chemical Reactions and Equations PDF', subject: 'Science', desc: 'NCERT back exercise solved chemical reactions with balancing shortcuts.', file: 'chemical_equations.pdf', size: '2.5 MB', category: 'NOTES', class: 'Class 10 Board Specialists' },
                  { id: 'mat3', title: 'Active & Passive Voice Rules Guide', subject: 'English', desc: 'English grammar rules with pre-board mock practice questions.', file: 'english_grammar_voice.pdf', size: '800 KB', category: 'NOTES', class: 'Class 10 Board Specialists' },
                  { id: 'mat4', title: 'Class 10 Physics Ray Diagrams', subject: 'Science', desc: 'Hand-drawn mirror and lens ray formation scenarios for board exam reference.', file: 'physics_ray_diagrams.pdf', size: '4.1 MB', category: 'NOTES', class: 'Class 10 Board Specialists' }
                ] as StudyMaterial[]).map((item, idx) => {
                  const isCached = downloadedMaterials.includes(item.id);
                  return (
                    <div key={idx} className="rounded-xl border border-slate-100 p-4 hover:border-slate-300 hover:shadow-sm transition-all flex justify-between items-start gap-4 bg-slate-50/10">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase text-brand-blue block">{item.subject}</span>
                          <span className="text-[9px] font-black uppercase text-brand-orange block">{item.class}</span>
                          {isCached && <span className="text-[8px] font-bold text-green-700 bg-green-50 px-2 py-0.2 rounded border border-green-200">✓ Cached</span>}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                      </div>
                      <button
                        id={`btn-dl-material-${idx}`}
                        onClick={() => handleDownloadMaterial(item)}
                        className={`rounded-lg p-2 border transition-all flex-shrink-0 cursor-pointer ${
                          isCached 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-slate-50 hover:bg-brand-blue hover:text-white border-slate-100 text-slate-600'
                        }`}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {/* TAB: NOTIFICATION CENTER */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-800">Notification Center</h3>
                    <p className="text-xs text-slate-500">Official digital announcements, homework alerts, exam routines, and fees reminders.</p>
                  </div>
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-bold">
                    {filteredNotifications.length} Total Alerts
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                      <Inbox className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500 font-bold">Inbox is completely clear!</p>
                      <p className="text-xs text-slate-400 mt-1">You will receive alerts here when teachers post updates.</p>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => {
                      let tagColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (n.category === 'EXAM') tagColor = 'bg-red-50 text-red-700 border-red-200';
                      if (n.category === 'FEE') tagColor = 'bg-orange-50 text-brand-orange border-orange-200';
                      if (n.category === 'HOLIDAY') tagColor = 'bg-rose-50 text-rose-700 border-rose-200';
                      if (n.category === 'HOMEWORK') tagColor = 'bg-blue-50 text-blue-700 border-blue-200';

                      return (
                        <div key={n.id} className="rounded-xl border border-slate-100 p-4 bg-white hover:border-slate-200 hover:shadow-sm transition-all flex gap-3.5 items-start">
                          <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border flex-shrink-0 ${tagColor}`}>
                            {n.category}
                          </span>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                            <span className="text-[10px] font-mono text-slate-400 block pt-1">Posted: {n.date}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BATCH BULLETIN BOARD */}
          {activeTab === 'bulletin' && (() => {
            const mySubscription = subscriptions.find(s => s.studentId === student.id);
            const studentBatchId = mySubscription?.batchId || 'b2';
            const studentBatchName = student.preferredBatch || mySubscription?.batchName || 'Class 10 - Evening Stars';
            
            const filteredBulletins = batchBulletins.filter(
              p => p.batchId === studentBatchId || 
              p.batchName.toLowerCase() === studentBatchName.toLowerCase()
            );

            const handlePostSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              if (!bulletinInputText.trim()) return;
              onAddBatchBulletinPost(studentBatchId, studentBatchName, bulletinInputText.trim());
              setBulletinInputText('');
            };

            return (
              <div className="space-y-6 animate-fade-in" id="batch-bulletin-container">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Active Batch
                        </span>
                        <h3 className="font-display font-bold text-lg text-slate-800">{studentBatchName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Real-time announcement board and student-teacher discussion panel for your specific batch.</p>
                    </div>
                  </div>

                  {/* Create Post Form */}
                  <form onSubmit={handlePostSubmit} className="mb-8 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Create a new post</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bulletinInputText}
                        onChange={(e) => setBulletinInputText(e.target.value)}
                        placeholder="Ask a doubt or share an update with your classmates..."
                        className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue bg-white font-medium text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={!bulletinInputText.trim()}
                        className="rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white px-5 py-3 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} /> Post
                      </button>
                    </div>
                  </form>

                  {/* Bulletins List */}
                  <div className="space-y-4">
                    {filteredBulletins.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                        <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500 font-bold">No announcements yet!</p>
                        <p className="text-xs text-slate-400 mt-1">Be the first to share an update or question in this batch bulletin.</p>
                      </div>
                    ) : (
                      filteredBulletins.map((post) => {
                        const isAuthor = post.authorId === student.id;
                        const dateObj = new Date(post.timestamp);
                        const formattedTime = isNaN(dateObj.getTime()) 
                          ? post.timestamp 
                          : dateObj.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                        const initials = post.authorName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        // Role styling
                        let roleColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        if (post.authorRole === 'TEACHER') {
                          roleColor = 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold';
                        } else if (post.authorRole === 'ADMIN') {
                          roleColor = 'bg-red-50 text-red-700 border-red-200 font-extrabold';
                        }

                        return (
                          <div 
                            key={post.id} 
                            className="rounded-xl border border-slate-100 p-4 bg-white hover:border-slate-200 transition-all flex gap-3.5 items-start relative group"
                          >
                            {/* Avatar */}
                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 font-display font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0">
                              {initials}
                            </div>

                             {/* Content */}
                             <div className="space-y-1.5 flex-1">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className="text-xs font-bold text-slate-800">{post.authorName}</span>
                                 <span className={`text-[9px] px-2 py-0.5 rounded border ${roleColor}`}>
                                   {post.authorRole}
                                 </span>
                                 <div className="ml-auto flex items-center gap-2">
                                   {post.readBy?.some(r => r.studentId === student.id) && (
                                     <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                       <Check size={11} className="stroke-[3]" /> Read
                                     </span>
                                   )}
                                   <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                                 </div>
                               </div>
                               <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/40 p-2.5 rounded-lg border border-slate-50/50 whitespace-pre-wrap">{post.content}</p>
                               
                               {/* 'X read this' counter trigger and expanded tracking list */}
                               <div className="mt-2" id={`bulletin-read-tracker-container-${post.id}`}>
                                 <button
                                   id={`bulletin-student-read-btn-${post.id}`}
                                   type="button"
                                   onClick={() => toggleBulletinReadList(post.id)}
                                   className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-brand-blue bg-slate-50 hover:bg-slate-100 rounded-md px-2 py-0.5 border border-slate-200/60 transition-colors cursor-pointer"
                                 >
                                   <Eye size={11} className="text-slate-400" />
                                   <span>{post.readBy?.length || 0} {post.readBy?.length === 1 ? 'student has' : 'students have'} read this</span>
                                 </button>

                                 {expandedBulletinReads[post.id] && (
                                   <div className="mt-1.5 p-2 rounded-lg border border-slate-100 bg-slate-50/40 text-[10px] text-slate-500 animate-fade-in" id={`bulletin-read-list-${post.id}`}>
                                     <div className="font-bold text-slate-600 mb-1">Seen by:</div>
                                     {(!post.readBy || post.readBy.length === 0) ? (
                                       <span className="italic text-slate-400">No one has seen this post yet.</span>
                                     ) : (
                                       <div className="flex flex-wrap gap-1">
                                         {post.readBy.map((r, idx) => {
                                           const readDate = new Date(r.timestamp);
                                           const readTimeStr = isNaN(readDate.getTime()) 
                                             ? r.timestamp 
                                             : readDate.toLocaleDateString('en-IN', {
                                                 day: '2-digit',
                                                 month: 'short',
                                                 hour: '2-digit',
                                                 minute: '2-digit'
                                               });
                                           return (
                                             <span 
                                               key={idx} 
                                               id={`student-read-receipt-${post.id}-${idx}`}
                                               className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 rounded-full px-1.5 py-0.2 font-medium"
                                               title={`Read at ${readTimeStr}`}
                                             >
                                               {r.studentName}
                                             </span>
                                           );
                                         })}
                                       </div>
                                     )}
                                   </div>
                                 )}
                               </div>
                             </div>

                            {/* Delete button */}
                            {isAuthor && (
                              <button
                                onClick={() => onDeleteBatchBulletinPost(post.id)}
                                className="text-slate-350 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-2 self-start cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete post"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB: MY STUDENT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card Summary */}
                <div className="md:col-span-1 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-brand-blue to-indigo-700" />
                    
                    <div className="relative pt-8 pb-4 flex flex-col items-center">
                      {/* Avatar with optional change overlay */}
                      <div className="relative group mb-3">
                        {profilePhotoUrl ? (
                          <img
                            src={profilePhotoUrl}
                            alt={student.name}
                            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-amber-400 text-brand-blue border-4 border-white shadow-md flex items-center justify-center text-3xl font-black font-display">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute bottom-0 right-0 rounded-full p-1.5 shadow-md border border-white text-white ${profilePhotoUrl ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
                          {profilePhotoUrl ? <Check size={12} className="font-bold" /> : <AlertTriangle size={12} />}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-lg text-slate-800">{student.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">Roll No: {student.rollNo}</p>
                      
                      <div className="mt-2.5 flex flex-col items-center gap-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-3xs">
                          🎓 {student.class}
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-400 flex items-center gap-1">
                          🔒 Registered Class & Fees Locked by Admin
                        </span>
                      </div>

                      <div className="w-full border-t border-slate-100 my-4 pt-4 text-left space-y-3">
                        <div className="flex items-center gap-2.5 text-xs">
                          <span className="font-semibold text-slate-400 w-24">Father's Name:</span>
                          <span className="text-slate-700 font-medium">{student.fatherName}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          <span className="font-semibold text-slate-400 w-24">Mother's Name:</span>
                          <span className="text-slate-700 font-medium">{student.motherName}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          <span className="font-semibold text-slate-400 w-24">Date of Birth:</span>
                          <span className="text-slate-700 font-medium font-mono">{student.dob}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          <span className="font-semibold text-slate-400 w-24">Gender:</span>
                          <span className="text-slate-700 font-medium">{student.gender}</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="font-semibold text-slate-400 w-24 flex-shrink-0">Address:</span>
                          <span className="text-slate-600 leading-normal">{student.address}</span>
                        </div>
                      </div>

                      <div className="w-full rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Verification Status</span>
                        {(!student.photoUrl || !student.mobile || !student.email) ? (
                          <div className="flex items-center justify-center gap-1 text-xs font-bold text-red-500">
                            <AlertTriangle size={14} /> Profile Incomplete
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-xs font-bold text-green-600">
                            <CheckCircle size={14} /> Fully Verified & Complete
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Official Billing & Fee Summary Card */}
                  <div id="card-student-billing-summary" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <h4 className="font-display font-black text-sm text-slate-800 border-b border-slate-100 pb-2">Official Billing Summary</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 font-display">Admission Date:</span>
                        <span className="text-slate-800 font-bold font-mono">{student.admissionDate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 font-display">Fee Starts From:</span>
                        <span className="text-slate-800 font-bold">{student.feeStartMonth || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 font-display">Monthly Tuition:</span>
                        <span className="text-indigo-900 font-black font-mono">₹{student.monthlyFee ?? 1200}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 font-display">Outstanding Balance:</span>
                        <span className={`font-black font-mono ${myFees.reduce((sum, f) => sum + f.pendingFee, 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{myFees.reduce((sum, f) => sum + f.pendingFee, 0)}
                        </span>
                      </div>
                      
                      {(() => {
                        // Get current fee status and next due date
                        const unpaid = myFees.filter(f => f.pendingFee > 0);
                        const nextDueRecord = unpaid.length > 0 ? unpaid[0] : null;
                        
                        // Current status based on overall status
                        let overallStatus = 'PAID';
                        let overallBg = 'bg-green-50 text-green-700 border-green-200';
                        if (unpaid.some(f => getFeeStatusForRecord(f) === 'OVERDUE')) {
                          overallStatus = 'OVERDUE';
                          overallBg = 'bg-red-50 text-red-700 border-red-200';
                        } else if (unpaid.some(f => getFeeStatusForRecord(f) === 'PENDING' || getFeeStatusForRecord(f) === 'PARTIAL')) {
                          overallStatus = 'PENDING DUES';
                          overallBg = 'bg-amber-50 text-amber-700 border-amber-200';
                        }
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-400 font-display">Current Status:</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${overallBg}`}>
                                {overallStatus}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-400 font-display">Next Due Date:</span>
                              <span className="text-slate-800 font-bold font-mono">{nextDueRecord ? nextDueRecord.dueDate : 'No pending dues'}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 font-display">Fee Timeline & Upcoming Cycles</span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {myFees.map((f) => {
                          const status = getFeeStatusForRecord(f);
                          let statusBg = 'bg-slate-50 text-slate-500';
                          if (status === 'PAID') statusBg = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                          else if (status === 'PARTIAL') statusBg = 'bg-amber-50 text-amber-700 border border-amber-100';
                          else if (status === 'OVERDUE') statusBg = 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse';
                          else if (status === 'PENDING') statusBg = 'bg-orange-50 text-orange-700 border border-orange-100';
                          else if (status === 'UPCOMING') statusBg = 'bg-blue-50 text-blue-700 border border-blue-100';
                          
                          return (
                            <div key={f.id} id={`timeline-item-${f.id}`} className="flex justify-between items-center text-[11px] p-1.5 rounded-lg border border-slate-100 bg-slate-50/50">
                              <span className="font-medium text-slate-700 font-display">{f.month}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-500 font-mono">₹{f.totalFee}</span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${statusBg}`}>{status}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-lg text-slate-800">Verify & Complete Profile</h3>
                      <p className="text-xs text-slate-500">Sunshine Classes requires all active students to provide a valid photo, active contact phone number, and official email ID.</p>
                    </div>

                    {profileSuccessMsg && (
                      <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 flex gap-3 items-center animate-fade-in text-green-800 text-xs font-semibold">
                        <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                        <div>{profileSuccessMsg}</div>
                      </div>
                    )}

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setIsSavingProfile(true);
                      
                      // Simulate a tiny delay for saving
                      setTimeout(() => {
                        setIsSavingProfile(false);
                        setProfileSuccessMsg('Congratulations! Your official profile photo, phone number, and email ID have been securely saved and updated.');
                        
                        if (onUpdateStudent) {
                          onUpdateStudent({
                            ...student,
                            email: profileEmail,
                            mobile: profileMobile,
                            photoUrl: profilePhotoUrl
                          });
                        }
                      }, 600);
                    }} className="space-y-5">
                      {/* 1. Mobile Number Input */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Student Mobile / Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-xs font-bold">+91</span>
                          <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            title="Please enter a valid 10-digit Indian phone number"
                            value={profileMobile}
                            onChange={(e) => setProfileMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9999988888"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Provide your primary contact number for weekly SMS updates & emergency calls.</p>
                      </div>

                      {/* 2. Email Address Input */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Student Email ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="rahul.verma@gmail.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Used for sending homework notifications, test report cards, and digital fee receipts.</p>
                      </div>

                      {/* 3. Drag-and-drop Image Upload */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Official Profile Passport Photo <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="space-y-1">
                          <CloudinaryUpload
                            id="profile-photo-picker-cloudinary"
                            folder="students"
                            cloudName={subConfig.cloudinaryCloudName}
                            uploadPreset={subConfig.cloudinaryUploadPreset}
                            apiKey={subConfig.cloudinaryApiKey}
                            apiSecret={subConfig.cloudinaryApiSecret}
                            maxSizeMB={subConfig.cloudinaryMaxFileSize}
                            initialUrl={profilePhotoUrl}
                            onUploadSuccess={(url) => setProfilePhotoUrl(url)}
                            onFileDeleted={() => setProfilePhotoUrl('')}
                            allowedTypes={['jpg', 'jpeg', 'png', 'webp']}
                            label="Student Photograph Profile Preview"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button
                          type="submit"
                          disabled={isSavingProfile || !profilePhotoUrl || !profileMobile || !profileEmail}
                          className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                            (!profilePhotoUrl || !profileMobile || !profileEmail) 
                              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                              : 'bg-brand-blue hover:bg-indigo-700 hover:shadow-lg active:scale-98'
                          }`}
                        >
                          {isSavingProfile ? (
                            <>
                              <Clock size={14} className="animate-spin" /> Saving Changes...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} /> Save Profile Details
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Password Management & Security Card */}
                  <div id="card-student-security" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                        <Lock className="text-brand-blue" size={18} /> Password & Security Management
                      </h3>
                      <p className="text-xs text-slate-500">Update your account login credentials. Sunshine Classes ERP enforces strong security guidelines for password changes.</p>
                    </div>

                    {pwdErrorMsg && (
                      <div id="student-pwd-error-banner" className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs font-semibold flex items-start gap-2">
                        <X className="text-rose-600 shrink-0 mt-0.5" size={16} />
                        <span>{pwdErrorMsg}</span>
                      </div>
                    )}

                    {pwdSuccessMsg && (
                      <div id="student-pwd-success-banner" className="mb-4 rounded-xl bg-green-50 border border-green-200 p-3 text-green-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle className="text-green-600 shrink-0" size={16} />
                        <span>{pwdSuccessMsg}</span>
                      </div>
                    )}

                    <form id="form-student-pwd-change" onSubmit={async (e) => {
                      e.preventDefault();
                      setPwdErrorMsg('');
                      setPwdSuccessMsg('');

                      const meetsLength = newPwdInput.length >= 8;
                      const meetsUpper = /[A-Z]/.test(newPwdInput);
                      const meetsLower = /[a-z]/.test(newPwdInput);
                      const meetsNum = /[0-9]/.test(newPwdInput);
                      const meetsSpecial = /[^A-Za-z0-9]/.test(newPwdInput);
                      const match = newPwdInput === confirmPwdInput && confirmPwdInput !== '';

                      if (!meetsLength || !meetsUpper || !meetsLower || !meetsNum || !meetsSpecial) {
                        setPwdErrorMsg('New password does not meet the security criteria.');
                        return;
                      }

                      if (!match) {
                        setPwdErrorMsg('Passwords do not match.');
                        return;
                      }

                      setIsUpdatingPwd(true);
                      try {
                        const storedUsers = localStorage.getItem('sunshine_users');
                        if (storedUsers && currentUser) {
                          const users = JSON.parse(storedUsers);
                          const liveUser = users.find((u: any) => u.id === currentUser.id);
                          if (liveUser) {
                            const hashedAttempt = simpleSecureHash(currentPwdInput);
                            const actualHash = liveUser.password || '';
                            const isMatched = hashedAttempt === actualHash || 
                                              hashedAttempt.replace('sha256_', 'sha256_mock_') === actualHash || 
                                              hashedAttempt.replace('sha256_mock_', 'sha256_') === actualHash;

                            if (!isMatched && liveUser.password) {
                              setPwdErrorMsg('The current password you entered is incorrect.');
                              setIsUpdatingPwd(false);
                              return;
                            }
                          }
                        }

                        await changePassword(newPwdInput);
                        setPwdSuccessMsg('Your password has been changed successfully! All other active sessions have been invalidated.');
                        setCurrentPwdInput('');
                        setNewPwdInput('');
                        setConfirmPwdInput('');
                      } catch (err: any) {
                        setPwdErrorMsg(err.message || 'An error occurred while updating your password.');
                      } finally {
                        setIsUpdatingPwd(false);
                      }
                    }} className="space-y-4">
                      {/* Current Password */}
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            id="student-current-pwd"
                            type={showCurrentPwd ? 'text' : 'password'}
                            required
                            value={currentPwdInput}
                            onChange={(e) => setCurrentPwdInput(e.target.value)}
                            placeholder="Enter your current password"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                          <Lock className="absolute left-3 top-3 text-slate-400" size={14} />
                          <button
                            id="btn-student-toggle-curr-pwd"
                            type="button"
                            onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* New Password */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              id="student-new-pwd"
                              type={showNewPwd ? 'text' : 'password'}
                              required
                              value={newPwdInput}
                              onChange={(e) => setNewPwdInput(e.target.value)}
                              placeholder="Enter secure new password"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                            />
                            <Lock className="absolute left-3 top-3 text-slate-400" size={14} />
                            <button
                              id="btn-student-toggle-new-pwd"
                              type="button"
                              onClick={() => setShowNewPwd(!showNewPwd)}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                            >
                              {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              id="student-confirm-pwd"
                              type={showConfirmPwd ? 'text' : 'password'}
                              required
                              value={confirmPwdInput}
                              onChange={(e) => setConfirmPwdInput(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                            />
                            <Lock className="absolute left-3 top-3 text-slate-400" size={14} />
                            <button
                              id="btn-student-toggle-conf-pwd"
                              type="button"
                              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                            >
                              {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Live Requirements Checklist */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700 block mb-1">Security Checklist:</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center gap-1.5">
                            {newPwdInput.length >= 8 ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={newPwdInput.length >= 8 ? 'text-green-700 font-medium' : 'text-slate-400'}>At least 8 characters</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/[A-Z]/.test(newPwdInput) ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={/[A-Z]/.test(newPwdInput) ? 'text-green-700 font-medium' : 'text-slate-400'}>One uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/[a-z]/.test(newPwdInput) ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={/[a-z]/.test(newPwdInput) ? 'text-green-700 font-medium' : 'text-slate-400'}>One lowercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/[0-9]/.test(newPwdInput) ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={/[0-9]/.test(newPwdInput) ? 'text-green-700 font-medium' : 'text-slate-400'}>One numeric digit</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/[^A-Za-z0-9]/.test(newPwdInput) ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={/[^A-Za-z0-9]/.test(newPwdInput) ? 'text-green-700 font-medium' : 'text-slate-400'}>One special symbol</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(newPwdInput === confirmPwdInput && confirmPwdInput !== '') ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={(newPwdInput === confirmPwdInput && confirmPwdInput !== '') ? 'text-green-700 font-bold' : 'text-slate-400'}>Passwords match</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          id="btn-student-submit-pwd"
                          type="submit"
                          disabled={isUpdatingPwd || !newPwdInput || newPwdInput !== confirmPwdInput || !(newPwdInput.length >= 8 && /[A-Z]/.test(newPwdInput) && /[a-z]/.test(newPwdInput) && /[0-9]/.test(newPwdInput) && /[^A-Za-z0-9]/.test(newPwdInput))}
                          className="rounded-xl bg-brand-blue hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {isUpdatingPwd ? 'Updating Security...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
      </div>



      {/* MODAL 1: SUBMIT HOMEWORK FORM */}
      {isSubmitHwOpen && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display font-bold text-base text-slate-800 mb-2">Submit Homework</h3>
            <p className="text-xs text-slate-500 mb-4">Subject: {selectedHomework.subject} • {selectedHomework.title}</p>

            <form onSubmit={handleSubmitHomework} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Type Your Homework Solutions / Notes</label>
                <textarea
                  id="ta-hw-submit-text"
                  required
                  rows={4}
                  value={hwAnswerText}
                  onChange={(e) => setHwAnswerText(e.target.value)}
                  placeholder="Provide details about your completed solutions or link to digital notebook..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                ></textarea>
              </div>

              <div className="space-y-1">
                <CloudinaryUpload
                  id="student-homework-upload-cloudinary"
                  folder="assignments"
                  cloudName={subConfig.cloudinaryCloudName}
                  uploadPreset={subConfig.cloudinaryUploadPreset}
                  apiKey={subConfig.cloudinaryApiKey}
                  apiSecret={subConfig.cloudinaryApiSecret}
                  maxSizeMB={subConfig.cloudinaryMaxFileSize}
                  initialUrl={hwFileUrl}
                  onUploadSuccess={(url) => setHwFileUrl(url)}
                  onFileDeleted={() => setHwFileUrl('')}
                  allowedTypes={['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx']}
                  label="Attach Photograph of Copy / Document (Optional)"
                  multiple={true}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  id="btn-hw-cancel"
                  type="button"
                  onClick={() => setIsSubmitHwOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-hw-submit-save"
                  type="submit"
                  className="rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-500"
                >
                  Submit Solutions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIGITAL ID CARD POPUP */}
      {idCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-brand-blue to-indigo-900 text-white p-6 shadow-2xl relative">
            <h4 className="text-center font-display font-black text-sm tracking-widest text-amber-300 uppercase mb-4">
              SUNSHINE CLASSES PIHANI
            </h4>

            <div className="flex flex-col items-center text-center">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="h-20 w-20 rounded-full border-4 border-amber-300 object-cover mb-3 shadow"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-20 w-20 rounded-full border-4 border-amber-300 bg-white text-slate-800 flex items-center justify-center text-3xl font-black mb-3 shadow">
                  {student.name.charAt(0)}
                </div>
              )}
              <h3 className="font-display font-bold text-lg">{student.name}</h3>
              <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">{student.class} Board Specialist</p>

              <div className="mt-4 w-full bg-white/10 rounded-xl p-3 text-xs text-left space-y-2 border border-white/10 font-mono">
                <div><span className="text-slate-300">Roll Number:</span> {student.rollNo}</div>
                <div><span className="text-slate-300">Father Name:</span> {student.fatherName}</div>
                <div><span className="text-slate-300">Batch Code:</span> {student.preferredBatch.split(' ')[0]}</div>
                <div><span className="text-slate-300">Contact No:</span> {student.mobile}</div>
              </div>

              {/* QR Code Segment */}
              <div className="mt-5 bg-white p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow">
                <div className="h-28 w-28 flex items-center justify-center border border-slate-100">
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`h-4 w-4 ${
                        (i % 3 === 0 || i % 4 === 1 || i < 5 || i > 20) ? 'bg-slate-900' : 'bg-slate-200'
                      }`}></div>
                    ))}
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-600 font-mono">SC-SECURE-VERIFICATION-{student.rollNo}</span>
              </div>
            </div>

            <button
              id="btn-close-id-card"
              onClick={() => setIdCardOpen(false)}
              className="absolute top-4 right-4 text-white/75 hover:text-white rounded-full p-1 bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: WEEKLY TIMETABLE SCHEDULE */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-850">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-slate-900">Academic Timetable</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {student.class} • {mySubscription?.batchName || student.preferredBatch || "Standard Batch"}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-schedule-modal"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-full p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Status / Shift Announcement */}
            <div className="grid gap-3 sm:grid-cols-2 mb-5">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-150">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Regular Timing</span>
                <span className="text-xs font-black text-slate-800 block mt-1.5">
                  ⏰ {mySubscription?.batchTime || student.preferredTiming || "04:00 PM - 06:30 PM"}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Classes held daily Monday to Saturday</span>
              </div>

              <div className={`rounded-xl p-4 border transition-all ${
                mySubscription?.tempTimeChange 
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                  : 'bg-slate-50/50 border-slate-150 text-slate-600'
              }`}>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Active Alerts</span>
                {mySubscription?.tempTimeChange ? (
                  <div className="mt-1">
                    <span className="text-xs font-black text-amber-800 flex items-center gap-1">
                      ⚠️ Temporary Shift Active
                    </span>
                    <p className="text-[11px] mt-0.5 leading-normal text-amber-700 font-semibold">
                      {mySubscription.tempTimeChange}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 text-xs font-bold flex items-center gap-1.5 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Standard timetable active. No changes today.
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Timetable Entries */}
            <div>
              <h4 className="font-display font-black text-xs text-slate-400 uppercase tracking-wider mb-3">Weekly Lecture Schedule</h4>
              
              {(() => {
                const myTimetable = timetableList.filter(entry => 
                  entry.className.toLowerCase() === student.class.toLowerCase()
                );

                if (myTimetable.length === 0) {
                  return (
                    <div className="text-center py-8 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200">
                      <Calendar size={28} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-600">No Custom Lectures Logged</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Refer to standard session timetables distributed by the Sunshine Academic Office.
                      </p>
                    </div>
                  );
                }

                // Group entries by day
                const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
                const grouped = myTimetable.reduce((acc, entry) => {
                  if (!acc[entry.day]) acc[entry.day] = [];
                  acc[entry.day].push(entry);
                  return acc;
                }, {} as Record<string, TimetableEntry[]>);

                return (
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
                    {daysOrder.map(day => {
                      const entries = grouped[day];
                      if (!entries || entries.length === 0) return null;
                      return (
                        <div key={day} className="rounded-xl border border-slate-150 bg-white p-3.5 shadow-3xs">
                          <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2 border-b border-indigo-50/80 pb-1 flex items-center justify-between">
                            <span>{day}</span>
                            <span className="text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-150 px-2 py-0.5 rounded-full font-mono">{entries.length} Classes</span>
                          </h5>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {entries.map(entry => (
                              <div key={entry.id} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-slate-800">{entry.subject}</span>
                                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">{entry.room}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex items-center gap-1">
                                    <Clock size={10} className="text-slate-400" />
                                    <span>{entry.startTime} - {entry.endTime}</span>
                                  </div>
                                  <div className="text-indigo-600 font-semibold">
                                    👨‍🏫 {entry.teacherName}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer with actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                id="btn-schedule-modal-close"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close Schedule
              </button>
              <button
                id="btn-schedule-modal-view-more"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setActiveTab('overview');
                }}
                className="rounded-xl bg-gradient-to-r from-[#0D47A1] to-[#1A237E] px-5 py-2.5 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                View in Overview Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FEE RECEIPT DIALOG PRINT */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative text-slate-800">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-4 mb-4">
              <SunshineLogo size={48} showText={true} textSubTitle="Excellence in Education • Pihani, Hardoi" />
              <span className="text-[10px] text-slate-400 mt-1">GSTIN / Registration No: 09BCXPS8401H1ZD</span>
            </div>

            {/* Receipt details */}
            <h4 className="text-center font-display font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">
              FEE PAYMENT RECEIPT / TAX INVOICE
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-100">
              <div>
                <div><span className="text-slate-400">Receipt ID:</span> {selectedReceipt.id}</div>
                <div><span className="text-slate-400">Date Issued:</span> {selectedReceipt.date}</div>
                <div><span className="text-slate-400">Student Name:</span> {selectedReceipt.studentName}</div>
              </div>
              <div className="text-right">
                <div><span className="text-slate-400">Roll No:</span> {student.rollNo}</div>
                <div><span className="text-slate-400">Academic Class:</span> {selectedReceipt.class}</div>
                <div><span className="text-slate-400">Collected By:</span> {selectedReceipt.receivedBy}</div>
              </div>
            </div>

            {/* Price block */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-4 text-xs">
              <div className="bg-slate-50 px-4 py-2 flex justify-between font-bold text-slate-500 text-[10px] uppercase">
                <span>Description</span>
                <span>Amount Paid (INR)</span>
              </div>
              <div className="px-4 py-3 flex justify-between border-b border-slate-100">
                <div>
                  <div className="font-bold">Coaching Tuition Fees</div>
                  <div className="text-[10px] text-slate-400">Session cycle for {selectedReceipt.month}</div>
                </div>
                <span className="font-bold text-slate-800">₹{selectedReceipt.amountPaid}.00</span>
              </div>
              <div className="bg-slate-50/70 px-4 py-3 flex justify-between font-bold text-sm text-brand-blue">
                <span>NET PAID TRANSACTION AMOUNT</span>
                <span>₹{selectedReceipt.amountPaid}.00</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mb-4 space-y-1">
              <div>• Transaction Method: **{selectedReceipt.paymentMethod}**</div>
              {selectedReceipt.transactionId && <div>• Reference Trans ID: **{selectedReceipt.transactionId}**</div>}
              <div>• Payment Status: **Completed & Reconciled**</div>
            </div>

            {/* Bottom buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                id="btn-print-cancel"
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                id="btn-print-pdf-trigger"
                onClick={() => {
                  alert("Voucher file sent to local system printer successfully.");
                  setSelectedReceipt(null);
                }}
                className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-blue-hover"
              >
                Print Voucher PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MONTHLY SUBSCRIPTION SECURE PAYMENT GATEWAY SIMULATOR */}
      {paySubId && mySubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-slate-900">SUNSHINE SECURE GATEWAY</h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Powered by Razorpay & UPI AutoSync</p>
              </div>
            </div>

            {paySuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4 animate-bounce">
                  <CheckCircle size={36} />
                </div>
                <h4 className="font-display font-black text-lg text-slate-950">PAYMENT SUCCESSFUL!</h4>
                <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
                  Thank you! Your tuition subscription for <strong>{mySubscription.batchName}</strong> has been updated. A receipt voucher has been generated in your portal.
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-4">Generating secure invoice tokens...</p>
              </div>
            ) : isPaying ? (
              <div className="text-center py-10 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin"></div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Authorizing Secure Transaction...</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Please do not refresh or close this browser tab</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-mono text-slate-500 text-left space-y-1">
                  <div>• Merchant ID: SUNSHINE_CLASSES_HD</div>
                  <div>• Gateway Target: Razorpay Secure Server API</div>
                  <div>• Handshake Status: Verifying secure OTP token...</div>
                </div>
              </div>
            ) : (
              <div>
                {/* Invoice Brief */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-4 text-xs">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-bold text-slate-800">{student.name}</span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-500">Batch Subscription:</span>
                    <span className="font-bold text-slate-800">{mySubscription.batchName}</span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-500">Tuition Fee Due:</span>
                    <span className="font-black text-slate-900">₹{mySubscription.monthlyFee}.00</span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-1.5 mt-1.5 flex justify-between font-bold text-brand-blue">
                    <span>Total Amount Payable:</span>
                    <span>₹{mySubscription.monthlyFee}.00</span>
                  </div>
                </div>

                {/* Method selector tab */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4 text-[10px] font-bold">
                  <button
                    onClick={() => setPaymentMethodSelected('UPI')}
                    className={`rounded-lg py-2 text-center transition-all cursor-pointer ${
                      paymentMethodSelected === 'UPI' ? 'bg-white shadow text-brand-blue' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    onClick={() => setPaymentMethodSelected('CARD')}
                    className={`rounded-lg py-2 text-center transition-all cursor-pointer ${
                      paymentMethodSelected === 'CARD' ? 'bg-white shadow text-brand-blue' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethodSelected('ONLINE')}
                    className={`rounded-lg py-2 text-center transition-all cursor-pointer ${
                      paymentMethodSelected === 'ONLINE' ? 'bg-white shadow text-brand-blue' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Net Bank
                  </button>
                  <button
                    onClick={() => setPaymentMethodSelected('NET_BANKING')}
                    className={`rounded-lg py-2 text-center transition-all cursor-pointer ${
                      paymentMethodSelected === 'NET_BANKING' ? 'bg-white shadow text-brand-blue' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Razorpay
                  </button>
                </div>

                {/* Sub Tab View Renderings */}
                {paymentMethodSelected === 'UPI' && (
                  <div className="space-y-3.5 mb-4 text-center">
                    <div className="mx-auto border border-slate-100 bg-white p-2.5 rounded-xl inline-block shadow">
                      {/* Dynamic QR Code */}
                      <div className="h-32 w-32 bg-slate-50 border border-slate-100 p-1 flex flex-col items-center justify-center gap-1">
                        <div className="grid grid-cols-8 gap-1">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className={`h-3 w-3 ${
                              (i % 5 === 0 || i % 7 === 1 || i < 16 || i > 48) ? 'bg-brand-blue' : 'bg-slate-200'
                            }`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Scan QR Code from BHIM, PhonePe, Paytm, or GPay to pay instantly.
                    </p>
                    <div className="text-left">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Or Enter UPI ID</label>
                      <input
                        type="text"
                        placeholder="studentname@okaxis"
                        defaultValue={`${student.name.toLowerCase().replace(/\s+/g, '')}@paytm`}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {paymentMethodSelected === 'CARD' && (
                  <div className="space-y-3 mb-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-blue focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">CVV / CVN</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="***"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-blue focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethodSelected === 'ONLINE' && (
                  <div className="mb-4 text-xs">
                    <label className="block text-[10px] font-bold text-slate-500 mb-2">Select Your Bank</label>
                    <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold text-slate-700">
                      <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white cursor-pointer hover:border-brand-blue">State Bank of India</div>
                      <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white cursor-pointer hover:border-brand-blue">HDFC Bank</div>
                      <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white cursor-pointer hover:border-brand-blue">ICICI NetBanking</div>
                      <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white cursor-pointer hover:border-brand-blue">Punjab National Bank</div>
                    </div>
                  </div>
                )}

                {paymentMethodSelected === 'NET_BANKING' && (
                  <div className="mb-4 text-center py-3">
                    <SunshineLogo size={36} showText={false} />
                    <p className="text-xs text-slate-600 max-w-xs mx-auto mt-2.5">
                      Redirecting securely to Sunshine Classes authorized payment node for board standard checkout processing.
                    </p>
                  </div>
                )}

                {/* Bottom checkout buttons */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                  <button
                    onClick={() => setPaySubId(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsPaying(true);
                      setTimeout(() => {
                        setIsPaying(false);
                        setPaySuccess(true);
                        // Trigger fee payment handler
                        onPaySubscription(paySubId, paymentMethodSelected, mySubscription.monthlyFee);
                        setTimeout(() => {
                          setPaySuccess(false);
                          setPaySubId(null);
                        }, 1800);
                      }, 1600);
                    }}
                    className="rounded-xl bg-brand-orange hover:bg-amber-500 text-white text-xs font-black px-5 py-2 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Confirm & Pay ₹{mySubscription.monthlyFee}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4B: OUTSTANDING TUITION FEE LEDGER SECURE PAYMENT GATEWAY SIMULATOR */}
      {payFeeId && selectedFeeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative text-slate-800 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-slate-900">SUNSHINE UPI PORTAL</h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">9161586254@upi</p>
                </div>
              </div>
              <button 
                id="btn-close-payment-portal"
                onClick={() => setPayFeeId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {paySuccess ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4 animate-bounce">
                  <CheckCircle size={36} />
                </div>
                <h4 className="font-display font-black text-lg text-slate-950">SUBMITTED FOR VERIFICATION!</h4>
                <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed font-semibold">
                  Your payment has been successfully submitted to the accounts team. Once verified, your status will update and a receipt will be emailed.
                </p>
                <button
                  id="btn-payment-done-close"
                  onClick={() => {
                    setPaySuccess(false);
                    setPayFeeId(null);
                  }}
                  className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 text-xs shadow-md cursor-pointer transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Invoice Details */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Details</h4>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Student Name</span>
                      <span className="font-bold text-slate-800">{student.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Fee Month</span>
                      <span className="font-bold text-slate-800">{selectedFeeItem.month}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Admission Number</span>
                      <span className="font-mono font-bold text-slate-800">{student.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Academic Class</span>
                      <span className="font-bold text-slate-800">{student.class}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Due Date</span>
                      <span className="font-mono font-bold text-slate-800">{selectedFeeItem.dueDate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Status</span>
                      <span className="font-extrabold text-amber-600">PENDING PAY</span>
                    </div>
                  </div>

                  {subConfig.allowPartialPayments ? (
                    <div className="border-t border-slate-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Payment Amount:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">₹</span>
                          <input
                            id="input-custom-pay-amount"
                            type="number"
                            min="1"
                            max={selectedFeeItem.pendingFee}
                            value={customPayAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (Number(val) > selectedFeeItem.pendingFee) {
                                setCustomPayAmount(String(selectedFeeItem.pendingFee));
                              } else {
                                setCustomPayAmount(val);
                              }
                            }}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-right text-indigo-900 focus:border-brand-blue outline-none"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right mt-1 font-medium font-mono">Outstanding dues: ₹{selectedFeeItem.pendingFee}</span>
                    </div>
                  ) : (
                    <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-brand-blue text-sm">
                      <span>Total Payable Amount:</span>
                      <span>₹{selectedFeeItem.pendingFee}.00</span>
                    </div>
                  )}
                </div>

                {/* Main Payment Step Views */}
                {upiStep === 'QR_DEEP_LINK' ? (() => {
                  const payAmt = subConfig.allowPartialPayments ? Number(customPayAmount) || selectedFeeItem.pendingFee : selectedFeeItem.pendingFee;
                  
                  // Initialize the configured payment gateway provider
                  const currentProviderId = subConfig.paymentGatewayProvider || 'FREE_UPI';
                  const provider = getPaymentProvider(currentProviderId);
                  
                  const payReq = provider.generateRequest({
                    amount: payAmt,
                    studentId: student.id,
                    studentName: student.name,
                    admissionNo: student.rollNo || student.id,
                    month: selectedFeeItem.month,
                    year: new Date().getFullYear().toString(),
                    coachingUpiId: subConfig.coachingUpiId || '9161586254@upi',
                    accountHolderName: subConfig.accountHolderName || 'Sunshine Classes'
                  });

                  // Display QR generator using api.qrserver.com
                  const qrApiUrl = payReq.qrUrl 
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payReq.qrUrl)}`
                    : null;

                  return (
                    <div className="space-y-4 animate-fade-in">
                      {/* Gateway description */}
                      <div className="text-center rounded-xl bg-indigo-50/50 p-3 border border-indigo-100 text-xs text-indigo-950 font-medium leading-relaxed">
                        🏦 Powered by <strong>{payReq.providerName}</strong>
                        {payReq.instructions && <p className="text-[10px] text-indigo-600 mt-1 font-semibold">{payReq.instructions}</p>}
                      </div>

                      {qrApiUrl && (
                        <div className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-2xl bg-white shadow-xs">
                          <img
                            id="img-payment-qr-code"
                            src={qrApiUrl}
                            alt="Scan UPI QR Code to Pay"
                            referrerPolicy="no-referrer"
                            className="h-44 w-44 object-contain shadow-sm border border-slate-50 p-1.5 rounded-lg"
                          />
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-2">
                            {subConfig.coachingUpiId || '9161586254@upi'}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {/* Mobile Deep Link launch button */}
                        <a
                          id="btn-quick-pay-now"
                          href={payReq.paymentUrl}
                          onClick={() => {
                            // Advance to confirmation screen where they submit UTR
                            setUpiStep('CONFIRMATION');
                          }}
                          className="w-full text-center block rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-4 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          🚀 Pay ₹{payAmt.toFixed(2)} with UPI
                        </a>
                        <button
                          id="btn-already-paid-utr"
                          onClick={() => setUpiStep('CONFIRMATION')}
                          className="w-full text-center block rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 transition-colors cursor-pointer"
                        >
                          I have completed payment, enter UTR
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  // Step 2: Confirmation / Enter UTR & optional Screenshot
                  <div className="space-y-4 animate-fade-in">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-950 font-medium leading-relaxed">
                      ⚠️ <strong>Payment Verification Submission:</strong> Please enter the 12-digit transaction reference number (UTR / Txn ID) from your payment app screen to claim this credit.
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">12-Digit UPI Transaction UTR ID *</label>
                        <input
                          id="input-student-upi-utr"
                          type="text"
                          maxLength={12}
                          placeholder="e.g. 614205819402"
                          value={transactionRefNum}
                          onChange={(e) => {
                            // standard UPI UTR is numeric 12-digits
                            const clean = e.target.value.replace(/\D/g, '');
                            setTransactionRefNum(clean);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-950 focus:bg-white"
                        />
                        {transactionRefNum.length > 0 && transactionRefNum.length < 12 && (
                          <span className="text-[9px] text-rose-500 font-bold block mt-1">UTR must be exactly 12 digits (entered {transactionRefNum.length}/12)</span>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Upload Payment Screenshot (Optional)</label>
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center">
                          {upiProofUrl ? (
                            <div className="space-y-2">
                              <img
                                src={upiProofUrl}
                                alt="Payment Proof Screenshot"
                                className="mx-auto max-h-32 rounded object-cover shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  onClick={() => setUpiProofUrl('')}
                                  className="text-[10px] font-bold text-rose-600 hover:underline"
                                >
                                  Remove Proof
                                </button>
                              </div>
                            </div>
                          ) : (
                            <CloudinaryUpload
                              id="cloudinary-student-upi-proof"
                              folder="fee_proofs"
                              onUploadSuccess={(url) => {
                                setUpiProofUrl(url);
                                alert("Transaction screenshot uploaded successfully!");
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        id="btn-upi-back-to-qr"
                        onClick={() => setUpiStep('QR_DEEP_LINK')}
                        className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-3 text-xs cursor-pointer text-center"
                      >
                        ⬅ Show QR/Link
                      </button>
                      <button
                        id="btn-upi-confirm-submit"
                        disabled={transactionRefNum.length !== 12}
                        onClick={() => {
                          if (transactionRefNum.length !== 12) {
                            alert("Please enter a valid 12-digit transaction UTR number.");
                            return;
                          }
                          const payAmt = subConfig.allowPartialPayments ? Number(customPayAmount) || selectedFeeItem.pendingFee : selectedFeeItem.pendingFee;
                          
                          if (onAddUpiPayment) {
                            const success = onAddUpiPayment({
                              studentId: student.id,
                              studentName: student.name,
                              admissionNo: student.rollNo || student.id,
                              class: student.class,
                              month: selectedFeeItem.month,
                              amount: payAmt,
                              utr: transactionRefNum,
                              screenshot: upiProofUrl || undefined,
                              feeStatusId: selectedFeeItem.id
                            });

                            if (success) {
                              setPaySuccess(true);
                              setTransactionRefNum('');
                              setUpiProofUrl('');
                              setUpiStep('QR_DEEP_LINK');
                            }
                          }
                        }}
                        className={`flex-1 rounded-xl font-bold px-4 py-3 text-xs cursor-pointer text-center text-white shadow transition-all ${
                          transactionRefNum.length === 12
                            ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95'
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                      >
                        Confirm & Submit
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                {upiStep === 'QR_DEEP_LINK' && (
                  <div className="flex justify-center border-t border-slate-100 pt-4 mt-4">
                    <button
                      id="btn-payment-cancel"
                      onClick={() => {
                        setPayFeeId(null);
                        setUpiStep('QR_DEEP_LINK');
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: SUBSCRIPTION RECEIPT POPUP */}
      {selectedSubReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative text-slate-800">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-4 mb-4">
              <SunshineLogo size={48} showText={true} textSubTitle="Excellence in Education • Pihani, Hardoi" />
              <span className="text-[10px] text-slate-400 mt-1">GSTIN / Registration No: 09BCXPS8401H1ZD</span>
            </div>

            {/* Receipt details */}
            <h4 className="text-center font-display font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">
              SUBSCRIPTION FEE RECEIPT / TAX INVOICE
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-100">
              <div>
                <div><span className="text-slate-400">Receipt ID:</span> {selectedSubReceipt.id}</div>
                <div><span className="text-slate-400">Date Issued:</span> {selectedSubReceipt.date}</div>
                <div><span className="text-slate-400">Student Name:</span> {selectedSubReceipt.studentName}</div>
              </div>
              <div className="text-right">
                <div><span className="text-slate-400">Roll No:</span> {student.rollNo}</div>
                <div><span className="text-slate-400">Academic Class:</span> {student.class}</div>
                <div><span className="text-slate-400">Collected By:</span> {selectedSubReceipt.receivedBy}</div>
              </div>
            </div>

            {/* Price block */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-4 text-xs">
              <div className="bg-slate-50 px-4 py-2 flex justify-between font-bold text-slate-500 text-[10px] uppercase">
                <span>Description</span>
                <span>Amount Paid (INR)</span>
              </div>
              <div className="px-4 py-3 flex justify-between border-b border-slate-100">
                <div>
                  <div className="font-bold">Monthly Course Batch Subscription</div>
                  <div className="text-[10px] text-slate-400">For academic month: {selectedSubReceipt.month}</div>
                </div>
                <span className="font-bold text-slate-800">₹{selectedSubReceipt.amountPaid}.00</span>
              </div>
              <div className="bg-slate-50/70 px-4 py-3 flex justify-between font-bold text-sm text-brand-blue">
                <span>NET PAID TRANSACTION AMOUNT</span>
                <span>₹{selectedSubReceipt.amountPaid}.00</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mb-4 space-y-1">
              <div>• Transaction Method: **{selectedSubReceipt.paymentMethod}**</div>
              {selectedSubReceipt.transactionId && <div>• Reference Trans ID: **{selectedSubReceipt.transactionId}**</div>}
              <div>• Payment Status: **Completed & Reconciled**</div>
            </div>

            {/* Bottom buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedSubReceipt(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Subscription Voucher file sent to local system printer successfully.");
                  setSelectedSubReceipt(null);
                }}
                className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-blue-hover cursor-pointer"
              >
                Print Voucher PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: MODAL-BASED DOCUMENT VIEWER FOR ATTACHED PDF / IMAGES */}
      {viewerFileUrl && (
        <div id="modal-doc-viewer-overlay" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div id="modal-doc-viewer-content" className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-slate-100">
            <div id="doc-viewer-header" className="flex items-center justify-between border-b border-slate-150 px-6 py-4 bg-slate-50">
              <div className="min-w-0 pr-4">
                <h3 id="doc-viewer-title" className="font-display font-black text-sm text-slate-800 truncate">{viewerFileTitle || 'Document Viewer'}</h3>
                <p id="doc-viewer-subtitle" className="text-[10px] text-slate-400 font-mono select-all truncate max-w-lg mt-0.5" title={viewerFileUrl}>{viewerFileUrl}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  id="btn-doc-viewer-download"
                  href={viewerFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Download File ↗
                </a>
                <button
                  id="btn-doc-viewer-close"
                  onClick={() => { setViewerFileUrl(null); setViewerFileTitle(''); }}
                  className="rounded-xl bg-slate-200 hover:bg-slate-300 p-2 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
                  title="Close Document"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div id="doc-viewer-body" className="flex-1 bg-slate-900/5 p-4 overflow-auto flex items-center justify-center relative min-h-[300px]">
              {viewerFileUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || viewerFileUrl.startsWith('data:image/') ? (
                <img
                  id="img-doc-viewer-rendering"
                  src={viewerFileUrl}
                  alt="Rendered Document Attachment"
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg bg-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <iframe
                  id="iframe-doc-viewer-rendering"
                  src={viewerFileUrl}
                  title="Document Attachment Viewer"
                  className="w-full h-full rounded-lg border-0 bg-white shadow-inner"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
