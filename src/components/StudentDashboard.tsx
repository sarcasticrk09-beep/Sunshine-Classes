/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  TrendingUp,
  Award,
  QrCode,
  AlertTriangle,
  Wifi,
  WifiOff,
  Sparkles,
  Inbox,
  Tv,
  Check
} from 'lucide-react';
import { Student, Attendance, FeeStatus, FeeReceipt, Test, StudentMark, Homework, HomeworkSubmission, AppNotification, StudentSubscription, SubscriptionPayment, SubscriptionReceipt, SubscriptionNotification, SubscriptionConfig, TimetableEntry } from '../types';
import SunshineLogo from './SunshineLogo';

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
  timetableList: TimetableEntry[];
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
  timetableList
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees' | 'performance' | 'homework' | 'study-material' | 'timetable' | 'notifications'>('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [hwAnswerText, setHwAnswerText] = useState('');
  const [isSubmitHwOpen, setIsSubmitHwOpen] = useState(false);
  const [idCardOpen, setIdCardOpen] = useState(false);

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
      ? "Simulated Offline Mode ACTIVATED. You are now disconnected from the live ERP database. Only pre-downloaded homework solutions and study materials can be viewed."
      : "Live Online Mode RESTORED. Full sync with Sunshine Classes digital databases is active."
    );
  };

  const handleDownloadHw = (id: string) => {
    const nextList = downloadedHw.includes(id) ? downloadedHw.filter(x => x !== id) : [...downloadedHw, id];
    setDownloadedHw(nextList);
    localStorage.setItem('sunshine_downloaded_hw', JSON.stringify(nextList));
    alert(downloadedHw.includes(id) 
      ? "Removed copy from local device storage." 
      : "Homework prompt, teacher details and answer sheet cached. Available in offline sandbox."
    );
  };

  const handleDownloadMaterial = (id: string) => {
    const nextList = downloadedMaterials.includes(id) ? downloadedMaterials.filter(x => x !== id) : [...downloadedMaterials, id];
    setDownloadedMaterials(nextList);
    localStorage.setItem('sunshine_downloaded_materials', JSON.stringify(nextList));
    alert(downloadedMaterials.includes(id)
      ? "Removed study notes from offline cache."
      : "Downloaded 'Offline Notes'. High-speed reading enabled, no internet required!"
    );
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
  const [selectedSubReceipt, setSelectedSubReceipt] = useState<SubscriptionReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [paymentMethodSelected, setPaymentMethodSelected] = useState<'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING'>('UPI');

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
      status: 'SUBMITTED'
    });

    setIsSubmitHwOpen(false);
    setSelectedHomework(null);
  };

  // SVG Chart generator for test results
  const renderPerformanceChart = () => {
    if (myMarks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <TrendingUp className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-500">No test marks entered yet for Class 10 boards syllabus.</p>
        </div>
      );
    }

    // Prepare chart coordinates
    const chartWidth = 500;
    const chartHeight = 200;
    const padding = 40;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    const points = myMarks.map((m, idx) => {
      const testObj = tests.find((t) => t.id === m.testId);
      const pct = testObj ? (m.marksObtained / testObj.totalMarks) * 100 : 0;
      const x = padding + (idx / Math.max(1, myMarks.length - 1)) * graphWidth;
      const y = padding + graphHeight - (pct / 100) * graphHeight;
      return { x, y, pct, title: testObj?.title || 'Test', score: `${m.marksObtained}/${testObj?.totalMarks}` };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="mb-4 font-display font-bold text-sm text-slate-800">Your Exam Marks Trend (%)</h4>
        <div className="min-w-[500px] h-[200px] relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = padding + graphHeight - (v / 100) * graphHeight;
              return (
                <g key={v}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-400">{v}%</text>
                </g>
              );
            })}

            {/* Line graph */}
            {points.length > 1 && (
              <path d={pathData} fill="none" stroke="#0D47A1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Data points */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="6" fill="#FF9800" stroke="#0D47A1" strokeWidth="2" />
                <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[9px] font-bold fill-brand-blue bg-white">{p.score}</text>
                <text x={p.x} y={chartHeight - 10} textAnchor="middle" className="text-[8px] font-medium fill-slate-500 max-w-[50px]">
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
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-brand-blue p-6 text-white md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-brand-blue text-2xl font-black shadow-lg">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-black">{student.name}</h2>
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                {student.class} Student
              </span>
            </div>
            <p className="text-sm text-blue-100">Roll No: {student.rollNo} • Batch: {student.preferredBatch}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            id="btn-digital-id"
            onClick={() => setIdCardOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 shadow-md hover:bg-amber-500"
          >
            <QrCode size={14} /> Digital Student ID Card
          </button>
        </div>
      </div>

      {/* Main ERP Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Hand Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
            <span className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student ERP Menu</span>
            
            <button
              id="student-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={16} /> Dashboard Overview
            </button>

            <button
              id="student-tab-attendance"
              onClick={() => setActiveTab('attendance')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'attendance' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar size={16} /> Attendance Log ({calculatedAttendancePct}%)
            </button>

            <button
              id="student-tab-fees"
              onClick={() => setActiveTab('fees')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'fees' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard size={16} /> Tuition Fees & Receipts
            </button>

            <button
              id="student-tab-performance"
              onClick={() => setActiveTab('performance')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'performance' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp size={16} /> Tests & Report Card
            </button>

            <button
              id="student-tab-homework"
              onClick={() => setActiveTab('homework')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'homework' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} /> Homework Assignments
            </button>

            <button
              id="student-tab-material"
              onClick={() => setActiveTab('study-material')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'study-material' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Download size={16} /> Study Material Center
            </button>

            <button
              id="student-tab-timetable"
              onClick={() => setActiveTab('timetable')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'timetable' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock size={16} /> Smart Timetable
            </button>

            <button
              id="student-tab-notifications"
              onClick={() => setActiveTab('notifications')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'notifications' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell size={16} /> Notification Center
              {notifications.length > 0 && (
                <span className="ml-auto h-2 w-2 rounded-full bg-brand-orange animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Progressive Web App (PWA) Widget */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles size={16} className="text-indigo-600 animate-pulse" /> PWA Desktop App
            </h4>
            
            {pwaInstallState === 'NOT_INSTALLED' ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Install Sunshine directly on your device home screen for fast loading & push notifications.
                </p>
                <button
                  id="btn-pwa-install-sidebar"
                  onClick={handleSimulateInstall}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download size={13} /> Install Standalone App
                </button>
              </div>
            ) : pwaInstallState === 'INSTALLING' ? (
              <div className="text-center py-2 space-y-2">
                <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-[10px] text-slate-400 font-bold block">Adding to home screen...</span>
              </div>
            ) : (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center space-y-1.5">
                <div className="flex justify-center text-indigo-600"><CheckCircle size={20} /></div>
                <span className="text-xs font-black text-indigo-950 block">Installed on Device ✓</span>
                <span className="text-[9px] text-slate-500 leading-none block font-semibold">Standalone Mode Active</span>
              </div>
            )}

            {/* Simulated Offline Switch */}
            <div className="border-t border-slate-100 pt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  {isOfflineMode ? <WifiOff size={13} className="text-brand-orange" /> : <Wifi size={13} className="text-green-500" />}
                  Sandbox Mode:
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOfflineMode ? 'bg-orange-50 text-brand-orange border border-orange-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                  {isOfflineMode ? 'OFFLINE' : 'ONLINE'}
                </span>
              </div>
              <button
                id="btn-toggle-offline-sim"
                onClick={toggleOfflineMode}
                className={`w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  isOfflineMode 
                    ? 'bg-slate-50 text-slate-700 hover:bg-white border-slate-200' 
                    : 'bg-orange-50 text-brand-orange hover:bg-orange-100 border-orange-150'
                }`}
              >
                {isOfflineMode ? 'Connect to Live ERP' : 'Simulate Offline Mode'}
              </button>
            </div>
          </div>

          {/* Quick Notice Board widget */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="font-display font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
              <Bell size={16} className="text-brand-orange" /> Real-time Notice Board
            </h4>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                  <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded uppercase mb-1 ${
                    n.category === 'EXAM' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {n.category}
                  </span>
                  <p className="text-xs font-bold text-slate-800">{n.title}</p>
                  <p className="text-[10px] text-slate-500 leading-snug">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Hand Dynamic Content Frame */}
        <div className="lg:col-span-3">
          {isOfflineMode && !['homework', 'study-material'].includes(activeTab) ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange mb-4 animate-bounce">
                <WifiOff size={32} />
              </div>
              <h3 className="font-display font-black text-xl text-slate-950 mb-2">PORTAL IS OFFLINE</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                You have activated <strong>Simulated Offline Mode</strong>. Live digital resources (such as active fee collection gateways, attendance registers, and real-time grades) are temporarily unavailable in standalone local sandbox.
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
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Analytics Quick Cards */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm flex items-center gap-4">
                      <div className="rounded-xl bg-brand-blue p-3 text-white">
                        <Calendar size={22} />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Attendance</span>
                        <span className="font-display text-xl font-bold text-slate-800">{calculatedAttendancePct}%</span>
                        <span className="text-[10px] text-green-600 font-semibold block">Outstanding Ratio</span>
                      </div>
                    </div>
                    
                    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm flex items-center gap-4">
                      <div className="rounded-xl bg-indigo-600 p-3 text-white">
                        <Award size={22} />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Grade</span>
                        <span className="font-display text-xl font-bold text-slate-800">88.4%</span>
                        <span className="text-[10px] text-indigo-600 font-semibold block">Top 10 percentile</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm flex items-center gap-4">
                      <div className={`rounded-xl p-3 text-white ${
                        mySubscription?.status === 'EXPIRED' ? 'bg-red-500' :
                        mySubscription?.status === 'OVERDUE' ? 'bg-orange-500' : 'bg-green-600'
                      }`}>
                        <CreditCard size={22} />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Subscription Status</span>
                        <span className={`font-display text-xs font-black block uppercase ${
                          mySubscription?.status === 'ACTIVE' ? 'text-green-600' :
                          mySubscription?.status === 'DUE_SOON' ? 'text-amber-500 font-semibold animate-pulse' :
                          mySubscription?.status === 'OVERDUE' ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {mySubscription?.status || 'NO ACTIVE SUB'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Due: {mySubscription?.nextDueDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

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
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="p-3">Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Class Session</th>
                          <th className="p-3">Marked By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {myAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No official attendance logs added yet.</td>
                          </tr>
                        ) : (
                          myAttendance.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-700">{a.date}</td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  a.status === 'PRESENT' ? 'bg-green-50 text-green-700' :
                                  a.status === 'ABSENT' ? 'bg-red-50 text-brand-red' :
                                  a.status === 'LATE' ? 'bg-amber-50 text-brand-orange' : 'bg-blue-50 text-brand-blue'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500">{a.class}</td>
                              <td className="p-3 text-slate-500">{a.markedBy}</td>
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
                <div className="space-y-6">
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

                  {/* Payment History log */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="font-display font-bold text-base text-slate-800 mb-4">Subscription Payment History</h3>

                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
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
                        <tbody className="divide-y divide-slate-50 text-xs">
                          {mySubPayments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No paid subscription transactions generated yet.</td>
                            </tr>
                          ) : (
                            mySubPayments.map((p) => {
                              const matchingReceipt = mySubReceipts.find(r => r.paymentId === p.id);
                              return (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-semibold text-brand-blue">{p.id}</td>
                                  <td className="p-3 font-bold text-slate-700">{p.month}</td>
                                  <td className="p-3 font-black text-slate-900">₹{p.amountPaid}</td>
                                  <td className="p-3 text-slate-500 font-mono text-[10px] uppercase">{p.paymentMethod}</td>
                                  <td className="p-3 text-slate-500">{p.paymentDate}</td>
                                  <td className="p-3 font-mono text-[10px] text-slate-400">{p.transactionId || 'N/A'}</td>
                                  <td className="p-3">
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
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Homework Assignments</h3>
              <p className="text-xs text-slate-500 mb-6">Complete assignments before their due dates to receive positive teacher evaluation remarks. Cache assignments to complete them even when offline.</p>

              <div className="space-y-4">
                {homeworkWithStatus.map((hw) => {
                  const isCached = downloadedHw.includes(hw.id);
                  return (
                    <div key={hw.id} className="rounded-xl border border-slate-100 p-5 bg-slate-50/30">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="inline-block rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue uppercase">
                              {hw.subject}
                            </span>
                            <button
                              id={`btn-cache-hw-${hw.id}`}
                              onClick={() => handleDownloadHw(hw.id)}
                              className={`inline-flex items-center gap-1 text-[9px] font-bold rounded-lg px-2.5 py-1 border transition-all cursor-pointer ${
                                isCached 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {isCached ? '✓ Offline Ready' : '↓ Cache Offline'}
                            </button>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{hw.title}</h4>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{hw.description}</p>
                          
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
                {[
                  { id: 'mat1', title: 'Class 10 Math Formula Cheat-Sheet', subject: 'Mathematics', desc: 'Complete algebraic, quadratic, and trigonometric formulas in 2 clean pages.', file: 'math_formulas.pdf', size: '1.2 MB' },
                  { id: 'mat2', title: 'Chemical Reactions and Equations PDF', subject: 'Science', desc: 'NCERT back exercise solved chemical reactions with balancing shortcuts.', file: 'chemical_equations.pdf', size: '2.5 MB' },
                  { id: 'mat3', title: 'Active & Passive Voice Rules Guide', subject: 'English', desc: 'English grammar rules with pre-board mock practice questions.', file: 'english_grammar_voice.pdf', size: '800 KB' },
                  { id: 'mat4', title: 'Class 10 Physics Ray Diagrams', subject: 'Science', desc: 'Hand-drawn mirror and lens ray formation scenarios for board exam reference.', file: 'physics_ray_diagrams.pdf', size: '4.1 MB' }
                ].map((item, idx) => {
                  const isCached = downloadedMaterials.includes(item.id);
                  return (
                    <div key={idx} className="rounded-xl border border-slate-100 p-4 hover:border-slate-300 hover:shadow-sm transition-all flex justify-between items-start gap-4 bg-slate-50/10">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase text-brand-blue block">{item.subject}</span>
                          {isCached && <span className="text-[8px] font-bold text-green-700 bg-green-50 px-2 py-0.2 rounded border border-green-200">✓ Cached</span>}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                        <span className="text-[9px] font-mono text-slate-400 block mt-2">{item.file} ({item.size})</span>
                      </div>
                      <button
                        id={`btn-dl-material-${idx}`}
                        onClick={() => handleDownloadMaterial(item.id)}
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

          {/* TAB: SMART TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-800">Smart Lecture Timetable</h3>
                    <p className="text-xs text-slate-500">Live lecture schedules, assigned faculty, and classroom allocations for {student.class}.</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    Auto-Synced ✓
                  </span>
                </div>

                {/* Holiday announcements */}
                {timetableList.some(t => t.className === student.class && t.isHoliday) && (
                  <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50/50 p-4 flex gap-3 items-start">
                    <AlertTriangle size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">Important Holiday Notice</h4>
                      {timetableList.filter(t => t.className === student.class && t.isHoliday).map((item, idx) => (
                        <p key={item.id} className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                          <strong>{item.day}:</strong> Academic classes are suspended due to: <em>"{item.holidayReason || 'Festival Break'}"</em>.
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid for Today and Tomorrow */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Today's Lectures */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                      Today's Lecture Schedule
                    </h4>

                    {timetableList.filter(t => t.className === student.class && !t.isHoliday).length === 0 ? (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 text-center text-xs text-slate-400 font-medium">
                        No active classes scheduled for today. Enjoy your self-study!
                      </div>
                    ) : (
                      timetableList.filter(t => t.className === student.class && !t.isHoliday).map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all bg-white relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue group-hover:bg-brand-orange transition-all"></div>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-slate-400 block">{item.startTime} - {item.endTime}</span>
                              <h5 className="text-sm font-bold text-slate-800 mt-1">{item.subject}</h5>
                              <p className="text-xs text-slate-500 mt-0.5">Faculty: {item.teacherName}</p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                              Room: {item.room}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* General Full Week Timetable */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Weekly Class Breakdown
                    </h4>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                        const dayLectures = timetableList.filter(t => t.className === student.class && t.day === day);
                        return (
                          <div key={day} className="rounded-xl border border-slate-50 p-3 bg-slate-50/40">
                            <h5 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">{day}</h5>
                            {dayLectures.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">No scheduled lectures.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {dayLectures.map(dl => (
                                  <div key={dl.id} className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-slate-800">
                                      {dl.subject} {dl.isHoliday ? <span className="text-red-500 font-normal">(Holiday)</span> : `(Rm ${dl.room})`}
                                    </span>
                                    <span className="text-slate-400 font-mono">{dl.startTime} - {dl.endTime}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                    {notifications.length} Total Alerts
                  </span>
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                      <Inbox className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500 font-bold">Inbox is completely clear!</p>
                      <p className="text-xs text-slate-400 mt-1">You will receive alerts here when teachers post updates.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
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
        </>
      )}
    </div>
      </div>

      {/* PWA Simulated Install Modal */}
      {showPwaInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                <Tv size={24} />
              </div>
              <button 
                onClick={() => setShowPwaInstallModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">Add Sunshine Classes to home screen?</h3>
              <p className="text-xs text-slate-500 leading-normal">
                This places a standalone shortcut icon on your desktop or application drawer. Enjoy high-speed offline cached access to your curriculum.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPwaInstallModal(false)}
                className="flex-1 rounded-xl border border-slate-200 text-slate-700 py-2.5 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={triggerSimulatedInstallProgress}
                className="flex-1 rounded-xl bg-indigo-600 text-white py-2.5 text-xs font-black hover:bg-indigo-700 shadow-md cursor-pointer"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}

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

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Attach Photograph of Copy / Document (Optional)</label>
                <input
                  id="input-hw-file"
                  type="file"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"
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
              <div className="h-20 w-20 rounded-full border-4 border-amber-300 bg-white text-slate-800 flex items-center justify-center text-3xl font-black mb-3 shadow">
                {student.name.charAt(0)}
              </div>
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
    </div>
  );
}

// Inline X SVG helper
function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
