/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Download,
  MapPin,
  Calendar,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Check,
  AlertTriangle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Admission, Student, FeeStatus, FeeReceipt, Inquiry, Batch, StudentSubscription, SubscriptionPayment, SubscriptionReceipt, SubscriptionNotification, SubscriptionConfig } from '../types';
import { getFeeForClass } from '../data';
import SunshineLogo from './SunshineLogo';
import { WhatsAppCommunication } from './WhatsAppCommunication';

interface ReceptionDashboardProps {
  students: Student[];
  admissions: Admission[];
  feeStatuses: FeeStatus[];
  feeReceipts: FeeReceipt[];
  inquiries: Inquiry[];
  onApproveAdmission: (admissionId: string) => void;
  onRejectAdmission: (admissionId: string) => void;
  onAddInquiry: (inq: Omit<Inquiry, 'id' | 'date'>) => void;
  onCollectFee: (fee: Omit<FeeReceipt, 'id' | 'date' | 'receivedBy'> & { skipWhatsApp?: boolean }) => void;
  batches: Batch[];
  subscriptions: StudentSubscription[];
  subPayments: SubscriptionPayment[];
  subReceipts: SubscriptionReceipt[];
  subNotifications: SubscriptionNotification[];
  subConfig: SubscriptionConfig;
  onPaySubscription: (subId: string, paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD' | 'NET_BANKING', amount: number) => void;
}

export default function ReceptionDashboard({
  students,
  admissions,
  feeStatuses,
  feeReceipts,
  inquiries,
  onApproveAdmission,
  onRejectAdmission,
  onAddInquiry,
  onCollectFee,
  batches,
  subscriptions,
  subPayments,
  subReceipts,
  subNotifications,
  subConfig,
  onPaySubscription
}: ReceptionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'admissions' | 'inquiries' | 'fees' | 'search' | 'whatsapp'>('admissions');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
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
              color: #d97706;
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
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              padding: 12px;
              border-radius: 10px;
            }
            .stat-card span {
              display: block;
              font-size: 9px;
              color: #b45309;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.05em;
            }
            .stat-card strong {
              display: block;
              font-size: 15px;
              color: #78350f;
              margin-top: 4px;
              font-weight: 800;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #fafaf9;
              color: #57534e;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 10px 12px;
              border-bottom: 1px solid #e7e5e4;
              text-align: left;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #f5f5f4;
              font-size: 10px;
              color: #44403c;
              line-height: 1.4;
            }
            tr:nth-child(even) td {
              background-color: #fafaf9;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #f5f5f4;
              padding-top: 15px;
              text-align: center;
              font-size: 9px;
              color: #a8a29e;
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
              <p>Mishra Gali opposite Subhash Park, Pihani, Hardoi • Admission & Fee Desk Portal</p>
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
            Sunshine Classes Admission Desk Registry • Generated by Neha Sharma.
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
    const targetData = searchQuery ? filteredStudentsForSearch : students;
    exportToCSV(targetData, `students_search_export_${new Date().toISOString().split('T')[0]}.csv`, headers, keys);
  };

  const handleExportStudentsPDF = () => {
    const targetData = searchQuery ? filteredStudentsForSearch : students;
    const headers = ['Roll No', 'Name', 'Class', 'Parents', 'Contacts', 'Admission Date'];
    const rows = targetData.map(s => [
      s.rollNo,
      s.name,
      s.class,
      `Father: ${s.fatherName}\nMother: ${s.motherName}`,
      `Self: ${s.mobile}\nParent: ${s.parentMobile}`,
      s.admissionDate
    ]);
    const summaryStats = [
      { label: 'Records Exported', value: `${targetData.length} Students` },
      { label: 'Search Query Used', value: searchQuery ? `"${searchQuery}"` : 'None (All Students)' },
      { label: 'Total active', value: `${students.length} Total Enrolled` }
    ];
    exportToPDF('Sunshine Enrolled Students Registry', headers, rows, summaryStats);
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
    exportToCSV(feeReceipts, `counter_cashflow_report_${new Date().toISOString().split('T')[0]}.csv`, headers, keys);
  };

