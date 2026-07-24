import React, { useState, useEffect } from 'react';
import { Percent, IndianRupee, Calendar, Tag, ShieldAlert, CheckCircle2, Trash2, Save, Sparkles, ArrowRight, Info } from 'lucide-react';

interface StudentFeeSettingsViewProps {
  studentId: string;
  studentName: string;
  studentClass: string;
  userRole: string;
}

export const StudentFeeSettingsView: React.FC<StudentFeeSettingsViewProps> = ({
  studentId,
  studentName,
  studentClass,
  userRole
}) => {
  const isReadOnly = userRole === 'RECEPTIONIST';
  const isTeacher = userRole === 'TEACHER';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data State
  const [classFee, setClassFee] = useState<number>(2000);
  const [concessionPercentage, setConcessionPercentage] = useState<number | ''>(0);
  const [reason, setReason] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [effectiveTill, setEffectiveTill] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [hasExistingSetting, setHasExistingSetting] = useState<boolean>(false);

  // Fetch Fee Settings
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/${studentId}/fee-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch student fee settings.');
      }

      if (json.success && json.data) {
        const data = json.data;
        setClassFee(data.classFee || 2000);

        if (data.setting) {
          setHasExistingSetting(true);
          setConcessionPercentage(data.setting.concessionPercentage ?? 0);
          setReason(data.setting.reason || '');
          setEffectiveFrom(data.setting.effectiveFrom || new Date().toISOString().split('T')[0]);
          setEffectiveTill(data.setting.effectiveTill || '');
          setStatus(data.setting.status || 'ACTIVE');
        } else {
          setHasExistingSetting(false);
          setConcessionPercentage(0);
          setReason('');
          setEffectiveFrom(new Date().toISOString().split('T')[0]);
          setEffectiveTill('');
          setStatus('ACTIVE');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load student fee settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchSettings();
    }
  }, [studentId]);

  // Live Calculations
  const numericPct = typeof concessionPercentage === 'number' ? Math.max(0, Math.min(100, concessionPercentage)) : 0;
  const concessionAmount = Math.round((classFee * numericPct) / 100);
  const finalFee = Math.max(0, classFee - concessionAmount);

  // Save / Update Concession
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || isTeacher) return;

    if (concessionPercentage === '' || numericPct < 0 || numericPct > 100) {
      setError('Concession percentage must be between 0% and 100%.');
      return;
    }

    if (!effectiveFrom) {
      setError('Effective from date is required.');
      return;
    }

    if (effectiveTill && effectiveTill < effectiveFrom) {
      setError('Effective till date cannot be before effective from date.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/${studentId}/fee-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          concessionPercentage: numericPct,
          reason,
          effectiveFrom,
          effectiveTill,
          status
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save fee settings.');
      }

      setSuccessMsg(json.message || 'Fee settings updated successfully.');
      setHasExistingSetting(true);
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save fee settings.');
    } finally {
      setSaving(false);
    }
  };

  // Remove Concession
  const handleRemove = async () => {
    if (isReadOnly || isTeacher) return;
    if (!window.confirm(`Are you sure you want to remove fee concession for ${studentName}?`)) return;

    setRemoving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/${studentId}/fee-settings`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to remove fee concession.');
      }

      setSuccessMsg('Fee concession removed. Student will inherit default class fee.');
      setConcessionPercentage(0);
      setReason('');
      setEffectiveTill('');
      setHasExistingSetting(false);
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to remove fee concession.');
    } finally {
      setRemoving(false);
    }
  };

  if (isTeacher) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-6 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="font-bold text-sm">Access Restricted</h3>
        <p className="text-xs text-amber-700">Teachers do not have permission to view or manage student fee concessions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 space-x-3 text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading fee settings & concession details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-indigo-200">
            <Tag size={16} /> Student Fee Settings & Concession (FM-006)
          </div>
          <p className="text-xs text-indigo-100">
            Assign percentage-based concession for <span className="font-semibold text-white">{studentName}</span> ({studentClass}). Concessions apply during monthly fee generation.
          </p>
        </div>
        {isReadOnly && (
          <span className="px-3 py-1 bg-amber-500/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-semibold">
            View Only Access
          </span>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 font-bold hover:underline ml-2">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold hover:underline ml-2">Dismiss</button>
        </div>
      )}

      {/* LIVE PREVIEW CARDS */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 uppercase tracking-wider">
          <Sparkles size={16} className="text-indigo-600" /> Instant Monthly Fee Preview
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Class Fee</span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center">
              <IndianRupee size={18} /> {classFee.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Standard monthly class structure</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Concession Discount</span>
            <div className="text-xl font-bold text-amber-600 mt-1 flex items-center gap-1">
              <span>{numericPct}%</span>
              <span className="text-xs text-slate-500 font-normal">(-₹{concessionAmount.toLocaleString('en-IN')})</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {status === 'ACTIVE' && numericPct > 0 ? 'Active percentage discount' : 'No active discount'}
            </span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl shadow-2xs">
            <span className="text-xs font-bold text-emerald-800 block">Final Monthly Fee</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 flex items-center">
              <IndianRupee size={22} /> {finalFee.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Will be snapshotted on monthly fee generation</span>
          </div>
        </div>

        <div className="bg-white/80 border border-indigo-100 p-3 rounded-xl text-xs text-slate-600 flex items-center gap-2">
          <Info size={15} className="text-indigo-600 flex-shrink-0" />
          <span>
            Calculation Formula: <strong className="text-slate-900">₹{classFee}</strong> (Class Fee) - <strong className="text-slate-900">{numericPct}%</strong> (₹{concessionAmount}) = <strong className="text-emerald-700">₹{finalFee}</strong>
          </span>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Tag size={16} className="text-indigo-900" />
          Concession Settings & Validity Period
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Concession % */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Concession Percentage (%) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-concession-percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                disabled={isReadOnly}
                value={concessionPercentage}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setConcessionPercentage(val);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900 transition-all disabled:opacity-60"
                placeholder="e.g. 10"
              />
              <Percent size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">Enter percentage value between 0% and 100%.</p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Concession Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-concession-status"
              disabled={isReadOnly}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900 transition-all disabled:opacity-60"
            >
              <option value="ACTIVE">ACTIVE (Concession will apply to generated fees)</option>
              <option value="INACTIVE">INACTIVE (Concession is paused/disabled)</option>
            </select>
            <p className="text-[11px] text-slate-500">Inactive concessions will not be applied during fee generation.</p>
          </div>

          {/* Effective From */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Effective From <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-effective-from"
                type="date"
                disabled={isReadOnly}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900 transition-all disabled:opacity-60"
              />
              <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">Date from which concession becomes active.</p>
          </div>

          {/* Effective Till */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Effective Till (Optional)
            </label>
            <div className="relative">
              <input
                id="input-effective-till"
                type="date"
                disabled={isReadOnly}
                value={effectiveTill}
                onChange={(e) => setEffectiveTill(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900 transition-all disabled:opacity-60"
              />
              <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">Leave blank for indefinite validity.</p>
          </div>

          {/* Reason */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reason / Justification
            </label>
            <input
              id="input-concession-reason"
              type="text"
              disabled={isReadOnly}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-900 focus:ring-1 focus:ring-indigo-900 transition-all disabled:opacity-60"
              placeholder="e.g. Merit Concession, Staff Child, Siblings Discount, Economic Hardship"
            />
            <p className="text-[11px] text-slate-500">Recorded in audit logs and student timeline for financial accountability.</p>
          </div>
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {hasExistingSetting ? (
              <button
                type="button"
                id="btn-remove-concession"
                disabled={removing || saving}
                onClick={handleRemove}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={15} />
                {removing ? 'Removing...' : 'Remove Concession'}
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              id="btn-save-concession"
              disabled={saving || removing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer ml-auto"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Fee Concession'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
