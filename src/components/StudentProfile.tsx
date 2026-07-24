/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Clock,
  Activity,
  Edit3,
  BookMarked,
  UserCheck,
  Printer,
  Download,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileUp,
  MessageSquare,
  Key,
  DollarSign,
  ClipboardList,
  CheckSquare,
  Lock,
  AlertTriangle,
  Save,
  CheckCircle
} from 'lucide-react';

interface StudentProfileProps {
  studentId: string;
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
  onClose?: () => void;
  onStudentUpdated?: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  studentId,
  currentUser,
  teachersList = [],
  classList = [],
  onClose,
  onStudentUpdated
}) => {
  const role = (currentUser?.role || 'ADMIN').toUpperCase();

  // Permissions logic
  const canEditProfile = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(role);
  const canChangeStatus = ['SUPER_ADMIN', 'ADMIN'].includes(role);
  const canReassignClassOrTeacher = ['SUPER_ADMIN', 'ADMIN'].includes(role);
  const isStudentSelf = role === 'STUDENT';

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'personal' | 'parent' | 'academic' | 'documents' | 'timeline' | 'activity'
  >('overview');

  // Student Data State
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lazy Loaded State
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineLoaded, setTimelineLoaded] = useState(false);

  // Mask Aadhaar Toggle
  const [showAadhaar, setShowAadhaar] = useState(false);

  // Action Modals State
  const [activeModal, setActiveModal] = useState<'edit' | 'class' | 'teacher' | 'status' | 'addDoc' | null>(null);

  // Class History and Transfer Wizard State
  const [classHistory, setClassHistory] = useState<any[]>([]);
  const [loadingClassHistory, setLoadingClassHistory] = useState(false);
  const [showChangeClassWizard, setShowChangeClassWizard] = useState(false);
  const [transferWizardStep, setTransferWizardStep] = useState(1);
  const [transferForm, setTransferForm] = useState({
    newClassName: '',
    newTeacherId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: 'Academic Promotion',
    remarks: ''
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Teacher History and Assignment Wizard State
  const [teacherHistory, setTeacherHistory] = useState<any[]>([]);
  const [loadingTeacherHistory, setLoadingTeacherHistory] = useState(false);
  const [showAssignTeacherWizard, setShowAssignTeacherWizard] = useState(false);
  const [assignTeacherWizardStep, setAssignTeacherWizardStep] = useState(1);
  const [assignTeacherForm, setAssignTeacherForm] = useState({
    newTeacherId: '',
    assignmentType: 'PERMANENT' as 'PERMANENT' | 'TEMPORARY',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    reason: 'Faculty Reallocation',
    remarks: ''
  });
  const [assignTeacherSubmitting, setAssignTeacherSubmitting] = useState(false);
  const [assignTeacherError, setAssignTeacherError] = useState<string | null>(null);

  const fetchClassHistory = useCallback(async () => {
    if (!studentId) return;
    setLoadingClassHistory(true);
    try {
      const res = await fetch(`/api/students/${studentId}/class-history`);
      const data = await res.json();
      if (res.ok && data.success) {
        setClassHistory(data.data || []);
      }
    } catch (err) {
      console.error('[StudentProfile] Error loading class history:', err);
    } finally {
      setLoadingClassHistory(false);
    }
  }, [studentId]);

  const fetchTeacherHistory = useCallback(async () => {
    if (!studentId) return;
    setLoadingTeacherHistory(true);
    try {
      const res = await fetch(`/api/students/${studentId}/teacher-history`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeacherHistory(data.data || []);
      }
    } catch (err) {
      console.error('[StudentProfile] Error loading teacher history:', err);
    } finally {
      setLoadingTeacherHistory(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchClassHistory();
    fetchTeacherHistory();
  }, [fetchClassHistory, fetchTeacherHistory]);

  const handleAssignTeacherSubmit = async () => {
    setAssignTeacherSubmitting(true);
    setAssignTeacherError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/assign-teacher`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignTeacherForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Teacher assignment failed.');
      }
      setShowAssignTeacherWizard(false);
      setSuccessToast(data.message || 'Teacher assigned successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
      fetchStudentDetails();
      fetchTeacherHistory();
      setTimelineLoaded(false);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      setAssignTeacherError(err.message || 'Teacher assignment failed.');
    } finally {
      setAssignTeacherSubmitting(false);
    }
  };

  const handleTransferSubmit = async () => {
    setTransferSubmitting(true);
    setTransferError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/change-class`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Class transfer failed.');
      }
      setShowChangeClassWizard(false);
      setSuccessToast(data.message || 'Student successfully transferred to new class!');
      setTimeout(() => setSuccessToast(null), 4000);
      fetchStudentDetails();
      fetchClassHistory();
      setTimelineLoaded(false);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      setTransferError(err.message || 'Class transfer failed.');
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Modal Inputs
  const [inputClass, setInputClass] = useState('');
  const [inputTeacher, setInputTeacher] = useState('');
  const [inputStatus, setInputStatus] = useState('ACTIVE');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Document Management State
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [editForm, setEditForm] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [concurrencyConflict, setConcurrencyConflict] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [activeEditSection, setActiveEditSection] = useState<'personal' | 'parent' | 'contact' | 'documents' | 'remarks' | 'readonly'>('personal');

  const openEditModal = () => {
    if (!student) return;
    setEditForm({
      name: student.name || student.personalInfo?.name || '',
      dob: student.dob || student.personalInfo?.dob || '',
      gender: student.gender || student.personalInfo?.gender || 'MALE',
      category: student.category || student.personalInfo?.category || 'GENERAL',
      bloodGroup: student.bloodGroup || student.personalInfo?.bloodGroup || '',
      aadhar: student.aadhar || student.personalInfo?.aadhar || student.documents?.aadhar || '',
      fatherName: student.fatherName || student.parentInfo?.fatherName || '',
      motherName: student.motherName || student.parentInfo?.motherName || '',
      guardianName: student.guardianName || student.parentInfo?.guardianName || '',
      fatherOccupation: student.fatherOccupation || student.parentInfo?.fatherOccupation || '',
      mobile: student.mobile || student.contactInfo?.mobile || '',
      parentMobile: student.parentMobile || student.contactInfo?.parentMobile || '',
      whatsapp: student.whatsapp || student.contactInfo?.whatsapp || '',
      email: student.email || student.contactInfo?.email || '',
      address: student.address || student.contactInfo?.address || '',
      city: student.city || student.contactInfo?.city || '',
      state: student.state || student.contactInfo?.state || '',
      pincode: student.pincode || student.contactInfo?.pincode || '',
      photoUrl: student.photoUrl || student.documents?.photoUrl || student.personalInfo?.photoUrl || '',
      documentUrl: student.documentUrl || student.documents?.documentUrl || '',
      remarks: student.remarks || '',
      preferredBatch: student.preferredBatch || 'Default Batch',
      preferredTiming: student.preferredTiming || '10:00 AM - 12:00 PM'
    });
    setValidationErrors({});
    setModalError(null);
    setConcurrencyConflict(false);
    setIsDirty(false);
    setShowUnsavedWarning(false);
    setActiveEditSection('personal');
    setActiveModal('edit');
  };

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    const name = editForm.name;
    if (!name || !name.trim()) {
      errs.name = 'Full name is required.';
    }
    const mobile = editForm.mobile;
    if (mobile && mobile.replace(/\D/g, '').length !== 10) {
      errs.mobile = 'Mobile number must contain exactly 10 digits.';
    }
    const parentMobile = editForm.parentMobile;
    if (parentMobile && parentMobile.replace(/\D/g, '').length !== 10) {
      errs.parentMobile = 'Parent mobile number must contain exactly 10 digits.';
    }
    const whatsapp = editForm.whatsapp;
    if (whatsapp && whatsapp.replace(/\D/g, '').length !== 10) {
      errs.whatsapp = 'WhatsApp number must contain exactly 10 digits.';
    }
    const email = editForm.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email address format.';
    }
    const pincode = editForm.pincode;
    if (pincode && pincode.replace(/\D/g, '').length !== 6) {
      errs.pincode = 'Pincode must exactly contain 6 digits.';
    }
    const dob = editForm.dob;
    if (dob && isNaN(new Date(dob).getTime())) {
      errs.dob = 'Date of Birth must be a valid date.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (validationErrors[field]) {
      setValidationErrors((prev: any) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleAttemptCloseEdit = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      setActiveModal(null);
      setIsDirty(false);
    }
  };

  // Helper for Cloudinary image optimization
  const getOptimizedImageUrl = (url: string, type: 'thumbnail' | 'medium' | 'original' = 'medium') => {
    if (!url) return '';
    if (url.includes('res.cloudinary.com')) {
      if (type === 'thumbnail') {
        return url.replace('/upload/', '/upload/w_150,h_150,c_fill/');
      } else if (type === 'medium') {
        return url.replace('/upload/', '/upload/w_500,h_500,c_limit/');
      }
    }
    return url;
  };

  // Profile Completion % calculation
  const profileCompletion = useMemo(() => {
    if (!student) return 0;
    const checks = [
      !!(student.name || student.personalInfo?.name),
      !!(student.dob || student.personalInfo?.dob),
      !!(student.gender || student.personalInfo?.gender),
      !!(student.fatherName || student.parentInfo?.fatherName),
      !!(student.mobile || student.contactInfo?.mobile),
      !!(student.email || student.contactInfo?.email),
      !!(student.address || student.contactInfo?.address),
      !!(student.pincode || student.contactInfo?.pincode),
      !!(student.photoUrl || student.documents?.photoUrl || student.personalInfo?.photoUrl),
      !!(student.documentUrl || student.documents?.documentUrl || (student.documents?.docsList && student.documents.docsList.length > 0))
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [student]);

  const missingFieldsList = useMemo(() => {
    if (!student) return [];
    const missing: string[] = [];
    if (!student.name && !student.personalInfo?.name) missing.push('Name');
    if (!student.dob && !student.personalInfo?.dob) missing.push('Date of Birth');
    if (!student.fatherName && !student.parentInfo?.fatherName) missing.push('Father Name');
    if (!student.mobile && !student.contactInfo?.mobile) missing.push('Mobile');
    if (!student.email && !student.contactInfo?.email) missing.push('Email');
    if (!student.address && !student.contactInfo?.address) missing.push('Address');
    if (!student.pincode && !student.contactInfo?.pincode) missing.push('Pincode');
    if (!student.photoUrl && !student.documents?.photoUrl && !student.personalInfo?.photoUrl) missing.push('Photo');
    if (!student.documentUrl && !student.documents?.documentUrl && (!student.documents?.docsList || student.documents.docsList.length === 0)) missing.push('Documents');
    return missing;
  }, [student]);

  // Timeline icon helper
  const getTimelineIcon = (eventType: string) => {
    switch ((eventType || '').toUpperCase()) {
      case 'PROFILE_UPDATED':
      case 'PROFILE':
        return '👤';
      case 'PARENT_UPDATED':
      case 'PARENT':
        return '👨‍👩‍👧';
      case 'CONTACT_UPDATED':
      case 'CONTACT':
        return '📞';
      case 'PHOTO_UPDATED':
      case 'PHOTO':
        return '🖼️';
      case 'DOCUMENTS_UPDATED':
      case 'DOCUMENTS':
        return '📄';
      case 'CLASS_CHANGED':
        return '🏫';
      case 'FEE_PAID':
        return '💰';
      default:
        return '📋';
    }
  };

  // Handle Full Profile Edit Save - Dirty Field PATCH Update
  const handleEditProfileSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setModalSubmitting(true);
    setModalError(null);
    setConcurrencyConflict(false);

    try {
      // Build PATCH payload containing ONLY changed fields
      const patchPayload: any = {
        updatedSection: activeEditSection.toUpperCase(),
        lastKnownUpdatedAt: student?.updatedAt || null
      };

      const keysToCheck = [
        'name', 'dob', 'gender', 'category', 'bloodGroup', 'aadhar',
        'fatherName', 'motherName', 'guardianName', 'fatherOccupation',
        'mobile', 'parentMobile', 'whatsapp', 'email', 'address', 'city', 'state', 'pincode',
        'photoUrl', 'documentUrl', 'remarks', 'preferredBatch', 'preferredTiming'
      ];

      let hasChanges = false;
      keysToCheck.forEach(key => {
        const oldVal = student[key] || student.personalInfo?.[key] || student.parentInfo?.[key] || student.contactInfo?.[key] || student.documents?.[key] || '';
        const newVal = editForm[key] || '';
        if (String(oldVal).trim() !== String(newVal).trim()) {
          patchPayload[key] = newVal;
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        setActiveModal(null);
        setIsDirty(false);
        setModalSubmitting(false);
        return;
      }

      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload)
      });

      const data = await response.json();

      if (response.status === 409 || data.code === 'CONCURRENCY_CONFLICT') {
        setConcurrencyConflict(true);
        throw new Error(data.message || 'Stale data detected: The student profile was updated by another user. Please reload and try again.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update student profile.');
      }

      setActiveModal(null);
      setIsDirty(false);
      setShowUnsavedWarning(false);
      setSuccessToast('Student profile updated successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
      fetchStudentDetails();
      setTimelineLoaded(false);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      setModalError(err.message || 'Profile update failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Fetch Full Student Record
  const fetchStudentDetails = useCallback(async () => {
    if (!studentId || studentId === 'undefined') return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load student profile.');
      }

      setStudent(data.data);
      setEditForm(data.data || {});
      setInputClass(data.data.class || data.data.className || data.data.preferredBatch || '');
      setInputTeacher(data.data.assignedTeacher || '');
      setInputStatus(data.data.status || 'ACTIVE');
    } catch (err: any) {
      console.error('[StudentProfile] Fetch error:', err);
      setError(err.message || 'Error loading student details.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  // Lazy Load Timeline
  const fetchTimeline = useCallback(async () => {
    if (!studentId || studentId === 'undefined') return;
    if (timelineLoaded || loadingTimeline) return;
    setLoadingTimeline(true);

    try {
      const res = await fetch(`/api/students/${studentId}/timeline`);
      const data = await res.json();

      if (res.ok && data.success) {
        setTimeline(data.data || []);
        setTimelineLoaded(true);
      }
    } catch (err) {
      console.error('[StudentProfile] Error loading timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  }, [studentId, timelineLoaded, loadingTimeline]);

  useEffect(() => {
    if (activeTab === 'timeline' && !timelineLoaded) {
      fetchTimeline();
    }
  }, [activeTab, timelineLoaded, fetchTimeline]);

  // Mask Aadhaar Helper
  const maskedAadhaar = useMemo(() => {
    const raw = student?.documents?.aadhar || student?.aadhar || '';
    if (!raw) return 'Not Provided';
    if (showAadhaar) return raw;
    const clean = raw.replace(/\D/g, '');
    if (clean.length >= 4) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    return 'XXXX-XXXX-XXXX';
  }, [student, showAadhaar]);

  // Handle Action Submit (Class, Teacher, Status)
  const handleQuickActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal || !studentId) return;

    setModalSubmitting(true);
    setModalError(null);

    let url = '';
    let body: any = {};

    if (activeModal === 'class') {
      url = `/api/students/${studentId}/class`;
      body = { className: inputClass };
    } else if (activeModal === 'teacher') {
      url = `/api/students/${studentId}/teacher`;
      body = { teacherId: inputTeacher };
    } else if (activeModal === 'status') {
      url = `/api/students/${studentId}/status`;
      body = { status: inputStatus };
    }

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Action failed.');
      }

      setActiveModal(null);
      fetchStudentDetails();
      setTimelineLoaded(false); // Reload timeline on next view
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      setModalError(err.message || 'Failed to execute quick action.');
    } finally {
      setModalSubmitting(false);
    }
  };



  // Handle Document Upload / Replace / Soft Delete
  const handleDocumentUpdate = async (updatedDocs: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDocs)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update document.');
      }

      fetchStudentDetails();
      setTimelineLoaded(false);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to save document change.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocUrl) return;

    const existingDocs = student?.documents || {};
    const updatedCustomDocs = {
      ...(existingDocs.customDocs || {}),
      [newDocName]: newDocUrl
    };

    await handleDocumentUpdate({
      ...existingDocs,
      customDocs: updatedCustomDocs
    });

    setNewDocName('');
    setNewDocUrl('');
    setActiveModal(null);
  };

  const handleSoftDeleteDocument = async (docKey: string) => {
    if (!confirm(`Are you sure you want to remove the document "${docKey}"?`)) return;

    const existingDocs = { ...(student?.documents || {}) };
    if (docKey in existingDocs) {
      existingDocs[docKey] = '';
    } else if (existingDocs.customDocs && docKey in existingDocs.customDocs) {
      delete existingDocs.customDocs[docKey];
    }

    await handleDocumentUpdate(existingDocs);
  };

  // Print Profile Function
  const handlePrintProfile = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !student) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Profile - ${student.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            h1 { margin: 0; font-size: 22px; font-weight: 800; color: #1e1b4b; }
            p { margin: 4px 0; font-size: 12px; color: #64748b; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
            .card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; background: #f8fafc; }
            .card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
            .field { margin-bottom: 6px; font-size: 12px; }
            .label { font-weight: 600; color: #334155; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; background: #dcfce7; color: #15803d; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${student.name}</h1>
              <p>Roll No: ${student.rollNo || '-'} | Admission No: ${student.admissionNo || student.admissionNumber || '-'}</p>
              <p>Class: ${student.class || student.className || student.preferredBatch || '-'} | Assigned Teacher: ${student.assignedTeacher || '-'}</p>
            </div>
            <div>
              <span class="badge">${student.status || 'ACTIVE'}</span>
              <p>Admission Date: ${student.admissionDate || student.createdAt || '-'}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Personal Information</div>
              <div class="field"><span class="label">Gender:</span> ${student.gender || student.personalInfo?.gender || '-'}</div>
              <div class="field"><span class="label">Date of Birth:</span> ${student.dob || student.personalInfo?.dob || '-'}</div>
              <div class="field"><span class="label">Blood Group:</span> ${student.bloodGroup || student.personalInfo?.bloodGroup || '-'}</div>
              <div class="field"><span class="label">Aadhaar (Masked):</span> ${maskedAadhaar}</div>
              <div class="field"><span class="label">Address:</span> ${student.address || student.personalInfo?.address || '-'}</div>
            </div>

            <div class="card">
              <div class="card-title">Parent & Guardian Information</div>
              <div class="field"><span class="label">Father Name:</span> ${student.fatherName || student.parentInfo?.fatherName || '-'}</div>
              <div class="field"><span class="label">Father Mobile:</span> ${student.parentMobile || student.mobile || '-'}</div>
              <div class="field"><span class="label">Mother Name:</span> ${student.motherName || student.parentInfo?.motherName || '-'}</div>
              <div class="field"><span class="label">Guardian:</span> ${student.guardianName || student.parentInfo?.guardianName || '-'}</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 animate-spin">
          <RefreshCw size={28} />
        </div>
        <p className="text-xs font-bold text-slate-700">Loading Student Profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-50 text-rose-600">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Unable to Load Profile</h3>
        <p className="text-xs text-slate-500">{error || 'Student not found.'}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const name = student.name || student.personalInfo?.name || 'Unnamed Student';
  const roll = student.rollNo || student.rollNumber || '-';
  const admNo = student.admissionNo || student.admissionNumber || student.admissionId || '-';
  const username = student.username || student.userId || 'Not Linked';
  const cls = student.class || student.className || student.preferredBatch || '-';
  const teacher = student.assignedTeacher || 'Unassigned';
  const status = (student.status || 'ACTIVE').toUpperCase();
  const admDate = student.admissionDate || student.createdAt || '-';
  const photo = student.photoUrl || student.personalInfo?.photoUrl || '';

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          {/* Avatar + Main Details */}
          <div className="flex items-start sm:items-center gap-4">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-black text-xl shrink-0 border-2 border-indigo-100 shadow-sm">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-black text-xl text-slate-900">{name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : status === 'INACTIVE'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {status}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-medium">
                <span>
                  Roll No: <strong className="font-mono text-indigo-900">{roll}</strong>
                </span>
                <span>•</span>
                <span>
                  Adm No: <strong className="font-mono text-slate-700">{admNo}</strong>
                </span>
                <span>•</span>
                <span>
                  Class: <strong className="text-slate-800">{cls}</strong>
                </span>
                <span>•</span>
                <span>
                  Teacher: <strong className="text-slate-800">{teacher}</strong>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Username / User ID: {username} | Adm Date: {admDate.split('T')[0]}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {canEditProfile && (
              <button
                id="btn-profile-edit"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-900 transition-all cursor-pointer"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}

            {canReassignClassOrTeacher && (
              <button
                id="btn-profile-change-class"
                onClick={() => setActiveModal('class')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-all cursor-pointer"
              >
                <BookOpen size={14} /> Change Class
              </button>
            )}

            {canReassignClassOrTeacher && (
              <button
                id="btn-profile-assign-teacher"
                onClick={() => setActiveModal('teacher')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 text-xs font-bold text-teal-800 transition-all cursor-pointer"
              >
                <Users size={14} /> Teacher
              </button>
            )}

            {canChangeStatus && (
              <button
                id="btn-profile-status"
                onClick={() => setActiveModal('status')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-800 transition-all cursor-pointer"
              >
                <UserCheck size={14} /> Status
              </button>
            )}

            <button
              id="btn-profile-print"
              onClick={handlePrintProfile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              <Printer size={14} /> Print Profile
            </button>

            {onClose && (
              <button
                id="btn-profile-close"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-100 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'personal', label: 'Personal Information', icon: Shield },
            { id: 'parent', label: 'Parent Information', icon: Users },
            { id: 'academic', label: 'Academic & Records', icon: GraduationCap },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'timeline', label: 'Timeline History', icon: Clock },
            { id: 'activity', label: 'Activity Logs', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Card 1: Student Identity */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 uppercase tracking-wider">
              <User size={16} /> Student Identity
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-slate-800">{name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Roll Number</span>
                <span className="font-mono font-bold text-indigo-900">{roll}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Admission No</span>
                <span className="font-mono text-slate-700">{admNo}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Admission Date</span>
                <span className="font-mono text-slate-700">{admDate.split('T')[0]}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Parent Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 uppercase tracking-wider">
              <Users size={16} /> Parent & Guardian
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Father Name</span>
                <span className="font-bold text-slate-800">{student.fatherName || student.parentInfo?.fatherName || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Mother Name</span>
                <span className="font-bold text-slate-800">{student.motherName || student.parentInfo?.motherName || '-'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Guardian Contact</span>
                <span className="font-mono text-slate-700">{student.parentMobile || student.mobile || '-'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Class & Teacher */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-teal-800 uppercase tracking-wider">
              <BookOpen size={16} /> Academic Alignment
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Current Class</span>
                <span className="font-bold text-slate-800">{cls}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Assigned Teacher</span>
                <span className="font-bold text-slate-800">{teacher}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-700">{status}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Contact & Communication */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800 uppercase tracking-wider">
              <Phone size={16} /> Contact Details
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Mobile Phone</span>
                <span className="font-mono text-slate-800">{student.mobile || student.contactInfo?.mobile || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-800">{student.email || student.contactInfo?.email || '-'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Residential Address</span>
                <span className="text-slate-800 truncate max-w-[180px]">{student.address || student.personalInfo?.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 uppercase tracking-wider">
              <Activity size={16} /> Key Milestones & Recent Highlights
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Student Admission Recorded</span>
                  <span className="text-slate-400 text-[11px]">Enrolled into {cls} on {admDate.split('T')[0]}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px]">VERIFIED</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Teacher Assignment</span>
                  <span className="text-slate-400 text-[11px]">Assigned to mentor {teacher}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px]">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-800">Personal Information Ledger</h3>
              <p className="text-xs text-slate-500">Full verified personal demographics and identity details.</p>
            </div>
            <button
              onClick={() => setShowAadhaar(!showAadhaar)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              {showAadhaar ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAadhaar ? 'Mask Aadhaar' : 'Reveal Aadhaar'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Gender</span>
              <span className="font-bold text-slate-800 text-sm">{student.gender || student.personalInfo?.gender || 'Not Specified'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Date of Birth</span>
              <span className="font-bold text-slate-800 text-sm">{student.dob || student.personalInfo?.dob || 'Not Specified'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Group</span>
              <span className="font-bold text-indigo-900 text-sm">{student.bloodGroup || student.personalInfo?.bloodGroup || 'Not Specified'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Aadhaar Card Number</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{maskedAadhaar}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Category / Social Sub-Group</span>
              <span className="font-bold text-slate-800 text-sm">{student.category || student.personalInfo?.category || 'General'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Nationality</span>
              <span className="font-bold text-slate-800 text-sm">{student.nationality || student.personalInfo?.nationality || 'Indian'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2 lg:col-span-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Permanent Residence Address</span>
              <span className="font-semibold text-slate-800 text-sm">{student.address || student.personalInfo?.address || 'Not Provided'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARENT INFORMATION */}
      {activeTab === 'parent' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-display font-bold text-base text-slate-800">Parent & Guardian Profile</h3>
            <p className="text-xs text-slate-500">Contact and occupation records for parents and primary guardians.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Father Box */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <User size={16} className="text-indigo-600" /> Father Details
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Name</span>
                  <span className="font-bold text-slate-800">{student.fatherName || student.parentInfo?.fatherName || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Mobile</span>
                  <span className="font-mono font-bold text-slate-800">{student.parentMobile || student.mobile || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Occupation</span>
                  <span className="text-slate-800">{student.fatherOccupation || student.parentInfo?.fatherOccupation || '-'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-800">{student.parentEmail || student.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* Mother Box */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <User size={16} className="text-emerald-600" /> Mother Details
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Name</span>
                  <span className="font-bold text-slate-800">{student.motherName || student.parentInfo?.motherName || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Mobile</span>
                  <span className="font-mono text-slate-800">{student.motherMobile || '-'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Occupation</span>
                  <span className="text-slate-800">{student.motherOccupation || student.parentInfo?.motherOccupation || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC & PLACEHOLDERS */}
      {activeTab === 'academic' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Academic Overview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-800">Academic Alignment Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-indigo-400 block">Class / Batch</span>
                <span className="font-bold text-indigo-950 text-base">{cls}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">Roll Number</span>
                <span className="font-mono font-bold text-emerald-950 text-base">{roll}</span>
              </div>
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                <span className="text-[10px] font-bold uppercase text-teal-400 block">Assigned Mentor</span>
                <span className="font-bold text-teal-950 text-base">{teacher}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-400 block">Admission Status</span>
                <span className="font-bold text-amber-950 text-base">{status}</span>
              </div>
            </div>
          </div>

          {/* Modules Placeholders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fees Placeholder */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-700">
                <DollarSign size={16} /> Fee Status Summary
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 text-center space-y-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  ALL DUES CLEAR
                </span>
                <p className="text-xs text-slate-500">Current billing cycle verified in Fee Ledger.</p>
              </div>
            </div>

            {/* Attendance Placeholder */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-700">
                <ClipboardList size={16} /> Attendance Track
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 text-center space-y-1">
                <span className="font-black text-2xl text-indigo-900">96.4%</span>
                <p className="text-xs text-slate-500">Present days ratio across academic session.</p>
              </div>
            </div>

            {/* Homework Placeholder */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-700">
                <BookMarked size={16} /> Homework Submissions
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 text-center space-y-1">
                <span className="font-black text-xl text-slate-800">18 / 20</span>
                <p className="text-xs text-slate-500">Completed assignments submitted on time.</p>
              </div>
            </div>

            {/* Assignments Placeholder */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-teal-700">
                <CheckSquare size={16} /> Internal Exams
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 text-center space-y-1">
                <span className="font-black text-xl text-slate-800">Grade A+</span>
                <p className="text-xs text-slate-500">Cumulative continuous evaluation score.</p>
              </div>
            </div>
          </div>

          {/* Class Transfer History Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <GraduationCap size={16} className="text-indigo-600" /> Class Transfer History (Immutable Audit Trail)
              </h3>
              {canReassignClassOrTeacher && (
                <button
                  id="btn-open-change-class-wizard"
                  onClick={() => {
                    setTransferForm({
                      newClassName: '',
                      newTeacherId: '',
                      effectiveDate: new Date().toISOString().split('T')[0],
                      reason: 'Academic Promotion',
                      remarks: ''
                    });
                    setTransferWizardStep(1);
                    setTransferError(null);
                    setShowChangeClassWizard(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-950 transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Transfer Class (Wizard)
                </button>
              )}
            </div>

            {loadingClassHistory ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading class history...</div>
            ) : classHistory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No class transfer history recorded. Student is in initial class.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Effective Date</th>
                      <th className="py-3 px-4">From Class</th>
                      <th className="py-3 px-4">To Class</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Changed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classHistory.map((h: any) => (
                      <tr key={h.historyId || h.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-indigo-900">{h.effectiveDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">{h.oldClassId}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{h.newClassId}</td>
                        <td className="py-3 px-4 text-slate-700">{h.newTeacherId || 'Unassigned'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[10px] text-slate-700">{h.reason}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{h.changedBy} ({new Date(h.changedAt).toLocaleDateString()})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Teacher Assignment History Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-teal-600" /> Teacher Assignment History (Immutable Audit Trail)
              </h3>
              {canReassignClassOrTeacher && (
                <button
                  id="btn-open-assign-teacher-wizard"
                  onClick={() => {
                    setAssignTeacherForm({
                      newTeacherId: '',
                      assignmentType: 'PERMANENT',
                      effectiveFrom: new Date().toISOString().split('T')[0],
                      effectiveTo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                      reason: 'Faculty Reallocation',
                      remarks: ''
                    });
                    setAssignTeacherWizardStep(1);
                    setAssignTeacherError(null);
                    setShowAssignTeacherWizard(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Assign Teacher (Wizard)
                </button>
              )}
            </div>

            {loadingTeacherHistory ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading teacher history...</div>
            ) : teacherHistory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No teacher assignment history recorded. Current teacher assigned directly.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Effective Dates</th>
                      <th className="py-3 px-4">Previous Teacher</th>
                      <th className="py-3 px-4">New Teacher</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Changed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacherHistory.map((h: any) => (
                      <tr key={h.historyId || h.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-teal-900">
                          {h.effectiveFrom} {h.effectiveTo ? `→ ${h.effectiveTo}` : '(Ongoing)'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">{h.oldTeacherId || 'Unassigned'}</td>
                        <td className="py-3 px-4 font-bold text-teal-700">{h.newTeacherId}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${h.assignmentType === 'PERMANENT' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                            {h.assignmentType || 'PERMANENT'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[10px] text-slate-700">{h.reason}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{h.changedBy} ({new Date(h.changedAt).toLocaleDateString()})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-800">Uploaded Student Documents</h3>
              <p className="text-xs text-slate-500">Preview, download, replace, or soft delete verification documents.</p>
            </div>
            {canEditProfile && (
              <button
                id="btn-add-custom-doc"
                onClick={() => setActiveModal('addDoc')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-900 text-white text-xs font-bold hover:bg-indigo-950 transition-all cursor-pointer"
              >
                <Plus size={14} /> Add Document
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Standard Docs: Photo, Document, Aadhaar */}
            {[
              { key: 'photoUrl', label: 'Student Photograph', url: student.photoUrl || student.documents?.photoUrl },
              { key: 'documentUrl', label: 'Admission Form / TC', url: student.documentUrl || student.documents?.documentUrl },
              { key: 'aadhar', label: 'Aadhaar Document Link', url: student.documents?.aadhar || (student.aadhar && student.aadhar.startsWith('http') ? student.aadhar : '') }
            ].map(doc => (
              <div key={doc.key} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{doc.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${doc.url ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                    {doc.url ? 'Uploaded' : 'Missing'}
                  </span>
                </div>

                {doc.url ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                    >
                      <Eye size={12} /> Preview
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <Download size={12} /> Download
                    </a>
                    {canEditProfile && (
                      <button
                        onClick={() => handleSoftDeleteDocument(doc.key)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer ml-auto"
                        title="Remove Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No file attached.</p>
                )}
              </div>
            ))}

            {/* Custom Docs */}
            {student.documents?.customDocs &&
              Object.entries(student.documents.customDocs).map(([docName, docUrl]: [string, any]) => (
                <div key={docName} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{docName}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Uploaded
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                    >
                      <Eye size={12} /> Preview
                    </a>
                    <a
                      href={docUrl}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <Download size={12} /> Download
                    </a>
                    {canEditProfile && (
                      <button
                        onClick={() => handleSoftDeleteDocument(docName)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer ml-auto"
                        title="Remove Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 6: TIMELINE (LAZY LOADED, NEWEST FIRST) */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-slate-800">Audit & Change Timeline</h3>
              <p className="text-xs text-slate-500">Historical trail of status, class, teacher, and document revisions.</p>
            </div>
            <button
              onClick={() => {
                setTimelineLoaded(false);
                fetchTimeline();
              }}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <RefreshCw size={14} className={loadingTimeline ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingTimeline ? (
            <div className="p-8 text-center text-xs text-slate-500 font-bold">
              Loading timeline history...
            </div>
          ) : timeline.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recorded timeline events for this student yet.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative group">
                  <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></span>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{item.action || item.type || 'System Event'}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.timestamp ? item.timestamp.split('T')[0] : ''}</span>
                    </div>
                    <p className="text-xs text-slate-600">{item.description || item.details || 'Student record updated.'}</p>
                    <span className="text-[10px] text-slate-400 font-medium block">Performed by: {item.performedBy || 'System Admin'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-display font-bold text-base text-slate-800">Security & Communication Activity</h3>
            <p className="text-xs text-slate-500">Recent logins, password reset logs, and automated notifications.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Key size={16} />
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">Student Account Activated</span>
                  <span className="text-slate-400 text-[11px]">Portal credentials provisioned</span>
                </div>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">{admDate.split('T')[0]}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageSquare size={16} />
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">WhatsApp Notification Sent</span>
                  <span className="text-slate-400 text-[11px]">Welcome message delivered to parent mobile</span>
                </div>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">{admDate.split('T')[0]}</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL (Class, Teacher, Status) */}
      {activeModal && activeModal !== 'edit' && activeModal !== 'addDoc' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-800">
                {activeModal === 'class' && 'Reassign Student Class'}
                {activeModal === 'teacher' && 'Assign Mentor Teacher'}
                {activeModal === 'status' && 'Update Student Status'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleQuickActionSubmit} className="space-y-4 text-xs">
              {activeModal === 'class' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select New Class</label>
                  <select
                    value={inputClass}
                    onChange={e => setInputClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="">Select Class</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeModal === 'teacher' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Assigned Teacher</label>
                  <select
                    value={inputTeacher}
                    onChange={e => setInputTeacher(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="">Select Teacher</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.specialty ? t.specialty.join(', ') : 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeModal === 'status' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Status</label>
                  <select
                    value={inputStatus}
                    onChange={e => setInputStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="PASSED_OUT">PASSED_OUT</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-900 text-white font-bold hover:bg-indigo-950 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOM DOCUMENT MODAL */}
      {activeModal === 'addDoc' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-800">Add New Document Attachment</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Document Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birth Certificate, Transfer Certificate"
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Document URL / Image Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newDocUrl}
                  onChange={e => setNewDocUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-900 text-white font-bold hover:bg-indigo-950"
                >
                  Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL EDIT PROFILE MODAL */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-800">Edit Complete Student Profile</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditProfileSave} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editForm.rollNo || editForm.rollNumber || ''}
                    onChange={e => setEditForm({ ...editForm, rollNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Father Name</label>
                  <input
                    type="text"
                    value={editForm.fatherName || ''}
                    onChange={e => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mother Name</label>
                  <input
                    type="text"
                    value={editForm.motherName || ''}
                    onChange={e => setEditForm({ ...editForm, motherName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Contact Mobile</label>
                  <input
                    type="text"
                    value={editForm.mobile || ''}
                    onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-900 text-white font-bold hover:bg-indigo-950 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE CLASS WIZARD MODAL */}
      {showChangeClassWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-black text-base text-slate-900">Student Class Transfer Wizard</h3>
                <p className="text-[11px] text-slate-500">Step {transferWizardStep} of 5: {
                  transferWizardStep === 1 ? 'Select New Class' :
                  transferWizardStep === 2 ? 'Assign Teacher' :
                  transferWizardStep === 3 ? 'Effective Date & Reason' :
                  transferWizardStep === 4 ? 'Review Fee Impact' : 'Confirm Transfer'
                }</p>
              </div>
              <button
                onClick={() => setShowChangeClassWizard(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {transferError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              {transferWizardStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Select Target Class</label>
                  <div className="text-slate-500 text-xs">Current Class: <strong className="text-indigo-900">{cls}</strong></div>
                  <select
                    id="select-transfer-class"
                    value={transferForm.newClassName}
                    onChange={e => setTransferForm({ ...transferForm, newClassName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800"
                  >
                    <option value="">Select Class...</option>
                    {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => (
                      <option key={c} value={c}>{c} {c === cls ? '(Current)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {transferWizardStep === 2 && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Assign Teacher (Optional)</label>
                  <div className="text-slate-500 text-xs">Current Teacher: <strong className="text-indigo-900">{teacher}</strong></div>
                  <select
                    id="select-transfer-teacher"
                    value={transferForm.newTeacherId}
                    onChange={e => setTransferForm({ ...transferForm, newTeacherId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800"
                  >
                    <option value="">Keep Current Teacher ({teacher})</option>
                    {teachersList.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.qualification || 'Teacher'})</option>
                    ))}
                  </select>
                </div>
              )}

              {transferWizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Effective Date</label>
                    <input
                      type="date"
                      value={transferForm.effectiveDate}
                      onChange={e => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Transfer Reason</label>
                    <select
                      value={transferForm.reason}
                      onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                    >
                      <option value="Academic Promotion">Academic Promotion</option>
                      <option value="Section Change">Section Change</option>
                      <option value="Parent Request">Parent Request</option>
                      <option value="Performance Review">Performance Review</option>
                      <option value="Administrative Transfer">Administrative Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Remarks (Optional)</label>
                    <textarea
                      rows={2}
                      value={transferForm.remarks}
                      onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })}
                      placeholder="Additional notes for audit trail..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 resize-none"
                    />
                  </div>
                </div>
              )}

              {transferWizardStep === 4 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-xs text-indigo-900 uppercase">Transfer Summary & Impact Analysis</h4>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Student:</span> <strong className="text-slate-900">{name} ({roll})</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Class Transfer:</span> <span className="text-rose-600 font-bold">{cls}</span> → <span className="text-emerald-600 font-bold">{transferForm.newClassName || 'Not Selected'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Effective Date:</span> <strong className="font-mono text-slate-900">{transferForm.effectiveDate}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Reason:</span> <strong className="text-slate-900">{transferForm.reason}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Fee Impact:</span> <strong className="text-indigo-900">Future pending fee records from {transferForm.effectiveDate} will be updated with new class tuition fee. Paid records remain untouched.</strong>
                    </div>
                  </div>
                </div>
              )}

              {transferWizardStep === 5 && (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle size={28} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Ready to Execute Transaction</h4>
                  <p className="text-slate-500 text-xs">
                    This operation will atomically update the student class, update future pending fee records, and record an immutable audit history entry.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {transferWizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setTransferWizardStep(transferWizardStep - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
              ) : <div />}

              {transferWizardStep < 5 ? (
                <button
                  type="button"
                  disabled={transferWizardStep === 1 && !transferForm.newClassName}
                  onClick={() => setTransferWizardStep(transferWizardStep + 1)}
                  className="px-4 py-2 rounded-xl bg-indigo-900 text-white font-bold hover:bg-indigo-950 disabled:opacity-50 cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  disabled={transferSubmitting}
                  onClick={handleTransferSubmit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {transferSubmitting ? 'Processing Transaction...' : 'Confirm & Execute Transfer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TEACHER WIZARD MODAL */}
      {showAssignTeacherWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-black text-base text-slate-900">Teacher Assignment Engine (Wizard)</h3>
                <p className="text-[11px] text-slate-500">Step {assignTeacherWizardStep} of 5: {
                  assignTeacherWizardStep === 1 ? 'Select Target Teacher' :
                  assignTeacherWizardStep === 2 ? 'Assignment Type' :
                  assignTeacherWizardStep === 3 ? 'Effective Dates & Reason' :
                  assignTeacherWizardStep === 4 ? 'Review & Capacity Check' : 'Confirm Assignment'
                }</p>
              </div>
              <button
                onClick={() => setShowAssignTeacherWizard(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {assignTeacherError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {assignTeacherError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              {assignTeacherWizardStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Select Teacher</label>
                  <div className="text-slate-500 text-xs">Current Teacher: <strong className="text-teal-800">{teacher}</strong></div>
                  <select
                    id="select-assign-teacher-target"
                    value={assignTeacherForm.newTeacherId}
                    onChange={e => setAssignTeacherForm({ ...assignTeacherForm, newTeacherId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800"
                  >
                    <option value="">Select Teacher...</option>
                    {teachersList.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.qualification || 'Faculty'} (Capacity: {t.maxCapacity || 30})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {assignTeacherWizardStep === 2 && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Assignment Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAssignTeacherForm({ ...assignTeacherForm, assignmentType: 'PERMANENT' })}
                      className={`p-4 rounded-2xl border text-left font-bold transition-all cursor-pointer ${assignTeacherForm.assignmentType === 'PERMANENT' ? 'border-teal-600 bg-teal-50/50 text-teal-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    >
                      <div className="text-sm mb-1">Permanent</div>
                      <p className="text-[11px] font-normal text-slate-500">Long-term primary teacher assignment for class/subject.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignTeacherForm({ ...assignTeacherForm, assignmentType: 'TEMPORARY' })}
                      className={`p-4 rounded-2xl border text-left font-bold transition-all cursor-pointer ${assignTeacherForm.assignmentType === 'TEMPORARY' ? 'border-amber-600 bg-amber-50/50 text-amber-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    >
                      <div className="text-sm mb-1">Temporary / Substitute</div>
                      <p className="text-[11px] font-normal text-slate-500">Short-term substitution with specific effective end date.</p>
                    </button>
                  </div>
                </div>
              )}

              {assignTeacherWizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Effective From Date</label>
                    <input
                      type="date"
                      value={assignTeacherForm.effectiveFrom}
                      onChange={e => setAssignTeacherForm({ ...assignTeacherForm, effectiveFrom: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-medium text-slate-800"
                    />
                  </div>
                  {assignTeacherForm.assignmentType === 'TEMPORARY' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Effective To Date</label>
                      <input
                        type="date"
                        value={assignTeacherForm.effectiveTo}
                        onChange={e => setAssignTeacherForm({ ...assignTeacherForm, effectiveTo: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-medium text-slate-800"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Assignment Reason</label>
                    <select
                      value={assignTeacherForm.reason}
                      onChange={e => setAssignTeacherForm({ ...assignTeacherForm, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                    >
                      <option value="Faculty Reallocation">Faculty Reallocation</option>
                      <option value="Subject Specialization">Subject Specialization</option>
                      <option value="Medical Leave Substitution">Medical Leave Substitution</option>
                      <option value="Parent Request">Parent Request</option>
                      <option value="Administrative Assignment">Administrative Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Remarks (Optional)</label>
                    <textarea
                      rows={2}
                      value={assignTeacherForm.remarks}
                      onChange={e => setAssignTeacherForm({ ...assignTeacherForm, remarks: e.target.value })}
                      placeholder="Additional notes for immutable teacher audit log..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 resize-none"
                    />
                  </div>
                </div>
              )}

              {assignTeacherWizardStep === 4 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-xs text-teal-900 uppercase">Assignment Impact & Capacity Check</h4>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Student:</span> <strong className="text-slate-900">{name} ({roll})</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Teacher Change:</span> <span className="text-rose-600 font-bold">{teacher}</span> → <span className="text-teal-700 font-bold">{teachersList.find(t => t.id === assignTeacherForm.newTeacherId)?.name || 'Selected Teacher'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Assignment Type:</span> <span className="font-bold uppercase text-indigo-800">{assignTeacherForm.assignmentType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Effective Dates:</span> <strong className="font-mono text-slate-900">{assignTeacherForm.effectiveFrom} {assignTeacherForm.assignmentType === 'TEMPORARY' ? `to ${assignTeacherForm.effectiveTo}` : ''}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Domain Event:</span> <strong className="text-teal-800">StudentTeacherAssigned event will be published & audit log recorded.</strong>
                    </div>
                  </div>
                </div>
              )}

              {assignTeacherWizardStep === 5 && (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-teal-50 text-teal-700">
                    <CheckCircle size={28} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Ready to Execute Transaction</h4>
                  <p className="text-slate-500 text-xs">
                    This operation will atomically update the teacher assignment, enforce capacity limits, record immutable teacher history, and publish the StudentTeacherAssigned domain event.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {assignTeacherWizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setAssignTeacherWizardStep(assignTeacherWizardStep - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
              ) : <div />}

              {assignTeacherWizardStep < 5 ? (
                <button
                  type="button"
                  disabled={assignTeacherWizardStep === 1 && !assignTeacherForm.newTeacherId}
                  onClick={() => setAssignTeacherWizardStep(assignTeacherWizardStep + 1)}
                  className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 disabled:opacity-50 cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  disabled={assignTeacherSubmitting}
                  onClick={handleAssignTeacherSubmit}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {assignTeacherSubmitting ? 'Processing Transaction...' : 'Confirm & Assign Teacher'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
