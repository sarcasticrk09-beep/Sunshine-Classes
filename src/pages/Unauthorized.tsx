import React from 'react';
import { useAuth } from '../auth/useAuth';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-amber-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden text-center">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600"></div>

        <div className="flex justify-center mb-5">
          <div className="p-4 bg-rose-50 rounded-full border border-rose-100">
            <ShieldAlert className="h-12 w-12 text-rose-500" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">403: Access Denied</h1>
        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-1">
          Strict Security Restriction
        </p>

        <p className="text-xs text-slate-500 font-semibold mt-4 leading-relaxed px-2">
          Your current account does not have sufficient clearance credentials to access this administrative terminal.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <button
            id="btn-unauth-home"
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Website Home</span>
          </button>

          <button
            id="btn-unauth-logout"
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-rose-200 hover:bg-rose-50/50 text-rose-600 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
