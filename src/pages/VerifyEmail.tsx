import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { CheckCircle2, XCircle, RefreshCw, LogIn, ArrowLeft } from 'lucide-react';
import SunshineLogo from '../components/SunshineLogo';

export const VerifyEmail: React.FC = () => {
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const handleVerify = async () => {
      if (!token || !email) {
        setError("Invalid verification link. Missing security token or identifier.");
        setLoading(false);
        return;
      }

      try {
        if (verifyEmail) {
          await verifyEmail(email, token);
          setSuccess(true);
        } else {
          throw new Error("Verification service is currently unavailable.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to verify email. The secure link might have expired.");
      } finally {
        setLoading(false);
      }
    };

    handleVerify();
  }, [token, email, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden text-center">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

        <div className="flex flex-col items-center mb-6">
          <SunshineLogo size={46} showText={false} />
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-3">Account Activation</h2>
        </div>

        {loading ? (
          <div className="space-y-4 py-6 flex flex-col items-center">
            <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Verifying your secure token key...</p>
          </div>
        ) : success ? (
          <div className="space-y-6 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
              <CheckCircle2 size={32} className="text-emerald-500 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-800 text-lg">Verification Successful!</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed px-4">
                Thank you, your email <strong className="text-slate-700">{email}</strong> has been successfully verified. Your account is now fully active.
              </p>
            </div>

            <button
              id="btn-verify-success-login"
              type="button"
              onClick={() => {
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new Event('popstate'));
              }}
              className="w-full rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn size={14} />
              <span>Sign In to ERP Portal</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100 shadow-inner">
              <XCircle size={32} className="text-rose-500" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-800 text-lg">Verification Failed</h3>
              <p className="text-xs text-rose-600 font-bold leading-relaxed px-4">
                {error}
              </p>
            </div>

            <button
              id="btn-verify-fail-back"
              type="button"
              onClick={() => {
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new Event('popstate'));
              }}
              className="w-full rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
