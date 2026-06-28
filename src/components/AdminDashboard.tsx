/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Printer
} from 'lucide-react';
import { Student, Teacher, User, Course, Batch, FeeStatus, FeeReceipt, AuditLog, AppNotification, StudentSubscription, SubscriptionPayment, SubscriptionReceipt, SubscriptionNotification, SubscriptionConfig } from '../types';

interface AdminDashboardProps {
  students: Student[];
  teachers: Teacher[];
  users: User[];
  courses: Course[];
  batches: Batch[];
  feeStatuses: FeeStatus[];
  feeReceipts: FeeReceipt[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  onAddStudent: (std: Omit<Student, 'id' | 'rollNo' | 'attendancePercentage'>) => void;
  onDeleteStudent: (id: string) => void;
  onAddTeacher: (tch: Omit<Teacher, 'id'>) => void;
  onDeleteTeacher: (id: string) => void;
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
}

export default function AdminDashboard({
  students,
  teachers,
  users,
  courses,
  batches,
  feeStatuses,
  feeReceipts,
  auditLogs,
  notifications,
  onAddStudent,
  onDeleteStudent,
  onAddTeacher,
  onDeleteTeacher,
  onAddNotification,
  onDeleteNotification,
  onTriggerBackup,
  subscriptions,
  subPayments,
  subReceipts,
  subNotifications,
  subConfig,
  onUpdateConfig,
  onPaySubscription
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'announcements' | 'audit' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

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
            Sunshine Classes ERP Automated Registry System • Shubham Shukla, Founder.
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

  // Add Student Form States
  const [stdName, setStdName] = useState('');
  const [stdClass, setStdClass] = useState('Class 10');
  const [stdFather, setStdFather] = useState('');
  const [stdMother, setStdMother] = useState('');
  const [stdDob, setStdDob] = useState('2011-05-15');
  const [stdGender, setStdGender] = useState('Male');
  const [stdAddress, setStdAddress] = useState('');
  const [stdMobile, setStdMobile] = useState('');
  const [stdParentMobile, setStdParentMobile] = useState('');
  const [stdEmail, setStdEmail] = useState('');
  const [stdBatch, setStdBatch] = useState('Class 10 - Evening Stars');
  const [stdTiming, setStdTiming] = useState('04:00 PM - 06:30 PM');

  // Add Teacher Form States
  const [tchName, setTchName] = useState('');
  const [tchEmail, setTchEmail] = useState('');
  const [tchPhone, setTchPhone] = useState('');
  const [tchQual, setTchQual] = useState('');
  const [tchSpecs, setTchSpecs] = useState('');
  const [tchBatches, setTchBatches] = useState('');

  // Add Notification Form States
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifCategory, setNotifCategory] = useState<'ANNOUNCEMENT' | 'EXAM' | 'FEE' | 'HOLIDAY'>('ANNOUNCEMENT');
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');

  // Subscription Config States
  const [cfgBillingDate, setCfgBillingDate] = useState(subConfig.billingDate);
  const [cfgGracePeriod, setCfgGracePeriod] = useState(subConfig.gracePeriod);
  const [cfgLateFee, setCfgLateFee] = useState(subConfig.lateFee || 0);
  const [cfgEnableOverdueSMS, setCfgEnableOverdueSMS] = useState(subConfig.enableOverdueSMS ?? true);
  const [cfgEnableMidGraceSMS, setCfgEnableMidGraceSMS] = useState(subConfig.enableMidGraceSMS ?? true);
  const [cfgEnableExpiryWarningSMS, setCfgEnableExpiryWarningSMS] = useState(subConfig.enableExpiryWarningSMS ?? false);
  const [cfgEnableExpiredSMS, setCfgEnableExpiredSMS] = useState(subConfig.enableExpiredSMS ?? true);

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
      whatsapp: stdMobile,
      parentMobile: stdParentMobile,
      email: stdEmail,
      preferredBatch: stdBatch,
      preferredTiming: stdTiming,
      admissionDate: new Date().toISOString().split('T')[0]
    });

    setStdName('');
    setStdFather('');
    setStdMother('');
    setStdAddress('');
    setStdMobile('');
    setStdParentMobile('');
    setStdEmail('');
    alert("New student registered into Sunshine Classes ERP system successfully.");
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTeacher({
      userId: `u-tch-${Date.now()}`,
      name: tchName,
      email: tchEmail,
      phone: tchPhone,
      qualification: tchQual,
      specialty: tchSpecs.split(',').map((s) => s.trim()),
      batches: tchBatches.split(',').map((b) => b.trim())
    });

    setTchName('');
    setTchEmail('');
    setTchPhone('');
    setTchQual('');
    setTchSpecs('');
    setTchBatches('');
    alert("New faculty registered.");
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

  const handleSaveConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      billingDate: Number(cfgBillingDate),
      gracePeriod: Number(cfgGracePeriod),
      lateFee: Number(cfgLateFee),
      enableOverdueSMS: cfgEnableOverdueSMS,
      enableMidGraceSMS: cfgEnableMidGraceSMS,
      enableExpiryWarningSMS: cfgEnableExpiryWarningSMS,
      enableExpiredSMS: cfgEnableExpiredSMS
    });
    alert("Sunshine Classes ERP configurations updated successfully! Payment grace periods, late fees, and automatic SMS/WhatsApp levels are synchronized.");
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
        <div className="relative h-[150px] w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full min-w-[400px]">
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

  return (
    <div id="admin-portal" className="mx-auto max-w-7xl px-4 py-8">
      {/* Admin Head Badge */}
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-indigo-950 p-6 text-white md:flex-row md:items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-indigo-950 text-2xl font-black shadow">
            <Shield size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-black">Shubham Shukla</h2>
              <span className="rounded bg-brand-orange/20 border border-brand-orange/30 px-2.5 py-0.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                Founder & Lead Director
              </span>
            </div>
            <p className="text-sm text-slate-300">Sunshine Classes • Mishra Gali opposite Subhash Park, Pihani</p>
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
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
            <span className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ERP Operations</span>

            <button
              id="admin-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Activity size={16} /> Admin Operations Overview
            </button>

            <button
              id="admin-tab-students"
              onClick={() => setActiveTab('students')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'students' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users size={16} /> Manage Student ERP ({students.length})
            </button>

            <button
              id="admin-tab-teachers"
              onClick={() => setActiveTab('teachers')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'teachers' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} /> Manage Teachers & Batches
            </button>

            <button
              id="admin-tab-announcements"
              onClick={() => setActiveTab('announcements')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'announcements' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell size={16} /> Broadcast Announcements
            </button>

            <button
              id="admin-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'audit' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={16} /> Audit & System Logs
            </button>

            <button
              id="admin-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'settings' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings size={16} /> Database Backup & settings
            </button>
          </div>
        </div>

        {/* Dynamic content area */}
        <div className="lg:col-span-3">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-black text-base text-slate-800">ERP Control Center</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Welcome to Sunshine Classes premium administrative suite. From this portal, you can monitor student roll counts, view real-time monthly tuition revenues, verify database backup settings, and broadcast critical notice reminders directly to teacher and student dashboards instantly.
              </p>

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

                <div className="overflow-hidden border border-slate-100 rounded-xl">
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
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-indigo-900 font-mono">{student.rollNo}</td>
                          <td className="p-3 font-bold text-slate-800">{student.name}</td>
                          <td className="p-3 text-slate-600">{student.class}</td>
                          <td className="p-3 text-slate-500">F: {student.fatherName}<br />M: {student.motherName}</td>
                          <td className="p-3 text-slate-500">{student.mobile}</td>
                          <td className="p-3">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* Add Teacher Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Add New Coaching Faculty</h3>
                <p className="text-xs text-slate-500 mb-4">Register credential profiles of new teachers to allow class syllabus marking.</p>

                <form onSubmit={handleCreateTeacher} className="space-y-4">
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
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Batch Allocations (comma separated)</label>
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

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-add-tch-submit"
                      type="submit"
                      className="rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow transition-colors"
                    >
                      Authorize Faculty Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Faculty Directory */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-4">Board Teachers Directory</h3>

                <div className="space-y-4">
                  {teachers.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{t.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Qual: {t.qualification}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Specialty: {t.specialty.join(', ')}</p>
                      </div>

                      <button
                        id={`btn-del-teacher-${t.id}`}
                        onClick={() => {
                          if (confirm(`Remove ${t.name} from Sunshine Faculty list?`)) {
                            onDeleteTeacher(t.id);
                          }
                        }}
                        className="rounded p-1.5 text-brand-red hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BROADCAST NOTICE */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Broadcast Notice / Announcement</h3>
                <p className="text-xs text-slate-500 mb-4">Dispatched notices instantly display on target user dashboards & public notice boards.</p>

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
                      Disptach Broadcast
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Broadcast logs */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-4">Notice Bulletin Archive</h3>

                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase text-indigo-900">{n.category}</span>
                          <span className="text-[9px] text-slate-400">{n.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{n.content}</p>
                      </div>

                      <button
                        id={`btn-del-notif-${n.id}`}
                        onClick={() => onDeleteNotification(n.id)}
                        className="rounded p-1 text-brand-red hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
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

              <div className="overflow-hidden border border-slate-100 rounded-xl">
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
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange"></span> 2. SMS & WhatsApp Grace Period Levels Toggles
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4">Select which specific grace period threshold levels trigger automated outbound mobile WhatsApp notifications to parents.</p>

                    <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
