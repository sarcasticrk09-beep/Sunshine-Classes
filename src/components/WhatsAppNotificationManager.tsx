import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Edit3,
  User,
  Phone,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { NotificationLog, WhatsAppTemplate, WhatsAppMessageType } from '../types';

interface WhatsAppNotificationManagerProps {
  userToken: string;
  userRole: string;
}

export const WhatsAppNotificationManager: React.FC<WhatsAppNotificationManagerProps> = ({ userToken, userRole }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'send-direct'>('history');

  // Logs state
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Templates state
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<WhatsAppMessageType>('FEE_REMINDER');
  const [templateText, setTemplateText] = useState('');

  // Send Direct Modal/Form
  const [sendStudentId, setSendStudentId] = useState('');
  const [sendParentPhone, setSendParentPhone] = useState('');
  const [sendTemplateType, setSendTemplateType] = useState<WhatsAppMessageType>('FEE_REMINDER');
  const [sendCustomText, setSendCustomText] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendDueDate, setSendDueDate] = useState('');
  const [sendReceiptNo, setSendReceiptNo] = useState('');

  // Bulk Send State
  const [bulkRecipientsText, setBulkRecipientsText] = useState('');

  // Fetch History Logs
  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);
      if (filterTemplate) params.append('template', filterTemplate);

      const res = await fetch(`/api/notifications/whatsapp/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        setTotalPages(data.data.meta?.pages || 1);
        setTotalCount(data.data.meta?.total || 0);
      } else {
        setErrorMsg(data.message || 'Failed to fetch WhatsApp history');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching WhatsApp history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch WhatsApp Templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/notifications/templates', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTemplates(data.data);
        const match = data.data.find((t: WhatsAppTemplate) => t.type === selectedTemplateType);
        if (match) setTemplateText(match.templateText);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp templates:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, [page, filterStatus, filterTemplate]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  // Retry Failed Notifications
  const handleRetryFailed = async (notificationId?: string) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/notifications/whatsapp/retry-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ notificationId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Retry completed! Retried: ${data.data.retried}, Succeeded: ${data.data.succeeded}, Failed: ${data.data.failed}`);
        fetchHistory();
      } else {
        setErrorMsg(data.message || 'Failed to execute retry');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error triggering retry execution');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Pending Notifications
  const handleCancelPending = async (notificationId?: string) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/notifications/whatsapp/cancel-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ notificationId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully cancelled ${data.data.cancelled} pending notifications.`);
        fetchHistory();
      } else {
        setErrorMsg(data.message || 'Failed to cancel pending notifications');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cancelling pending notifications');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Template
  const handleSaveTemplate = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/notifications/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          type: selectedTemplateType,
          templateText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`WhatsApp Template for ${selectedTemplateType} updated successfully!`);
        fetchTemplates();
      } else {
        setErrorMsg(data.message || 'Failed to save template');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving template');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Direct Single WhatsApp Message
  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendParentPhone && !sendStudentId) {
      setErrorMsg('Please provide either Student ID or Parent Phone number.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/notifications/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          studentId: sendStudentId || undefined,
          parentPhone: sendParentPhone || undefined,
          template: sendTemplateType,
          messageOverride: sendCustomText || undefined,
          variables: {
            amount: sendAmount || undefined,
            dueDate: sendDueDate || undefined,
            receiptNumber: sendReceiptNo || undefined
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`WhatsApp message dispatched to ${sendParentPhone || sendStudentId}! Status: ${data.data.status}`);
        setSendStudentId('');
        setSendParentPhone('');
        setSendCustomText('');
        setSendAmount('');
        setSendDueDate('');
        setSendReceiptNo('');
        fetchHistory();
      } else {
        setErrorMsg(data.message || 'Failed to send WhatsApp message');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error dispatching WhatsApp message');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Bulk WhatsApp Messages
  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkRecipientsText.trim()) {
      setErrorMsg('Bulk recipients list cannot be empty.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Parse CSV / Line separated list: phone, studentId, amount
      const lines = bulkRecipientsText.trim().split('\n');
      const recipients = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          parentPhone: parts[0] || '',
          studentId: parts[1] || 'UNKNOWN',
          template: sendTemplateType,
          variables: {
            amount: parts[2] || undefined,
            dueDate: parts[3] || undefined
          }
        };
      }).filter(r => r.parentPhone.length > 0);

      if (recipients.length === 0) {
        setErrorMsg('No valid phone numbers parsed from bulk text.');
        setActionLoading(false);
        return;
      }

      const res = await fetch('/api/notifications/whatsapp/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ recipients })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Bulk Dispatch Completed! Total: ${data.data.total}, Sent: ${data.data.sent}, Failed: ${data.data.failed}`);
        setBulkRecipientsText('');
        fetchHistory();
      } else {
        setErrorMsg(data.message || 'Failed to process bulk dispatch');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing bulk dispatch');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Notification ID', 'Student ID', 'Student Name', 'Parent Phone', 'Template', 'Message ID', 'Status', 'Error', 'Sent Date'];
    const rows = logs.map(l => [
      l.notificationId,
      l.studentId,
      `"${l.studentName || ''}"`,
      l.parentPhone,
      l.template,
      l.messageId,
      l.status,
      `"${l.errorMessage || ''}"`,
      l.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WhatsApp_Notification_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const placeholders = [
    '{{studentName}}',
    '{{parentName}}',
    '{{class}}',
    '{{amount}}',
    '{{dueDate}}',
    '{{receiptNumber}}',
    '{{paymentMode}}'
  ];

  const insertPlaceholder = (ph: string) => {
    setTemplateText(prev => prev + ' ' + ph);
  };

  const renderTemplatePreview = (text: string, data: Record<string, any>) => {
    let result = text || '';
    result = result.replace(/\{\{studentName\}\}/g, data.studentName || 'Aarav Sharma');
    result = result.replace(/\{\{parentName\}\}/g, data.parentName || 'Ramesh Sharma');
    result = result.replace(/\{\{class\}\}/g, data.class || 'Class 10-A');
    result = result.replace(/\{\{className\}\}/g, data.class || 'Class 10-A');
    result = result.replace(/\{\{amount\}\}/g, String(data.amount || 3500));
    result = result.replace(/\{\{dueDate\}\}/g, data.dueDate || '2026-08-05');
    result = result.replace(/\{\{receiptNumber\}\}/g, data.receiptNumber || 'RCP-2026-000101');
    result = result.replace(/\{\{paymentMode\}\}/g, data.paymentMode || 'UPI');
    return result;
  };

  const getStatusBadge = (status: string) => {

    switch (status) {
      case 'DELIVERED':
      case 'READ':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</span>;
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" /> SENT</span>;
      case 'QUEUED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> QUEUED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Meta WhatsApp Cloud Provider • Sunshine ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">WhatsApp Cloud API Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automated notification dispatch, delivery tracking, retries & webhook audit logs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-retry-failed-whatsapp"
            onClick={() => handleRetryFailed()}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Retry Failed</span>
          </button>

          <button
            id="btn-cancel-pending-whatsapp"
            onClick={() => handleCancelPending()}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all border border-slate-200"
          >
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Cancel Pending</span>
          </button>

          <button
            id="btn-export-csv-whatsapp"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div id="alert-whatsapp-error" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div id="alert-whatsapp-success" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          id="tab-whatsapp-history"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notification Logs ({totalCount})</span>
        </button>

        <button
          id="tab-whatsapp-send-direct"
          onClick={() => setActiveTab('send-direct')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'send-direct'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Send Direct / Bulk Message</span>
        </button>

        <button
          id="tab-whatsapp-templates"
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>WhatsApp Templates</span>
        </button>
      </div>

      {/* TAB 1: HISTORY LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-search-whatsapp-history"
                type="text"
                placeholder="Search Phone, Student, Notification ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                id="select-filter-whatsapp-status"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="py-2 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="SENT">SENT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="READ">READ</option>
                <option value="FAILED">FAILED</option>
              </select>

              <select
                id="select-filter-whatsapp-template"
                value={filterTemplate}
                onChange={e => { setFilterTemplate(e.target.value); setPage(1); }}
                className="py-2 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="">All Templates</option>
                <option value="FEE_REMINDER">FEE_REMINDER</option>
                <option value="PAYMENT_CONFIRMATION">PAYMENT_CONFIRMATION</option>
                <option value="ADMISSION_CONFIRMATION">ADMISSION_CONFIRMATION</option>
                <option value="RECEIPT_GENERATED">RECEIPT_GENERATED</option>
                <option value="GENERAL_ANNOUNCEMENT">GENERAL_ANNOUNCEMENT</option>
                <option value="CUSTOM_MESSAGE">CUSTOM_MESSAGE</option>
              </select>

              <button
                id="btn-reset-whatsapp-filters"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('');
                  setFilterTemplate('');
                  setPage(1);
                }}
                className="py-2 px-3 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                Loading WhatsApp notification logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No WhatsApp Logs Found</p>
                <p className="text-xs text-slate-400 mt-1">Send a single or bulk message to populate delivery logs</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">ID / Time</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Parent Phone</th>
                      <th className="px-4 py-3">Template</th>
                      <th className="px-4 py-3">Message Body</th>
                      <th className="px-4 py-3">Message ID (Meta)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map(log => (
                      <tr key={log.notificationId || log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs font-semibold text-slate-700">{log.notificationId}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{log.studentName || 'Student'}</div>
                          <div className="text-xs text-slate-400 font-mono">ID: {log.studentId}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800">{log.parentPhone}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {log.template}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-600" title={log.messageText}>
                          {log.messageText || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                          {log.messageId}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(log.status)}
                          {log.errorMessage && (
                            <div className="text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={log.errorMessage}>
                              Err: {log.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(log.status === 'FAILED' || log.status === 'ERROR') && (
                            <button
                              id={`btn-retry-log-${log.notificationId}`}
                              onClick={() => handleRetryFailed(log.notificationId)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Retry
                            </button>
                          )}
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
                  id="btn-prev-page-whatsapp"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  id="btn-next-page-whatsapp"
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

      {/* TAB 2: SEND DIRECT / BULK */}
      {activeTab === 'send-direct' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Single Message Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Send Direct Single WhatsApp Message</h2>
              <p className="text-xs text-slate-500">Dispatch individual template or custom message instantly.</p>
            </div>

            <form onSubmit={handleSendSingle} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-send-whatsapp-phone"
                    type="text"
                    placeholder="e.g. 9876543210 (+91 default)"
                    value={sendParentPhone}
                    onChange={e => setSendParentPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student ID (Optional)</label>
                <input
                  id="input-send-whatsapp-student-id"
                  type="text"
                  placeholder="e.g. STU-1001"
                  value={sendStudentId}
                  onChange={e => setSendStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Type / Template</label>
                <select
                  id="select-send-whatsapp-template-type"
                  value={sendTemplateType}
                  onChange={e => setSendTemplateType(e.target.value as WhatsAppMessageType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="FEE_REMINDER">FEE_REMINDER</option>
                  <option value="PAYMENT_CONFIRMATION">PAYMENT_CONFIRMATION</option>
                  <option value="ADMISSION_CONFIRMATION">ADMISSION_CONFIRMATION</option>
                  <option value="RECEIPT_GENERATED">RECEIPT_GENERATED</option>
                  <option value="GENERAL_ANNOUNCEMENT">GENERAL_ANNOUNCEMENT</option>
                  <option value="CUSTOM_MESSAGE">CUSTOM_MESSAGE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    id="input-send-whatsapp-amount"
                    type="number"
                    placeholder="e.g. 3500"
                    value={sendAmount}
                    onChange={e => setSendAmount(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    id="input-send-whatsapp-due-date"
                    type="date"
                    value={sendDueDate}
                    onChange={e => setSendDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Message Text Override (Optional)</label>
                <textarea
                  id="textarea-send-whatsapp-custom-text"
                  rows={3}
                  placeholder="Leave empty to use template default text..."
                  value={sendCustomText}
                  onChange={e => setSendCustomText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                />
              </div>

              <button
                id="btn-submit-send-whatsapp-single"
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Dispatching...' : 'Send WhatsApp Message'}
              </button>
            </form>
          </div>

          {/* Bulk Message Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Send Bulk WhatsApp Messages</h2>
              <p className="text-xs text-slate-500">Rate-limited batch sender. Format: phone, studentId, amount, dueDate</p>
            </div>

            <form onSubmit={handleSendBulk} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CSV / Multiline Recipients</label>
                <p className="text-[11px] text-slate-400 mb-2 font-mono">Format: 9876543210, STU-1001, 3500, 2026-08-05</p>
                <textarea
                  id="textarea-send-whatsapp-bulk"
                  rows={8}
                  placeholder={`9876543210, STU-1001, 3500, 2026-08-05\n9812345678, STU-1002, 4200, 2026-08-05`}
                  value={bulkRecipientsText}
                  onChange={e => setBulkRecipientsText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono bg-slate-50"
                />
              </div>

              <button
                id="btn-submit-send-whatsapp-bulk"
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Processing Bulk Dispatch...' : 'Dispatch Bulk Batch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES MANAGER */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Meta WhatsApp Notification Template Manager</h2>
            <p className="text-xs text-slate-500">Configure standard template texts with dynamic runtime placeholders.</p>
          </div>

          {/* Template Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {(['FEE_REMINDER', 'PAYMENT_CONFIRMATION', 'ADMISSION_CONFIRMATION', 'RECEIPT_GENERATED', 'GENERAL_ANNOUNCEMENT', 'CUSTOM_MESSAGE'] as WhatsAppMessageType[]).map(tType => {
              const isActive = selectedTemplateType === tType;
              return (
                <button
                  key={tType}
                  id={`btn-whatsapp-template-type-${tType}`}
                  onClick={() => {
                    setSelectedTemplateType(tType);
                    const found = templates.find(t => t.type === tType);
                    if (found) setTemplateText(found.templateText);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
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
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Insert Dynamic Variables:</label>
            <div className="flex flex-wrap gap-2">
              {placeholders.map(ph => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => insertPlaceholder(ph)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  + {ph}
                </button>
              ))}
            </div>
          </div>

          {/* Template Textarea */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Template Body ({selectedTemplateType})
            </label>
            <textarea
              id="textarea-whatsapp-template-body"
              rows={5}
              value={templateText}
              onChange={e => setTemplateText(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-slate-50"
            />
          </div>

          {/* Live Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Message Sample Preview</span>
            </div>
            <div className="text-sm text-slate-800 leading-relaxed font-sans bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
              {renderTemplatePreview(templateText, {
                studentName: 'Aarav Sharma',
                parentName: 'Ramesh Sharma',
                class: 'Class 10-A',
                amount: 3500,
                dueDate: '2026-08-05',
                receiptNumber: 'RCP-2026-000101',
                paymentMode: 'UPI'
              })}
            </div>

          </div>

          <button
            id="btn-save-whatsapp-template"
            onClick={handleSaveTemplate}
            disabled={actionLoading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
          >
            Save WhatsApp Template
          </button>
        </div>
      )}
    </div>
  );
};
