import React, { useState, useEffect } from 'react';
import { Mail, ChevronDown, ChevronUp, Trash2, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { getSentEmails, clearSentEmails, SentEmail } from '../utils/mailSimulator';

export const MailSimulatorWidget: React.FC = () => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const loadEmails = () => {
    setEmails(getSentEmails());
  };

  useEffect(() => {
    loadEmails();
    const handleUpdate = () => {
      loadEmails();
      // Auto expand the newest email when a new one arrives
      const list = getSentEmails();
      if (list.length > 0) {
        setExpandedEmailId(list[0].id);
        setIsOpen(true);
      }
    };
    window.addEventListener('sunshine_emails_updated', handleUpdate);
    return () => window.removeEventListener('sunshine_emails_updated', handleUpdate);
  }, []);

  if (emails.length === 0) return null;

  return (
    <div 
      id="mail-simulator-widget"
      className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden font-sans text-white transition-all duration-300 transform scale-100"
    >
      {/* Header Bar */}
      <button
        id="btn-toggle-mail-simulator"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 px-4 py-3 flex items-center justify-between hover:bg-slate-900/90 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Mail size={16} className="text-amber-400" />
            <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-indigo-950 font-black text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
              {emails.length}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight text-slate-150">Mail Sandbox (Dev Mode)</h4>
            <p className="text-[9px] text-slate-400">Captured outbox dispatches</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800 bg-slate-900/95 p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Simulated Inboxes</span>
            <button
              id="btn-clear-simulated-mails"
              type="button"
              onClick={() => {
                clearSentEmails();
                setExpandedEmailId(null);
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Trash2 size={12} />
              Clear Sandbox
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pt-1">
            {emails.map((email) => {
              const isExpanded = expandedEmailId === email.id;
              return (
                <div 
                  key={email.id} 
                  className={`rounded-xl border transition-all duration-200 ${
                    isExpanded 
                      ? 'border-amber-400/40 bg-slate-950 p-3' 
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 p-2.5 cursor-pointer'
                  }`}
                  onClick={() => !isExpanded && setExpandedEmailId(email.id)}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-slate-400">To: <strong className="text-slate-200">{email.to}</strong></span>
                      <h5 className="text-[11px] font-extrabold text-amber-200 truncate mt-0.5">{email.subject}</h5>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono shrink-0">
                      {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-[10.5px] text-slate-300 leading-relaxed font-medium">
                        {email.body}
                      </p>
                      
                      <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl flex flex-col gap-1.5">
                        <span className="text-[8.5px] font-bold text-amber-400 uppercase tracking-widest block">Simulated One-Time Key</span>
                        <a
                          id={`simulated-email-link-${email.id}`}
                          href={email.link}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsOpen(false);
                            // Set path and navigate smoothly
                            window.history.pushState({}, "", email.link);
                            window.dispatchEvent(new Event('popstate'));
                          }}
                          className="flex items-center justify-between gap-1 text-[11px] font-black text-amber-300 hover:text-amber-200 transition-colors bg-amber-950/40 px-3 py-2 rounded-lg border border-amber-500/20"
                        >
                          <span className="truncate flex-1 pr-2">Proceed with One-Time Link</span>
                          <ArrowRight size={12} className="shrink-0 text-amber-400" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
