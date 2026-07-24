/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  Lock,
  Download,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

interface AdmissionRecord {
  id: string;
  rollNo?: string;
  admissionNo?: string;
  studentId?: string;
  userId?: string;
  studentName: string;
  fatherName: string;
  motherName?: string;
  dob: string;
  gender: string;
  className: string;
  class?: string;
  previousSchool?: string;
  mobile: string;
  whatsapp?: string;
  parentMobile?: string;
  email?: string;
  address: string;
  aadhar?: string;
  preferredBatch?: string;
  preferredTiming?: string;
  assignedTeacher?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  date?: string;
  admissionDate?: string;
  createdAt?: string;
  monthlyFee?: number;
}

interface NewAdmissionCredentials {
  studentName: string;
  rollNo: string;
  username: string;
  temporaryPassword?: string;
  className: string;
  initialFee: number;
}

const CLASS_OPTIONS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'LKG', 'UKG', 'Nursery'
];

export default function AdmissionsModule() {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role || 'RECEPTIONIST').toUpperCase();
  
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(userRole);
  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(userRole);
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals state
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<AdmissionRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState<AdmissionRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AdmissionRecord | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<NewAdmissionCredentials | null>(null);

  // Form State for New Admission
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    gender: 'Male',
    className: 'Class 10',
    mobile: '',
    whatsapp: '',
    parentMobile: '',
    email: '',
    address: '',
    aadhar: '',
    previousSchool: '',
    preferredBatch: 'Class 10 Standard Batch',
    preferredTiming: '08:00 AM - 10:00 AM',
    discount: '0',
    scholarship: '0'
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);

  // Fetch Admissions list from API
  const fetchAdmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '10');
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedClass) queryParams.append('className', selectedClass);
      if (selectedStatus) queryParams.append('status', selectedStatus);

      const res = await fetch(`/api/admissions?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setAdmissions(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.totalCount || 0);
        }
      } else {
        setError(data.error || 'Failed to fetch admissions');
      }
    } catch (err: any) {
      console.error('[AdmissionsModule] Fetch error:', err);
      setError('Unable to load admissions records. Please refresh or check server logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [page, selectedClass, selectedStatus]);

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAdmissions();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit New Admission Form
  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.message || data.error || 'Failed to process admission');
        setFormSubmitting(false);
        return;
      }

      // Success
      setShowNewModal(false);
      
      // Reset Form
      setFormData({
        studentName: '',
        fatherName: '',
        motherName: '',
        dob: '',
        gender: 'Male',
        className: 'Class 10',
        mobile: '',
        whatsapp: '',
        parentMobile: '',
        email: '',
        address: '',
        aadhar: '',
        previousSchool: '',
        preferredBatch: 'Class 10 Standard Batch',
        preferredTiming: '08:00 AM - 10:00 AM',
        discount: '0',
        scholarship: '0'
      });

      // Show Credentials Dialog
      if (data.data && data.data.user) {
        setCredentialsModal({
          studentName: data.data.admission.studentName,
          rollNo: data.data.rollNo || data.data.admission.rollNo,
          username: data.data.user.username,
          temporaryPassword: data.data.user.temporaryPassword,
          className: data.data.admission.className || data.data.admission.class,
          initialFee: data.data.initialFee?.pendingFee || data.data.admission.monthlyFee || 500
        });
      }

      fetchAdmissions();
    } catch (err: any) {
      console.error('[AdmissionsModule] Create error:', err);
      setFormError(err.message || 'Server error occurred during admission creation.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update Admission Submit
  const handleUpdateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/admissions/${showEditModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(showEditModal)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to update admission');
        setFormSubmitting(false);
        return;
      }

      setShowEditModal(null);
      fetchAdmissions();
    } catch (err: any) {
      console.error('[AdmissionsModule] Update error:', err);
      setFormError('Failed to update admission details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Admission Submit
  const handleDeleteAdmission = async () => {
    if (!showDeleteModal) return;

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/admissions/${showDeleteModal.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete admission');
        return;
      }

      setShowDeleteModal(null);
      fetchAdmissions();
    } catch (err: any) {
      console.error('[AdmissionsModule] Delete error:', err);
      alert('Error deleting admission record.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Copy Credentials Helper
  const copyCredentialsToClipboard = () => {
    if (!credentialsModal) return;
    const text = `
☀️ Sunshine Classes - Student Credentials
----------------------------------------
Student Name: ${credentialsModal.studentName}
Roll Number:  ${credentialsModal.rollNo}
Class:        ${credentialsModal.className}
Username:     ${credentialsModal.username}
Temp Password:${credentialsModal.temporaryPassword}
Current Month Dues: ₹${credentialsModal.initialFee}
----------------------------------------
Please change your password upon your first login at https://sunshineclasses.net
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  return (
    <div id="admissions-module-container" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black font-display text-slate-800">Student Admissions Module</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official enrollment engine, automated roll number assignment (SC-YYYY-CC-0001), and initial fee setup.
          </p>
        </div>

        {canCreate && (
          <button
            id="btn-new-admission"
            onClick={() => { setShowNewModal(true); setFormError(null); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            New Student Admission
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-admission-search"
            type="text"
            placeholder="Search by Name, Roll No, Mobile, Class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Class Filter */}
          <select
            id="select-admission-class-filter"
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Classes</option>
            {CLASS_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="select-admission-status-filter"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved / Enrolled</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            id="btn-refresh-admissions"
            onClick={fetchAdmissions}
            title="Refresh Table"
            className="p-2 text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading admissions records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-xs font-bold">{error}</p>
            <button
              onClick={fetchAdmissions}
              className="mt-3 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : admissions.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Admission Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No students match the current search filters. Click "New Student Admission" to enroll a new candidate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Father Name</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Admission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {admissions.map((adm) => {
                  const roll = adm.rollNo || adm.admissionNo || adm.id;
                  const targetClass = adm.className || adm.class || 'Class 10';
                  const isApproved = adm.status === 'APPROVED';

                  return (
                    <tr key={adm.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-700 bg-amber-50/50 rounded-lg my-1">
                        {roll}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {adm.studentName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {targetClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {adm.fatherName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {adm.mobile}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {adm.date || adm.admissionDate || adm.createdAt?.split('T')[0] || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : adm.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {adm.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            id={`btn-view-admission-${adm.id}`}
                            onClick={() => setShowDetailModal(adm)}
                            title="View Admission Details"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Admission */}
                          {canEdit && (
                            <button
                              id={`btn-edit-admission-${adm.id}`}
                              onClick={() => { setShowEditModal(adm); setFormError(null); }}
                              title="Edit Admission"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Admission */}
                          {canDelete && (
                            <button
                              id={`btn-delete-admission-${adm.id}`}
                              onClick={() => setShowDeleteModal(adm)}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing <strong className="text-slate-800">{admissions.length}</strong> of <strong className="text-slate-800">{totalCount}</strong> admissions
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-800">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW ADMISSION FORM MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-800">New Student Admission</h3>
                  <p className="text-xs text-slate-500">Generates roll number SC-2026-CC-0001 & student account.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmission} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="studentName"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* Father Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Father's Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="fatherName"
                    placeholder="e.g. Suresh Sharma"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* Mother Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    placeholder="e.g. Sunita Sharma"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Class / Grade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    {CLASS_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth (DOB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Mobile (10 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    name="mobile"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Parent Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Parent Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="parentMobile"
                    maxLength={10}
                    placeholder="e.g. 9876543211"
                    value={formData.parentMobile}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Residential Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  name="address"
                  placeholder="e.g. Mohalla Qureshi, Pihani, Hardoi, Uttar Pradesh"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                />
              </div>

              {/* Additional Options Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Previous School Name
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    placeholder="e.g. Primary School Pihani"
                    value={formData.previousSchool}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scholarship / Discount (₹)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    placeholder="0"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Records...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Create Admission
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS & CREDENTIALS DIALOG */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-display text-slate-800">Admission Created Successfully!</h3>
              <p className="text-xs text-slate-500">
                Roll number assigned and student user account provisioned.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans font-bold">Student Name:</span>
                <span className="font-bold text-slate-800 font-sans">{credentialsModal.studentName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans font-bold">Roll Number:</span>
                <span className="font-bold text-amber-700">{credentialsModal.rollNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans font-bold">Class:</span>
                <span className="font-bold text-slate-800 font-sans">{credentialsModal.className}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans font-bold">Generated Username:</span>
                <span className="font-bold text-indigo-700">{credentialsModal.username}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2 bg-amber-50 p-2 rounded-lg">
                <span className="text-amber-800 font-sans font-bold">Temp Password:</span>
                <span className="font-bold text-rose-700">{credentialsModal.temporaryPassword}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-sans font-bold">Current Month Dues:</span>
                <span className="font-bold text-emerald-700 font-sans">₹{credentialsModal.initialFee} (Pending)</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Temporary Password Visibility Notice:</span>
              </div>
              <p>
                This temporary password is displayed <strong>only once</strong> now and cannot be retrieved again later (only reset). Receptionists are strongly advised to <strong>Print</strong>, <strong>Copy</strong>, or <strong>Share</strong> these credentials immediately with the student/parent.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={copyCredentialsToClipboard}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {copiedCredentials ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCredentials ? 'Copied!' : 'Copy Credentials'}
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Slip
              </button>

              <button
                onClick={() => setCredentialsModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-black text-base text-slate-800">{showDetailModal.studentName}</h3>
                  <p className="text-xs font-mono text-amber-700 font-bold">{showDetailModal.rollNo || showDetailModal.admissionNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Class / Grade</span>
                  <span className="font-bold text-slate-800">{showDetailModal.className || showDetailModal.class}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-black text-emerald-700">{showDetailModal.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Father's Name</span>
                  <span className="font-bold text-slate-800">{showDetailModal.fatherName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Mother's Name</span>
                  <span className="font-bold text-slate-800">{showDetailModal.motherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Date of Birth</span>
                  <span className="font-bold text-slate-800">{showDetailModal.dob}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Gender</span>
                  <span className="font-bold text-slate-800">{showDetailModal.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile</span>
                  <span className="font-mono font-bold text-slate-800">{showDetailModal.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Parent Mobile</span>
                  <span className="font-mono font-bold text-slate-800">{showDetailModal.parentMobile || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Address</span>
                <span className="font-medium text-slate-700">{showDetailModal.address}</span>
              </div>

              {showDetailModal.assignedTeacher && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Teacher</span>
                  <span className="font-bold text-indigo-700">{showDetailModal.assignedTeacher}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-base text-slate-800">
                Edit Admission: {showEditModal.studentName}
              </h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmission} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  value={showEditModal.studentName}
                  onChange={(e) => setShowEditModal({ ...showEditModal, studentName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Class</label>
                  <select
                    value={showEditModal.className || showEditModal.class}
                    onChange={(e) => setShowEditModal({ ...showEditModal, className: e.target.value, class: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Mobile</label>
                  <input
                    type="text"
                    value={showEditModal.mobile}
                    onChange={(e) => setShowEditModal({ ...showEditModal, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Father Name</label>
                <input
                  type="text"
                  value={showEditModal.fatherName}
                  onChange={(e) => setShowEditModal({ ...showEditModal, fatherName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Address</label>
                <textarea
                  rows={2}
                  value={showEditModal.address}
                  onChange={(e) => setShowEditModal({ ...showEditModal, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Delete Admission Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deleting <strong>{showDeleteModal.studentName}</strong> ({showDeleteModal.rollNo || showDeleteModal.admissionNo}) will remove their admission profile. The roll number will be locked and never reused.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmission}
                disabled={formSubmitting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
