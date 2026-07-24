import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  User,
  Plus,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { FeeReminder, ReminderTemplate } from '../types';

interface FeeReminderManagerProps {
  userToken: string;
  userRole: string;
}

export const FeeReminderManager: React.FC<FeeReminderManagerProps> = ({ userToken, userRole }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'templates' | 'student-history'>('queue');

  // Stats State
  const [stats, setStats] = useState({
    upcomingToday: 0,
    dueToday: 0,
    overdue: 0,
    sentToday: 0,
    failed: 0,
    manualReminders: 0,
    totalReminders: 0
  });

  // Reminders List & Filters
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Templates State
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'FINAL_NOTICE'>('UPCOMING');
  const [templateText, setTemplateText] = useState('');

  // Manual Send Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualFeeRecordId, setManualFeeRecordId] = useState('');
  const [manualType, setManualType] = useState<'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'FINAL_NOTICE'>('UPCOMING');
  const [manualChannel, setManualChannel] = useState<'MANUAL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH'>('MANUAL');
  const [manualMessage, setManualMessage] = useState('');

  // Student History Lookup
  const [lookupStudentId, setLookupStudentId] = useState('');
  const [studentHistory, setStudentHistory] = useState<FeeReminder[]>([]);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/reminders/dashboard', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reminder stats:', err);
    }
  };

  // Fetch Reminders List
  const fetchReminders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (searchQuery) params.append('search', searchQuery);
      if (filterClass) params.append('className', filterClass);
      if (filterMonth) params.append('month', filterMonth);
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('reminderType', filterType);

      const res = await fetch(`/api/reminders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setReminders(data.data.reminders || []);
        setTotalPages(data.data.meta?.pages || 1);
        setTotalCount(data.data.meta?.total || 0);
      } else {
        setErrorMsg(data.message || 'Failed to fetch reminders');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching reminders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/reminders/templates', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTemplates(data.data);
        const current = data.data.find((t: ReminderTemplate) => t.templateType === selectedTemplateType);
        if (current) setTemplateText(current.templateText);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReminders();
    fetchTemplates();
  }, [page, filterClass, filterMonth, filterStatus, filterType]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReminders();
  };

  // Run Automated Scheduler Scan & Send
  const handleRunScheduler = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/reminders/send-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success) {
        const { feesScanned, remindersGenerated, remindersSkipped } = data.data;
        setSuccessMsg(`Scheduler Run Completed! Scanned: ${feesScanned}, Generated & Sent: ${remindersGenerated}, Skipped: ${remindersSkipped}`);
        fetchStats();
        fetchReminders();
      } else {
        setErrorMsg(data.message || 'Failed to run scheduler');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing scheduler');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Template Edit
  const handleSaveTemplate = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/reminders/template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          templateType: selectedTemplateType,
          templateText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Template for ${selectedTemplateType} updated successfully!`);
        fetchTemplates();
      } else {
        setErrorMsg(data.message || 'Failed to update template');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating template');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manual Send Submission
  const handleSendManualReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      setErrorMsg('Student ID is required for manual reminder.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          studentId: manualStudentId,
          feeRecordId: manualFeeRecordId || undefined,
          reminderType: manualType,
          channel: manualChannel,
          messageOverride: manualMessage || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Manual ${manualType} reminder sent successfully to Student ID ${manualStudentId}!`);
        setIsManualModalOpen(false);
        setManualStudentId('');
        setManualFeeRecordId('');
        setManualMessage('');
        fetchStats();
        fetchReminders();
      } else {
        setErrorMsg(data.message || 'Failed to send manual reminder');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending manual reminder');
    } finally {
      setActionLoading(false);
    }
  };

  // Lookup Student History
  const handleLookupHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupStudentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reminders/student/${lookupStudentId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudentHistory(data.data || []);
      } else {
        setErrorMsg(data.message || 'Student reminders not found');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching student history');
    } finally {
      setLoading(false);
    }
  };

  // Placeholders for Template Editor
  const placeholders = [
    '{{studentName}}',
    '{{rollNumber}}',
    '{{amount}}',
    '{{dueDate}}',
    '{{class}}',
    '{{billingMonth}}',
    '{{receiptNumber}}'
  ];

  const insertPlaceholder = (ph: string) => {
    setTemplateText(prev => prev + ' ' + ph);
  };

  const renderTemplatePreview = (text: string, data: any) => {
    let result = text || '';
    result = result.replace(/\{\{studentName\}\}/g, data.studentName || 'Student');
    result = result.replace(/\{\{rollNumber\}\}/g, data.rollNumber || 'N/A');
    result = result.replace(/\{\{amount\}\}/g, String(data.amount || 0));
    result = result.replace(/\{\{dueDate\}\}/g, data.dueDate || 'N/A');
    result = result.replace(/\{\{class\}\}/g, data.className || 'N/A');
    result = result.replace(/\{\{className\}\}/g, data.className || 'N/A');
    result = result.replace(/\{\{billingMonth\}\}/g, data.billingMonth || 'N/A');
    result = result.replace(/\{\{receiptNumber\}\}/g, data.receiptNumber || 'N/A');
    return result;
  };

  // Helper render badge for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> SENT</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> PENDING</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"><XCircle className="w-3 h-3 mr-1" /> CANCELLED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><AlertTriangle className="w-3 h-3 mr-1" /> {status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'UPCOMING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Upcoming</span>;
      case 'DUE_TODAY':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">Due Today</span>;
      case 'OVERDUE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Overdue</span>;
      case 'FINAL_NOTICE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">Final Notice</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Bell className="w-4 h-4" />
            <span>Sunshine ERP • Module FM-005</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Fee Reminders & Notification Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automated stage-based scheduling, notification tracking, and template manager</p>
        </div>

        <div className="flex items-center gap-3">
          {userRole !== 'TEACHER' && (
            <>
              <button
                id="btn-run-scheduler"
                onClick={handleRunScheduler}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Run Scheduler Scan</span>
              </button>

              <button
                id="btn-open-manual-modal"
                onClick={() => setIsManualModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Send Manual Reminder</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div id="alert-error" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div id="alert-success" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div id="card-upcoming-today" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.upcomingToday}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Upcoming Today</div>
        </div>

        <div id="card-due-today" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Due</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.dueToday}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Due Today</div>
        </div>

        <div id="card-overdue" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alert</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.overdue}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Overdue Count</div>
        </div>

        <div id="card-sent-today" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <Send className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Logs</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.sentToday}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Sent Today</div>
        </div>

        <div id="card-failed" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Errors</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.failed}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Failed</div>
        </div>

        <div id="card-manual" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <User className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Direct</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.manualReminders}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Manual Direct</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          id="tab-queue"
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reminder Queue & History ({totalCount})</span>
        </button>

        <button
          id="tab-templates"
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Template Editor</span>
        </button>

        <button
          id="tab-student-history"
          onClick={() => setActiveTab('student-history')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'student-history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Student History Lookup</span>
        </button>
      </div>

      {/* TAB 1: REMINDER QUEUE & HISTORY */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-search-reminders"
                type="text"
                placeholder="Search Student Name or Roll No..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                id="select-filter-type"
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setPage(1); }}
                className="py-2 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="">All Types</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="DUE_TODAY">Due Today</option>
                <option value="OVERDUE">Overdue</option>
                <option value="FINAL_NOTICE">Final Notice</option>
              </select>

              <select
                id="select-filter-status"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="py-2 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <input
                id="input-filter-class"
                type="text"
                placeholder="Filter Class..."
                value={filterClass}
                onChange={e => { setFilterClass(e.target.value); setPage(1); }}
                className="py-2 px-3 text-sm border border-slate-200 rounded-lg w-28"
              />

              <button
                id="btn-reset-filters"
                onClick={() => {
                  setSearchQuery('');
                  setFilterClass('');
                  setFilterMonth('');
                  setFilterStatus('');
                  setFilterType('');
                  setPage(1);
                }}
                className="py-2 px-3 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Reminders Found</p>
                <p className="text-xs text-slate-400 mt-1">Run scheduler scan or trigger a manual reminder</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Reminder ID</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Stage / Type</th>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reminders.map(r => (
                      <tr key={r.reminderId || r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 font-semibold">{r.reminderId}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{r.studentName}</div>
                          <div className="text-xs text-slate-400 font-mono">Roll: {r.rollNumber || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{r.className}</td>
                        <td className="px-4 py-3 text-slate-600">{r.billingMonth}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">₹{r.amount}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.dueDate}</td>
                        <td className="px-4 py-3">{getTypeBadge(r.reminderType)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {r.channel}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                          {r.sentAt ? new Date(r.sentAt).toLocaleString('en-IN') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> ({totalCount} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-prev-page"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  id="btn-next-page"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 font-medium flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE EDITOR */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notification Template Editor</h2>
            <p className="text-xs text-slate-500">Edit dynamic reminder text for automatic and manual messages with placeholders.</p>
          </div>

          {userRole === 'TEACHER' || userRole === 'RECEPTIONIST' ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              Note: Template editing is restricted to Admin and Super Admin roles. You have read-only view.
            </div>
          ) : null}

          {/* Template Selector Pills */}
          <div className="flex flex-wrap gap-3">
            {(['UPCOMING', 'DUE_TODAY', 'OVERDUE', 'FINAL_NOTICE'] as const).map(tType => {
              const isActive = selectedTemplateType === tType;
              return (
                <button
                  key={tType}
                  id={`btn-template-type-${tType}`}
                  onClick={() => {
                    setSelectedTemplateType(tType);
                    const found = templates.find(t => t.templateType === tType);
                    if (found) setTemplateText(found.templateText);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tType.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          {/* Placeholder Insert Pills */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Insert Dynamic Placeholders:</label>
            <div className="flex flex-wrap gap-2">
              {placeholders.map(ph => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => insertPlaceholder(ph)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  + {ph}
                </button>
              ))}
            </div>
          </div>

          {/* Template Textarea */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Template Text ({selectedTemplateType})
            </label>
            <textarea
              id="textarea-template-text"
              rows={5}
              value={templateText}
              disabled={userRole === 'TEACHER' || userRole === 'RECEPTIONIST'}
              onChange={e => setTemplateText(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-slate-50"
            />
          </div>

          {/* Live Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Live Sample Preview</span>
            </div>
            <div className="text-sm text-slate-800 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200">
              {renderTemplatePreview(templateText, {
                studentName: 'Aarav Sharma',
                rollNumber: 'SC-2026-042',
                amount: 3500,
                dueDate: '2026-08-05',
                className: 'Class 10-A',
                billingMonth: 'August 2026',
                receiptNumber: 'RCP-2026-000101'
              })}
            </div>
          </div>

          {userRole !== 'TEACHER' && userRole !== 'RECEPTIONIST' && (
            <button
              id="btn-save-template"
              onClick={handleSaveTemplate}
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
            >
              Save Template Changes
            </button>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT HISTORY LOOKUP */}
      {activeTab === 'student-history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Student Reminder Audit History</h2>
            <p className="text-xs text-slate-500">Search specific student ID to audit all sent and pending reminders.</p>
          </div>

          <form onSubmit={handleLookupHistory} className="flex gap-3 max-w-md">
            <input
              id="input-lookup-student-id"
              type="text"
              placeholder="Enter Student ID (e.g. STU-1001)..."
              value={lookupStudentId}
              onChange={e => setLookupStudentId(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              id="btn-lookup-submit"
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors"
            >
              Lookup Logs
            </button>
          </form>

          {studentHistory.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">
                Reminder Audit Logs for {studentHistory[0].studentName} ({studentHistory.length} records)
              </h3>
              <div className="space-y-2">
                {studentHistory.map(rem => (
                  <div key={rem.reminderId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-700">{rem.reminderId}</span>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(rem.reminderType)}
                        {getStatusBadge(rem.status)}
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                      {rem.message || 'No message logged'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Fee Record: {rem.feeRecordId} | Amount: ₹{rem.amount}</span>
                      <span>{new Date(rem.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL REMINDER MODAL */}
      {isManualModalOpen && (
        <div id="modal-manual-reminder" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Send Manual Fee Reminder</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSendManualReminder} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student ID *</label>
                <input
                  id="input-manual-student-id"
                  type="text"
                  required
                  placeholder="e.g. STU-1001"
                  value={manualStudentId}
                  onChange={e => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee Record ID (Optional)</label>
                <input
                  id="input-manual-fee-id"
                  type="text"
                  placeholder="Leave blank to auto-detect pending fee"
                  value={manualFeeRecordId}
                  onChange={e => setManualFeeRecordId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reminder Stage</label>
                  <select
                    id="select-manual-stage"
                    value={manualType}
                    onChange={e => setManualType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="DUE_TODAY">DUE_TODAY</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="FINAL_NOTICE">FINAL_NOTICE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Channel</label>
                  <select
                    id="select-manual-channel"
                    value={manualChannel}
                    onChange={e => setManualChannel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="MANUAL">MANUAL</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="EMAIL">EMAIL</option>
                    <option value="SMS">SMS</option>
                    <option value="PUSH">PUSH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Message Override (Optional)</label>
                <textarea
                  id="textarea-manual-message"
                  rows={3}
                  placeholder="Leave blank to use default template..."
                  value={manualMessage}
                  onChange={e => setManualMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  id="btn-cancel-manual-modal"
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-manual-modal"
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
