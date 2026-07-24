import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Percent,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  X,
  CreditCard,
  ArrowUpDown,
  PieChart,
  BarChart3,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';

interface FinanceDashboardProps {
  currentUser?: {
    id: string;
    username: string;
    role: string;
  };
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ currentUser }) => {
  const isTeacher = currentUser?.role === 'TEACHER';

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'collections' | 'class-wise' | 'students' | 'overdue' | 'concessions' | 'payment-modes' | 'receipts'
  >('overview');

  // Filters State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [academicSession, setAcademicSession] = useState<string>('2026-2027');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Class Report Sort State
  const [classSortBy, setClassSortBy] = useState<'highest_collection' | 'lowest_collection' | 'pending_amount'>('highest_collection');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);

  // Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>({ dailyTrend: [], monthlyTrend: [] });
  const [classReport, setClassReport] = useState<any[]>([]);
  const [studentReport, setStudentReport] = useState<any>({ data: [], total: 0, totalPages: 1 });
  const [overdueReport, setOverdueReport] = useState<any[]>([]);
  const [concessionReport, setConcessionReport] = useState<any[]>([]);
  const [paymentModeReport, setPaymentModeReport] = useState<any>({ grandTotal: 0, breakdown: [] });
  const [receiptReport, setReceiptReport] = useState<any>({ data: [], total: 0, totalPages: 1 });

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Fetch Dashboard Summary Metrics
  const fetchDashboardMetrics = async () => {
    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
        academicSession,
        classId: classFilter
      }).toString();
      const res = await fetch(`/api/finance/dashboard?${query}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics || {});
      }
    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
    }
  };

  // Fetch Tab Specific Data
  const fetchTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview' || activeTab === 'collections') {
        const query = new URLSearchParams({
          startDate,
          endDate,
          classId: classFilter,
          paymentMode: paymentModeFilter
        }).toString();
        const res = await fetch(`/api/finance/reports/collections?${query}`);
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.analytics || { dailyTrend: [], monthlyTrend: [] });
        }
      }

      if (activeTab === 'overview' || activeTab === 'class-wise') {
        const query = new URLSearchParams({
          sortBy: classSortBy
        }).toString();
        const res = await fetch(`/api/finance/reports/class-wise?${query}`);
        const data = await res.json();
        if (data.success) {
          setClassReport(data.report || []);
        }
      }

      if (activeTab === 'students') {
        const query = new URLSearchParams({
          search: searchTerm,
          classId: classFilter,
          status: statusFilter,
          page: page.toString(),
          limit: limit.toString()
        }).toString();
        const res = await fetch(`/api/finance/reports/students?${query}`);
        const data = await res.json();
        if (data.success) {
          setStudentReport({
            data: data.data || [],
            total: data.total || 0,
            totalPages: data.totalPages || 1
          });
        }
      }

      if (activeTab === 'overdue') {
        const query = new URLSearchParams({
          classId: classFilter
        }).toString();
        const res = await fetch(`/api/finance/reports/overdue?${query}`);
        const data = await res.json();
        if (data.success) {
          setOverdueReport(data.report || []);
        }
      }

      if (activeTab === 'concessions') {
        const query = new URLSearchParams({
          classId: classFilter
        }).toString();
        const res = await fetch(`/api/finance/reports/concessions?${query}`);
        const data = await res.json();
        if (data.success) {
          setConcessionReport(data.report || []);
        }
      }

      if (activeTab === 'overview' || activeTab === 'payment-modes') {
        const res = await fetch(`/api/finance/reports/payment-modes`);
        const data = await res.json();
        if (data.success) {
          setPaymentModeReport(data.report || { grandTotal: 0, breakdown: [] });
        }
      }

      if (activeTab === 'receipts') {
        const query = new URLSearchParams({
          search: searchTerm,
          paymentMode: paymentModeFilter,
          status: statusFilter,
          startDate,
          endDate,
          page: page.toString(),
          limit: limit.toString()
        }).toString();
        const res = await fetch(`/api/finance/reports/receipts?${query}`);
        const data = await res.json();
        if (data.success) {
          setReceiptReport({
            data: data.data || [],
            total: data.total || 0,
            totalPages: data.totalPages || 1
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching tab data:', err);
      setError('Failed to load financial report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isTeacher) {
      fetchDashboardMetrics();
      fetchTabData();
    }
  }, [activeTab, classFilter, paymentModeFilter, statusFilter, academicSession, classSortBy, page]);

  // Debounced search trigger for Student and Receipt reports
  useEffect(() => {
    if (activeTab === 'students' || activeTab === 'receipts') {
      const timer = setTimeout(() => {
        setPage(1);
        fetchTabData();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Reset Filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setAcademicSession('2026-2027');
    setClassFilter('ALL');
    setPaymentModeFilter('ALL');
    setStatusFilter('ALL');
    setSearchTerm('');
    setPage(1);
  };

  // Audit Log Export Trigger
  const logExport = async (reportName: string, exportType: string) => {
    try {
      await fetch('/api/finance/audit/log-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName,
          exportType,
          filtersUsed: {
            startDate,
            endDate,
            academicSession,
            classFilter,
            paymentModeFilter,
            statusFilter
          }
        })
      });
    } catch (err) {
      console.warn('Failed to audit log export:', err);
    }
  };

  // Excel Export Handler (.xlsx)
  const handleExportExcel = (reportName: string, dataArray: any[]) => {
    if (!dataArray || dataArray.length === 0) {
      alert('No data available to export.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportName);
    const fileName = `${reportName}_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    logExport(reportName, 'EXCEL (.xlsx)');
  };

  // CSV Export Handler
  const handleExportCSV = (reportName: string, dataArray: any[]) => {
    if (!dataArray || dataArray.length === 0) {
      alert('No data available to export.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportName}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logExport(reportName, 'CSV');
  };

  // PDF / Print Handler
  const handlePrintPDF = (reportName: string) => {
    window.print();
    logExport(reportName, 'PDF/PRINT');
  };

  // Recharts Colors
  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  if (isTeacher) {
    return (
      <div id="finance-dashboard-access-denied" className="p-8 max-w-4xl mx-auto my-12 bg-white rounded-2xl border border-rose-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 font-display">Access Denied</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Teachers do not have access to the Finance Dashboard & Reports module. Please contact your system administrator if you require authorization.
        </p>
      </div>
    );
  }

  return (
    <div id="finance-dashboard-container" className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/80">
              FM-007
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-800">Finance Dashboard & Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time financial analytics, revenue trends, class reports, overdue tracking, and audit exports.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-finance-data"
            onClick={() => {
              fetchDashboardMetrics();
              fetchTabData();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global Filters Control Bar */}
      <div id="finance-filters-bar" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Global Financial Filters
          </div>
          <button
            id="btn-reset-finance-filters"
            onClick={handleResetFilters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Start Date</label>
            <input
              id="input-filter-start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">End Date</label>
            <input
              id="input-filter-end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
            />
          </div>

          {/* Academic Session */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Academic Session</label>
            <select
              id="select-filter-academic-session"
              value={academicSession}
              onChange={e => setAcademicSession(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <option value="2025-2026">2025 - 2026</option>
              <option value="2026-2027">2026 - 2027</option>
              <option value="2027-2028">2027 - 2028</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Class</label>
            <select
              id="select-filter-class"
              value={classFilter}
              onChange={e => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Payment Mode</label>
            <select
              id="select-filter-payment-mode"
              value={paymentModeFilter}
              onChange={e => {
                setPaymentModeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Fee Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Fee Status</label>
            <select
              id="select-filter-fee-status"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* DASHBOARD SUMMARY CARDS (Top KPI Grid) */}
      <div id="finance-summary-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* Total Expected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expected (Month)</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-slate-800">
            ₹{(metrics.totalExpected || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Current Billing Cycle</p>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-emerald-700">
            ₹{(metrics.totalCollected || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">
            Collection Rate: {metrics.collectionPercentage || 0}%
          </p>
        </div>

        {/* Pending Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Collection</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-amber-600">
            ₹{(metrics.pendingCollection || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Outstanding Balance</p>
        </div>

        {/* Today's Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Collection</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-slate-800">
            ₹{(metrics.todayCollection || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Today's Transactions</p>
        </div>

        {/* Yesterday's Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Yesterday's Collection</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-slate-800">
            ₹{(metrics.yesterdayCollection || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Previous Day Record</p>
        </div>

        {/* This Week Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Week</span>
            <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-slate-800">
            ₹{(metrics.thisWeekCollection || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Rolling 7 Days</p>
        </div>

        {/* Students Paid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students Paid</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-slate-800">
            {metrics.studentsPaid || 0}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Clear Status</p>
        </div>

        {/* Overdue Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Students</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-rose-600">
            {metrics.overdueStudents || 0}
          </div>
          <p className="text-[10px] text-rose-500 font-semibold mt-1">Needs Follow-Up</p>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'overview', label: 'Overview & Charts', icon: PieChart },
            { id: 'collections', label: 'Collections Analytics', icon: TrendingUp },
            { id: 'class-wise', label: 'Class Reports', icon: BarChart3 },
            { id: 'students', label: 'Student Reports', icon: Users },
            { id: 'overdue', label: 'Overdue Report', icon: AlertCircle },
            { id: 'concessions', label: 'Concessions Report', icon: Percent },
            { id: 'payment-modes', label: 'Payment Mode Report', icon: CreditCard },
            { id: 'receipts', label: 'Receipts Report', icon: FileCheck }
          ].map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW & CHARTS TAB */}
      {activeTab === 'overview' && (
        <div id="finance-tab-overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Collection Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">Collection Trend (Daily)</h3>
                  <p className="text-[11px] text-slate-400">Daily revenue performance over time</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded">
                  Daily
                </span>
              </div>
              <div className="h-64">
                {analytics.dailyTrend && analytics.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyTrend}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <Tooltip formatter={(value: any) => [`₹${value}`, 'Amount']} />
                      <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No daily transaction data recorded for this filter.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Payment Mode Share */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">Payment Mode Distribution</h3>
                  <p className="text-[11px] text-slate-400">Breakdown of collections by channel</p>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                {paymentModeReport.breakdown && paymentModeReport.breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={paymentModeReport.breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="totalAmount"
                        nameKey="paymentMode"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {paymentModeReport.breakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`₹${val}`, 'Collected']} />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">No payment mode breakdown available.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Class-wise Collections */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">Class-Wise Collection</h3>
                  <p className="text-[11px] text-slate-400">Comparison of expected vs collected fees</p>
                </div>
              </div>
              <div className="h-64">
                {classReport && classReport.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classReport.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="className" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <Tooltip formatter={(val: any) => [`₹${val}`, 'Amount']} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="expectedFees" name="Expected" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collectedFees" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No class fee statistics loaded.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Pending vs Paid Ratio */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">Pending vs Paid Overview</h3>
                  <p className="text-[11px] text-slate-400">Proportion of settled vs outstanding balance</p>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={[
                        { name: 'Collected', value: metrics.totalCollected || 0 },
                        { name: 'Pending', value: metrics.pendingCollection || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip formatter={(val: any) => [`₹${val}`, 'Amount']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COLLECTIONS ANALYTICS TAB */}
      {activeTab === 'collections' && (
        <div id="finance-tab-collections" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Collection Analytics</h3>
              <p className="text-xs text-slate-500">
                Detailed collection trends aggregated by daily and monthly revenue intervals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-export-collections-excel"
                onClick={() => handleExportExcel('Collections_Report', analytics.dailyTrend)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                id="btn-export-collections-csv"
                onClick={() => handleExportCSV('Collections_Report', analytics.dailyTrend)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Monthly Collection Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                      analytics.monthlyTrend.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{m.month}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">₹{m.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-slate-400">No monthly data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Daily Collection Breakdown</h4>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Collected Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.dailyTrend && analytics.dailyTrend.length > 0 ? (
                      analytics.dailyTrend.map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-medium text-slate-700">{d.date}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-600">₹{d.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-slate-400">No daily records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CLASS REPORTS TAB */}
      {activeTab === 'class-wise' && (
        <div id="finance-tab-class-wise" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Class-Wise Financial Report</h3>
              <p className="text-xs text-slate-500">
                Detailed collection performance, expected vs actual revenue, and pending amounts by class.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                id="select-sort-class-report"
                value={classSortBy}
                onChange={e => setClassSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium cursor-pointer"
              >
                <option value="highest_collection">Sort: Highest Collection</option>
                <option value="lowest_collection">Sort: Lowest Collection</option>
                <option value="pending_amount">Sort: Highest Pending</option>
              </select>

              <button
                id="btn-export-class-excel"
                onClick={() => handleExportExcel('Class_Wise_Report', classReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                id="btn-export-class-csv"
                onClick={() => handleExportCSV('Class_Wise_Report', classReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Class / Batch</th>
                  <th className="py-3 px-3.5 text-center">Total Students</th>
                  <th className="py-3 px-3.5 text-right">Expected Fees</th>
                  <th className="py-3 px-3.5 text-right">Collected Fees</th>
                  <th className="py-3 px-3.5 text-right">Pending Fees</th>
                  <th className="py-3 px-3.5 text-center">Collection %</th>
                  <th className="py-3 px-3.5 text-right">Concessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classReport.length > 0 ? (
                  classReport.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3.5 font-bold text-slate-800">{c.className}</td>
                      <td className="py-3 px-3.5 text-center font-semibold text-slate-600">{c.totalStudents}</td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-700">₹{(c.expectedFees || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-600">₹{(c.collectedFees || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-amber-600">₹{(c.pendingFees || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                          c.collectionPercentage >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {c.collectionPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-500">₹{(c.concessionAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">No class records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. STUDENT REPORTS TAB */}
      {activeTab === 'students' && (
        <div id="finance-tab-students" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Student Financial Reports</h3>
              <p className="text-xs text-slate-500">Search and audit individual student payment histories and outstanding dues.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-export-students-excel"
                onClick={() => handleExportExcel('Student_Report', studentReport.data)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                id="btn-export-students-csv"
                onClick={() => handleExportCSV('Student_Report', studentReport.data)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-student-reports"
              type="text"
              placeholder="Search by student name, roll number, admission number, or class..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Student</th>
                  <th className="py-3 px-3.5">Admission / Roll</th>
                  <th className="py-3 px-3.5">Class</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Total Paid</th>
                  <th className="py-3 px-3.5 text-right">Outstanding</th>
                  <th className="py-3 px-3.5 text-center">Concession %</th>
                  <th className="py-3 px-3.5 text-right">Last Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentReport.data && studentReport.data.length > 0 ? (
                  studentReport.data.map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3.5 font-bold text-slate-800">{s.studentName}</td>
                      <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">{s.admissionNo} / {s.rollNo}</td>
                      <td className="py-3 px-3.5 font-medium">{s.class}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.currentMonthStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                          s.currentMonthStatus === 'OVERDUE' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {s.currentMonthStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-600">₹{(s.paidFee || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-amber-600">₹{(s.outstandingAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-center text-slate-600 font-medium">{s.concessionPercentage}%</td>
                      <td className="py-3 px-3.5 text-right text-slate-500 text-[11px]">{s.lastPaymentDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">No student financial records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {studentReport.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Showing Page {page} of {studentReport.totalPages} ({studentReport.total} total students)</span>
              <div className="flex items-center gap-1">
                <button
                  id="btn-prev-page-students"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="btn-next-page-students"
                  disabled={page >= studentReport.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. OVERDUE REPORT TAB */}
      {activeTab === 'overdue' && (
        <div id="finance-tab-overdue" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Overdue Dues Report</h3>
              <p className="text-xs text-slate-500">Track overdue students, days past due date, concessions applied, and last reminder dispatch date.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-export-overdue-excel"
                onClick={() => handleExportExcel('Overdue_Report', overdueReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                id="btn-export-overdue-csv"
                onClick={() => handleExportCSV('Overdue_Report', overdueReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Student Name</th>
                  <th className="py-3 px-3.5">Roll No</th>
                  <th className="py-3 px-3.5">Class</th>
                  <th className="py-3 px-3.5">Due Month</th>
                  <th className="py-3 px-3.5 text-right">Overdue Amount</th>
                  <th className="py-3 px-3.5 text-center">Days Overdue</th>
                  <th className="py-3 px-3.5">Concession</th>
                  <th className="py-3 px-3.5 text-right">Last Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueReport.length > 0 ? (
                  overdueReport.map((o: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3.5 font-bold text-slate-800">{o.studentName}</td>
                      <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">{o.rollNo}</td>
                      <td className="py-3 px-3.5 font-medium">{o.class}</td>
                      <td className="py-3 px-3.5 font-medium text-slate-700">{o.dueMonth}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-rose-600">₹{(o.dueAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100">
                          {o.daysOverdue} Days
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{o.concessionApplied}</td>
                      <td className="py-3 px-3.5 text-right text-slate-500 text-[11px]">{o.lastReminderSent}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">No overdue accounts found. Excellent collection record!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CONCESSIONS REPORT TAB */}
      {activeTab === 'concessions' && (
        <div id="finance-tab-concessions" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Student Concessions & Scholarships</h3>
              <p className="text-xs text-slate-500">
                Audit list of all active fee concessions, scholarship reasons, and effective discount periods.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-export-concessions-excel"
                onClick={() => handleExportExcel('Concessions_Report', concessionReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                id="btn-export-concessions-csv"
                onClick={() => handleExportCSV('Concessions_Report', concessionReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Student</th>
                  <th className="py-3 px-3.5">Class</th>
                  <th className="py-3 px-3.5 text-right">Original Fee</th>
                  <th className="py-3 px-3.5 text-center">Concession %</th>
                  <th className="py-3 px-3.5 text-right">Discount Amount</th>
                  <th className="py-3 px-3.5 text-right">Final Payable Fee</th>
                  <th className="py-3 px-3.5">Reason / Category</th>
                  <th className="py-3 px-3.5 text-right">Effective Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {concessionReport.length > 0 ? (
                  concessionReport.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3.5 font-bold text-slate-800">{c.studentName} ({c.rollNo})</td>
                      <td className="py-3 px-3.5 font-medium">{c.class}</td>
                      <td className="py-3 px-3.5 text-right line-through text-slate-400">₹{c.originalFee}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {c.concessionPercentage}% OFF
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-semibold text-emerald-600">-₹{c.concessionAmount}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-800">₹{c.finalFee}</td>
                      <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate">{c.reason}</td>
                      <td className="py-3 px-3.5 text-right text-slate-500 text-[11px]">{c.effectivePeriod}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">No concession records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. PAYMENT MODES REPORT TAB */}
      {activeTab === 'payment-modes' && (
        <div id="finance-tab-payment-modes" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Payment Mode Breakdown</h3>
              <p className="text-xs text-slate-500">Categorized analysis of transactions by payment instrument.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-export-modes-excel"
                onClick={() => handleExportExcel('Payment_Modes_Report', paymentModeReport.breakdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Payment Mode</th>
                  <th className="py-3 px-3.5 text-center">Number of Transactions</th>
                  <th className="py-3 px-3.5 text-right">Total Collected Amount</th>
                  <th className="py-3 px-3.5 text-center">% Share of Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentModeReport.breakdown && paymentModeReport.breakdown.length > 0 ? (
                  paymentModeReport.breakdown.map((pm: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3.5 font-bold text-slate-800 uppercase">{pm.paymentMode}</td>
                      <td className="py-3 px-3.5 text-center font-semibold text-slate-600">{pm.transactionCount}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-600">₹{(pm.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 text-center font-bold text-indigo-600">{pm.percentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No payment mode breakdown available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. RECEIPTS REPORT TAB */}
      {activeTab === 'receipts' && (
        <div id="finance-tab-receipts" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Receipts Engine Search & Re-download</h3>
              <p className="text-xs text-slate-500">Query and view generated fee receipts across all historical billing cycles.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-export-receipts-excel"
                onClick={() => handleExportExcel('Receipts_Report', receiptReport.data)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-receipt-reports"
              type="text"
              placeholder="Search by receipt number, student name, roll number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Receipt No</th>
                  <th className="py-3 px-3.5">Student</th>
                  <th className="py-3 px-3.5">Class</th>
                  <th className="py-3 px-3.5 text-right">Amount</th>
                  <th className="py-3 px-3.5">Mode</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receiptReport.data && receiptReport.data.length > 0 ? (
                  receiptReport.data.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3.5 font-bold font-mono text-slate-800 text-[11px]">{r.receiptNumber}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-800">{r.studentName}</td>
                      <td className="py-3 px-3.5 font-medium">{r.class}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-600">₹{(r.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3.5 font-semibold text-slate-600 uppercase">{r.paymentMode}</td>
                      <td className="py-3 px-3.5 text-slate-500 text-[11px]">{r.date}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          id={`btn-view-receipt-${r.receiptNumber}`}
                          onClick={() => setSelectedReceipt(r.rawReceipt || r)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg cursor-pointer transition-all"
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">No receipts match the search criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW / PRINT MODAL */}
      {selectedReceipt && (
        <div id="modal-receipt-preview" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-800 text-base">Fee Payment Receipt</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedReceipt.receiptNumber || selectedReceipt.id}</p>
              </div>
              <button
                id="btn-close-receipt-modal"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.studentName || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Class / Batch:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.class || selectedReceipt.className || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Billing Month:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.month || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className="font-bold text-indigo-700 uppercase">{selectedReceipt.paymentMode || selectedReceipt.paymentMethod || 'CASH'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Date Issued:</span>
                <span className="font-medium text-slate-700">{selectedReceipt.date || selectedReceipt.issuedAt || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-700 font-bold">Total Amount Paid:</span>
                <span className="font-extrabold text-sm text-emerald-600">₹{(selectedReceipt.amountPaid || selectedReceipt.amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                id="btn-print-receipt-modal"
                onClick={() => handlePrintPDF('Single_Receipt')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print / Download PDF
              </button>
              <button
                id="btn-dismiss-receipt-modal"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
