import React from 'react';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-amber-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden text-center">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500"></div>

        <div className="flex justify-center mb-5">
          <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
            <HelpCircle className="h-12 w-12 text-slate-500 animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">404: Page Not Found</h1>
        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-1">
          Sunshine Classes ERP
        </p>

        <p className="text-xs text-slate-500 font-semibold mt-4 leading-relaxed px-2">
          The requested page or view has moved, expired, or does not exist under our digitized routing scheme.
        </p>

        <div className="mt-8">
          <button
            id="btn-notfound-home"
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Website Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