  const handleExportPaymentsPDF = () => {
    const headers = ['Receipt ID', 'Student Name', 'Class', 'Cycle Month', 'Amount Paid', 'Method', 'Date Received'];
    const rows = feeReceipts.map(rec => [
      rec.id,
      rec.studentName,
      rec.class,
      rec.month,
      `₹${rec.amountPaid}`,
      rec.paymentMethod,
      rec.date
    ]);
    const summaryStats = [
      { label: 'Total Collections', value: `${feeReceipts.length} Payments` },
      { label: 'Net Amount Collected', value: `₹${feeReceipts.reduce((sum, r) => sum + r.amountPaid, 0)}` },
      { label: 'Cash Remittance', value: `₹${feeReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.amountPaid, 0)}` },
      { label: 'Digital Remittance', value: `₹${feeReceipts.filter(r => r.paymentMethod !== 'CASH').reduce((sum, r) => sum + r.amountPaid, 0)}` }
    ];
    exportToPDF('Counter Cashflow Revenue Registry', headers, rows, summaryStats);
  };

  const handleDownloadStudentHistoryPDF = (studentId: string, studentName: string) => {
    const studentReceipts = feeReceipts.filter(r => r.studentId === studentId);
    const sortedReceipts = [...studentReceipts].sort((a, b) => b.date.localeCompare(a.date));

    const headers = ['Receipt ID', 'Cycle Month', 'Amount Paid', 'Payment Method', 'Date Received', 'Collected By'];
    const rows = sortedReceipts.map(rec => [
      rec.id,
      rec.month,
      `₹${rec.amountPaid}`,
      rec.paymentMethod,
      rec.date,
      rec.receivedBy || 'Neha Sharma'
    ]);

    const totalPaid = sortedReceipts.reduce((sum, r) => sum + r.amountPaid, 0);

    const summaryStats = [
      { label: 'Student Name', value: studentName },
      { label: 'Total Payments', value: `${sortedReceipts.length} Transactions` },
      { label: 'Total Amount Paid', value: `₹${totalPaid}` }
    ];

    exportToPDF(`Fee Payment History - ${studentName}`, headers, rows, summaryStats);
  };

