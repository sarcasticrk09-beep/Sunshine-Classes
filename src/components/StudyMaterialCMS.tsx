import React, { useState, useEffect, useMemo } from 'react';
import { 
  StudyMaterial, 
  StudyMaterialType, 
  StudyMaterialStatus, 
  User 
} from '../types';
import { 
  getStudyMaterials, 
  createStudyMaterial, 
  updateStudyMaterial, 
  deleteStudyMaterial, 
  bulkDeleteStudyMaterials, 
  bulkUpdateStatus, 
  generateSlug 
} from '../services/studyMaterialService';
import { SEED_STUDY_MATERIALS } from '../data';
import { 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Download, 
  Globe, 
  Lock, 
  CheckCircle, 
  XCircle, 
  Archive, 
  Share2, 
  Youtube, 
  Link as LinkIcon, 
  Sparkles, 
  BookOpen, 
  Tag, 
  TrendingUp, 
  BarChart2, 
  Layers, 
  CheckSquare, 
  Square, 
  X, 
  ExternalLink, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudyMaterialCMSProps {
  currentUser: User;
  onAuditLog?: (action: string, details: string) => void;
}

const MATERIAL_TYPES: { type: StudyMaterialType; label: string; icon: string; bg: string }[] = [
  { type: 'PDF', label: 'PDF Document', icon: '📄', bg: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' },
  { type: 'NOTES', label: 'Study Notes', icon: '📝', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
  { type: 'WORKSHEET', label: 'Worksheet / Assignment', icon: '📋', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
  { type: 'QUESTION_BANK', label: 'Question Bank', icon: '🗂️', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300' },
  { type: 'PYQ', label: 'Previous Year Question (PYQ)', icon: '📜', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300' },
  { type: 'SAMPLE_PAPER', label: 'Sample Paper', icon: '🎯', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
  { type: 'FORMULA_SHEET', label: 'Formula Sheet', icon: '🧮', bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300' },
  { type: 'NCERT_SOLUTION', label: 'NCERT Solution', icon: '📖', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300' },
  { type: 'VIDEO_LINK', label: 'YouTube / Video Lecture', icon: '🎥', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' },
  { type: 'EXTERNAL_LINK', label: 'External Resource', icon: '🔗', bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300' },
  { type: 'BLOG', label: 'Educational Article / Blog', icon: '📰', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300' }
];

const CLASSES_LIST = [
  'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 
  'Class 5', 'Class 4', 'Class 3', 'Class 2', 'Class 1', 'Board Specials'
];

const CMS_TREE_SECTIONS = [
  { id: 'ALL', label: 'All Content', icon: '✨' },
  { id: 'STUDY_MATERIAL', label: 'Study Material', icon: '📚' },
  { id: 'BLOG_ARTICLES', label: 'Blog Articles', icon: '✍️' },
  { id: 'ANNOUNCEMENTS', label: 'Announcements', icon: '📢' },
  { id: 'NEWS', label: 'News', icon: '📰' },
  { id: 'DOWNLOADS', label: 'Downloads', icon: '📥' },
  { id: 'RESOURCES', label: 'Resources', icon: '💡' },
  { id: 'GALLERY', label: 'Gallery', icon: '🖼️', isFuture: true },
  { id: 'EVENTS', label: 'Events', icon: '📅', isFuture: true },
];

const SUBJECTS_LIST = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 
  'English', 'Social Studies', 'Hindi', 'Computer', 'General Knowledge'
];

export const StudyMaterialCMS: React.FC<StudyMaterialCMSProps> = ({ currentUser, onAuditLog }) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>(SEED_STUDY_MATERIALS);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Search & Filter state
  const [selectedCmsSection, setSelectedCmsSection] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPublic, setSelectedPublic] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'MOST_VIEWED' | 'MOST_DOWNLOADED' | 'TITLE'>('NEWEST');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    class: string;
    subject: string;
    chapter: string;
    materialType: StudyMaterialType;
    fileUrl: string;
    thumbnailUrl: string;
    youtubeUrl: string;
    externalUrl: string;
    fileData: string;
    fileName: string;
    fileSize: string;
    isPublic: boolean;
    status: StudyMaterialStatus;
    tagsInput: string;
    seoTitle: string;
    metaDescription: string;
    keywordsInput: string;
  }>({
    title: '',
    slug: '',
    description: '',
    class: 'Class 10',
    subject: 'Mathematics',
    chapter: '',
    materialType: 'PDF',
    fileUrl: '',
    thumbnailUrl: '',
    youtubeUrl: '',
    externalUrl: '',
    fileData: '',
    fileName: '',
    fileSize: '1.2 MB',
    isPublic: true,
    status: 'PUBLISHED',
    tagsInput: 'Math, Class 10, Board',
    seoTitle: '',
    metaDescription: '',
    keywordsInput: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState<number | null>(null);

  // Authorization Helpers
  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'FOUNDER' || currentUser.role === 'CO_FOUNDER';
  const isTeacher = currentUser.role === 'TEACHER';
  const isReceptionist = currentUser.role === 'RECEPTIONIST';
  const canUpload = isSuperAdminOrAdmin || isTeacher;

  // Load materials from Firestore on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getStudyMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and Sorted list
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      // CMS Category Filter
      let matchCmsSection = true;
      if (selectedCmsSection === 'STUDY_MATERIAL') {
        matchCmsSection = ['NOTES', 'QUESTION_BANK', 'PYQ', 'SAMPLE_PAPER', 'NCERT_SOLUTION', 'WORKSHEET', 'PDF'].includes(m.materialType || 'PDF');
      } else if (selectedCmsSection === 'BLOG_ARTICLES') {
        matchCmsSection = m.materialType === 'BLOG';
      } else if (selectedCmsSection === 'ANNOUNCEMENTS') {
        matchCmsSection = m.materialType === 'NOTES' && (m.tags?.includes('Notice') || m.tags?.includes('Announcement') || m.title.toLowerCase().includes('notice'));
      } else if (selectedCmsSection === 'NEWS') {
        matchCmsSection = m.tags?.includes('News') || m.title.toLowerCase().includes('news') || m.title.toLowerCase().includes('result');
      } else if (selectedCmsSection === 'DOWNLOADS') {
        matchCmsSection = ['PDF', 'SAMPLE_PAPER', 'WORKSHEET'].includes(m.materialType || 'PDF');
      } else if (selectedCmsSection === 'RESOURCES') {
        matchCmsSection = ['FORMULA_SHEET', 'VIDEO_LINK', 'EXTERNAL_LINK'].includes(m.materialType || 'PDF');
      }

      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchSearch = !search || 
        m.title.toLowerCase().includes(search) || 
        m.subject.toLowerCase().includes(search) || 
        (m.chapter && m.chapter.toLowerCase().includes(search)) || 
        (m.description && m.description.toLowerCase().includes(search)) || 
        (m.tags && m.tags.some(t => t.toLowerCase().includes(search)));

      // Class Filter
      const matchClass = selectedClass === 'ALL' || m.class === selectedClass;

      // Subject Filter
      const matchSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;

      // Type Filter
      const matchType = selectedType === 'ALL' || m.materialType === selectedType;

      // Status Filter
      const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

      // Public Filter
      const matchPublic = selectedPublic === 'ALL' || 
        (selectedPublic === 'PUBLIC' && m.isPublic) || 
        (selectedPublic === 'PRIVATE' && !m.isPublic);

      return matchCmsSection && matchSearch && matchClass && matchSubject && matchType && matchStatus && matchPublic;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
      if (sortBy === 'OLDEST') return new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime();
      if (sortBy === 'MOST_VIEWED') return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === 'MOST_DOWNLOADED') return (b.downloadCount || 0) - (a.downloadCount || 0);
      if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [materials, selectedCmsSection, searchTerm, selectedClass, selectedSubject, selectedType, selectedStatus, selectedPublic, sortBy]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = materials.length;
    const published = materials.filter(m => m.status === 'PUBLISHED').length;
    const drafts = materials.filter(m => m.status === 'DRAFT').length;
    const archived = materials.filter(m => m.status === 'ARCHIVED').length;
    const totalViews = materials.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
    const totalDownloads = materials.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);
    return { total, published, drafts, archived, totalViews, totalDownloads };
  }, [materials]);

  // Form Handlers
  const handleOpenAddForm = () => {
    setEditingMaterial(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      class: 'Class 10',
      subject: 'Mathematics',
      chapter: '',
      materialType: 'PDF',
      fileUrl: '',
      thumbnailUrl: '',
      youtubeUrl: '',
      externalUrl: '',
      fileData: '',
      fileName: '',
      fileSize: '1.2 MB',
      isPublic: true,
      status: 'PUBLISHED',
      tagsInput: 'Class 10, Board Exam, Revision',
      seoTitle: '',
      metaDescription: '',
      keywordsInput: ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (material: StudyMaterial) => {
    if (isTeacher && material.createdBy !== currentUser.name && material.uploadedBy !== currentUser.name && !isSuperAdminOrAdmin) {
      alert('Teachers can only edit their own uploaded materials.');
      return;
    }
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      slug: material.slug || generateSlug(material.title),
      description: material.description || material.desc || '',
      class: material.class,
      subject: material.subject,
      chapter: material.chapter || '',
      materialType: material.materialType || 'PDF',
      fileUrl: material.fileUrl || material.file || '',
      thumbnailUrl: material.thumbnailUrl || '',
      youtubeUrl: material.youtubeUrl || '',
      externalUrl: material.externalUrl || '',
      fileData: material.fileData || '',
      fileName: material.file || '',
      fileSize: material.size || '1.2 MB',
      isPublic: material.isPublic !== undefined ? material.isPublic : true,
      status: material.status || 'PUBLISHED',
      tagsInput: material.tags ? material.tags.join(', ') : '',
      seoTitle: material.seoTitle || '',
      metaDescription: material.metaDescription || '',
      keywordsInput: material.keywords ? material.keywords.join(', ') : ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.title) ? generateSlug(newTitle) : prev.slug,
      seoTitle: prev.seoTitle === '' || prev.seoTitle.includes(prev.title) ? `${newTitle} PDF - Sunshine Classes` : prev.seoTitle
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security & File Type Validation
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!ext || !allowedExtensions.includes(ext)) {
      setFormError(`Invalid file type (.${ext}). Only PDF, Word, PowerPoint, ZIP, and Images are allowed.`);
      return;
    }

    // Size check (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFormError('File size exceeds maximum allowed limit of 25 MB.');
      return;
    }

    setFormError(null);
    setFileUploadProgress(20);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    // Simulate upload reading as data URL for instant offline capability or storage link
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setFileUploadProgress(percent);
      }
    };
    reader.onload = () => {
      setFileUploadProgress(100);
      setTimeout(() => setFileUploadProgress(null), 500);
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeInMB,
        fileData: reader.result as string,
        fileUrl: URL.createObjectURL(file)
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Material Title is required.');
      return;
    }

    const tagsArray = formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const keywordsArray = formData.keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const autoSlug = formData.slug.trim() || generateSlug(formData.title);

    try {
      if (editingMaterial) {
        // Edit existing
        const updates: Partial<StudyMaterial> = {
          title: formData.title,
          slug: autoSlug,
          description: formData.description,
          desc: formData.description,
          class: formData.class,
          subject: formData.subject,
          chapter: formData.chapter,
          materialType: formData.materialType,
          fileUrl: formData.fileUrl || formData.fileData,
          file: formData.fileName || editingMaterial.file,
          size: formData.fileSize || editingMaterial.size,
          thumbnailUrl: formData.thumbnailUrl,
          youtubeUrl: formData.youtubeUrl,
          externalUrl: formData.externalUrl,
          fileData: formData.fileData || editingMaterial.fileData,
          isPublic: formData.isPublic,
          status: formData.status,
          tags: tagsArray,
          seoTitle: formData.seoTitle || `${formData.title} PDF - Sunshine Classes`,
          metaDescription: formData.metaDescription || formData.description,
          keywords: keywordsArray
        };

        await updateStudyMaterial(editingMaterial.id, updates);

        setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? { ...m, ...updates } : m));

        if (onAuditLog) {
          onAuditLog('UPDATE_STUDY_MATERIAL', `Updated study material "${formData.title}" (${formData.class} ${formData.subject})`);
        }
      } else {
        // Create new
        const newMaterial = await createStudyMaterial({
          title: formData.title,
          slug: autoSlug,
          description: formData.description,
          class: formData.class,
          subject: formData.subject,
          chapter: formData.chapter,
          materialType: formData.materialType,
          fileUrl: formData.fileUrl || formData.fileData,
          file: formData.fileName || `${autoSlug}.pdf`,
          size: formData.fileSize,
          thumbnailUrl: formData.thumbnailUrl,
          youtubeUrl: formData.youtubeUrl,
          externalUrl: formData.externalUrl,
          fileData: formData.fileData,
          isPublic: formData.isPublic,
          status: formData.status,
          tags: tagsArray,
          seoTitle: formData.seoTitle || `${formData.title} PDF - Sunshine Classes`,
          metaDescription: formData.metaDescription || formData.description,
          keywords: keywordsArray,
          createdBy: currentUser.name,
          uploadedBy: currentUser.name,
          date: new Date().toISOString().split('T')[0]
        });

        setMaterials(prev => [newMaterial, ...prev]);

        if (onAuditLog) {
          onAuditLog('UPLOAD_STUDY_MATERIAL', `Uploaded study material "${formData.title}" for ${formData.class} ${formData.subject}`);
        }
      }

      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving study material:', err);
      setFormError('Failed to save study material. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const target = materials.find(m => m.id === id);
    if (!target) return;

    if (isTeacher && target.createdBy !== currentUser.name && target.uploadedBy !== currentUser.name && !isSuperAdminOrAdmin) {
      alert('Teachers can only delete their own uploaded materials.');
      return;
    }

    try {
      await deleteStudyMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      setDeleteConfirmId(null);

      if (onAuditLog) {
        onAuditLog('DELETE_STUDY_MATERIAL', `Deleted study material "${target.title}"`);
      }
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('Failed to delete material.');
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMaterials.map(m => m.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected items?`)) return;

    try {
      await bulkDeleteStudyMaterials(selectedIds);
      setMaterials(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
      if (onAuditLog) {
        onAuditLog('BULK_DELETE_STUDY_MATERIAL', `Bulk deleted ${selectedIds.length} study materials`);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const handleBulkStatusChange = async (status: StudyMaterialStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateStatus(selectedIds, status, status === 'PUBLISHED' ? true : undefined);
      setMaterials(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, status, isPublic: status === 'PUBLISHED' ? true : m.isPublic } : m));
      setSelectedIds([]);
      if (onAuditLog) {
        onAuditLog('BULK_STATUS_STUDY_MATERIAL', `Updated ${selectedIds.length} study materials status to ${status}`);
      }
    } catch (err) {
      console.error('Bulk status update failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Content & Study Material CMS
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                  CM-001
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized management for public notes, assignments, worksheets, PYQs, and video lectures.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#/study-material"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-all shadow-xs"
            id="btn-public-study-material-portal"
          >
            <Globe size={16} className="text-indigo-500" />
            Public Website Portal
            <ExternalLink size={14} className="opacity-60" />
          </a>

          {canUpload ? (
            <button
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              id="btn-upload-new-study-material"
            >
              <Plus size={18} />
              Upload Material
            </button>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Lock size={14} />
              View-Only Access (Receptionist)
            </div>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Resources</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">Published</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.published}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{stats.drafts}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Archived</div>
          <div className="text-2xl font-extrabold text-slate-500 mt-1">{stats.archived}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
            <Eye size={12} /> Total Views
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{stats.totalViews}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
            <Download size={12} /> Downloads
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">{stats.totalDownloads}</div>
        </div>
      </div>

      {/* CMS TAXONOMY TREE TABS */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pb-2">
          CMS Taxonomy Categories
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {CMS_TREE_SECTIONS.map(sec => {
            const isActive = selectedCmsSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedCmsSection(sec.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
                id={`cms-admin-tree-tab-${sec.id.toLowerCase()}`}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
                {sec.isFuture && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                    Future
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Title, Subject, Chapter, Tags or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="input-cms-search"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="select-filter-class"
            >
              <option value="ALL">All Classes</option>
              {CLASSES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="select-filter-subject"
            >
              <option value="ALL">All Subjects</option>
              {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="select-filter-type"
            >
              <option value="ALL">All Resource Types</option>
              {MATERIAL_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="select-filter-status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="select-filter-sort"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="MOST_VIEWED">Most Viewed</option>
              <option value="MOST_DOWNLOADED">Most Downloaded</option>
              <option value="TITLE">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* BULK ACTIONS TOOLBAR */}
        {selectedIds.length > 0 && (
          <div className="bg-amber-500/10 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <CheckSquare size={16} className="text-amber-600" />
              {selectedIds.length} item(s) selected
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange('PUBLISHED')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all"
                id="btn-bulk-publish"
              >
                Bulk Publish
              </button>
              <button
                onClick={() => handleBulkStatusChange('ARCHIVED')}
                className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium transition-all"
                id="btn-bulk-archive"
              >
                Bulk Archive
              </button>
              {canUpload && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-all"
                  id="btn-bulk-delete"
                >
                  Bulk Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TABLE / LIST OF MATERIALS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Class & Subject</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Metrics</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <BookOpen size={40} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-base">No study materials found</p>
                    <p className="text-xs mt-1">Try adjusting search query or upload a new resource.</p>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item) => {
                  const typeObj = MATERIAL_TYPES.find(t => t.type === item.materialType) || MATERIAL_TYPES[0];
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate" title={item.title}>
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">/{item.slug}</span>
                          {item.chapter && <span className="truncate">| {item.chapter}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.class}</div>
                        <div className="text-xs text-slate-500">{item.subject}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeObj.bg}`}>
                          <span>{typeObj.icon}</span>
                          {typeObj.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {item.status === 'PUBLISHED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle size={12} /> Published
                            </span>
                          )}
                          {item.status === 'DRAFT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Draft
                            </span>
                          )}
                          {item.status === 'ARCHIVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <Archive size={12} /> Archived
                            </span>
                          )}

                          {item.isPublic ? (
                            <span className="text-xs text-emerald-600" title="Publicly accessible on website">
                              <Globe size={14} />
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400" title="Private">
                              <Lock size={14} />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-3">
                          <span title="Views" className="flex items-center gap-1">
                            <Eye size={12} className="text-indigo-500" /> {item.viewCount || 0}
                          </span>
                          <span title="Downloads" className="flex items-center gap-1">
                            <Download size={12} className="text-teal-500" /> {item.downloadCount || 0}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewMaterial(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Preview Material"
                            id={`btn-preview-${item.id}`}
                          >
                            <Eye size={16} />
                          </button>

                          {canUpload && (
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Material"
                              id={`btn-edit-${item.id}`}
                            >
                              <Edit3 size={16} />
                            </button>
                          )}

                          {canUpload && (
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete Material"
                              id={`btn-delete-${item.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT MATERIAL FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={20} className="text-amber-400" />
                  <h3 className="font-bold text-lg">
                    {editingMaterial ? 'Edit Study Material' : 'Upload New Study Material'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resource Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Class 10 Math Formula Cheat-Sheet"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="input-material-title"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      URL Slug (SEO friendly)
                    </label>
                    <input
                      type="text"
                      placeholder="class-10-math-formula-cheat-sheet"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="input-material-slug"
                    />
                  </div>

                  {/* Material Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Material Type
                    </label>
                    <select
                      value={formData.materialType}
                      onChange={(e) => setFormData({ ...formData, materialType: e.target.value as StudyMaterialType })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="select-material-type"
                    >
                      {MATERIAL_TYPES.map(t => (
                        <option key={t.type} value={t.type}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Class / Cohort
                    </label>
                    <select
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="select-material-class"
                    >
                      {CLASSES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="select-material-subject"
                    >
                      {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Chapter */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chapter (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Chapter 3 - Pair of Linear Equations in Two Variables"
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="input-material-chapter"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Summary / Overview
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of what students will learn from this study resource..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="input-material-description"
                    />
                  </div>

                  {/* FILE ATTACHMENT OR VIDEO LINK */}
                  <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Upload size={14} className="text-amber-500" />
                      Resource Content Attachment
                    </div>

                    {formData.materialType === 'VIDEO_LINK' ? (
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          YouTube Video URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={formData.youtubeUrl}
                          onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          id="input-material-youtube-url"
                        />
                      </div>
                    ) : formData.materialType === 'EXTERNAL_LINK' ? (
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          External Link URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={formData.externalUrl}
                          onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          id="input-material-external-url"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-all shadow-xs">
                            <Upload size={14} />
                            Choose File (PDF, DOCX, ZIP, PPT, Images)
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.webp"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-input-study-material"
                            />
                          </label>
                          {formData.fileName && (
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono truncate max-w-xs">
                              {formData.fileName} ({formData.fileSize})
                            </span>
                          )}
                        </div>

                        {fileUploadProgress !== null && (
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full transition-all duration-300"
                              style={{ width: `${fileUploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Math, Class 10, Board Exam, Revision"
                      value={formData.tagsInput}
                      onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="input-material-tags"
                    />
                  </div>

                  {/* Status & Visibility */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as StudyMaterialStatus })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      id="select-material-status"
                    >
                      <option value="PUBLISHED">Published (Live)</option>
                      <option value="DRAFT">Draft (Hidden)</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        id="checkbox-material-is-public"
                      />
                      Make available on Public Website without login
                    </label>
                  </div>

                  {/* SEO Section */}
                  <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      Search Engine Optimization (SEO)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">SEO Title Tag</label>
                        <input
                          type="text"
                          placeholder="Class 10 Math Formula Cheat Sheet PDF"
                          value={formData.seoTitle}
                          onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                          id="input-material-seo-title"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Meta Description</label>
                        <input
                          type="text"
                          placeholder="Free PDF download of Class 10 Maths formula sheet..."
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                          id="input-material-meta-description"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all"
                    id="btn-submit-material-form"
                  >
                    {editingMaterial ? 'Save Changes' : 'Upload & Publish Resource'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-amber-400" />
                  <h3 className="font-bold text-base truncate">{previewMaterial.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                    {previewMaterial.class}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold">
                    {previewMaterial.subject}
                  </span>
                  {previewMaterial.chapter && (
                    <span className="text-slate-500">| {previewMaterial.chapter}</span>
                  )}
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {previewMaterial.description || previewMaterial.desc}
                </p>

                {previewMaterial.tags && previewMaterial.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewMaterial.tags.map((t, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <div>Format: <strong className="text-slate-900 dark:text-white">{previewMaterial.materialType}</strong></div>
                    <div>Views: <strong>{previewMaterial.viewCount || 0}</strong> | Downloads: <strong>{previewMaterial.downloadCount || 0}</strong></div>
                  </div>

                  {previewMaterial.fileUrl ? (
                    <a
                      href={previewMaterial.fileUrl}
                      download={previewMaterial.file || 'study_material.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs"
                    >
                      <Download size={14} /> Download File
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No file attached</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 text-right">
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full text-center space-y-4"
            >
              <div className="p-3 bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Delete Study Material?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this material? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteItem(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  id="btn-confirm-delete-material"
                >
                  Yes, Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyMaterialCMS;
