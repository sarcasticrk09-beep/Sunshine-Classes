import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { motion } from 'motion/react';
import SunshineLogo from '../components/SunshineLogo';

interface LoginProps {
  onBackToWebsite?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBackToWebsite }) => {
  const { login, googleLogin, googleLoading, currentUser, changePassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoginStep, setGoogleLoginStep] = useState<string>('');

  // States for forced password change (firstLogin === true)
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passChanging, setPassChanging] = useState<boolean>(false);
  const [passError, setPassError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    setGoogleLoginStep('Google Sign-In Initiated');
    console.log('[Google Sign-In] Google Sign-In Initiated');
    try {
      setGoogleLoginStep('Contacting Google/Firebase authentication server...');
      console.log('[Google Sign-In] Contacting Firebase Auth (signInWithPopup/signInWithRedirect)');
      
      const success = await googleLogin();
      
      if (success) {
        setGoogleLoginStep('Firebase User UID obtained. Verification successful.');
        console.log('[Google Sign-In] Firebase User UID obtained');
        setTimeout(() => {
          setGoogleLoginStep('Firestore user doc checked. Access granted.');
          console.log('[Google Sign-In] Firestore user doc checked');
        }, 500);
      } else {
        setGoogleLoginStep('');
      }
    } catch (err: any) {
      console.error("[Google Sign-In] Google login failed:", err);
      setError(err.message || 'Google Sign-In failed.');
      setGoogleLoginStep('');
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassChanging(true);
    try {
      await changePassword(password, newPassword);
      alert("Password hardened successfully! Welcome to Sunshine Classes.");
    } catch (err: any) {
      setPassError(err.message || 'Failed to update passcode.');
    } finally {
      setPassChanging(false);
    }
  };

  // If user is authenticated BUT has firstLogin flag set to true, force password change!
  if (currentUser && (currentUser as any).firstLogin === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-amber-100">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 to-brand-orange"></div>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Key className="h-12 w-12 text-amber-500 animate-bounce" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configure Secure Passcode</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
              This is your first login. To protect academic records, you must configure a secure personal passcode.
            </p>
          </div>

          {passError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-600 font-semibold leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleForceChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  id="force-new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  id="btn-toggle-force-new-pass"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Confirm New Password</label>
              <div className="relative">
                <input
                  id="force-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  id="btn-toggle-force-confirm-pass"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="btn-force-submit"
              type="submit"
              disabled={passChanging}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {passChanging ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Passcode...</span>
                </>
              ) : (
                <span>Activate Account</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-amber-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-brand-orange"></div>
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <SunshineLogo size={42} showText={false} />
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-3">
            {location.pathname === '/student/login' ? 'Student Portal' : location.pathname === '/admin/login' ? 'Admin Portal' : 'Sunshine Classes'}
          </h2>
          <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
            {location.pathname === '/student/login' ? 'Student ERP Login' : location.pathname === '/admin/login' ? 'Admin ERP Login' : 'Excellence in Education'}
          </p>
        </div>

        {error && (
          <div id="login-error-alert" className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start justify-between gap-2.5 text-xs text-rose-600 font-semibold leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              id="btn-dismiss-login-error"
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600 p-0.5 rounded-lg transition-colors cursor-pointer"
              title="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* First-time login credential helper */}
        <div id="first-time-login-tip" className="mb-5 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950 font-medium leading-relaxed">
          <Key size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-indigo-950 block mb-0.5">🔑 First-Time Logging In?</strong>
            Your default passcode is your username followed by <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">123</code> (e.g., if username is <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">student</code>, password is <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">student123</code>). You will configure your own secure custom passcode after entering this first time!
          </div>
        </div>

        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Email Address or Username</label>
            <input
              id="auth-email"
              type="text"
              required
              disabled={loading}
              placeholder="Enter your registered email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/10 transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Account Password</label>
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/10 transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center py-0.5 select-none">
            <input
              id="auth-remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer accent-brand-blue"
            />
            <label
              htmlFor="auth-remember-me"
              className="ml-2 text-xs text-slate-600 font-bold cursor-pointer hover:text-slate-800 transition-colors"
            >
              Remember Me on this device
            </label>
          </div>

          {/* Compliance Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 font-semibold">
            <Shield size={12} className="text-emerald-600 shrink-0" />
            <span>Encrypted cloud authentication active.</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {onBackToWebsite && (
              <button
                id="btn-back-website"
                type="button"
                onClick={() => {
                  if (onBackToWebsite) {
                    onBackToWebsite();
                  } else {
                    navigate('/');
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Website Home
              </button>
            )}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl text-white py-2.5 text-xs font-bold shadow-md transition-all relative overflow-hidden flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-brand-blue/90 cursor-wait' 
                  : 'bg-brand-blue hover:bg-brand-blue-hover active:scale-[0.99] cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw id="icon-login-progress-spinner" className="h-3.5 w-3.5 animate-spin text-white shrink-0" />
                  <span id="txt-login-progress-label">Loading...</span>
                  <div id="login-button-progress-bar" className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                    <motion.div
                      id="login-button-progress-fill"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      className="h-full w-1/2 bg-white rounded-full shadow-xs"
                    />
                  </div>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase">Or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          id="btn-google-auth"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
        >
          {googleLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-brand-blue" />
              <span className="text-brand-blue">Handshaking with Google...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.37 0 3.402 2.659 1.492 6.551l3.774 3.214z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 15.345c-1.077.733-2.43 1.164-4.04 1.164-2.955 0-5.46-2-6.355-4.697l-3.805 3.19C3.714 20.254 7.545 23 12 23c3.082 0 5.864-1.018 7.91-2.764l-3.87-2.89z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.273c0-.818-.082-1.609-.227-2.373H12v4.509h6.464c-.277 1.482-1.114 2.736-2.373 3.582l3.87 2.891c2.264-2.091 3.53-5.173 3.53-8.609z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.685 11.812A6.974 6.974 0 0 1 5.645 10c0-.627.087-1.232.227-1.813L2.097 4.973A11.954 11.954 0 0 0 0 10c0 1.79.4 3.49 1.11 5.027l4.575-3.215z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {googleLoginStep && (
          <div className="mt-2.5 text-center text-[10px] font-bold text-brand-blue tracking-wide uppercase animate-pulse flex items-center justify-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>{googleLoginStep}</span>
          </div>
        )}

      </div>
    </div>
  );
};
