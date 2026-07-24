import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, History, Check, Eye, X, HelpCircle, 
  Settings, Layers, TrendingUp, AlertCircle, FileText, ArrowRight,
  Sparkles, ShieldCheck
} from 'lucide-react';

interface FeeStructure {
  id: string;
  structureId: string;
  classId: string;
  className: string;
  academicSessionId: string;
  academicSessionName: string;
  monthlyFee: number;
  quarterlyDiscountEnabled: boolean;
  quarterlyDiscountType: 'PERCENTAGE' | 'FIXED';
  quarterlyDiscountValue: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: number;
  remarks: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  archivedAt?: string;
}

export const FeeStructureManager: React.FC<{ currentUserRole?: string }> = ({ currentUserRole }) => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Drawer & History
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [historyList, setHistoryList] = useState<FeeStructure[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Modal forms
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Form Fields
  const [classId, setClassId] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [academicSessionId, setAcademicSessionId] = useState<string>('session-2026');
  const [academicSessionName, setAcademicSessionName] = useState<string>('2026-2027');
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
  const [quarterlyDiscountEnabled, setQuarterlyDiscountEnabled] = useState<boolean>(false);
  const [quarterlyDiscountType, setQuarterlyDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [quarterlyDiscountValue, setQuarterlyDiscountValue] = useState<number>(0);
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [effectiveTo, setEffectiveTo] = useState<string>('2030-12-31');
  const [remarks, setRemarks] = useState<string>('');
  const [statusField, setStatusField] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');

  const classesList = [
    { id: 'class-1', name: 'Class 1' },
    { id: 'class-2', name: 'Class 2' },
    { id: 'class-3', name: 'Class 3' },
    { id: 'class-4', name: 'Class 4' },
    { id: 'class-5', name: 'Class 5' },
    { id: 'class-6', name: 'Class 6' },
    { id: 'class-7', name: 'Class 7' },
    { id: 'class-8', name: 'Class 8' },
    { id: 'class-9', name: 'Class 9' },
    { id: 'class-10', name: 'Class 10' },
    { id: 'class-11', name: 'Class 11' },
    { id: 'class-12', name: 'Class 12' },
  ];

  const sessionsList = [
    { id: 'session-2025', name: '2025-2026' },
    { id: 'session-2026', name: '2026-2027' },
    { id: 'session-2027', name: '2027-2028' },
    { id: 'session-2028', name: '2028-2029' },
  ];

  // Load fee structures on mount
  useEffect(() => {
    fetchStructures();
  }, []);

  // Update session name automatically when ID changes
  useEffect(() => {
    const matching = sessionsList.find(s => s.id === academicSessionId);
    if (matching) {
      setAcademicSessionName(matching.name);
    }
  }, [academicSessionId]);

  // Update class name automatically when ID changes
  useEffect(() => {
    const matching = classesList.find(c => c.id === classId);
    if (matching) {
      setClassName(matching.name);
    }
  }, [classId]);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fees/structures');
      const json = await res.json();
      if (json.success) {
        setStructures(json.data || []);
      } else {
        setError(json.message || 'Failed to fetch fee structures.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error while fetching fee structures.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStructure = async (structure: FeeStructure) => {
    setSelectedId(structure.id);
    setSelectedStructure(structure);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/fees/structures/${structure.id}/history`);
      const json = await res.json();
      if (json.success) {
        setHistoryList(json.data || []);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error(err);
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setClassId(classesList[0].id);
    setClassName(classesList[0].name);
    setAcademicSessionId(sessionsList[1].id);
    setAcademicSessionName(sessionsList[1].name);
    setMonthlyFee(1500);
    setQuarterlyDiscountEnabled(false);
    setQuarterlyDiscountType('PERCENTAGE');
    setQuarterlyDiscountValue(0);
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEffectiveTo('2030-12-31');
    setRemarks('');
    setStatusField('DRAFT');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (s: FeeStructure) => {
    setIsEditing(true);
    setEditId(s.id);
    setClassId(s.classId);
    setClassName(s.className);
    setAcademicSessionId(s.academicSessionId);
    setAcademicSessionName(s.academicSessionName);
    setMonthlyFee(s.monthlyFee);
    setQuarterlyDiscountEnabled(s.quarterlyDiscountEnabled);
    setQuarterlyDiscountType(s.quarterlyDiscountType);
    setQuarterlyDiscountValue(s.quarterlyDiscountValue);
    setEffectiveFrom(s.effectiveFrom);
    setEffectiveTo(s.effectiveTo);
    setRemarks(s.remarks || '');
    setStatusField(s.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT');
    setError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    // Frontend Validations
    if (monthlyFee <= 0) {
      setError('Monthly fee must be greater than zero.');
      setSubmitLoading(false);
      return;
    }

    if (quarterlyDiscountEnabled) {
      if (quarterlyDiscountValue < 0) {
        setError('Discount value must be zero or positive.');
        setSubmitLoading(false);
        return;
      }
      if (quarterlyDiscountType === 'PERCENTAGE' && quarterlyDiscountValue > 100) {
        setError('Discount percentage must be between 0 and 100.');
        setSubmitLoading(false);
        return;
      }
    }

    const payload = {
      classId,
      className,
      academicSessionId,
      academicSessionName,
      monthlyFee: Number(monthlyFee),
      quarterlyDiscountEnabled,
      quarterlyDiscountType,
      quarterlyDiscountValue: quarterlyDiscountEnabled ? Number(quarterlyDiscountValue) : 0,
      effectiveFrom,
      effectiveTo,
      remarks,
      status: statusField
    };

    try {
      let res;
      if (isEditing && editId) {
        res = await fetch(`/api/fees/structures/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/fees/structures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || 'Fee structure saved successfully.');
        setShowModal(false);
        fetchStructures();
        if (selectedId) {
          // Refresh details if currently viewing the updated structure
          const updatedStruct = json.data;
          if (updatedStruct) {
            setSelectedStructure(updatedStruct);
            handleSelectStructure(updatedStruct);
          }
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(json.message || 'Failed to save fee structure.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An unexpected network error occurred.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to activate this fee structure? This will automatically archive the currently active version for this class + academic session.')) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/fees/structures/${id}/activate`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Fee structure activated successfully.');
        fetchStructures();
        if (selectedStructure && selectedStructure.id === id) {
          const updated = { ...selectedStructure, status: 'ACTIVE' as const };
          setSelectedStructure(updated);
          handleSelectStructure(updated);
        } else {
          setSelectedId(null);
          setSelectedStructure(null);
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(json.message || 'Failed to activate fee structure.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to contact server for activation.');
    }
  };

  // Filter calculations
  const filteredStructures = structures.filter(s => {
    const matchesSearch = s.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.academicSessionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSession = sessionFilter === 'ALL' ? true : s.academicSessionId === sessionFilter;
    const matchesStatus = statusFilter === 'ALL' ? true : s.status === statusFilter;
    return matchesSearch && matchesSession && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800" id="fee-structure-engine-container">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Sunshine ERP Admin Panel
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fee Structure Engine</h1>
          <p className="text-slate-500 mt-1">Master configurations, automated version control, and multi-session fee rules.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            id="btn-create-fee-structure"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create Fee Structure</span>
          </button>
        </div>
      </div>

      {/* SYSTEM FEEDBACK BANNER */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 shadow-sm"
            id="banner-success-feedback"
          >
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 shadow-sm"
            id="banner-error-feedback"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Error occurred:</span> {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANALYTICS HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="fee-analytics-grid">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Total Configurations</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{structures.length}</h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Active Rule Sets</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {structures.filter(s => s.status === 'ACTIVE').length}
            </h3>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Draft / Inactive Configs</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {structures.filter(s => s.status === 'DRAFT').length}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & TABLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* MAIN CONFIGURATION TABLE */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="fee-configurations-card">
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="filter-fee-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Class or Session..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 text-sm">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  id="filter-fee-session"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="bg-transparent border-none py-1.5 focus:outline-none text-slate-700 font-medium cursor-pointer"
                >
                  <option value="ALL">All Sessions</option>
                  {sessionsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 text-sm">
                <select
                  id="filter-fee-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none py-1.5 focus:outline-none text-slate-700 font-medium cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <span>Loading fee structures...</span>
            </div>
          ) : filteredStructures.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50/50">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No configurations found</h3>
              <p className="text-sm text-slate-500 mt-1">Try resetting the filters or create a new master fee structure.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="fee-structures-table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Class / Session</th>
                    <th className="px-6 py-3.5">Monthly Fee</th>
                    <th className="px-6 py-3.5">Quarterly Discount</th>
                    <th className="px-6 py-3.5 text-center">Version</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStructures.map((struct) => {
                    const isSelected = selectedId === struct.id;
                    return (
                      <tr 
                        key={struct.id} 
                        className={`hover:bg-slate-50 transition duration-150 cursor-pointer ${isSelected ? 'bg-indigo-50/40 font-medium' : ''}`}
                        onClick={() => handleSelectStructure(struct)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{struct.className}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{struct.academicSessionName}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          ₹{struct.monthlyFee.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          {struct.quarterlyDiscountEnabled ? (
                            <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs font-semibold">
                              {struct.quarterlyDiscountType === 'PERCENTAGE' 
                                ? `${struct.quarterlyDiscountValue}% Off` 
                                : `₹${struct.quarterlyDiscountValue} Off`
                              }
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
                            v{struct.version}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            struct.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : struct.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {struct.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`btn-view-${struct.id}`}
                              onClick={() => handleSelectStructure(struct)}
                              title="View Details"
                              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition duration-150"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-edit-${struct.id}`}
                              onClick={() => handleOpenEditModal(struct)}
                              title="Edit / Revise"
                              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition duration-150"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            {struct.status !== 'ACTIVE' && (
                              <button
                                id={`btn-activate-action-${struct.id}`}
                                onClick={() => handleActivate(struct.id)}
                                title="Activate Configuration"
                                className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition duration-150"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SIDE DETAIL PANEL / DRAWER */}
        <div className="lg:col-span-1" id="detail-history-column">
          <AnimatePresence mode="wait">
            {selectedStructure ? (
              <motion.div
                key={selectedStructure.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6"
                id="fee-details-card"
              >
                {/* Panel Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedStructure.className}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedStructure.academicSessionName} — v{selectedStructure.version}</p>
                  </div>
                  <button
                    id="btn-close-details"
                    onClick={() => { setSelectedId(null); setSelectedStructure(null); }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badges Row */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Status</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    selectedStructure.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : selectedStructure.status === 'DRAFT'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedStructure.status}
                  </span>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1 font-medium">Monthly Fee</span>
                    <span className="text-xl font-bold text-slate-900">₹{selectedStructure.monthlyFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1 font-medium">Quarterly Benefit</span>
                    {selectedStructure.quarterlyDiscountEnabled ? (
                      <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                        {selectedStructure.quarterlyDiscountType === 'PERCENTAGE' 
                          ? `${selectedStructure.quarterlyDiscountValue}% Discount` 
                          : `₹${selectedStructure.quarterlyDiscountValue} Discount`
                        }
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">Disabled</span>
                    )}
                  </div>
                </div>

                {/* Timing / Dates */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Effective Range</span>
                    <span className="font-semibold text-slate-700">{selectedStructure.effectiveFrom} to {selectedStructure.effectiveTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configured By</span>
                    <span className="font-semibold text-slate-700">{selectedStructure.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created At</span>
                    <span className="font-semibold text-slate-700">{new Date(selectedStructure.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedStructure.remarks && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <span className="text-slate-500 block mb-1">Remarks</span>
                      <p className="text-slate-600 bg-slate-50 p-2 rounded italic font-sans">{selectedStructure.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons inside Details */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    id="btn-edit-detail-action"
                    onClick={() => handleOpenEditModal(selectedStructure)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition duration-150"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit / Revise</span>
                  </button>

                  {selectedStructure.status !== 'ACTIVE' && (
                    <button
                      id="btn-activate-detail-action"
                      onClick={() => handleActivate(selectedStructure.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition duration-150"
                    >
                      <Check className="w-4 h-4" />
                      <span>Activate</span>
                    </button>
                  )}
                </div>

                {/* Version History List */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-800">Version History Log</h4>
                  </div>

                  {historyLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>
                  ) : historyList.length <= 1 ? (
                    <p className="text-xs text-slate-400">This is the sole configuration version recorded for this Class + Session.</p>
                  ) : (
                    <div className="space-y-3">
                      {historyList.map(item => {
                        const isCurrentInDetails = item.id === selectedStructure.id;
                        return (
                          <div 
                            key={item.id}
                            id={`history-item-${item.id}`}
                            className={`p-2.5 rounded-lg border transition duration-150 cursor-pointer text-xs ${
                              isCurrentInDetails 
                                ? 'bg-indigo-50 border-indigo-200 font-medium' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                            onClick={() => handleSelectStructure(item)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700">Version v{item.version}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                item.status === 'ACTIVE' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : item.status === 'DRAFT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500 mt-1">
                              <span>Fee: ₹{item.monthlyFee}</span>
                              <span>By {item.createdBy}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Detailed Analytics</h4>
                <p className="text-xs text-slate-500 mt-1">Select any fee structure from the left list to explore history logs, auditing parameters, and manage active schedules.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FORM MODAL (CREATE / REVISION EDIT) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="fee-structure-modal">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></motion.div>

            {/* Modal Body Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
              >
                {/* Modal Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>{isEditing ? 'Revise Fee Structure' : 'Create Fee Structure'}</span>
                  </h3>
                  <button
                    id="btn-close-modal"
                    onClick={() => setShowModal(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                  {isEditing && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg text-xs leading-relaxed flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Historical Integrity Mode:</span> Modifying active or archived parameters automatically creates a <span className="font-bold underline">new revision draft (Version {structures.find(s => s.id === editId)?.status === 'ACTIVE' ? (structures.find(s => s.id === editId)?.version || 1) + 1 : (structures.find(s => s.id === editId)?.version || 1)})</span> to keep original financial reports intact.
                      </div>
                    </div>
                  )}

                  {/* Class Selection */}
                  <div>
                    <label htmlFor="field-classId" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Target Class</label>
                    <select
                      id="field-classId"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      disabled={isEditing}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                    >
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Session Selection */}
                  <div>
                    <label htmlFor="field-sessionId" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Academic Session</label>
                    <select
                      id="field-sessionId"
                      value={academicSessionId}
                      onChange={(e) => setAcademicSessionId(e.target.value)}
                      disabled={isEditing}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                    >
                      {sessionsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Monthly Fee */}
                  <div>
                    <label htmlFor="field-monthlyFee" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Monthly Fee (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">₹</span>
                      <input
                        id="field-monthlyFee"
                        type="number"
                        min="1"
                        value={monthlyFee === 0 ? '' : monthlyFee}
                        onChange={(e) => setMonthlyFee(Math.max(0, Number(e.target.value)))}
                        placeholder="Enter amount"
                        required
                        className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Quarterly discount section */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Quarterly Payment Discount</span>
                      <input
                        id="field-quarterlyDiscountEnabled"
                        type="checkbox"
                        checked={quarterlyDiscountEnabled}
                        onChange={(e) => setQuarterlyDiscountEnabled(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {quarterlyDiscountEnabled && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label htmlFor="field-quarterlyDiscountType" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Type</label>
                          <select
                            id="field-quarterlyDiscountType"
                            value={quarterlyDiscountType}
                            onChange={(e) => setQuarterlyDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (₹)</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="field-quarterlyDiscountValue" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Benefit Value</label>
                          <input
                            id="field-quarterlyDiscountValue"
                            type="number"
                            min="0"
                            value={quarterlyDiscountValue === 0 ? '' : quarterlyDiscountValue}
                            onChange={(e) => setQuarterlyDiscountValue(Math.max(0, Number(e.target.value)))}
                            placeholder="Enter value"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="field-effectiveFrom" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Effective From</label>
                      <input
                        id="field-effectiveFrom"
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => setEffectiveFrom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="field-effectiveTo" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Effective To</label>
                      <input
                        id="field-effectiveTo"
                        type="date"
                        value={effectiveTo}
                        onChange={(e) => setEffectiveTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label htmlFor="field-remarks" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Remarks</label>
                    <textarea
                      id="field-remarks"
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add brief auditing or context comments..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </div>

                  {/* Initial Status (Create Mode Only) */}
                  {!isEditing && (
                    <div>
                      <label htmlFor="field-statusField" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Initial Status</label>
                      <select
                        id="field-statusField"
                        value={statusField}
                        onChange={(e) => setStatusField(e.target.value as 'DRAFT' | 'ACTIVE')}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="DRAFT">Save as DRAFT (Recommended first)</option>
                        <option value="ACTIVE">Save & Activate instantly (Archives older configs)</option>
                      </select>
                    </div>
                  )}

                  {/* Error display inside Modal */}
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-medium">
                      {error}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      id="btn-cancel-modal"
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-submit-fee-structure"
                      type="submit"
                      disabled={submitLoading}
                      className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {submitLoading ? 'Saving config...' : (isEditing ? 'Save Revision' : 'Create Configuration')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
