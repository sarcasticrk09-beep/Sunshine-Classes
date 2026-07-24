import React, { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle2, XCircle, AlertCircle, FileText, Printer, History, ClipboardCheck, ArrowRight, ArrowLeft, Download, Send, ExternalLink, Lock } from 'lucide-react';
import { generateReceiptPdf } from '../lib/pdfGenerator';
import QRCode from 'qrcode';

interface Student {
  id: string;
  name: string;
  rollNo?: string;
  class?: string;
  preferredBatch?: string;
  mobile?: string;
}

interface FeeStatus {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  month: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  dueDate: string;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  class: string;
  preferredBatch: string;
  paymentMode: string;
  amount: number;
  monthsCovered: string[];
  breakdown: Array<{
    month: string;
    baseFee: number;
    discountApplied: number;
    amountPaid: number;
  }>;
  transactionId?: string;
  generatedBy: string;
  generatedAt: string;
}

export function FeeCollectionManager({ jwtToken }: { jwtToken: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'collect' | 'queue' | 'history' | 'lookup'>('collect');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and student selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pendingFees, setPendingFees] = useState<FeeStatus[]>([]);
  const [selectedFeeRecordIds, setSelectedFeeRecordIds] = useState<string[]>([]);
  
  // Payment execution state
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [amountToPay, setAmountToPay] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  // Queue state
  const [queue, setQueue] = useState<any[]>([]);
  const [queueFilterStatus, setQueueFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);

  // Completed Payment History state
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);

  // Receipt Lookup state
  const [lookupReceiptNumber, setLookupReceiptNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<Receipt | null>(null);

  // Dynamic QR and PDF Download Handler
  const handleDownloadPDF = async (receipt: any) => {
    try {
      const studentAdapter = {
        id: receipt.studentId,
        name: receipt.studentName,
        rollNo: receipt.rollNo || receipt.rollNumber || '',
        class: receipt.class || receipt.className || '',
        preferredBatch: receipt.preferredBatch || ''
      } as any;
      
      const docObj = generateReceiptPdf(receipt, studentAdapter);
      
      // Inject real QR Code pointing to the public verification endpoint
      const verifyUrl = `${window.location.origin}/verify/receipt/${receipt.receiptNumber}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 100 });
      
      // Override the geometric placeholder at x=20, y=145 with the real QR code
      docObj.addImage(qrDataUrl, 'PNG', 20, 145, 25, 25);
      
      docObj.save(`Receipt-${receipt.receiptNumber}.pdf`);

      // Record the download event via the audit route
      await fetch(`/api/receipts/${receipt.receiptNumber}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Error generating or downloading PDF receipt:', err);
      setError('Failed to generate and download PDF receipt.');
    }
  };

  // Receipt Notification Resend Handler
  const handleResendReceipt = async (receiptId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      const res = await fetch(`/api/receipts/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiptId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Receipt notification resent successfully.');
      } else {
        setError(data.message || 'Failed to resend receipt.');
      }
    } catch (err) {
      setError('An error occurred while resending receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  // QR Code state and generator hook
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    async function genQR() {
      const target = activeReceipt || lookupResult;
      if (target) {
        const url = `${window.location.origin}/verify/receipt/${target.receiptNumber}`;
        try {
          const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
          setQrCodeUrl(dataUrl);
        } catch (err) {
          console.error('[FeeCollectionManager] Error generating QR code image:', err);
        }
      } else {
        setQrCodeUrl(null);
      }
    }
    genQR();
  }, [activeReceipt, lookupResult]);

  useEffect(() => {
    if (activeSubTab === 'queue') {
      fetchQueue();
    } else if (activeSubTab === 'history') {
      fetchPaymentsHistory(paymentsPage);
    }
    setError(null);
    setSuccessMessage(null);
  }, [activeSubTab, queueFilterStatus, paymentsPage]);

  // Fetch student search results
  const handleStudentSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setStudents([]);
      return;
    }
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to search students', err);
    }
  };

  // Select student and fetch outstanding monthly fees
  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearchQuery('');
    setSelectedFeeRecordIds([]);
    setAmountToPay(0);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/fees/monthly/student/${student.id}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        const outstanding = (data.data || [])
          .filter((f: any) => f.status !== 'PAID')
          .sort((a: any, b: any) => a.monthVal - b.monthVal);
        setPendingFees(outstanding);
      }
    } catch (err) {
      setError('Failed to fetch pending fee records.');
    }
  };

  // Toggle selection of outstanding fee month (Enforces FIFO)
  const handleToggleFeeRecord = (record: FeeStatus) => {
    const isSelected = selectedFeeRecordIds.includes(record.id);

    if (isSelected) {
      // Unselect: must unselect from the end (FIFO descending) to ensure no gaps are left
      const index = selectedFeeRecordIds.indexOf(record.id);
      const newSelection = selectedFeeRecordIds.slice(0, index);
      setSelectedFeeRecordIds(newSelection);
      recalculateAmount(newSelection);
    } else {
      // Select: must select oldest pending sequentially (FIFO ascending)
      const currentSelectionCount = selectedFeeRecordIds.length;
      const expectedOldestPending = pendingFees[currentSelectionCount];
      
      if (expectedOldestPending && expectedOldestPending.id === record.id) {
        const newSelection = [...selectedFeeRecordIds, record.id];
        setSelectedFeeRecordIds(newSelection);
        recalculateAmount(newSelection);
      } else {
        setError('FIFO Rule Violation: You must pay the oldest outstanding month first.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const recalculateAmount = (recordIds: string[]) => {
    const sum = pendingFees
      .filter(f => recordIds.includes(f.id))
      .reduce((s, f) => s + f.pendingFee, 0);
    setAmountToPay(sum);
  };

  // Submit payment (Cash is instant, others go to queue)
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedFeeRecordIds.length === 0) {
      setError('Please select a student and at least one outstanding fee record.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (paymentMode === 'CASH') {
        // Direct cash payment API
        const res = await fetch('/api/fees/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            studentId: selectedStudent.id,
            feeRecordIds: selectedFeeRecordIds,
            amount: amountToPay,
            remarks
          })
        });
        const data = await res.json();
        if (res.status === 201 && data.success) {
          setSuccessMessage('Cash payment processed and settled successfully!');
          setActiveReceipt(data.data.receipt);
          // Refresh student outstanding state
          handleSelectStudent(selectedStudent);
          setRemarks('');
        } else {
          setError(data.message || 'Payment processing failed.');
        }
      } else {
        // UPI, Bank Transfer, Cheque goes to verification queue
        const res = await fetch('/api/fees/payment/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            studentId: selectedStudent.id,
            feeRecordIds: selectedFeeRecordIds,
            amount: amountToPay,
            paymentMode,
            transactionId,
            proofUrl: proofUrl || undefined
          })
        });
        const data = await res.json();
        if (res.status === 201 && data.success) {
          setSuccessMessage(`${paymentMode} payment verification submitted successfully! Pending administrator verification.`);
          // Refresh
          handleSelectStudent(selectedStudent);
          setTransactionId('');
          setProofUrl('');
        } else {
          setError(data.message || 'Payment submission failed.');
        }
      }
    } catch (err) {
      setError('An error occurred during payment processing.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Verification Queue
  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/fees/payment/verifications?status=${queueFilterStatus}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  // Approve payment
  const handleApprove = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/fees/payment/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ verificationId: id })
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setSuccessMessage('Payment approved successfully! Outstanding fees settled.');
        fetchQueue();
        if (data.data && data.data.receipt) {
          setActiveReceipt(data.data.receipt);
        }
      } else {
        setError(data.message || 'Approve action failed.');
      }
    } catch (err) {
      setError('An error occurred during approval.');
    }
  };

  // Reject payment
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionTargetId || !rejectionReason.trim()) return;

    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/fees/payment/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          verificationId: rejectionTargetId,
          reason: rejectionReason
        })
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setSuccessMessage('Payment rejected successfully.');
        setRejectionTargetId(null);
        setRejectionReason('');
        fetchQueue();
      } else {
        setError(data.message || 'Reject action failed.');
      }
    } catch (err) {
      setError('An error occurred during rejection.');
    }
  };

  // Fetch Payment History
  const fetchPaymentsHistory = async (page: number) => {
    try {
      const res = await fetch(`/api/fees/payments?page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.data?.payments || []);
        setPaymentsTotalPages(data.data?.meta?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch payments history', err);
    }
  };

  // Lookup single receipt
  const handleReceiptLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupReceiptNumber.trim()) return;

    setError(null);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/fees/receipt/${lookupReceiptNumber.trim()}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setLookupResult(data.data);
      } else {
        setError(data.message || 'Receipt not found.');
      }
    } catch (err) {
      setError('An error occurred during lookup.');
    }
  };

  // QR string generator mock for Manual UPI Scan
  const getUpiQrString = () => {
    if (!selectedStudent) return '';
    const nameStr = encodeURIComponent('Sunshine Classes');
    const paStr = encodeURIComponent('sunshine@ybl');
    const monthsStr = pendingFees
      .filter(f => selectedFeeRecordIds.includes(f.id))
      .map(f => f.month)
      .join(', ');
    const noteStr = encodeURIComponent(`Fees ${selectedStudent.name} ${monthsStr}`);
    return `upi://pay?pa=${paStr}&pn=${nameStr}&am=${amountToPay}&tn=${noteStr}&cu=INR`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-slate-50 rounded-xl shadow-sm border border-slate-200" id="fee-collection-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight" id="fee-engine-title">Fee Collection Engine (FM-003)</h2>
          <p className="text-xs text-slate-500 mt-1" id="fee-engine-subtitle">Immutable payment ledger, FIFO enforcement &amp; real-time admin approval queue</p>
        </div>
        <div className="flex bg-slate-200/60 p-1 rounded-lg mt-4 md:mt-0" id="fee-sub-tabs">
          <button
            id="subtab-collect-btn"
            onClick={() => setActiveSubTab('collect')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeSubTab === 'collect' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Collect Payment
          </button>
          <button
            id="subtab-queue-btn"
            onClick={() => setActiveSubTab('queue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeSubTab === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Verification Queue
          </button>
          <button
            id="subtab-history-btn"
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeSubTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Payment Ledger
          </button>
          <button
            id="subtab-lookup-btn"
            onClick={() => setActiveSubTab('lookup')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeSubTab === 'lookup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Receipt Lookup
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS ALERTS */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2 animate-fade-in" id="error-alert-box">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span id="error-message-text">{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2 animate-fade-in" id="success-alert-box">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span id="success-message-text">{successMessage}</span>
        </div>
      )}

      {/* TAB 1: COLLECT PAYMENT */}
      {activeSubTab === 'collect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="collect-tab-content">
          {/* LEFT COLUMN: Student Search & Pending Fees */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Student Search card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  id="student-payment-search-input"
                  placeholder="Enter student name, roll number, or mobile..."
                  value={searchQuery}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Student Search Dropdown results */}
              {students.length > 0 && (
                <div className="mt-2 border border-slate-200 rounded-lg max-h-52 overflow-y-auto bg-white shadow-md z-10 absolute w-[calc(100%-2.5rem)] lg:w-[45%]" id="student-search-results">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      id={`student-select-option-${s.id}`}
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-xs flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        <p className="text-slate-500">Roll No: {s.rollNo || 'N/A'} • {s.class}</p>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{s.preferredBatch || 'No Batch'}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Student profile summary */}
              {selectedStudent && (
                <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center" id="selected-student-badge">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800" id="selected-student-name">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-500 mt-1" id="selected-student-meta">
                      Class: <strong>{selectedStudent.class || 'N/A'}</strong> • Roll No: <strong>{selectedStudent.rollNo || 'N/A'}</strong> • Batch: <strong>{selectedStudent.preferredBatch || 'N/A'}</strong>
                    </p>
                  </div>
                  <button
                    id="deselect-student-btn"
                    onClick={() => { setSelectedStudent(null); setPendingFees([]); setSelectedFeeRecordIds([]); setAmountToPay(0); }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
                  >
                    Change Student
                  </button>
                </div>
              )}
            </div>

            {/* Pending outstanding fees table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Pending Outstanding Fees (FIFO Order)</h3>
                {selectedStudent && pendingFees.length > 0 && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200">
                    {pendingFees.length} Pending Month(s)
                  </span>
                )}
              </div>

              {!selectedStudent ? (
                <div className="h-48 flex flex-col justify-center items-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl" id="no-student-selected-prompt">
                  <CreditCard className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs">Please search and select a student to load pending fees.</p>
                </div>
              ) : pendingFees.length === 0 ? (
                <div className="h-48 flex flex-col justify-center items-center text-emerald-600 border-2 border-dashed border-emerald-100 bg-emerald-50/20 rounded-xl" id="all-fees-paid-alert">
                  <CheckCircle2 className="w-8 h-8 mb-2 stroke-1 text-emerald-500" />
                  <p className="text-xs font-medium">All fees are fully paid! No outstanding invoices.</p>
                </div>
              ) : (
                <div className="overflow-x-auto" id="pending-fees-table-container">
                  <table className="w-full text-xs text-left text-slate-600" id="pending-fees-table">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5">Select</th>
                        <th className="px-4 py-2.5">Billing Month</th>
                        <th className="px-4 py-2.5">Due Date</th>
                        <th className="px-4 py-2.5 text-right">Total Fee</th>
                        <th className="px-4 py-2.5 text-right">Paid</th>
                        <th className="px-4 py-2.5 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingFees.map((fee, idx) => {
                        const isSelected = selectedFeeRecordIds.includes(fee.id);
                        const isSelectable = idx === selectedFeeRecordIds.length || isSelected;

                        return (
                          <tr
                            key={fee.id}
                            id={`fee-record-row-${fee.id}`}
                            className={`border-b border-slate-100 last:border-0 transition ${isSelected ? 'bg-blue-50/30 font-medium' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                id={`checkbox-fee-${fee.id}`}
                                checked={isSelected}
                                disabled={!isSelectable && !isSelected}
                                onChange={() => handleToggleFeeRecord(fee)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{fee.month}</td>
                            <td className="px-4 py-3 text-slate-500">{fee.dueDate}</td>
                            <td className="px-4 py-3 text-right">₹{fee.totalFee}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">₹{fee.paidFee}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-bold">₹{fee.pendingFee}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-amber-600 mt-3 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Fees must be cleared sequentially. Selecting a month automatically clears preceding unpaid months first.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Processing Desk */}
          <div className="lg:col-span-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Payment Checkout Desk</h3>

              <form onSubmit={handleProcessPayment} id="payment-checkout-form">
                {/* Selected months summary */}
                <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Selected Month(s)</span>
                    <span className="font-semibold text-slate-700">{selectedFeeRecordIds.length} Selected</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 line-clamp-1">
                    {selectedFeeRecordIds.length > 0 
                      ? pendingFees.filter(f => selectedFeeRecordIds.includes(f.id)).map(f => f.month).join(', ')
                      : 'None selected'
                    }
                  </div>

                  <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">Total Payable Amount</span>
                    <span className="text-lg font-black text-blue-600" id="checkout-payable-total">₹{amountToPay}</span>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2" id="payment-mode-grid">
                    {(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        id={`mode-select-${mode.toLowerCase()}-btn`}
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${paymentMode === mode ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CASH Specific remarks */}
                {paymentMode === 'CASH' && (
                  <div className="mb-4 animate-fade-in" id="cash-remarks-section">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Collection Remarks</label>
                    <textarea
                      id="cash-remarks-input"
                      rows={2}
                      placeholder="Enter optional payment details, hand-over info, etc."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* UPI, Bank, Cheque QR / Submission details */}
                {paymentMode !== 'CASH' && (
                  <div className="mb-4 flex flex-col gap-4 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 animate-fade-in" id="non-cash-fields">
                    {/* UPI Intent details */}
                    {paymentMode === 'UPI' && selectedFeeRecordIds.length > 0 && (
                      <div className="flex flex-col items-center border-b border-slate-150 pb-3 mb-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Instant UPI QR Link</span>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col items-center">
                          {/* We can output a beautiful instruction or simulate a deep-link scan */}
                          <p className="text-[11px] text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded text-center break-all select-all">
                            {getUpiQrString()}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1">Copy UPI Intent code or scan on device</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Transaction ID / Reference Number (UTR) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="transaction-id-input"
                        required
                        placeholder="E.g. UPI UTR, Cheque No, Bank Ref"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Payment Proof URL (Screenshot/Receipt Image)
                      </label>
                      <input
                        type="url"
                        id="payment-proof-url-input"
                        placeholder="Https://example.com/receipt.jpg"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  id="process-payment-submit-btn"
                  disabled={isLoading || !selectedStudent || selectedFeeRecordIds.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isLoading ? 'Processing...' : paymentMode === 'CASH' ? 'Confirm Immediate Cash Collection' : 'Submit Reference for Admin Approval'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" id="queue-tab-content">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-4">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin Verification Queue</h3>
            
            {/* Filter queue status */}
            <div className="flex bg-slate-100 p-1 rounded-lg" id="queue-status-filters">
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  id={`queue-filter-${status.toLowerCase()}-btn`}
                  onClick={() => setQueueFilterStatus(status)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${queueFilterStatus === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="h-48 flex flex-col justify-center items-center text-slate-400" id="queue-empty-prompt">
              <ClipboardCheck className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs">No payment verifications found matching status: {queueFilterStatus}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="queue-table-container">
              <table className="w-full text-xs text-left text-slate-600" id="queue-table">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Months to Clear</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5">Transaction ID</th>
                    <th className="px-4 py-2.5">Submitted By</th>
                    <th className="px-4 py-2.5">Status</th>
                    {queueFilterStatus === 'PENDING' && <th className="px-4 py-2.5 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {queue.map((req) => (
                    <tr key={req.id} id={`verification-queue-row-${req.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{req.studentName}</p>
                        <p className="text-slate-400 text-[10px]">Roll: {req.rollNo} • {req.class}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{req.monthsToPay.join(', ')}</td>
                      <td className="px-4 py-3.5"><span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded">{req.paymentMode}</span></td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-800">₹{req.amount}</td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-600 break-all max-w-[120px]">
                        {req.transactionId}
                        {req.proofUrl && (
                          <a href={req.proofUrl} target="_blank" rel="noreferrer" className="block text-[10px] text-blue-500 hover:underline mt-1">
                            View Proof ↗
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-700">{req.submittedBy}</p>
                        <p className="text-slate-400 text-[9px]">{new Date(req.submittedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {req.status}
                        </span>
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <p className="text-[10px] text-red-500 italic mt-1 font-medium">Reason: {req.rejectionReason}</p>
                        )}
                      </td>
                      {queueFilterStatus === 'PENDING' && (
                        <td className="px-4 py-3.5 text-center flex justify-center items-center gap-1.5 mt-1">
                          <button
                            id={`approve-btn-${req.id}`}
                            onClick={() => handleApprove(req.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                          >
                            Approve
                          </button>
                          <button
                            id={`reject-btn-${req.id}`}
                            onClick={() => { setRejectionTargetId(req.id); setRejectionReason(''); }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                          >
                            Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rejection Modal/Form */}
          {rejectionTargetId && (
            <div className="fixed inset-0 bg-slate-900/40 flex justify-center items-center z-50 p-4" id="rejection-modal-overlay">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xl max-w-sm w-full animate-fade-in" id="rejection-modal">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Reject Payment Verification</h4>
                <p className="text-xs text-slate-500 mb-4">Please provide a reason why this transaction verification request is being rejected.</p>
                <form onSubmit={handleReject} id="rejection-modal-form">
                  <textarea
                    id="rejection-reason-input"
                    required
                    rows={3}
                    placeholder="E.g. Mismatched reference number, unpaid amounts, screenshot invalid..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      id="rejection-cancel-btn"
                      onClick={() => setRejectionTargetId(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="rejection-confirm-btn"
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT LEDGER (HISTORY) */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" id="history-tab-content">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Completed Payments Ledger</h3>
            <span className="text-xs text-slate-500">Immutable Records Only</span>
          </div>

          {payments.length === 0 ? (
            <div className="h-48 flex flex-col justify-center items-center text-slate-400" id="payments-empty-prompt">
              <History className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs">No completed fee payments recorded in ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="payments-history-table-container">
              <table className="w-full text-xs text-left text-slate-600" id="payments-history-table">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5">Payment ID</th>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Cleared Month(s)</th>
                    <th className="px-4 py-2.5">Mode</th>
                    <th className="px-4 py-2.5 text-right">Amount Paid</th>
                    <th className="px-4 py-2.5">Receipt Number</th>
                    <th className="px-4 py-2.5">Collected By</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} id={`payment-ledger-row-${p.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-[9px] text-slate-500 break-all max-w-[80px]">{p.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{p.studentName}</p>
                        <p className="text-slate-400 text-[10px]">Roll: {p.rollNo} • {p.class}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{p.monthsPaid.join(', ')}</td>
                      <td className="px-4 py-3"><span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">{p.paymentMode}</span></td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">₹{p.amountPaid}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 text-[11px]">{p.receiptNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{p.collectedBy}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(p.collectedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          id={`view-receipt-btn-${p.receiptNumber}`}
                          onClick={() => {
                            // Fetch full receipt details and display modal
                            handleViewReceiptDirectly(p.receiptNumber);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {paymentsTotalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100" id="payments-pagination">
                  <button
                    id="prev-payments-page-btn"
                    disabled={paymentsPage === 1}
                    onClick={() => setPaymentsPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Prev
                  </button>
                  <span className="text-xs text-slate-500">Page {paymentsPage} of {paymentsTotalPages}</span>
                  <button
                    id="next-payments-page-btn"
                    disabled={paymentsPage === paymentsTotalPages}
                    onClick={() => setPaymentsPage(prev => Math.min(prev + 1, paymentsTotalPages))}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RECEIPT LOOKUP */}
      {activeSubTab === 'lookup' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" id="lookup-tab-content">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Direct Receipt Lookup</h3>
          
          <form onSubmit={handleReceiptLookup} className="flex gap-2 max-w-md mb-6" id="lookup-form">
            <input
              type="text"
              id="lookup-receipt-number-input"
              required
              placeholder="Enter Receipt Number (e.g. REC-20260724-1234)"
              value={lookupReceiptNumber}
              onChange={(e) => setLookupReceiptNumber(e.target.value)}
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              id="lookup-receipt-submit-btn"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-md"
            >
              Lookup Receipt
            </button>
          </form>

          {/* Lookup Results */}
          {lookupResult && (
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 shadow-inner max-w-xl mx-auto" id="lookup-receipt-result-panel">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">SUNSHINE CLASSES RECEIPT</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sunshine Plaza, Sector-15, New Delhi</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-md">
                    {lookupResult.receiptNumber}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">Generated: {new Date(lookupResult.generatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-6">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Student Name</p>
                  <p className="font-bold text-slate-800">{lookupResult.studentName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Roll Number / Class</p>
                  <p className="font-bold text-slate-800">{lookupResult.rollNo} • {lookupResult.class}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Billing Months</p>
                  <p className="font-semibold text-slate-800">{lookupResult.monthsCovered.join(', ')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Payment Method</p>
                  <p className="font-bold text-slate-800 uppercase">{lookupResult.paymentMode}</p>
                </div>
              </div>

              {/* Receipt Breakdowns */}
              <div className="border-t border-b border-slate-200 py-3 mb-6" id="lookup-receipt-breakdown">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Fee Itemized Breakdown</p>
                <div className="flex flex-col gap-2">
                  {lookupResult.breakdown?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span>Monthly Tuition Fee ({item.month})</span>
                      <div className="text-right">
                        <span>₹{item.amountPaid}</span>
                        {item.discountApplied > 0 && (
                          <span className="block text-[9px] text-emerald-500">Includes discount: -₹{item.discountApplied}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-800 border-b border-slate-200 pb-4 mb-4">
                <span className="text-xs font-bold uppercase">Total Settled Amount</span>
                <span className="text-lg font-black text-blue-600">₹{lookupResult.amount}</span>
              </div>

              {/* Secure QR Verification Panel */}
              <div className="flex gap-4 items-center bg-slate-100/80 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 mb-6">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Receipt Verification QR"
                    className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded-lg animate-pulse" />
                )}
                <div>
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" /> Secure Online Verification
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    This receipt is cryptographically locked. Scan the QR code or click below to check verification status on our public portal.
                  </p>
                  <a
                    href={`/verify/receipt/${lookupResult.receiptNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:underline mt-2"
                  >
                    Open Public Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  id="print-lookup-receipt-btn"
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button
                  id="download-lookup-receipt-btn"
                  onClick={() => handleDownloadPDF(lookupResult)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  id="resend-lookup-receipt-btn"
                  onClick={() => handleResendReceipt(lookupResult.receiptNumber)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition border border-slate-200"
                >
                  <Send className="w-3.5 h-3.5" /> Resend Alert
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PRINTABLE RECEIPT MODAL FOR SUCCESSFUL PAYMENTS */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-50 p-4" id="receipt-modal-overlay">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xl max-w-md w-full animate-fade-in relative" id="active-receipt-modal">
            <button
              id="close-receipt-modal-btn"
              onClick={() => setActiveReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded-full flex justify-center items-center transition"
            >
              ✕
            </button>

            <div className="text-center mb-4 border-b border-slate-150 pb-4">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Payment Successful
              </span>
              <h4 className="text-sm font-black text-slate-800">SUNSHINE CLASSES</h4>
              <p className="text-[9px] text-slate-500">Official Student Fee Receipt</p>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-blue-600">{activeReceipt.receiptNumber}</span>
              <span className="text-[10px] text-slate-400">{new Date(activeReceipt.generatedAt).toLocaleString()}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-2 text-xs text-slate-600 mb-4 border border-slate-150">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-800">{activeReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roll • Class:</span>
                <span className="font-medium text-slate-800">{activeReceipt.rollNo || 'N/A'} • {activeReceipt.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-bold text-slate-800 uppercase">{activeReceipt.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cleared Months:</span>
                <span className="font-bold text-slate-800">{activeReceipt.monthsCovered.join(', ')}</span>
              </div>
              {activeReceipt.transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Tx Reference:</span>
                  <span className="font-mono text-slate-800 text-[10px]">{activeReceipt.transactionId}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-slate-150 py-3.5 mb-4" id="modal-receipt-itemization">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Detailed Fee Items</p>
              <div className="flex flex-col gap-2">
                {activeReceipt.breakdown?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs text-slate-700">
                    <span>Tuition Fee ({item.month})</span>
                    <div className="text-right font-medium">
                      <span>₹{item.amountPaid}</span>
                      {item.discountApplied > 0 && (
                        <span className="block text-[9px] text-emerald-500 font-normal">Discount Applied: -₹{item.discountApplied}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-800 font-bold border-t border-slate-150 pt-3 mb-4">
              <span className="text-xs uppercase">Total Amount Paid</span>
              <span className="text-lg font-black text-blue-600">₹{activeReceipt.amount}</span>
            </div>

            {/* Secure QR Verification Panel inside Modal */}
            <div className="flex gap-3 items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-150 mb-5">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Receipt Verification QR"
                  className="w-16 h-16 bg-white p-1 rounded border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-200 rounded animate-pulse" />
              )}
              <div className="flex-1">
                <h5 className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" /> Secure Online Verification
                </h5>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  Cryptographically secure. Scan the QR code or click below to check status.
                </p>
                <a
                  href={`/verify/receipt/${activeReceipt.receiptNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:underline mt-1"
                >
                  Verify Online <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                id="modal-print-receipt-btn"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                id="modal-download-receipt-btn"
                onClick={() => handleDownloadPDF(activeReceipt)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                id="modal-resend-receipt-btn"
                onClick={() => handleResendReceipt(activeReceipt.receiptNumber)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 transition border border-slate-200"
              >
                <Send className="w-3.5 h-3.5" /> Resend Alert
              </button>
              <button
                id="modal-close-receipt-btn"
                onClick={() => setActiveReceipt(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper inside component to direct view receipts without double modal overlays
  async function handleViewReceiptDirectly(receiptNumber: string) {
    try {
      const res = await fetch(`/api/fees/receipt/${receiptNumber}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveReceipt(data.data);
      } else {
        setError(data.message || 'Receipt not found.');
      }
    } catch (err) {
      setError('An error occurred loading receipt.');
    }
  }
}
