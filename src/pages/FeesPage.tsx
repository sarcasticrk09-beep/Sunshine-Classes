import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Search, DollarSign, Calendar, CreditCard, Shield, Receipt, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import SunshineLogo from '../components/SunshineLogo';
import { useNavigate } from 'react-router-dom';
import { Student, FeeStatus, FeeReceipt } from '../types';

interface FeesPageProps {
  students: Student[];
  feeStatuses: FeeStatus[];
  feeReceipts: FeeReceipt[];
  onCollectFee: (fee: Omit<FeeReceipt, 'id' | 'date' | 'receivedBy'> & { skipWhatsApp?: boolean }) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const FeesPage: React.FC<FeesPageProps> = ({
  students,
  feeStatuses,
  feeReceipts,
  onCollectFee,
  theme,
  onToggleTheme
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<FeeStatus[]>([]);
  const [studentReceipts, setStudentReceipts] = useState<FeeReceipt[]>([]);

  // Checkout Form states
  const [payingFee, setPayingFee] = useState<FeeStatus | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'NET_BANKING'>('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [newReceiptId, setNewReceiptId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) {
      setMatchedStudent(null);
      setStudentFees([]);
      setStudentReceipts([]);
      return;
    }

    // Match student by Roll No or Name or ID
    const found = students.find(
      (s) =>
        s.rollNo?.toLowerCase() === query ||
        s.id.toLowerCase() === query ||
        s.name.toLowerCase().includes(query)
    );

    if (found) {
      setMatchedStudent(found);
      // Filter fees
      const fees = feeStatuses.filter((f) => f.studentId === found.id);
      setStudentFees(fees);
      // Filter receipts
      const receipts = feeReceipts.filter((r) => r.studentId === found.id);
      setStudentReceipts(receipts);
    } else {
      setMatchedStudent(null);
      setStudentFees([]);
      setStudentReceipts([]);
    }
  };

  const handleOpenCheckout = (fee: FeeStatus) => {
    setPayingFee(fee);
    setPaymentAmount(fee.pendingFee.toString());
    setTransactionId('');
    setPaymentSuccess(false);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFee || !matchedStudent) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amount > payingFee.pendingFee) {
      alert(`Payment amount cannot exceed pending balance of ₹${payingFee.pendingFee}`);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Simulate receipt id generation matching app logic
      const receiptId = `REC-0${feeReceipts.length + 101}`;
      
      // Trigger core payment state action
      onCollectFee({
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        class: matchedStudent.class || 'Class 10',
        month: payingFee.month,
        amountPaid: amount,
        paymentMethod: paymentMethod === 'CASH' ? 'Cash' : paymentMethod === 'CARD' ? 'Card' : paymentMethod === 'UPI' ? 'UPI' : 'Bank Transfer',
        transactionId: transactionId || `TXN-${Date.now().toString().slice(-8)}`,
        notes: `Online Parent payment for ${payingFee.month}`,
        skipWhatsApp: false
      });

      setNewReceiptId(receiptId);
      setIsProcessing(false);
      setPaymentSuccess(true);

      // Refresh student metrics
      const updatedFees = feeStatuses.map((f) => {
        if (f.studentId === matchedStudent.id && f.month === payingFee.month) {
          const nextPaid = f.paidFee + amount;
          const nextPending = Math.max(0, f.totalFee - f.discount - f.scholarship - nextPaid);
          return {
            ...f,
            paidFee: nextPaid,
            pendingFee: nextPending,
            status: nextPending === 0 ? ('PAID' as const) : ('PARTIAL' as const)
          };
        }
        return f;
      }).filter(f => f.studentId === matchedStudent.id);

      setStudentFees(updatedFees);
      
      const updatedReceipts = [
        {
          id: receiptId,
          studentId: matchedStudent.id,
          studentName: matchedStudent.name,
          class: matchedStudent.class || 'Class 10',
          month: payingFee.month,
          amountPaid: amount,
          paymentMethod: paymentMethod === 'CASH' ? 'Cash' : paymentMethod === 'CARD' ? 'Card' : paymentMethod === 'UPI' ? 'UPI' : 'Bank Transfer',
          transactionId: transactionId || `TXN-${Date.now().toString().slice(-8)}`,
          date: new Date().toISOString().split('T')[0],
          receivedBy: currentUser?.name || 'Online Portal'
        },
        ...studentReceipts
      ];
      setStudentReceipts(updatedReceipts);

    }, 1500);
  };

  const handlePrintReceipt = (receipt: FeeReceipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${receipt.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .receipt-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 800; color: #dd6b20; margin: 0; }
            .subtitle { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin: 4px 0 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .label { font-weight: bold; color: #64748b; }
            .value { font-weight: 800; color: #0f172a; }
            .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; text-align: center; margin-top: 24px; }
            .amount-title { font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase; margin: 0; }
            .amount-val { font-size: 28px; font-weight: 900; color: #15803d; margin: 4px 0 0; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt-card">
            <div class="header">
              <h1 class="title">SUNSHINE CLASSES</h1>
              <p class="subtitle">E-Receipt for Academic Fees</p>
            </div>
            <div class="row"><span class="label">Receipt ID:</span><span class="value">${receipt.id}</span></div>
            <div class="row"><span class="label">Date:</span><span class="value">${receipt.date}</span></div>
            <div class="row"><span class="label">Student Name:</span><span class="value">${receipt.studentName}</span></div>
            <div class="row"><span class="label">Class:</span><span class="value">${receipt.class}</span></div>
            <div class="row"><span class="label">Billing Cycle:</span><span class="value">${receipt.month}</span></div>
            <div class="row"><span class="label">Payment Mode:</span><span class="value">${receipt.paymentMethod}</span></div>
            <div class="row"><span class="label">Transaction Reference:</span><span class="value">${receipt.transactionId || 'N/A'}</span></div>
            <div class="row"><span class="label">Authorized Signatory:</span><span class="value">${receipt.receivedBy}</span></div>
            <div class="amount-box">
              <p class="amount-title">Amount Paid</p>
              <p class="amount-val">₹${receipt.amountPaid}</p>
            </div>
            <div class="footer">
              Thank you for trusting Sunshine Classes. This is a computer-generated digital receipt and requires no physical signature.
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors selection:bg-amber-100">
      
      {/* Upper Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex justify-between items-center">
          <button
            id="fees-back-btn"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-orange transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} /> Back to Home
          </button>
          
          <SunshineLogo size="md" showText={true} textSubTitle="Digital Payment Terminal" />
          
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                id="btn-toggle-theme-fees"
                onClick={onToggleTheme}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 text-xs transition-all border border-slate-200 dark:border-slate-700"
              >
                {theme === 'light' ? <DollarSign size={16} /> : <Shield size={16} />}
              </button>
            )}
            <button
              id="btn-go-dashboard-fees"
              onClick={() => navigate(currentUser ? '/login' : '/login')}
              className="rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold px-3.5 py-1.5"
            >
              {currentUser ? 'Dashboard' : 'Staff Login'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-brand-orange text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            <DollarSign size={13} /> Fee Verification & Pay Portal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Academic Ledger Search</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
            Parents and students can check monthly tuition fees, outstanding balances, and safely dispatch online payments using their unique Student Roll Number.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm p-6 mb-8 transition-colors">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                id="fees-search-input"
                type="text"
                required
                placeholder="Enter Student ID, Roll No (e.g. S-101, ROLL-101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-brand-blue focus:bg-white dark:focus:bg-slate-850 transition-all font-semibold"
              />
            </div>
            <button
              id="fees-search-submit"
              type="submit"
              className="rounded-2xl bg-brand-orange hover:bg-amber-500 text-white px-6 py-3 text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
            >
              Search Records
            </button>
          </form>
          
          <div className="mt-3.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 px-3.5 py-2 rounded-xl">
            <Shield size={12} className="text-emerald-500 shrink-0" />
            <span>Encrypted Ledger Gateway active. Tip: Try searching "S-01" or "ROLL-01" for seed students.</span>
          </div>
        </div>

        {/* Results Container */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
            >
              {matchedStudent ? (
                <div className="space-y-6">
                  
                  {/* Student Profile Card */}
                  <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-1/4 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                      <div>
                        <span className="bg-indigo-800 text-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Active Student Profile
                        </span>
                        <h2 className="text-2xl font-extrabold mt-1.5 tracking-tight">{matchedStudent.name}</h2>
                        <p className="text-indigo-200 text-xs font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                          Class: {matchedStudent.class || 'Class 10'} • Roll No: {matchedStudent.rollNo || 'N/A'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">Guardian Details</span>
                        <span className="text-sm font-extrabold block mt-0.5">{matchedStudent.fatherName || 'Mr. Sharma'}</span>
                        <span className="text-xs text-indigo-200 block mt-0.5">{matchedStudent.parentMobile || matchedStudent.mobile || 'No contact'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee Ledger Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm p-6 transition-colors">
                    <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                      <Calendar className="text-brand-orange h-4.5 w-4.5" /> Academic Billings & Ledger Statuses
                    </h3>

                    {studentFees.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                        No active billing ledgers recorded for this student in the database.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                              <th className="py-3 px-2">Cycle</th>
                              <th className="py-3 px-2">Total Due</th>
                              <th className="py-3 px-2">Paid</th>
                              <th className="py-3 px-2">Pending Balance</th>
                              <th className="py-3 px-2">Due Date</th>
                              <th className="py-3 px-2">Status</th>
                              <th className="py-3 px-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {studentFees.map((fee, idx) => {
                              const isPaid = fee.status === 'PAID';
                              const isPending = fee.status === 'PENDING';
                              const isPartial = fee.status === 'PARTIAL';
                              
                              return (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                                  <td className="py-3.5 px-2 text-slate-800 dark:text-slate-100 font-extrabold">{fee.month}</td>
                                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">₹{fee.totalFee}</td>
                                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">₹{fee.paidFee}</td>
                                  <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-slate-100">
                                    ₹{fee.pendingFee}
                                  </td>
                                  <td className="py-3.5 px-2 text-slate-500 text-[11px] font-mono">{fee.dueDate}</td>
                                  <td className="py-3.5 px-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                      isPaid 
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                        : isPartial
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                    }`}>
                                      {fee.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-2 text-right">
                                    {isPaid ? (
                                      <span className="text-emerald-600 text-[11px] font-bold flex items-center justify-end gap-1">
                                        <CheckCircle size={12} /> Clear
                                      </span>
                                    ) : (
                                      <button
                                        id={`pay-btn-${idx}`}
                                        onClick={() => handleOpenCheckout(fee)}
                                        className="bg-brand-orange hover:bg-amber-500 text-white text-[11px] font-black py-1 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
                                      >
                                        Pay Fee
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Historic Receipts */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm p-6 transition-colors">
                    <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                      <Receipt className="text-indigo-600 h-4.5 w-4.5" /> Recent Payment Receipts & Invoices
                    </h3>

                    {studentReceipts.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                        No previous digital transactions recorded on file.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentReceipts.map((receipt) => (
                          <div 
                            key={receipt.id}
                            className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 rounded-2xl text-xs hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                  {receipt.id}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 font-bold">{receipt.date}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] font-bold mt-1">
                                Billing: {receipt.month} • Mode: {receipt.paymentMethod}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                                ₹{receipt.amountPaid}
                              </span>
                              <button
                                id={`print-receipt-${receipt.id}`}
                                onClick={() => handlePrintReceipt(receipt)}
                                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                                title="Download / Print E-Receipt"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 p-12 text-center shadow-xs transition-colors">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-brand-orange border border-amber-100 dark:border-amber-900/30 mb-4 animate-bounce">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">No Student Matches Found</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                    Verify that you entered the correct student ID or register number. Make sure it matches exactly (e.g., S-01, ROLL-01, S-02).
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Checkout Payment Dialog Drawer */}
      <AnimatePresence>
        {payingFee && matchedStudent && (
          <>
            {/* Modal Overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
              onClick={() => {
                if (!isProcessing) setPayingFee(null);
              }}
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl z-[60] w-full max-w-md overflow-hidden transition-colors font-sans"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-orange to-brand-blue"></div>
              
              {!paymentSuccess ? (
                <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">Checkout Terminal</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Billing month: {payingFee.month}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                      {matchedStudent.name}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enter Payment Amount (₹)</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</div>
                      <input
                        id="checkout-amount"
                        type="number"
                        required
                        disabled={isProcessing}
                        max={payingFee.pendingFee}
                        min="1"
                        placeholder="Enter payment amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-7 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-brand-blue focus:bg-white dark:focus:bg-slate-850 font-bold transition-all"
                      />
                    </div>
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 block">
                      Maximum Allowed: ₹{payingFee.pendingFee} (Cycle Pending Balance)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Methodology</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'UPI', label: 'UPI / Google Pay', icon: CreditCard },
                        { id: 'CARD', label: 'Debit/Credit Card', icon: CreditCard },
                        { id: 'NET_BANKING', label: 'Net Banking', icon: CreditCard },
                        { id: 'CASH', label: 'Cash Receipt', icon: DollarSign }
                      ].map((m) => (
                        <button
                          key={m.id}
                          id={`pay-method-${m.id}`}
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                            paymentMethod === m.id 
                              ? 'bg-brand-blue/5 border-brand-blue text-brand-blue dark:bg-indigo-950/30' 
                              : 'border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <m.icon size={14} className="shrink-0" />
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / UPI Ref Number</label>
                      <input
                        id="checkout-transaction-id"
                        type="text"
                        disabled={isProcessing}
                        placeholder="Enter transaction, check, or UPI reference ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none focus:border-brand-blue focus:bg-white dark:focus:bg-slate-850 font-semibold"
                      />
                    </div>
                  )}

                  {/* Trust indicator */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                    <Shield size={14} className="text-emerald-500 shrink-0" />
                    <span>Secure Gateway active. Submitting will update the student's ledger and instantly deliver parent notification.</span>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      id="checkout-cancel"
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setPayingFee(null)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="checkout-submit"
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 rounded-xl bg-brand-orange hover:bg-amber-500 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <span>Verify & Pay</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle size={24} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Payment Successfully Recorded</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Receipt ID: {newReceiptId}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                      Payment of <strong className="text-slate-800 dark:text-slate-100">₹{paymentAmount}</strong> for {matchedStudent.name} ({payingFee.month}) was registered. The student's fee ledger was dynamically adjusted.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3">
                    <button
                      id="print-success-receipt"
                      onClick={() => {
                        const rec = studentReceipts.find(r => r.id === newReceiptId);
                        if (rec) handlePrintReceipt(rec);
                      }}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt size={14} /> Print Receipt / Invoice
                    </button>
                    <button
                      id="checkout-close"
                      onClick={() => setPayingFee(null)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Return to Ledgers
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
