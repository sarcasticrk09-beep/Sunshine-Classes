import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Printer, ArrowLeft } from 'lucide-react';

interface VerificationData {
  receiptNumber: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  status: string;
}

export function ReceiptVerificationPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    async function verify() {
      if (!receiptNumber) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/verify/receipt/${receiptNumber}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Invalid Receipt');
        }
      } catch (err) {
        setError('An error occurred during verification.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [receiptNumber]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        {/* Header decoration */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
          <div className="absolute top-4 left-4">
            <Link to="/" className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-md font-bold tracking-tight">SUNSHINE CLASSES</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Official Online Verification</p>
        </div>

        {/* Content body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Cryptographically validating receipt...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center" id="verification-error-view">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-150 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{error}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-4">
                This receipt number does not match any authenticated record in the Sunshine ERP database or has a mismatched signature.
              </p>
              <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
                <p className="text-[10px] text-slate-400 font-medium">
                  If you believe this is an error, please contact Sunshine Classes Administrative Department at +91 8707738284.
                </p>
              </div>
            </div>
          ) : data ? (
            <div id="verification-success-view">
              {/* Success Badge */}
              <div className="flex flex-col items-center border-b border-slate-100 dark:border-slate-700 pb-5 mb-5 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 text-[11px] font-bold rounded-full mb-3 uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5" /> Cryptographically Verified
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Receipt Number</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-0.5">{data.receiptNumber}</p>
              </div>

              {/* Receipt Details Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Student Name</span>
                  <span className="text-xs text-slate-800 dark:text-slate-200 font-bold">{data.studentName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Amount</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-black">₹{data.amount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Date Issued</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {data.paymentDate ? new Date(data.paymentDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Status</span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    data.status === 'VALID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                    data.status === 'VOID' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {data.status}
                  </span>
                </div>
              </div>

              {/* Verification Message */}
              <div className="mt-6 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                  This page confirms that the digital receipt is genuine and matches the official tuition settlement logs recorded in the Sunshine ERP database.
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex justify-center gap-3">
                <button
                  id="print-verification-view-btn"
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Page
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer copyright */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-6 text-center">
        Sunshine Classes • Reg No: 09BCXPS8401H1ZD • Pihani, Hardoi, Uttar Pradesh
      </p>
    </div>
  );
}
