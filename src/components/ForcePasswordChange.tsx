import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Check, X, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { simpleSecureHash } from '../auth/AuthProvider';

interface ForcePasswordChangeProps {
  onSuccess?: () => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ onSuccess }) => {
  const { currentUser, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password validation checks
  const meetsMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const isPasswordValid = meetsMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('New password does not meet the specified security criteria.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Load current user from DB to verify current password
      const storedUsers = localStorage.getItem('sunshine_users');
      if (storedUsers && currentUser) {
        const users = JSON.parse(storedUsers);
        const liveUser = users.find((u: any) => u.id === currentUser.id);
        if (liveUser) {
          const hashedAttempt = simpleSecureHash(currentPassword);
          const actualHash = liveUser.password || '';
          const match = hashedAttempt === actualHash || 
                        hashedAttempt.replace('sha256_', 'sha256_mock_') === actualHash || 
                        hashedAttempt.replace('sha256_mock_', 'sha256_') === actualHash;

          if (!match && liveUser.password) {
            setError('The current password you entered is incorrect.');
            setLoading(false);
            return;
          }
        }
      }

      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="force-password-change-container" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        id="force-password-change-card"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Update Required</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            To protect your account, you must update your password before proceeding to the dashboard.
          </p>
        </div>

        {error && (
          <div id="change-pwd-error-banner" className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs flex items-start gap-2">
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div id="change-pwd-success-banner" className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full mb-3">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Password Changed Successfully</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Redirecting to your secure dashboard...</p>
          </div>
        ) : (
          <form id="force-password-change-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="input-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter current password"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <button
                  id="btn-toggle-show-current"
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="input-new-password"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter secure new password"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <button
                  id="btn-toggle-show-new"
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="input-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Re-enter new password"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <button
                  id="btn-toggle-show-confirm"
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Criteria */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800 space-y-1 text-[11px]">
              <span className="block font-medium text-slate-500 dark:text-slate-400 mb-1">Security Checklist:</span>
              <div className="flex items-center gap-1.5">
                {meetsMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                <span className={meetsMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>Minimum 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                <span className={hasUppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>At least one uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                <span className={hasLowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>At least one lowercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>At least one numeric digit</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                <span className={hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>At least one special character</span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200 dark:border-slate-800 mt-1">
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 font-semibold'}>Passwords match</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="btn-logout-cancel"
                type="button"
                onClick={() => logout()}
                className="flex-1 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
              >
                <LogOut className="w-4 h-4" /> Cancel
              </button>
              <button
                id="btn-submit-password-change"
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="flex-1 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {loading ? 'Updating...' : 'Save Password'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
