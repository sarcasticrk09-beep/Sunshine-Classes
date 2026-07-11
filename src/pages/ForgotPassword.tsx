import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { Mail, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import SunshineLogo from '../components/SunshineLogo';

export const ForgotPassword: React.FC = () => {
  const { resetPassword, verifyAndResetPassword } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // One-Time Reset Link Mode states
  const searchParams = new URLSearchParams(window.location.search);
  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email');
  const isOneTimeLinkMode = !!(tokenParam && emailParam);

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [resetCompleted, setResetCompleted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to trigger recovery flow. Check registered email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      setLoading(false);
      return;
    }

    try {
      if (verifyAndResetPassword && emailParam && tokenParam) {
        await verifyAndResetPassword(emailParam, tokenParam, newPassword);
        setResetCompleted(true);
      } else {
        throw new Error("Password reset service is currently unavailable.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update password. Your secure one-time link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-amber-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-brand-orange"></div>

        <div className="flex flex-col items-center text-center mb-8">
          <SunshineLogo size={42} showText={false} />
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-3">
            {isOneTimeLinkMode ? 'Configure Credentials' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed px-4">
            {isOneTimeLinkMode 
              ? `Configure a secure new password for your account: ${emailParam}`
              : 'We will send a secure password configuration link to your registered email address.'
            }
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-600 font-semibold leading-relaxed animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isOneTimeLinkMode ? (
          resetCompleted ? (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
                <CheckCircle2 size={32} className="text-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-800 text-base">Password Updated!</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Your security credentials have been successfully updated. You may now log in.
                </p>
              </div>

              <button
                id="btn-new-pass-success-login"
                type="button"
                onClick={() => {
                  window.history.pushState({}, "", "/login");
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="w-full rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetNewPassword} className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white transition-all font-semibold"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Re-type your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white transition-all font-semibold"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  id="btn-save-new-password"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-950 hover:bg-slate-900 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving password...</span>
                    </>
                  ) : (
                    <span>Save Password & Activate</span>
                  )}
                </button>

                <button
                  id="btn-new-pass-cancel"
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, "", "/login");
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="w-full rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )
        ) : (
          success ? (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-700 font-semibold leading-relaxed">
                <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-extrabold">Recovery Email Dispatched!</p>
                  <p className="mt-1 font-medium leading-relaxed">
                    A secure simulated recovery email has been sent to <strong className="text-slate-800">{email}</strong>. Use the <strong>Mail Sandbox</strong> drawer on the bottom right to complete the configuration!
                  </p>
                </div>
              </div>

              <button
                id="btn-back-login-success"
                type="button"
                onClick={() => {
                  window.history.pushState({}, "", "/login");
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="w-full rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <input
                    id="reset-email"
                    type="email"
                    required
                    placeholder="Enter your registered email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white transition-all font-semibold"
                  />
                  <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <button
                  id="btn-reset-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending email...</span>
                    </>
                  ) : (
                    <span>Send Recovery Email</span>
                  )}
                </button>

                <button
                  id="btn-back-login"
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
            </form>
          )
        )}
      </div>
    </div>
  );
};
