import React, { useState, useEffect, useMemo } from 'react';
import { StudyMaterial, StudyMaterialType } from '../types';
import { getPublicStudyMaterials, incrementDownloadCount, incrementViewCount } from '../services/studyMaterialService';
import { SEED_STUDY_MATERIALS } from '../data';
import { 
  BookOpen, 
  Search, 
  Download, 
  Eye, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  GraduationCap, 
  Share2, 
  ExternalLink, 
  Youtube, 
  CheckCircle2, 
  ArrowLeft,
  X,
  Tag,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CLASSES = ['Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Board Specials'];
const SUBJECTS = ['All Subjects', 'Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

const CMS_TAXONOMY_SECTIONS = [
  { id: 'ALL', label: 'All Content', icon: '✨', desc: 'Complete Content Library' },
  { id: 'STUDY_MATERIAL', label: 'Study Material', icon: '📚', desc: 'Notes, PYQs, Question Banks & Solutions' },
  { id: 'BLOG_ARTICLES', label: 'Blog Articles', icon: '✍️', desc: 'Educational Articles, Guides & Exam Tips' },
  { id: 'ANNOUNCEMENTS', label: 'Announcements', icon: '📢', desc: 'Important Notices & Circulars' },
  { id: 'NEWS', label: 'News', icon: '📰', desc: 'Sunshine Classes Updates & Milestones' },
  { id: 'DOWNLOADS', label: 'Downloads', icon: '📥', desc: 'Forms, Prospectus & Syllabus PDFs' },
  { id: 'RESOURCES', label: 'Resources', icon: '💡', desc: 'Formula Sheets, Reference Links & Video Lectures' },
  { id: 'GALLERY', label: 'Gallery', icon: '🖼️', desc: 'Campus Photos & Event Media', isFuture: true },
  { id: 'EVENTS', label: 'Events', icon: '📅', desc: 'Academic Seminars & Workshops', isFuture: true },
];
const RESOURCE_TYPES: { type: string; label: string; icon: string }[] = [
  { type: 'ALL', label: 'All Resources', icon: '📚' },
  { type: 'NOTES', label: 'Notes', icon: '📝' },
  { type: 'FORMULA_SHEET', label: 'Formula Sheets', icon: '🧮' },
  { type: 'WORKSHEET', label: 'Worksheets', icon: '📋' },
  { type: 'QUESTION_BANK', label: 'Question Banks', icon: '🗂️' },
  { type: 'PYQ', label: 'PYQs (Previous Years)', icon: '📜' },
  { type: 'SAMPLE_PAPER', label: 'Sample Papers', icon: '🎯' },
  { type: 'NCERT_SOLUTION', label: 'NCERT Solutions', icon: '📖' },
  { type: 'VIDEO_LINK', label: 'Video Lectures', icon: '🎥' }
];

export const PublicStudyMaterialPage: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeCmsSection, setActiveCmsSection] = useState<string>('STUDY_MATERIAL');
  const [activeClass, setActiveClass] = useState<string>('Class 10');
  const [activeSubject, setActiveSubject] = useState<string>('All Subjects');
  const [activeType, setActiveType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  // Load public study materials on mount
  useEffect(() => {
    loadPublicMaterials();
  }, []);

  const loadPublicMaterials = async () => {
    setLoading(true);
    try {
      const data = await getPublicStudyMaterials();
      setMaterials(data.length > 0 ? data : SEED_STUDY_MATERIALS.filter(m => m.isPublic));
    } catch (err) {
      console.warn('Using fallback study material seed data:', err);
      setMaterials(SEED_STUDY_MATERIALS.filter(m => m.isPublic));
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      // CMS Section Match
      let matchCmsSection = true;
      if (activeCmsSection === 'STUDY_MATERIAL') {
        matchCmsSection = ['NOTES', 'QUESTION_BANK', 'PYQ', 'SAMPLE_PAPER', 'NCERT_SOLUTION', 'WORKSHEET', 'PDF'].includes(item.materialType || 'PDF');
      } else if (activeCmsSection === 'BLOG_ARTICLES') {
        matchCmsSection = item.materialType === 'BLOG';
      } else if (activeCmsSection === 'ANNOUNCEMENTS') {
        matchCmsSection = item.materialType === 'NOTES' && (item.tags?.includes('Notice') || item.tags?.includes('Announcement') || item.title.toLowerCase().includes('notice'));
      } else if (activeCmsSection === 'NEWS') {
        matchCmsSection = item.tags?.includes('News') || item.title.toLowerCase().includes('news') || item.title.toLowerCase().includes('result');
      } else if (activeCmsSection === 'DOWNLOADS') {
        matchCmsSection = ['PDF', 'SAMPLE_PAPER', 'WORKSHEET'].includes(item.materialType || 'PDF');
      } else if (activeCmsSection === 'RESOURCES') {
        matchCmsSection = ['FORMULA_SHEET', 'VIDEO_LINK', 'EXTERNAL_LINK'].includes(item.materialType || 'PDF');
      }

      // Class Match
      const matchClass = !activeClass || item.class === activeClass;

      // Subject Match
      const matchSubject = activeSubject === 'All Subjects' || item.subject === activeSubject;

      // Type Match
      const matchType = activeType === 'ALL' || item.materialType === activeType;

      // Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        item.title.toLowerCase().includes(query) || 
        item.subject.toLowerCase().includes(query) || 
        (item.chapter && item.chapter.toLowerCase().includes(query)) || 
        (item.description && item.description.toLowerCase().includes(query)) || 
        (item.tags && item.tags.some(t => t.toLowerCase().includes(query)));

      return matchCmsSection && matchClass && matchSubject && matchType && matchQuery;
    });
  }, [materials, activeCmsSection, activeClass, activeSubject, activeType, searchQuery]);

  // Handle Download
  const handleDownload = async (item: StudyMaterial) => {
    try {
      await incrementDownloadCount(item.id);
      setMaterials(prev => prev.map(m => m.id === item.id ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m));
    } catch (e) {
      console.warn('Could not record download metric:', e);
    }

    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank');
    } else {
      // Fallback demo blob download
      const blob = new Blob([`Sunshine Classes Study Resource: ${item.title}\nClass: ${item.class}\nSubject: ${item.subject}\n\nContent overview: ${item.description}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.slug || 'study_material'}.txt`;
      a.click();
    }
  };

  // Handle View Modal
  const handleViewDetails = async (item: StudyMaterial) => {
    setSelectedMaterial(item);
    try {
      await incrementViewCount(item.id);
      setMaterials(prev => prev.map(m => m.id === item.id ? { ...m, viewCount: (m.viewCount || 0) + 1 } : m));
    } catch (e) {
      console.warn('Could not record view metric:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* TOP HERO BRANDING HEADER */}
      <header className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white py-12 px-4 shadow-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <a 
              href="#/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-all"
            >
              <ArrowLeft size={14} /> Back to Home
            </a>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={14} /> Free Public Learning Library
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sunshine Classes Study Material Portal
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Free high-quality NCERT notes, formula cheat-sheets, worksheets, chapterwise question banks, and pre-board sample papers for Class 1 to Class 10.
          </p>

          {/* BREADCRUMBS NAVIGATION */}
          <nav className="flex items-center gap-2 text-xs text-amber-200/80 pt-2">
            <a href="#/" className="hover:underline">Home</a>
            <ChevronRight size={12} />
            <span className="text-white font-semibold">Study Material</span>
            {activeClass && (
              <>
                <ChevronRight size={12} />
                <span className="text-amber-400 font-semibold">{activeClass}</span>
              </>
            )}
            {activeSubject !== 'All Subjects' && (
              <>
                <ChevronRight size={12} />
                <span className="text-amber-300">{activeSubject}</span>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* CMS TAXONOMY CATEGORIES TAB BAR */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-1 pb-2">
            CMS Content Categories
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CMS_TAXONOMY_SECTIONS.map(sec => {
              const isActive = activeCmsSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveCmsSection(sec.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                  id={`cms-cat-tab-${sec.id.toLowerCase()}`}
                >
                  <span className="text-base">{sec.icon}</span>
                  <span>{sec.label}</span>
                  {sec.isFuture && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                      Q4 2026
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CLASS SELECTION TABS */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {CLASSES.map(cls => (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeClass === cls 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeClass} study materials by topic, chapter, or keyword...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <select
              value={activeSubject}
              onChange={(e) => setActiveSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* RESOURCE TYPE PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {RESOURCE_TYPES.map(rt => (
            <button
              key={rt.type}
              onClick={() => setActiveType(rt.type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                activeType === rt.type 
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 border-transparent shadow-xs' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <span>{rt.icon}</span>
              {rt.label}
            </button>
          ))}
        </div>

        {/* MATERIAL CARDS GRID */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Loading educational resources...</p>
          </div>
        ) : activeCmsSection === 'GALLERY' ? (
          <div className="bg-gradient-to-br from-purple-900/10 via-white to-amber-500/10 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 p-12 rounded-3xl border border-purple-200 dark:border-purple-800/40 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🖼️
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
              Future CMS Module • Planned Q4 2026
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Sunshine Classes Visual Media Gallery
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Our high-resolution campus photo gallery, annual function highlights, student felicitation ceremony albums, and science exhibition memories will launch here in Q4 2026.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setActiveCmsSection('STUDY_MATERIAL')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-md hover:bg-amber-600 transition-all"
              >
                Browse Study Material
              </button>
            </div>
          </div>
        ) : activeCmsSection === 'EVENTS' ? (
          <div className="bg-gradient-to-br from-indigo-900/10 via-white to-amber-500/10 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 p-12 rounded-3xl border border-indigo-200 dark:border-indigo-800/40 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-3xl mx-auto shadow-inner">
              📅
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              Future CMS Module • Planned Q4 2026
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Academic Seminars & Competition Calendar
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Interactive event registration for Olympiad prep workshops, Parent-Teacher Meets (PTM), Board Exam stress buster sessions, and guest lectures launching Q4 2026.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setActiveCmsSection('STUDY_MATERIAL')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-md hover:bg-amber-600 transition-all"
              >
                Browse Study Material
              </button>
            </div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <BookOpen size={48} className="mx-auto text-amber-500/40" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No materials match your filter
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We update our public study library weekly. Try clearing your search or switching subject filters.
            </p>
            <button
              onClick={() => {
                setActiveSubject('All Subjects');
                setActiveType('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Class and Subject Badge */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {item.class}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {item.subject}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <FileCheck size={13} /> {item.size || 'PDF'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => handleViewDetails(item)}
                    className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {item.title}
                  </h3>

                  {/* Chapter */}
                  {item.chapter && (
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Layers size={13} /> {item.chapter}
                    </div>
                  )}

                  {/* Summary */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description || item.desc}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CARD FOOTER */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1" title="Total Views">
                      <Eye size={12} className="text-indigo-500" /> {item.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Total Downloads">
                      <Download size={12} className="text-teal-500" /> {item.downloadCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* DETAIL PREVIEW MODAL */}
      <AnimatePresence>
        {selectedMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-amber-400" />
                  <h3 className="font-bold text-base truncate">{selectedMaterial.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold">
                    {selectedMaterial.class}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                    {selectedMaterial.subject}
                  </span>
                  {selectedMaterial.chapter && (
                    <span className="text-slate-500 font-semibold">| {selectedMaterial.chapter}</span>
                  )}
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedMaterial.description || selectedMaterial.desc}
                </p>

                {selectedMaterial.youtubeUrl && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <Youtube size={18} /> Video Lecture Available
                    </span>
                    <a
                      href={selectedMaterial.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Watch Video
                    </a>
                  </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <div>Author / Faculty: <strong>{selectedMaterial.createdBy || 'Sunshine Classes'}</strong></div>
                    <div>Downloads: <strong>{selectedMaterial.downloadCount || 0}</strong></div>
                  </div>

                  <button
                    onClick={() => handleDownload(selectedMaterial)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Download size={15} /> Free Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicStudyMaterialPage;