  const handlePrintSingleReceipt = (rec: FeeReceipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print receipt.");
      return;
    }
    const rollNo = students.find(s => s.id === rec.studentId)?.rollNo || 'SC-1001';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${rec.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
              background-color: #ffffff;
            }
            .receipt-card {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .header {
              display: flex;
              flex-direction: column;
              align-items: center;
              border-bottom: 2px dashed #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #b45309;
              font-weight: 800;
            }
            .header p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              background-color: #f8fafc;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 20px;
              border: 1px solid #f1f5f9;
            }
            .meta-item span {
              color: #94a3b8;
            }
            .table-container {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              overflow: hidden;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 10px 15px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 15px;
              font-size: 12px;
              border-bottom: 1px solid #f1f5f9;
            }
            .total-row {
              background-color: #fef3c7;
              font-weight: 700;
              color: #b45309;
            }
            .total-row td {
              border-bottom: none;
              font-size: 13px;
            }
            .details {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 15px;
            }
            @media print {
              body { padding: 0; }
              .receipt-card { border: none; box-shadow: none; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header">
              <h1>SUNSHINE CLASSES</h1>
              <p>Mishra Gali opposite Subhash Park, Pihani, Hardoi</p>
              <p style="font-size: 9px; margin-top: 2px;">GSTIN / Reg No: 09BCXPS8401H1ZD • Admission & Fee Desk</p>
            </div>
            
            <div style="text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #475569; margin-bottom: 15px; text-transform: uppercase;">
              FEE PAYMENT RECEIPT / TAX INVOICE
            </div>

            <div class="meta-grid">
              <div>
                <div class="meta-item"><span>Receipt ID:</span> ${rec.id}</div>
                <div class="meta-item"><span>Date Issued:</span> ${rec.date}</div>
                <div class="meta-item"><span>Student Name:</span> ${rec.studentName}</div>
              </div>
              <div style="text-align: right;">
                <div class="meta-item"><span>Roll No:</span> ${rollNo}</div>
                <div class="meta-item"><span>Academic Class:</span> ${rec.class}</div>
                <div class="meta-item"><span>Collected By:</span> ${rec.receivedBy || 'Neha Sharma'}</div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount Paid (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style="font-weight: 600;">Coaching Tuition Fees</div>
                      <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Session cycle for ${rec.month}</div>
                    </td>
                    <td style="text-align: right; font-weight: 600;">₹${rec.amountPaid}.00</td>
                  </tr>
                  <tr class="total-row">
                    <td>NET PAID TRANSACTION AMOUNT</td>
                    <td style="text-align: right;">₹${rec.amountPaid}.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="details">
              <div>• Payment Method: <strong>${rec.paymentMethod}</strong></div>
              \${rec.transactionId ? \`<div>• Reference Transaction ID: <strong>\${rec.transactionId}</strong></div>\` : ''}
              <div>• Status: <strong>Payment Received & Reconciled</strong></div>
            </div>

            <div class="footer">
              This is a computer-generated invoice. No physical signature is required.<br>
              Thank you for choosing Sunshine Classes for academic excellence!
            </div>
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
  
  // Inquiry Form States
  const [inqName, setInqName] = useState('');
  const [inqMobile, setInqMobile] = useState('');
  const [inqWhatsapp, setInqWhatsapp] = useState('');
  const [inqClass, setInqClass] = useState('Class 10 Board Specialists');
  const [inqNotes, setInqNotes] = useState('');

  // Fee Collection States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeMonth, setFeeMonth] = useState('June 2026');
  const [feeAmount, setFeeAmount] = useState(1200);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'ONLINE'>('UPI');
  const [transactionId, setTransactionId] = useState('');
  
  // Selected receipt to show print popup
  const [receiptToPrint, setReceiptToPrint] = useState<FeeReceipt | null>(null);

  // Search filtered students
  const filteredStudentsForSearch = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    onAddInquiry({
      name: inqName,
      mobile: inqMobile,
      whatsapp: inqWhatsapp,
      className: inqClass,
      notes: inqNotes,
      status: 'PENDING'
    });

    setInqName('');
    setInqMobile('');
    setInqWhatsapp('');
    setInqNotes('');
    alert("Inquiry logged successfully.");
  };

  const handleCollectFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert("Please select a student first.");
      return;
    }

    onCollectFee({
      studentId: selectedStudentId,
      studentName: students.find(s => s.id === selectedStudentId)?.name || 'Student',
      class: students.find(s => s.id === selectedStudentId)?.class || 'Class 10 Board Specialists',
      month: feeMonth,
      amountPaid: Number(feeAmount),
      paymentMethod,
      transactionId: paymentMethod !== 'CASH' ? transactionId : undefined
    });

    alert("Fee logged! Receipt generated instantly.");
    setSelectedStudentId('');
    setTransactionId('');
  };

  // Helper stats
  const pendingAdmissionsCount = admissions.filter((a) => a.status === 'PENDING').length;
  const totalDailyInquiries = inquiries.length;
  const totalDailyFeesCollected = feeReceipts.reduce((acc, r) => acc + r.amountPaid, 0);

  // Fee Overview calculations for current selected month cycle
  const currentMonthLedgers = feeStatuses.filter(f => f.month === feeMonth);
  const totalCollectedForMonth = currentMonthLedgers.reduce((sum, f) => sum + f.paidFee, 0);
  const totalPendingForMonth = currentMonthLedgers.reduce((sum, f) => sum + f.pendingFee, 0);
  const totalTargetForMonth = currentMonthLedgers.reduce((sum, f) => sum + (f.totalFee - f.discount - f.scholarship), 0);
  
  // Overdue calculation (due date before June 29, 2026)
  const todayStr = '2026-06-29';
  const totalOverdueForMonth = currentMonthLedgers
    .filter(f => f.pendingFee > 0 && f.dueDate < todayStr)
    .reduce((sum, f) => sum + f.pendingFee, 0);

  return (
    <div id="reception-portal" className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-amber-600 p-6 text-white md:flex-row md:items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-amber-500 text-2xl font-black shadow-md">
            R
          </div>
          <div>
            <h2 className="font-display text-2xl font-black">Neha Sharma</h2>
            <p className="text-sm text-amber-100">Senior Registrar & Admission Desk Representative</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest block">Daily Desk Desk Status</span>
          <span className="font-display text-base font-bold text-slate-950 flex items-center gap-1.5 justify-end mt-0.5">
            <span className="h-2 w-2 rounded-full bg-green-400"></span> Live Register Connected
          </span>
        </div>
      </div>

      {/* Analytics bar */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Admission Requests</span>
          <span className="font-display text-2xl font-black text-slate-800">{pendingAdmissionsCount} Pending</span>
          <span className="text-[10px] text-brand-blue font-semibold block mt-1">Class 1-10 Queue Active</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Today's Cashflow collected</span>
          <span className="font-display text-2xl font-black text-slate-800">₹{totalDailyFeesCollected}</span>
          <span className="text-[10px] text-green-600 font-semibold block mt-1">UPI & Cash Reconciled</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Admissions Inquiries</span>
          <span className="font-display text-2xl font-black text-slate-800">{totalDailyInquiries} Logged</span>
          <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Average conversion 85%</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Menu / Mobile Switcher */}
        <div className="lg:col-span-1">
          {(() => {
            const tabsList = [
              { id: 'admissions', label: `Admissions Desk (${pendingAdmissionsCount})`, icon: <Users size={16} /> },
              { id: 'inquiries', label: 'Lead & Inquiries log', icon: <Phone size={16} /> },
              { id: 'fees', label: 'Collect Monthly Fees', icon: <CreditCard size={16} /> },
              { id: 'search', label: 'Search Students Directory', icon: <Search size={16} /> },
              { id: 'whatsapp', label: 'WhatsApp Chat Console', icon: <MessageSquare size={16} /> }
            ] as const;

            const activeTabObj = tabsList.find(t => t.id === activeTab);

            return (
              <>
                {/* Mobile Tab Dropdown Selector (Visible on < lg) */}
                <div className="block lg:hidden mb-4 relative">
                  <button
                    id="reception-mobile-tab-dropdown-btn"
                    type="button"
                    onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-amber-200 active:bg-slate-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-600">
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
                          Navigate Desk Modules
                        </div>
                        <div className="pt-1.5 space-y-1">
                          {tabsList.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                id={`reception-mobile-tab-opt-${tab.id}`}
                                type="button"
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setIsTabDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-amber-600 text-white shadow-sm font-bold' 
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
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 lg:p-4 shadow-sm space-y-1">
                    <span className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Desk Modules</span>
                    <div className="flex flex-col gap-1">
                      {tabsList.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            id={`reception-desktop-tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Dynamic content screen */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
          {/* TAB 1: ADMISSIONS REQUESTS */}
          {activeTab === 'admissions' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display font-bold text-base text-slate-800 mb-1">Online Admission Applications</h3>
              <p className="text-xs text-slate-500 mb-6">Review online admission submissions made by parents from Pihani. Approving automatically registers them into student ERP.</p>

              <div className="space-y-4">
                {admissions.map((adm) => (
                  <div key={adm.id} className="rounded-xl border border-slate-150 p-5 bg-slate-50/50">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[9px] font-bold text-brand-orange bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {adm.id}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${
                            adm.status === 'PENDING' ? 'bg-amber-100 text-brand-orange animate-pulse' :
                            adm.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-brand-red'
                          }`}>
                            {adm.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Student: {adm.studentName}</h4>
                        <p className="text-xs text-slate-600">Class Target: **{adm.className}** • Parents: {adm.fatherName} & {adm.motherName}</p>
                        
                        <div className="mt-4 grid gap-x-6 gap-y-1 text-[10px] text-slate-500 sm:grid-cols-2">
                          <div>📍 Address: {adm.address}</div>
                          <div>📞 Parents Mobile: {adm.parentMobile}</div>
                          <div>🕒 Preferred Slot: {adm.preferredBatch} ({adm.preferredTiming})</div>
                          <div>📅 Applied Date: {adm.date}</div>
                        </div>
                      </div>

                      {adm.status === 'PENDING' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            id={`btn-reject-adm-${adm.id}`}
                            onClick={() => {
                              onRejectAdmission(adm.id);
                              alert("Admission request declined.");
                            }}
                            className="rounded-xl border border-red-200 hover:bg-red-50 text-brand-red p-2"
                            title="Reject Admission"
                          >
                            <XCircle size={18} />
                          </button>
                          <button
                            id={`btn-approve-adm-${adm.id}`}
                            onClick={() => {
                              onApproveAdmission(adm.id);
                              alert(`Admission Approved! Student enrolled and Roll ID generated.`);
                            }}
                            className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm"
                          >
                            Approve & Enroll
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {admissions.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No online applications found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LEAD & INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              {/* Inquiry Logger Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Record Offline Desk Inquiry</h3>
                <p className="text-xs text-slate-500 mb-4">Log walk-in parent inquiries details for proper tracking and follow-up reminders.</p>

                <form onSubmit={handleCreateInquiry} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Inquirer Name</label>
                      <input
                        id="input-inq-name"
                        type="text"
                        required
                        placeholder="e.g. Ramesh Singh"
                        value={inqName}
                        onChange={(e) => setInqName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target Cohort Class</label>
                      <select
                        id="select-inq-class"
                        value={inqClass}
                        onChange={(e) => setInqClass(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      >
                        <option value="Class 10 Board Specialists">Class 10 Board Specialists (₹1,200/mo)</option>
                        <option value="Class 9 Foundation Course">Class 9 Foundation Course (₹1,000/mo)</option>
                        <option value="Classes 5 to 8 Apex Learning">Classes 5 to 8 Apex Learning (₹700/mo)</option>
                        <option value="Classes 1 to 4 Junior Sunshine">Classes 1 to 4 Junior Sunshine (₹500/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mobile Calling Number</label>
                      <input
                        id="input-inq-mobile"
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={inqMobile}
                        onChange={(e) => setInqMobile(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">WhatsApp Notification Number</label>
                      <input
                        id="input-inq-whatsapp"
                        type="tel"
                        required
                        placeholder="e.g. 9161586254"
                        value={inqWhatsapp}
                        onChange={(e) => setInqWhatsapp(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Follow-up Notes / Parent Requirements</label>
                    <textarea
                      id="ta-inq-notes"
                      rows={3}
                      placeholder="Specify subject requirements, budget details, previous marks, etc..."
                      value={inqNotes}
                      onChange={(e) => setInqNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-inq-submit"
                      type="submit"
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow transition-colors"
                    >
                      Save Inquiry Lead
                    </button>
                  </div>
                </form>
              </div>

                {/* Inquiry Leads List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-display font-bold text-base text-slate-800 mb-4">Logged Inquiries Ledger</h3>

                  <div className="border border-slate-100 rounded-xl bg-white">
                    <table className="w-full text-left border-collapse block md:table">
                    <thead className="hidden md:table-header-group">
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-3">Inquirer</th>
                        <th className="p-3">Target Class</th>
                        <th className="p-3">Contacts</th>
                        <th className="p-3">Notes</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs text-slate-700">
                      {inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                          <td className="py-1 px-3 font-semibold text-slate-800 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-24">Inquirer:</span>{inq.name}</td>
                          <td className="py-1 px-3 text-brand-blue font-bold block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-24">Class:</span>{inq.className}</td>
                          <td className="py-1 px-3 space-y-0.5 block md:table-cell md:p-3">
                            <span className="inline-block md:hidden font-bold text-slate-400 w-24">Contacts:</span>
                            <div className="inline-flex flex-col gap-0.5 align-middle">
                              <div className="text-[10px] text-slate-500">📞 {inq.mobile}</div>
                              <div className="text-[10px] text-green-600">💬 {inq.whatsapp}</div>
                            </div>
                          </td>
                          <td className="py-1 px-3 max-w-full md:max-w-[180px] text-slate-500 leading-snug block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-24">Notes:</span>{inq.notes}</td>
                          <td className="py-1 px-3 block md:table-cell md:p-3">
                            <span className="inline-block md:hidden font-bold text-slate-400 w-24">Status:</span>
                            <span className="inline-block rounded bg-amber-50 text-brand-orange border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                              {inq.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLLECT MONTHLY FEES */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Fee Overview Widget */}
              <div id="fee-overview-widget" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Collected Card */}
                <div id="card-fee-collected" className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-emerald-900/30 dark:bg-emerald-950/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Collected Fees</span>
                    <div className="p-1.5 rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/25">
                      <CheckCircle size={15} />
                    </div>
                  </div>
                  <h3 className="font-display font-black text-2xl text-emerald-800 dark:text-emerald-300">₹{totalCollectedForMonth}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Successfully received payments</p>
                </div>

                {/* Pending Card */}
                <div id="card-fee-pending" className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-blue-900/30 dark:bg-blue-950/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">Pending Fees</span>
                    <div className="p-1.5 rounded-xl bg-blue-500 text-white shadow-sm shadow-blue-500/25">
                      <Clock size={15} />
                    </div>
                  </div>
                  <h3 className="font-display font-black text-2xl text-blue-800 dark:text-blue-300">₹{totalPendingForMonth}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Awaiting student remittance</p>
                </div>

                {/* Overdue Card */}
                <div id="card-fee-overdue" className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-rose-900/30 dark:bg-rose-950/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">Overdue Fees</span>
                    <div className="p-1.5 rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                      <AlertTriangle size={15} />
                    </div>
                  </div>
                  <h3 className="font-display font-black text-2xl text-rose-800 dark:text-rose-300">₹{totalOverdueForMonth}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Passed payment due dates</p>
                </div>

                {/* Monthly Target Card */}
                <div id="card-fee-target" className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-amber-900/30 dark:bg-amber-950/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">Monthly Target</span>
                    <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/25">
                      <DollarSign size={15} />
                    </div>
                  </div>
                  <h3 className="font-display font-black text-2xl text-amber-800 dark:text-amber-300">₹{totalTargetForMonth}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">For {feeMonth} cycle</p>
                </div>
              </div>

              {/* Fee Collection Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Log Fee Remittance</h3>
                <p className="text-xs text-slate-500 mb-4">Record student monthly coaching payments, cash or digital receipts.</p>

                <form onSubmit={handleCollectFeeSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Active Student</label>
                      <select
                        id="select-fee-student"
                        required
                        value={selectedStudentId}
                        onChange={(e) => {
                          setSelectedStudentId(e.target.value);
                          const cls = students.find(s => s.id === e.target.value)?.class || 'Class 10 Board Specialists';
                          setFeeAmount(getFeeForClass(cls));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      >
                        <option value="">-- Choose Enrolled Student --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.rollNo} - {s.class})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target Fee Month Cycle</label>
                      <select
                        id="select-fee-month"
                        value={feeMonth}
                        onChange={(e) => setFeeMonth(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      >
                        <option value="June 2026">June 2026 Cycle</option>
                        <option value="July 2026">July 2026 Cycle</option>
                        <option value="August 2026">August 2026 Cycle</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Net Fees Amount Received (INR)</label>
                      <input
                        id="input-fee-amount"
                        type="number"
                        required
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Remittance Mode</label>
                      <select
                        id="select-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                      >
                        <option value="UPI">UPI Payment / PhonePe / Paytm</option>
                        <option value="CASH">Cash Over Desk Counter</option>
                        <option value="ONLINE">Razorpay / Net Banking</option>
                      </select>
                    </div>

                    {paymentMethod !== 'CASH' && (
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Digital Reference Trans ID / UTR Code</label>
                        <input
                          id="input-fee-txid"
                          type="text"
                          required
                          placeholder="e.g. UPI849104820184"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-collect-fee-submit"
                      type="submit"
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow transition-colors"
                    >
                      Authorize Payment Voucher
                    </button>
                  </div>
                </form>
              </div>

              {/* Student Monthly Fee Ledger with WhatsApp button */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-display font-bold text-base text-slate-800">Student Monthly Fee Remittance Ledger ({feeMonth})</h3>
                  <p className="text-xs text-slate-500">List of student tuition fee obligations for the current cycle. Click 1-Click WhatsApp to send instant reminders.</p>
                </div>

                <div className="border border-slate-100 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse block md:table">
                    <thead className="hidden md:table-header-group">
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-3">Student details</th>
                        <th className="p-3">Total Fee</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Pending</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Action Link</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                      {currentMonthLedgers.map((ledger) => {
                        const studentDetails = students.find(s => s.id === ledger.studentId);
                        const parentMobile = studentDetails?.parentMobile || '9161586254';
                        const isOverdue = ledger.pendingFee > 0 && ledger.dueDate < todayStr;
                        
                        // Construct professional message
                        const msg = `Dear Parent, this is a friendly fee reminder from Sunshine Classes Pihani. Your ward ${ledger.studentName}'s tuition fee of ₹${ledger.pendingFee} for ${ledger.month} is pending. Please remit before due date ${ledger.dueDate}. Thank you!`;
                        const encodedMsg = encodeURIComponent(msg);
                        const waLink = `https://wa.me/91${parentMobile.replace(/\D/g, '')}?text=${encodedMsg}`;

                        return (
                          <tr key={ledger.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                            <td className="py-1 px-3 block md:table-cell md:p-3">
                              <span className="inline-block md:hidden font-bold text-slate-400 w-28">Student:</span>
                              <div className="inline-block align-middle">
                                <div className="font-bold text-slate-800">{ledger.studentName}</div>
                                <div className="text-[10px] text-slate-500 font-medium">{ledger.class} • Parent: {parentMobile}</div>
                              </div>
                            </td>
                            <td className="py-1 px-3 font-semibold text-slate-700 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Total Fee:</span>₹{ledger.totalFee - ledger.discount - ledger.scholarship}</td>
                            <td className="py-1 px-3 text-green-600 font-bold block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Paid:</span>₹{ledger.paidFee}</td>
                            <td className="py-1 px-3 text-slate-800 font-bold block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Pending:</span>₹{ledger.pendingFee}</td>
                            <td className="py-1 px-3 block md:table-cell md:p-3">
                              <span className="inline-block md:hidden font-bold text-slate-400 w-28">Status:</span>
                              {ledger.pendingFee === 0 ? (
                                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Paid</span>
                              ) : isOverdue ? (
                                <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">Overdue ({ledger.dueDate})</span>
                              ) : (
                                <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">Pending</span>
                              )}
                            </td>
                            <td className="py-1 px-3 text-left md:text-center block md:table-cell md:p-3">
                              <span className="inline-block md:hidden font-bold text-slate-400 w-28">Action:</span>
                              {ledger.pendingFee > 0 ? (
                                <button
                                  type="button"
                                  id={`btn-wa-remind-${ledger.id}`}
                                  onClick={() => {
                                    alert(`WhatsApp Fee Alert Dispatch Initiated for ${ledger.studentName}!\n\nTarget Number: +91 ${parentMobile}\nMessage: "${msg}"\n\nRedirecting to WhatsApp web portal...`);
                                    window.open(waLink, '_blank');
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all cursor-pointer hover:scale-105"
                                >
                                  <MessageCircle size={12} /> 1-Click WhatsApp
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">No Pending Fees</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions list */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">Counter Cashflow History</h3>
                    <p className="text-xs text-slate-500">Real-time listing of tuition fee vouchers collected at the reception counter.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportPaymentsCSV}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <FileSpreadsheet size={13} className="text-emerald-600" /> Export CSV
                    </button>
                    <button
                      onClick={handleExportPaymentsPDF}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Printer size={13} /> Export PDF
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse block md:table">
                    <thead className="hidden md:table-header-group">
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-3">Receipt ID</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Cycle</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                      {feeReceipts.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 block md:table-row p-3 md:p-0">
                          <td className="py-1 px-3 font-semibold text-amber-600 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Receipt ID:</span>{rec.id}</td>
                          <td className="py-1 px-3 font-bold text-slate-800 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Student:</span>{rec.studentName}</td>
                          <td className="py-1 px-3 text-slate-600 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Cycle:</span>{rec.month}</td>
                          <td className="py-1 px-3 font-bold text-slate-800 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Amount:</span>₹{rec.amountPaid}</td>
                          <td className="py-1 px-3 text-slate-500 font-mono text-[10px] block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Method:</span>{rec.paymentMethod}</td>
                          <td className="py-1 px-3 block md:table-cell md:p-3">
                            <span className="inline-block md:hidden font-bold text-slate-400 w-28">Actions:</span>
                            <div className="inline-flex gap-1.5 align-middle">
                              <button
                                id={`btn-reception-print-${rec.id}`}
                                onClick={() => setReceiptToPrint(rec)}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                              >
                                <Printer size={10} /> View Voucher
                              </button>
                              <button
                                id={`btn-reception-pdf-history-${rec.id}`}
                                onClick={() => handleDownloadStudentHistoryPDF(rec.studentId, rec.studentName)}
                                className="inline-flex items-center gap-1 rounded bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer"
                                title="Download complete payment history for this student"
                              >
                                <Download size={10} /> Download PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEARCH DIRECTORY */}
          {activeTab === 'search' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800 mb-1">Search Enrolled Students</h3>
                  <p className="text-xs text-slate-500">Meticulously lookup any student profile, roll details, parental contacts, or address records.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportStudentsCSV}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-600" /> Export CSV
                  </button>
                  <button
                    onClick={handleExportStudentsPDF}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Printer size={13} /> Export PDF
                  </button>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="input-reception-search"
                  type="text"
                  placeholder="Type student name, father name, or roll number to locate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              {/* Results grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredStudentsForSearch.map((student) => (
                  <div key={student.id} className="rounded-xl border border-slate-100 p-4 hover:border-slate-300 transition-all bg-slate-50/20">
                    <span className="text-[9px] font-bold bg-amber-50 text-brand-orange border border-amber-200 px-2 py-0.5 rounded inline-block mb-2">
                      Roll: {student.rollNo}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">{student.name}</h4>
                    <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{student.class} • Batch: {student.preferredBatch}</p>

                    <div className="mt-3 text-[10px] text-slate-500 space-y-1">
                      <div>👨‍👦 Father Name: {student.fatherName}</div>
                      <div>📞 Mother Name: {student.motherName}</div>
                      <div>💬 Parent Contact: {student.parentMobile}</div>
                      <div>📍 Home Address: {student.address}</div>
                    </div>
                  </div>
                ))}
                {filteredStudentsForSearch.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6 col-span-2">No students match your search criteria.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppCommunication 
              currentUser={{
                id: 'reception',
                username: 'reception',
                name: 'Reception Desk',
                role: 'RECEPTIONIST'
              }}
              studentsList={students}
            />
          )}
          </motion.div>
        </div>
      </div>

      {/* PRINT RECEIPT MODAL DIALOG */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative text-slate-800">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-4 mb-4">
              <SunshineLogo size={48} showText={true} textSubTitle="Excellence in Education • Pihani, Hardoi" />
              <span className="text-[10px] text-slate-400 mt-1">GSTIN / Registration No: 09BCXPS8401H1ZD</span>
            </div>

            <h4 className="text-center font-display font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">
              FEE PAYMENT RECEIPT / TAX INVOICE
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-100">
              <div>
                <div><span className="text-slate-400">Receipt ID:</span> {receiptToPrint.id}</div>
                <div><span className="text-slate-400">Date Issued:</span> {receiptToPrint.date}</div>
                <div><span className="text-slate-400">Student Name:</span> {receiptToPrint.studentName}</div>
              </div>
              <div className="text-right">
                <div><span className="text-slate-400">Roll No:</span> {students.find(s => s.id === receiptToPrint.studentId)?.rollNo || 'SC-1001'}</div>
                <div><span className="text-slate-400">Academic Class:</span> {receiptToPrint.class}</div>
                <div><span className="text-slate-400">Collected By:</span> Neha Sharma</div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden mb-4 text-xs">
              <div className="bg-slate-50 px-4 py-2 flex justify-between font-bold text-slate-500 text-[10px] uppercase">
                <span>Description</span>
                <span>Amount Paid (INR)</span>
              </div>
              <div className="px-4 py-3 flex justify-between border-b border-slate-100">
                <div>
                  <div className="font-bold">Coaching Tuition Fees</div>
                  <div className="text-[10px] text-slate-400">Session cycle for {receiptToPrint.month}</div>
                </div>
                <span className="font-bold text-slate-800">₹{receiptToPrint.amountPaid}.00</span>
              </div>
              <div className="bg-slate-50/70 px-4 py-3 flex justify-between font-bold text-sm text-brand-blue">
                <span>NET PAID TRANSACTION AMOUNT</span>
                <span>₹{receiptToPrint.amountPaid}.00</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mb-4 space-y-1">
              <div>• Transaction Method: **{receiptToPrint.paymentMethod}**</div>
              {receiptToPrint.transactionId && <div>• Reference Trans ID: **{receiptToPrint.transactionId}**</div>}
              <div>• Payment Status: **Completed & Reconciled**</div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                id="btn-rec-print-close"
                onClick={() => setReceiptToPrint(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                id="btn-rec-history-pdf"
                onClick={() => {
                  handleDownloadStudentHistoryPDF(receiptToPrint.studentId, receiptToPrint.studentName);
                  setReceiptToPrint(null);
                }}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Download complete payment history for this student"
              >
                <Download size={13} /> History Ledger PDF
              </button>
              <button
                id="btn-rec-print-pdf"
                onClick={() => {
                  handlePrintSingleReceipt(receiptToPrint);
                  setReceiptToPrint(null);
                }}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
