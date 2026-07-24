/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  Edit3,
  Eye,
  BookOpen,
  UserPlus,
  FileText,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Printer,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
  User,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { StudentProfile } from './StudentProfile';

interface StudentDirectoryProps {
  currentUser: {
    id?: string;
    userId?: string;
    studentId?: string;
    username?: string;
    name?: string;
    role: string;
    email?: string;
  };
  teachersList?: any[];
  classList?: string[];
  onRefreshGlobalData?: () => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  currentUser,
  teachersList = [],
  classList = [],
  onRefreshGlobalData
}) => {
  const role = (currentUser?.role || 'ADMIN').toUpperCase();
  const canEditProfile = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(role);
  const canChangeStatus = ['SUPER_ADMIN', 'ADMIN'].includes(role);
  const canReassignClassOrTeacher = ['SUPER_ADMIN', 'ADMIN'].includes(role);
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [admissionYear, setAdmissionYear] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [updatedDate, setUpdatedDate] = useState('');
  const [hasDocuments, setHasDocuments] = useState('ALL');
  const [hasPhoto, setHasPhoto] = useState('ALL');
  const [missingMobile, setMissingMobile] = useState('ALL');
  const [missingEmail, setMissingEmail] = useState('ALL');

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState('rollNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(() => {
    const saved = localStorage.getItem('sunshine_directory_limit');
    return saved ? parseInt(saved, 10) : 25;
  });

  // Data & API State
  const [students, setStudents] = useState<any[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<any>({
    totalCount: 0,
    totalPages: 1,
    hasMore: false,
    lastDocId: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkModalType, setBulkModalType] = useState<'teacher' | 'class' | 'status' | null>(null);
  const [bulkTargetValue, setBulkTargetValue] = useState('');

  // Modals & Single Action State
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [studentTimeline, setStudentTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<{
    type: 'class' | 'teacher' | 'status' | 'documents';
    student: any;
  } | null>(null);

  // Form Inputs for Modals
  const [modalInputClass, setModalInputClass] = useState('');
  const [modalInputTeacher, setModalInputTeacher] = useState('');
  const [modalInputStatus, setModalInputStatus] = useState('ACTIVE');
  const [modalInputDocs, setModalInputDocs] = useState({
    photoUrl: '',
    documentUrl: '',
    aadhar: ''
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filter Bar Expand Toggle
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Save Page Limit
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    localStorage.setItem('sunshine_directory_limit', newLimit.toString());
  };

  // Debounce Search Term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedClass) params.append('className', selectedClass);
      if (selectedTeacher) params.append('teacherId', selectedTeacher);
      if (selectedStatus && selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedGender && selectedGender !== 'ALL') params.append('gender', selectedGender);
      if (admissionYear) params.append('admissionYear', admissionYear);
      if (joinedDate) params.append('joinedDate', joinedDate);
      if (updatedDate) params.append('updatedDate', updatedDate);
      if (hasDocuments !== 'ALL') params.append('hasDocuments', hasDocuments);
      if (hasPhoto !== 'ALL') params.append('hasPhoto', hasPhoto);
      if (missingMobile !== 'ALL') params.append('missingMobile', missingMobile);
      if (missingEmail !== 'ALL') params.append('missingEmail', missingEmail);

      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/students?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch student directory.');
      }

      setStudents(data.data || []);
      setPaginationInfo(data.pagination || { totalCount: 0, totalPages: 1, hasMore: false });
    } catch (err: any) {
      console.error('[StudentDirectory] Fetch error:', err);
      setError(err.message || 'Network error fetching students.');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    selectedClass,
    selectedTeacher,
    selectedStatus,
    selectedGender,
    admissionYear,
    joinedDate,
    updatedDate,
    hasDocuments,
    hasPhoto,
    missingMobile,
    missingEmail,
    sortBy,
    sortOrder,
    page,
    limit
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedClass('');
    setSelectedTeacher('');
    setSelectedStatus('ALL');
    setSelectedGender('ALL');
    setAdmissionYear('');
    setJoinedDate('');
    setUpdatedDate('');
    setHasDocuments('ALL');
    setHasPhoto('ALL');
    setMissingMobile('ALL');
    setMissingEmail('ALL');
    setPage(1);
  };

  // Checkbox Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Sorting Toggle
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field, 'asc');
    }
  };

  const setSort = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  // Fetch Timeline for View Profile
  const handleViewProfile = async (student: any) => {
    setViewingStudent(student);
    setLoadingTimeline(true);
    try {
      const res = await fetch(`/api/students/${student.id}/timeline`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentTimeline(data.data || []);
      } else {
        setStudentTimeline([]);
      }
    } catch (err) {
      setStudentTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Open Single Action Modal
  const openActionModal = (type: 'class' | 'teacher' | 'status' | 'documents', student: any) => {
    setActiveActionModal({ type, student });
    setModalError(null);
    if (type === 'class') {
      setModalInputClass(student.class || student.className || '');
    } else if (type === 'teacher') {
      setModalInputTeacher(student.assignedTeacher || '');
    } else if (type === 'status') {
      setModalInputStatus(student.status || 'ACTIVE');
    } else if (type === 'documents') {
      const docs = student.documents || {};
      setModalInputDocs({
        photoUrl: student.photoUrl || docs.photoUrl || '',
        documentUrl: student.documentUrl || docs.documentUrl || '',
        aadhar: docs.aadhar || student.aadhar || ''
      });
    }
  };

  // Handle Action Submit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionModal) return;

    setModalSubmitting(true);
    setModalError(null);

    const { type, student } = activeActionModal;
    let url = '';
    let method = 'PATCH';
    let body: any = {};

    if (type === 'class') {
      url = `/api/students/${student.id}/class`;
      body = { className: modalInputClass };
    } else if (type === 'teacher') {
      url = `/api/students/${student.id}/teacher`;
      body = { teacherId: modalInputTeacher };
    } else if (type === 'status') {
      url = `/api/students/${student.id}/status`;
      body = { status: modalInputStatus };
    } else if (type === 'documents') {
      url = `/api/students/${student.id}/documents`;
      body = modalInputDocs;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Action failed.');
      }

      setActiveActionModal(null);
      fetchStudents();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update student record.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Edit Profile Save
  const handleEditProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setModalSubmitting(true);
    setModalError(null);

    try {
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setEditingStudent(null);
      fetchStudents();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err: any) {
      setModalError(err.message || 'Profile update failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Export Dataset
  const handleExportDataset = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedClass) params.append('className', selectedClass);
      if (selectedTeacher) params.append('teacherId', selectedTeacher);
      if (selectedStatus && selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedGender && selectedGender !== 'ALL') params.append('gender', selectedGender);
      if (admissionYear) params.append('admissionYear', admissionYear);
      if (joinedDate) params.append('joinedDate', joinedDate);
      if (updatedDate) params.append('updatedDate', updatedDate);
      if (hasDocuments !== 'ALL') params.append('hasDocuments', hasDocuments);
      if (hasPhoto !== 'ALL') params.append('hasPhoto', hasPhoto);
      if (missingMobile !== 'ALL') params.append('missingMobile', missingMobile);
      if (missingEmail !== 'ALL') params.append('missingEmail', missingEmail);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('format', format);

      if (format === 'csv') {
        window.open(`/api/students/export?${params.toString()}`, '_blank');
      } else {
        const res = await fetch(`/api/students/export?${params.toString()}`);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_directory_${Date.now()}.json`;
        a.click();
      }
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  // Handle Bulk Execution
  const handleBulkExecute = async () => {
    if (!bulkModalType || selectedIds.length === 0 || !bulkTargetValue) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const studentId of selectedIds) {
      try {
        let url = '';
        let body: any = {};

        if (bulkModalType === 'class') {
          url = `/api/students/${studentId}/class`;
          body = { className: bulkTargetValue };
        } else if (bulkModalType === 'teacher') {
          url = `/api/students/${studentId}/teacher`;
          body = { teacherId: bulkTargetValue };
        } else if (bulkModalType === 'status') {
          url = `/api/students/${studentId}/status`;
          body = { status: bulkTargetValue };
        }

        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) successCount++;
        else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    setIsBulkProcessing(false);
    setBulkModalType(null);
    setBulkTargetValue('');
    setSelectedIds([]);
    fetchStudents();
    if (onRefreshGlobalData) onRefreshGlobalData();

    alert(`Bulk Operation Complete:\n- Updated: ${successCount}\n- Failed: ${failCount}`);
  };

  // Print Student List
  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sunshine ERP - Student Directory Print</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { font-size: 11px; color: #64748b; margin-top: 0; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; uppercase; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
            .active { background-color: #dcfce7; color: #15803d; }
            .inactive { background-color: #ffe4e6; color: #be123c; }
          </style>
        </head>
        <body>
          <h1>Sunshine Classes - Official Student Directory</h1>
          <p>Generated on ${new Date().toLocaleString()} | Total Records: ${students.length}</p>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Assigned Teacher</th>
                <th>Father / Parent Name</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Admission Date</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td><strong>${s.rollNo || s.rollNumber || '-'}</strong></td>
                  <td>${s.name || s.personalInfo?.name || '-'}</td>
                  <td>${s.class || s.className || '-'}</td>
                  <td>${s.assignedTeacher || '-'}</td>
                  <td>${s.fatherName || s.parentInfo?.fatherName || '-'}</td>
                  <td>${s.mobile || s.contactInfo?.mobile || '-'}</td>
                  <td>
                    <span class="badge ${s.status === 'INACTIVE' ? 'inactive' : 'active'}">
                      ${s.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>${s.admissionDate || s.createdAt || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <GraduationCap size={20} />
            </span>
            <h2 className="font-display font-black text-lg text-slate-800">
              Student Directory Registry
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, manage class alignments, teacher assignments, and export records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-refresh-directory"
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            Refresh
          </button>

          <button
            id="btn-export-csv"
            onClick={() => handleExportDataset('csv')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-black text-emerald-800 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            id="btn-print-directory"
            onClick={handlePrintList}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 text-xs font-black text-indigo-900 shadow-2xs transition-all cursor-pointer"
          >
            <Printer size={14} /> Print List
          </button>
        </div>
      </div>

      {/* STICKY SEARCH & FILTER CONTROLS */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        {/* TOP ROW: Search Input + Main Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-search-students"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Roll No, Admission No, Father, Mobile, Email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div className="lg:col-span-2">
            <select
              id="select-filter-class"
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="">🎓 All Classes</option>
              {classList.map(cls => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div className="lg:col-span-2">
            <select
              id="select-filter-teacher"
              value={selectedTeacher}
              onChange={e => {
                setSelectedTeacher(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="">👨‍🏫 All Teachers</option>
              {teachersList.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              id="select-filter-status"
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">🔍 All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="INACTIVE">🔴 Inactive</option>
              <option value="SUSPENDED">🟡 Suspended</option>
              <option value="PASSED_OUT">🎓 Passed Out</option>
            </select>
          </div>

          {/* Advanced Filter Toggle Button */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              id="btn-toggle-advanced-filters"
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center w-full ${
                isAdvancedFilterOpen
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle Advanced Filters"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* BOTTOM EXPANDABLE ROW: Advanced Combine Filters */}
        {isAdvancedFilterOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
            {/* Gender Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Gender</label>
              <select
                id="select-filter-gender"
                value={selectedGender}
                onChange={e => {
                  setSelectedGender(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Admission Year */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Adm. Year</label>
              <input
                id="input-filter-adm-year"
                type="text"
                value={admissionYear}
                onChange={e => {
                  setAdmissionYear(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. 2026"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium placeholder-slate-300"
              />
            </div>

            {/* Has Photo */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Has Photo</label>
              <select
                id="select-filter-has-photo"
                value={hasPhoto}
                onChange={e => {
                  setHasPhoto(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Has Documents */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Has Documents</label>
              <select
                id="select-filter-has-documents"
                value={hasDocuments}
                onChange={e => {
                  setHasDocuments(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Missing Mobile */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Missing Mobile</label>
              <select
                id="select-filter-missing-mobile"
                value={missingMobile}
                onChange={e => {
                  setMissingMobile(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All</option>
                <option value="true">Missing Only</option>
                <option value="false">Has Mobile</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                id="btn-reset-filters"
                onClick={handleResetFilters}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BULK ACTIONS TOOLBAR */}
      {selectedIds.length > 0 && (
        <div id="bulk-actions-toolbar" className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-900 text-white p-4 rounded-2xl shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-800 text-amber-300 font-black text-xs">
              {selectedIds.length} Selected
            </span>
            <p className="text-xs text-indigo-100 font-medium">
              Choose a bulk administrative operation:
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canReassignClassOrTeacher && (
              <button
                id="btn-bulk-assign-teacher"
                onClick={() => {
                  setBulkModalType('teacher');
                  setBulkTargetValue('');
                }}
                className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-700 transition-all cursor-pointer"
              >
                Assign Teacher
              </button>
            )}

            {canReassignClassOrTeacher && (
              <button
                id="btn-bulk-change-class"
                onClick={() => {
                  setBulkModalType('class');
                  setBulkTargetValue('');
                }}
                className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-700 transition-all cursor-pointer"
              >
                Change Class
              </button>
            )}

            {canChangeStatus && (
              <button
                id="btn-bulk-change-status"
                onClick={() => {
                  setBulkModalType('status');
                  setBulkTargetValue('ACTIVE');
                }}
                className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-700 transition-all cursor-pointer"
              >
                Update Status
              </button>
            )}

            <button
              id="btn-clear-selection"
              onClick={() => setSelectedIds([])}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* MAIN DATA TABLE / SKELETON / EMPTY / ERROR STATES */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="p-6 space-y-4">
            <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse flex items-center justify-between px-4">
                  <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/12"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Failed to Load Student Records</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchStudents}
              className="mt-2 inline-flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Retry Request
            </button>
          </div>
        ) : students.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400">
              <UserX size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Student Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No students match your active filters or search criteria. Try modifying your search term or clearing filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* TABLE CONTENT */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      id="checkbox-select-all"
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                  </th>
                  <th className="p-3.5">Photo</th>
                  <th className="p-3.5 cursor-pointer hover:text-slate-700" onClick={() => handleSort('rollNo')}>
                    <div className="flex items-center gap-1">
                      <span>Roll Number</span>
                      {sortBy === 'rollNo' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-slate-700" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Student Name</span>
                      {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-slate-700" onClick={() => handleSort('class')}>
                    <div className="flex items-center gap-1">
                      <span>Class / Batch</span>
                      {sortBy === 'class' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th className="p-3.5">Teacher</th>
                  <th className="p-3.5">Parent Info</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 cursor-pointer hover:text-slate-700" onClick={() => handleSort('admissionDate')}>
                    <div className="flex items-center gap-1">
                      <span>Adm. Date</span>
                      {sortBy === 'admissionDate' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {students.map(s => {
                  const isSelected = selectedIds.includes(s.id);
                  const name = s.name || s.personalInfo?.name || 'Unnamed';
                  const roll = s.rollNo || s.rollNumber || '-';
                  const cls = s.class || s.className || '-';
                  const teacher = s.assignedTeacher || 'Unassigned';
                  const parent = s.fatherName || s.parentInfo?.fatherName || s.motherName || '-';
                  const mobile = s.mobile || s.contactInfo?.mobile || '-';
                  const status = (s.status || 'ACTIVE').toUpperCase();
                  const admDate = s.admissionDate || s.createdAt || '-';
                  const photo = s.photoUrl || s.personalInfo?.photoUrl || '';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          id={`checkbox-student-${s.id}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(s.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                        />
                      </td>

                      {/* Photo */}
                      <td className="p-3.5">
                        {photo ? (
                          <img
                            src={photo}
                            alt={name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-100 text-indigo-900 flex items-center justify-center font-bold text-xs border border-slate-200">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>

                      {/* Roll Number */}
                      <td className="p-3.5 font-bold font-mono text-indigo-900">
                        {roll}
                      </td>

                      {/* Name */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{name}</div>
                        {s.email || s.contactInfo?.email ? (
                          <div className="text-[10px] text-slate-400 font-normal">{s.email || s.contactInfo?.email}</div>
                        ) : null}
                      </td>

                      {/* Class */}
                      <td className="p-3.5 text-slate-700">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-[11px] text-slate-800">
                          {cls}
                        </span>
                      </td>

                      {/* Teacher */}
                      <td className="p-3.5 text-slate-600">
                        {teacher}
                      </td>

                      {/* Parent */}
                      <td className="p-3.5 text-slate-600">
                        {parent}
                      </td>

                      {/* Mobile */}
                      <td className="p-3.5 font-mono text-slate-600">
                        {mobile}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'INACTIVE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Admission Date */}
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {admDate.split('T')[0]}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-view-${s.id}`}
                            onClick={() => handleViewProfile(s)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Profile & Timeline"
                          >
                            <Eye size={15} />
                          </button>

                          {canEditProfile && (
                            <button
                              id={`btn-edit-${s.id}`}
                              onClick={() => setEditingStudent({ ...s })}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Full Profile"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {canReassignClassOrTeacher && (
                            <button
                              id={`btn-class-${s.id}`}
                              onClick={() => openActionModal('class', s)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Change Class"
                            >
                              <BookOpen size={15} />
                            </button>
                          )}

                          {canReassignClassOrTeacher && (
                            <button
                              id={`btn-teacher-${s.id}`}
                              onClick={() => openActionModal('teacher', s)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                              title="Assign Teacher"
                            >
                              <UserPlus size={15} />
                            </button>
                          )}

                          {canEditProfile && (
                            <button
                              id={`btn-docs-${s.id}`}
                              onClick={() => openActionModal('documents', s)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Update Documents"
                            >
                              <FileText size={15} />
                            </button>
                          )}

                          {canChangeStatus && (
                            <button
                              id={`btn-status-${s.id}`}
                              onClick={() => openActionModal('status', s)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Update Status"
                            >
                              <UserCheck size={15} />
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

        {/* PAGINATION FOOTER */}
        {!loading && students.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-3">
              <span>Rows per page:</span>
              <select
                id="select-pagination-limit"
                value={limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>
                Showing <strong>{((page - 1) * limit) + 1}</strong> - <strong>{Math.min(page * limit, paginationInfo.totalCount)}</strong> of <strong>{paginationInfo.totalCount}</strong> students
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-prev-page"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 font-bold text-slate-700">
                Page {page} of {paginationInfo.totalPages || 1}
              </span>

              <button
                id="btn-next-page"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (paginationInfo.totalPages || 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW STUDENT PROFILE & TIMELINE MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="max-w-5xl w-full my-6">
            <StudentProfile
              studentId={viewingStudent.id}
              currentUser={currentUser}
              teachersList={teachersList}
              classList={classList}
              onClose={() => setViewingStudent(null)}
              onStudentUpdated={() => {
                fetchStudents();
                if (onRefreshGlobalData) onRefreshGlobalData();
              }}
            />
          </div>
        </div>
      )}

      {/* QUICK SINGLE ACTION MODAL (Change Class / Assign Teacher / Update Status / Documents) */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-sm text-slate-800 uppercase tracking-wider">
                {activeActionModal.type === 'class' && 'Reassign Class'}
                {activeActionModal.type === 'teacher' && 'Assign Teacher'}
                {activeActionModal.type === 'status' && 'Update Student Status'}
                {activeActionModal.type === 'documents' && 'Update Document Attachments'}
              </h3>
              <button onClick={() => setActiveActionModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {activeActionModal.type === 'class' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select New Class</label>
                  <select
                    value={modalInputClass}
                    onChange={e => setModalInputClass(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Class...</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeActionModal.type === 'teacher' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Assigned Teacher</label>
                  <select
                    value={modalInputTeacher}
                    onChange={e => setModalInputTeacher(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Teacher...</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.specialty?.join(', ') || 'Teacher'})</option>
                    ))}
                  </select>
                </div>
              )}

              {activeActionModal.type === 'status' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Status</label>
                  <select
                    value={modalInputStatus}
                    onChange={e => setModalInputStatus(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="PASSED_OUT">PASSED OUT</option>
                  </select>
                </div>
              )}

              {activeActionModal.type === 'documents' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Passport Photo URL</label>
                    <input
                      type="text"
                      value={modalInputDocs.photoUrl}
                      onChange={e => setModalInputDocs({ ...modalInputDocs, photoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Document Attachment URL</label>
                    <input
                      type="text"
                      value={modalInputDocs.documentUrl}
                      onChange={e => setModalInputDocs({ ...modalInputDocs, documentUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aadhar Number</label>
                    <input
                      type="text"
                      value={modalInputDocs.aadhar}
                      onChange={e => setModalInputDocs({ ...modalInputDocs, aadhar: e.target.value })}
                      placeholder="12-digit Aadhar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL EDIT PROFILE MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-sm text-slate-800 uppercase tracking-wider">
                Edit Student Profile: {editingStudent.name}
              </h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditProfileSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    value={editingStudent.name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editingStudent.rollNo || editingStudent.rollNumber || ''}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Father Name</label>
                  <input
                    type="text"
                    value={editingStudent.fatherName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, fatherName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mother Name</label>
                  <input
                    type="text"
                    value={editingStudent.motherName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, motherName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editingStudent.mobile || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingStudent.email || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK EXECUTION CONFIRMATION MODAL */}
      {bulkModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-black text-sm text-slate-800 uppercase tracking-wider">
              Bulk Operation: {selectedIds.length} Students Selected
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {bulkModalType === 'class' && 'Select Class to Assign to All'}
                {bulkModalType === 'teacher' && 'Select Teacher to Assign to All'}
                {bulkModalType === 'status' && 'Select New Status for All'}
              </label>

              {bulkModalType === 'class' && (
                <select
                  value={bulkTargetValue}
                  onChange={e => setBulkTargetValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">Select Target Class...</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              )}

              {bulkModalType === 'teacher' && (
                <select
                  value={bulkTargetValue}
                  onChange={e => setBulkTargetValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">Select Target Teacher...</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              )}

              {bulkModalType === 'status' && (
                <select
                  value={bulkTargetValue}
                  onChange={e => setBulkTargetValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="PASSED_OUT">PASSED OUT</option>
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkModalType(null)}
                className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkExecute}
                disabled={isBulkProcessing || !bulkTargetValue}
                className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isBulkProcessing ? 'Executing...' : 'Apply Bulk Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
