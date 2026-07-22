import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Inbox, RefreshCw, CheckCircle2, AlertCircle, 
  User, Sparkles, X, ChevronRight, FileText, Search, ExternalLink,
  ShieldAlert, LogOut, Check
} from 'lucide-react';
import { 
  authenticateGmail, 
  fetchGmailProfile, 
  sendGmailMessage, 
  listGmailMessages, 
  fetchFullGmailMessage, 
  buildERPEmailHtml,
  GmailProfile, 
  GmailMessageSummary 
} from '../services/gmailService';
import { getCachedAccessToken, clearCachedAccessToken } from '../lib/firebase';
import { Student, Teacher } from '../types';

interface GmailHubProps {
  students?: Student[];
  teachers?: Teacher[];
  currentUserName?: string;
  currentUserEmail?: string;
}

export const GmailHub: React.FC<GmailHubProps> = ({
  students = [],
  teachers = [],
  currentUserName = 'Administrator',
  currentUserEmail = '',
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tabs: 'compose' | 'inbox' | 'templates'
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox' | 'templates'>('compose');

  // Inbox & Messages State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [loadingFullMsg, setLoadingFullMsg] = useState<boolean>(false);

  // Compose State
  const [recipientType, setRecipientType] = useState<'custom' | 'student' | 'teacher'>('student');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [subject, setSubject] = useState<string>('Important Update from Sunshine Classes');
  const [templateType, setTemplateType] = useState<string>('GENERAL');
  const [messageBody, setMessageBody] = useState<string>(
    'We are writing to inform you regarding the upcoming class schedule and academic progress updates.'
  );

  // Send Confirmation Modal State (MANDATORY User Confirmation for Mutating Operations)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Auto-fetch profile if access token is already available
  useEffect(() => {
    if (accessToken) {
      loadProfileAndMessages(accessToken);
    }
  }, [accessToken]);

  const loadProfileAndMessages = async (token: string) => {
    setLoadingProfile(true);
    setAuthError(null);
    try {
      const prof = await fetchGmailProfile(token);
      setProfile(prof);
      fetchInbox(token);
    } catch (err: any) {
      console.warn('Failed to load Gmail profile:', err);
      setAuthError(err.message || 'Gmail authorization expired. Please sign in again.');
      setAccessToken(null);
      clearCachedAccessToken();
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setLoadingProfile(true);
    try {
      const { accessToken: token, userEmail } = await authenticateGmail();
      setAccessToken(token);
      await loadProfileAndMessages(token);
    } catch (err: any) {
      console.error('Gmail Sign In Error:', err);
      setAuthError(err.message || 'Google sign-in was canceled or failed.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleDisconnect = () => {
    clearCachedAccessToken();
    setAccessToken(null);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
  };

  const fetchInbox = async (token: string) => {
    setLoadingMessages(true);
    try {
      const res = await listGmailMessages(token, { maxResults: 12, q: searchQuery });
      setMessages(res.messages);
    } catch (err: any) {
      console.warn('Error fetching Gmail inbox:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleViewMessage = async (msgSummary: GmailMessageSummary) => {
    if (!accessToken) return;
    setSelectedMessage(msgSummary);
    setLoadingFullMsg(true);
    try {
      const full = await fetchFullGmailMessage(accessToken, msgSummary.id);
      setSelectedMessage(full);
    } catch (err) {
      console.warn('Error fetching full message:', err);
    } finally {
      setLoadingFullMsg(false);
    }
  };

  // Resolve target email address based on user selection
  const getResolvedRecipientEmail = (): { email: string; name: string } => {
    if (recipientType === 'student') {
      const st = students.find((s) => s.id === selectedStudentId);
      return {
        email: st?.email || st?.parentEmail || '',
        name: st?.name || 'Student',
      };
    }
    if (recipientType === 'teacher') {
      const tc = teachers.find((t) => t.id === selectedTeacherId);
      return {
        email: tc?.email || '',
        name: tc?.name || 'Faculty Member',
      };
    }
    return { email: customTo, name: 'Recipient' };
  };

  const handlePrepareSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    const { email } = getResolvedRecipientEmail();
    if (!email) {
      setSendError('Please select a valid recipient or enter an email address.');
      return;
    }
    if (!subject.trim()) {
      setSendError('Subject line cannot be empty.');
      return;
    }

    // Open mandatory explicit confirmation dialog
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    if (!accessToken) {
      setSendError('Gmail access token missing. Please sign in with Google first.');
      setShowConfirmModal(false);
      return;
    }

    setSending(true);
    setSendError(null);

    const { email: recipientEmail, name: recipientName } = getResolvedRecipientEmail();

    const formattedHtml = buildERPEmailHtml({
      title: subject,
      studentName: recipientName,
      contentHtml: `<p>${messageBody.replace(/\n/g, '<br/>')}</p>`,
      callToActionText: 'Visit Sunshine Classes ERP Portal',
      callToActionUrl: window.location.origin,
    });

    try {
      await sendGmailMessage(accessToken, {
        to: recipientEmail,
        subject: subject,
        body: formattedHtml,
      });

      setSendSuccess(`Email successfully sent to ${recipientEmail} via Gmail API!`);
      setShowConfirmModal(false);

      // Reset fields partially
      setSubject('Important Update from Sunshine Classes');
      setMessageBody('We are writing to inform you regarding the upcoming class schedule and academic progress updates.');

      // Refresh inbox
      fetchInbox(accessToken);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setSendError(err.message || 'Failed to dispatch email via Gmail API.');
      setShowConfirmModal(false);
    } finally {
      setSending(false);
    }
  };

  // Quick Template Injector
  const applyTemplate = (type: string) => {
    setTemplateType(type);
    if (type === 'FEE_REMINDER') {
      setSubject('Fee Payment Reminder — Sunshine Classes Varanasi');
      setMessageBody(
        `This is a gentle reminder regarding the pending fee payment for the current billing cycle. Kindly ensure the payment is completed by the due date to maintain uninterrupted learning access.\n\nYou can pay online via UPI, Credit/Debit card, or at the reception branch.`
      );
    } else if (type === 'ADMISSION_CONFIRM') {
      setSubject('Admission Confirmation & Welcome — Sunshine Classes');
      setMessageBody(
        `We are thrilled to welcome you to Sunshine Classes Varanasi! Your admission process has been successfully verified.\n\nPlease find your batch schedule and student login credentials attached in the student portal.`
      );
    } else if (type === 'MARKS_REPORT') {
      setSubject('Weekly Test Assessment Report & Performance Marks');
      setMessageBody(
        `The results for the recent subject assessment test have been published on the ERP portal. Please log in to review section-wise marks, ranking, and faculty feedback.`
      );
    } else if (type === 'HOMEWORK_ALERT') {
      setSubject('Daily Homework Assignment & Study Materials Uploaded');
      setMessageBody(
        `New practice questions and chapter notes have been uploaded to your student workspace. Please complete the assigned exercise before the next class session.`
      );
    }
  };

  return (
    <div id="gmail-hub-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Gmail Communications Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Official Integration
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Send official ERP notices, fee receipts, and marks directly using your Google account.
            </p>
          </div>
        </div>

        {/* OAuth Authentication Status Bar */}
        <div>
          {accessToken && profile ? (
            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">{profile.emailAddress}</p>
                <p className="text-[10px] text-slate-400">Gmail API Active • {profile.messagesTotal || 0} Total Msgs</p>
              </div>
              <button
                id="gmail-disconnect-btn"
                onClick={handleDisconnect}
                className="ml-2 text-xs text-slate-400 hover:text-rose-400 transition-colors p-1"
                title="Disconnect Gmail session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="gmail-signin-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loadingProfile}
              className="gsi-material-button text-xs font-semibold"
              style={{
                backgroundColor: '#ffffff',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '18px', height: '18px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              {loadingProfile ? 'Connecting...' : 'Sign in with Google'}
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div id="gmail-auth-error-alert" className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
          <button onClick={() => setAuthError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sendSuccess && (
        <div id="gmail-send-success-alert" className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sendSuccess}</span>
          </div>
          <button onClick={() => setSendSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sendError && (
        <div id="gmail-send-error-alert" className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{sendError}</span>
          </div>
          <button onClick={() => setSendError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-3">
        <button
          id="gmail-tab-compose"
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'compose'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Compose & Dispatch
        </button>

        <button
          id="gmail-tab-inbox"
          onClick={() => {
            setActiveTab('inbox');
            if (accessToken) fetchInbox(accessToken);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'inbox'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          Gmail Inbox & Sent
          {messages.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="mt-6">
        {activeTab === 'compose' && (
          <form onSubmit={handlePrepareSend} className="space-y-4">
            {/* Quick Templates Bar */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
              <label className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                Quick ERP Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'GENERAL', label: 'General Announcement' },
                  { id: 'FEE_REMINDER', label: 'Fee Payment Reminder' },
                  { id: 'ADMISSION_CONFIRM', label: 'Admission Welcome' },
                  { id: 'MARKS_REPORT', label: 'Test Assessment Marks' },
                  { id: 'HOMEWORK_ALERT', label: 'Homework Assignment' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => applyTemplate(tmpl.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      templateType === tmpl.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Picker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Target Audience</label>
                <select
                  id="gmail-recipient-type-select"
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="student">Student / Parent (ERP Database)</option>
                  <option value="teacher">Faculty Member (Teachers)</option>
                  <option value="custom">Custom Email Address</option>
                </select>
              </div>

              {recipientType === 'student' && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300 block mb-1">Select Student / Parent</label>
                  <select
                    id="gmail-student-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.preferredBatch || st.class || 'Batch'}) - {st.email || st.parentEmail || 'No Email Registered'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'teacher' && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300 block mb-1">Select Faculty Member</label>
                  <select
                    id="gmail-teacher-select"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.qualification || 'Faculty'}) - {tc.email || 'No Email'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'custom' && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300 block mb-1">Recipient Email</label>
                  <input
                    id="gmail-custom-to-input"
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email Subject Line</label>
              <input
                id="gmail-subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Enter subject..."
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Message Body (HTML Supported)</label>
              <textarea
                id="gmail-message-body-textarea"
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                placeholder="Write your email content here..."
              />
            </div>

            {/* Submit / Send Action */}
            <div className="flex justify-end pt-2">
              <button
                id="gmail-prepare-send-btn"
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
                Review & Dispatch Email
              </button>
            </div>
          </form>
        )}

        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Search & Refresh */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="gmail-inbox-search-input"
                  type="text"
                  placeholder="Search Gmail messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && accessToken && fetchInbox(accessToken)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                id="gmail-inbox-refresh-btn"
                onClick={() => accessToken && fetchInbox(accessToken)}
                disabled={loadingMessages || !accessToken}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                title="Refresh Gmail inbox"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>

            {/* Message List */}
            {!accessToken ? (
              <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-800">
                <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-medium">Authentication Required</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-4">Sign in with Google to view your Gmail inbox.</p>
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  Sign in with Google
                </button>
              </div>
            ) : loadingMessages ? (
              <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span>Loading messages from Gmail API...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No messages found in your Gmail inbox for this view.
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    id={`gmail-msg-${msg.id}`}
                    onClick={() => handleViewMessage(msg)}
                    className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-200 truncate">{msg.from}</span>
                        {msg.unread && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold px-2 py-0.5 rounded-full">
                            UNREAD
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                        {msg.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.snippet}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{msg.date ? new Date(msg.date).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Message Modal */}
      {selectedMessage && (
        <div id="gmail-view-message-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 pr-8">{selectedMessage.subject}</h3>
            <div className="text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
              <p><strong className="text-slate-300">From:</strong> {selectedMessage.from}</p>
              <p><strong className="text-slate-300">To:</strong> {selectedMessage.to}</p>
              <p><strong className="text-slate-300">Date:</strong> {selectedMessage.date}</p>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl text-xs text-slate-200 leading-relaxed font-sans border border-slate-800">
              {loadingFullMsg ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Loading full email message body...</span>
                </div>
              ) : selectedMessage.body ? (
                <div dangerouslySetInnerHTML={{ __html: selectedMessage.body }} />
              ) : (
                <p className="text-slate-400 italic">{selectedMessage.snippet}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Close Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY Explicit User Confirmation Modal for Sending Emails */}
      {showConfirmModal && (
        <div id="gmail-confirm-send-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">Confirm Email Dispatch</h3>
            <p className="text-xs text-slate-400 mb-4">
              You are about to send an email using your connected Gmail account. Please confirm the details:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs mb-6">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recipient:</span>
                <span className="text-slate-200 font-semibold">{getResolvedRecipientEmail().email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subject:</span>
                <span className="text-slate-200">{subject}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                id="gmail-cancel-send-btn"
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={sending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                id="gmail-confirm-send-btn"
                type="button"
                onClick={handleConfirmSend}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sending via Gmail...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
