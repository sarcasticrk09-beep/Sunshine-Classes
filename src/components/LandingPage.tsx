/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  Users,
  CheckCircle,
  FileText,
  Mail,
  Camera,
  Layers,
  ArrowUp,
  X,
  Plus,
  Search,
  Lock,
  AlertCircle,
  Sun,
  Moon,
  Facebook,
  Instagram,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Upload,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, BlogPost, Testimonial, Topper, StudyMaterial, GalleryItem, Admission, Student, FounderMember, SubscriptionConfig } from '../types';
import SunshineLogo from './SunshineLogo';
import { CloudinaryUpload } from './CloudinaryUpload';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const WhatsAppIcon = ({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.705 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function maskName(name: string): string {
  if (!name) return '';
  return name.split(' ').map(word => {
    if (word.length <= 2) return word.charAt(0) + '*'.repeat(word.length - 1);
    return word.slice(0, 2) + '*'.repeat(word.length - 2);
  }).join(' ');
}

function maskMobile(mobile: string): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length <= 4) return '*'.repeat(digits.length);
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

interface LandingPageProps {
  courses: Course[];
  blogs: BlogPost[];
  testimonials: Testimonial[];
  toppers: Topper[];
  onAddReview: (review: Omit<Testimonial, 'id'>) => void;
  studyMaterials: StudyMaterial[];
  gallery: GalleryItem[];
  onNavigateToERP: () => void;
  onAddAdmission: (adm: Omit<Admission, 'id' | 'status' | 'date'>) => Promise<string> | string;
  admissions?: Admission[];
  students?: Student[];
  founders?: FounderMember[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  subConfig: SubscriptionConfig;
}

export default function LandingPage({
  courses,
  blogs,
  testimonials,
  toppers,
  onAddReview,
  studyMaterials,
  gallery,
  onNavigateToERP,
  onAddAdmission,
  admissions = [],
  students = [],
  founders = [],
  theme,
  onToggleTheme,
  subConfig
}: LandingPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const getSectionFromPath = (pathname: string) => {
    if (pathname === '/about') return 'about';
    if (pathname === '/courses') return 'courses';
    if (pathname === '/enroll' || pathname === '/admissions') return 'admissions';
    if (pathname === '/results') return 'results';
    if (pathname === '/resources') return 'resources';
    if (pathname === '/gallery') return 'gallery';
    if (pathname === '/contact') return 'contact';
    return 'home';
  };

  const activeSection = getSectionFromPath(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const setActiveSection = (section: 'home' | 'about' | 'courses' | 'admissions' | 'results' | 'resources' | 'gallery' | 'contact') => {
    if (section === 'home') navigate('/');
    else if (section === 'admissions') navigate('/enroll');
    else navigate(`/${section}`);
  };

  const handleERPClick = () => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (currentUser.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (currentUser.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else if (currentUser.role === 'RECEPTIONIST') {
        navigate('/receptionist/dashboard');
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [galleryFilter, setGalleryFilter] = useState<string>('ALL');

  // Resource/Study Notes Hub Filter States
  const [resourcesSearch, setResourcesSearch] = useState('');
  const [resourcesSubject, setResourcesSubject] = useState('ALL');
  const [resourcesClass, setResourcesClass] = useState('ALL');
  const [resourcesCategory, setResourcesCategory] = useState('ALL');

  const filteredResources = (studyMaterials || []).filter((item) => {
    const matchSearch = resourcesSearch.trim() === '' || 
      item.title.toLowerCase().includes(resourcesSearch.toLowerCase()) || 
      item.desc.toLowerCase().includes(resourcesSearch.toLowerCase()) || 
      item.subject.toLowerCase().includes(resourcesSearch.toLowerCase());
    
    const matchSubject = resourcesSubject === 'ALL' || item.subject === resourcesSubject;
    const matchClass = resourcesClass === 'ALL' || item.class === resourcesClass;
    const matchCategory = resourcesCategory === 'ALL' || item.category === resourcesCategory;

    return matchSearch && matchSubject && matchClass && matchCategory;
  });

  // Contact/Inquiry states
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactClass, setContactClass] = useState('Class 10');
  const [contactNotes, setContactNotes] = useState('');
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);

  // Admission Form States
  const [admName, setAdmName] = useState('');
  const [admFather, setAdmFather] = useState('');
  const [admMother, setAdmMother] = useState('');
  const [admDob, setAdmDob] = useState('2011-05-15');
  const [admGender, setAdmGender] = useState('Male');
  const [admClass, setAdmClass] = useState('Class 10');
  const [admPrevSchool, setAdmPrevSchool] = useState('');
  const [admMobile, setAdmMobile] = useState('');
  const [admWhatsapp, setAdmWhatsapp] = useState('');
  const [admParentMobile, setAdmParentMobile] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admAddress, setAdmAddress] = useState('');
  const [admAadhar, setAdmAadhar] = useState('');
  const [admBatch, setAdmBatch] = useState('Class 10 - Evening Stars');
  const [admTiming, setAdmTiming] = useState('04:00 PM - 06:30 PM');
  const [admPhotoUrl, setAdmPhotoUrl] = useState('');
  
  // Admission confirmation state
  const [generatedAdmId, setGeneratedAdmId] = useState<string | null>(null);
  const [isAdmLoading, setIsAdmLoading] = useState(false);
  const [admError, setAdmError] = useState<string | null>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactSubmitted(true);
    setTimeout(() => {
      setIsContactSubmitted(false);
      setContactName('');
      setContactMobile('');
      setContactNotes('');
    }, 4000);
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdmLoading(true);
    setAdmError(null);
    try {
      const admId = await onAddAdmission({
        studentName: admName,
        fatherName: admFather,
        motherName: admMother,
        dob: admDob,
        gender: admGender,
        className: admClass,
        previousSchool: admPrevSchool || undefined,
        mobile: admMobile,
        whatsapp: admWhatsapp,
        parentMobile: admParentMobile,
        email: admEmail,
        address: admAddress,
        aadhar: admAadhar || undefined,
        preferredBatch: admBatch,
        preferredTiming: admTiming,
        photoUrl: admPhotoUrl || undefined
      });

      setGeneratedAdmId(admId);
      // Clear fields
      setAdmName('');
      setAdmFather('');
      setAdmMother('');
      setAdmPrevSchool('');
      setAdmMobile('');
      setAdmWhatsapp('');
      setAdmParentMobile('');
      setAdmEmail('');
      setAdmAddress('');
      setAdmAadhar('');
      setAdmPhotoUrl('');
    } catch (err: any) {
      console.error("[LandingPage] Admission Form Submission Failed:", err);
      setAdmError(err.message || "An error occurred while submitting the admission. Please try again.");
    } finally {
      setIsAdmLoading(false);
    }
  };

  // Static Facilities List
  const facilities = [
    { title: 'Interactive Smart Classrooms', desc: 'Syllabus topics explained using premium modern audio-visual visualization tools.', icon: Layers },
    { title: 'Small Batch Sizes (Max 25)', desc: 'Guarantees that each board aspirant gets personal, direct concept guidance.', icon: Users },
    { title: 'Doubt Clinics Rooms', desc: 'Daily post-class sessions with Priyanshu Sir to master difficult NCERT numerical tasks.', icon: BookOpen },
    { title: 'Bi-Weekly Assessment Logs', desc: 'Highly structure mock exam series mirroring authentic UP/CBSE board templates.', icon: FileText }
  ];

  // Static Achievements Timeline
  const timeline = [
    { year: '2016', title: 'Sunshine Founded', desc: 'Started in Pihani with just 15 board students to deliver excellent, conceptual mathematics tuition.' },
    { year: '2019', title: 'District Merit Holder', desc: 'Our Class 10 pre-board topper secured Ranked 4th in Hardoi District Board list.' },
    { year: '2022', title: 'Smart Class Installed', desc: 'Integrated state-of-the-art interactive digital visual boards mapping complete NCERT curriculum.' },
    { year: '2025', title: '98% Board Results', desc: 'Celebrated historic 98% first-division passing marks among our entire Class 10 batches.' }
  ];

  return (
    <div id="landing-container" className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Sticky Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div className="mx-auto max-w-7xl px-4 py-3.5 flex justify-between items-center">
          <button
            id="header-logo-home"
            onClick={() => {
              setActiveSection('home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg p-0.5 text-left border-0 bg-transparent"
            title="Go to Home Page"
          >
            <SunshineLogo size="md" showText={true} textSubTitle="Excellence in Education • Pihani, Hardoi" />
          </button>

          {/* Navigation Links - Desktop Only */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'courses', label: 'Courses' },
              { id: 'admissions', label: 'Admissions 2026' },
              { id: 'results', label: 'Our Toppers' },
              { id: 'resources', label: 'Study Notes' },
              { id: 'gallery', label: 'Campus Gallery' },
              { id: 'contact', label: 'Contact Us' }
            ].map((link) => (
              <button
                key={link.id}
                id={`nav-link-${link.id}`}
                onClick={() => {
                  setActiveSection(link.id as any);
                  setGeneratedAdmId(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSection === link.id ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Block - Desktop Only */}
          <div className="hidden md:flex items-center gap-2">
            <button
              id="btn-toggle-theme-public"
              onClick={onToggleTheme}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 text-xs transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              id="btn-trigger-erp"
              onClick={handleERPClick}
              className="rounded-xl bg-brand-orange hover:bg-amber-500 text-white px-4 py-2 text-xs font-black shadow-md transition-all flex items-center gap-1"
            >
              🔑 {currentUser ? 'Go to ERP Dashboard' : 'Student/Teacher ERP Portal'}
            </button>
          </div>

          {/* Hamburger Menu Toggle Button - Mobile Only */}
          <button
            id="mobile-nav-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center rounded-xl p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Collapsible Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3.5 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Explore Sunshine Classes
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'home', label: 'Home' },
                    { id: 'about', label: 'About Us' },
                    { id: 'courses', label: 'Courses' },
                    { id: 'admissions', label: 'Admissions 2026' },
                    { id: 'results', label: 'Our Toppers' },
                    { id: 'resources', label: 'Study Notes' },
                    { id: 'gallery', label: 'Campus Gallery' },
                    { id: 'contact', label: 'Contact Us' }
                  ].map((link) => (
                    <button
                      key={link.id}
                      id={`mobile-nav-link-${link.id}`}
                      onClick={() => {
                        setActiveSection(link.id as any);
                        setGeneratedAdmId(null);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3 py-2.5 rounded-xl transition-colors text-left text-xs font-bold ${
                        activeSection === link.id 
                          ? 'bg-brand-blue text-white shadow-xs' 
                          : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-850'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Theme and ERP shortcuts */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex items-center justify-between gap-3">
                  <button
                    id="mobile-btn-toggle-theme"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon size={15} />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun size={15} />
                        <span>Light Mode</span>
                      </>
                    )}
                  </button>

                  <button
                    id="mobile-btn-trigger-erp"
                    onClick={() => {
                      handleERPClick();
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 rounded-xl bg-brand-orange hover:bg-amber-500 text-white py-2.5 px-3 text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    🔑 {currentUser ? 'Dashboard' : 'ERP Portal'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Dynamic View Switching Block */}
      <main className="flex-1">
        {/* VIEW 1: HOME */}
        {activeSection === 'home' && (
          <div className="space-y-16">
            {/* HERO HERO SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-indigo-900 to-slate-950 text-white py-16 md:py-24">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,213,79,0.1),transparent_50%)]"></div>
              
              <div className="mx-auto max-w-7xl px-4 grid gap-12 md:grid-cols-12 items-center relative">
                <div className="md:col-span-7 space-y-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md uppercase tracking-wider">
                    🔥 Admissions Open 2026–27 (Classes 1 to 10)
                  </span>
                  
                  <h2 className="font-display text-4xl font-black md:text-5xl leading-tight tracking-tight text-white">
                    Your Journey Towards <span className="text-amber-400">Academic Excellence</span> Starts Here
                  </h2>
                  
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                    Sunshine Classes delivers concept-driven, high-scoring Mathematics, Science, and English coaching in Pihani, Uttar Pradesh. Special board syllabus guidelines to secure district merit.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      id="hero-btn-enroll"
                      onClick={() => setActiveSection('admissions')}
                      className="rounded-xl bg-brand-orange hover:bg-amber-500 text-white px-6 py-3 text-xs font-black shadow-lg transition-all"
                    >
                      Enroll Now Online
                    </button>
                    <button
                      id="hero-btn-demo"
                      onClick={() => setActiveSection('contact')}
                      className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-5 py-3 text-xs font-black backdrop-blur-sm transition-all"
                    >
                      Book Free Demo Class
                    </button>
                  </div>

                  {/* Hot contact actions */}
                  <div className="pt-4 flex flex-wrap gap-4 text-xs font-bold text-amber-300">
                    <a id="hero-call" href="tel:8707738284" className="flex items-center gap-1.5 hover:underline">
                      📞 Call: 8707738284
                    </a>
                    <a id="hero-wa" href="https://wa.me/9161586254" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-green-400">
                      💬 WhatsApp: 9161586254
                    </a>
                  </div>
                </div>

                <div className="md:col-span-5 relative space-y-4">
                  {/* Modern Classroom Header Image Card */}
                  <div className="relative h-48 md:h-56 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                    <img
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80"
                      alt="Sunshine Classes Modern Collaborative Classroom"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent flex items-end p-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded backdrop-blur-md border border-amber-400/20">
                          Active Collaborative Learning
                        </span>
                        <p className="text-xs font-bold text-white tracking-wide">
                          Modern classrooms designed for conceptual focus and high board performance
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Glass card of stats */}
                  <div className="glass-panel-dark rounded-3xl p-6 shadow-2xl relative z-10 space-y-6 border border-white/10">
                    <h3 className="font-display font-bold text-base text-amber-300 tracking-wide text-center uppercase">
                      Class 10 Boards Specialist
                    </h3>

                    <div className="divide-y divide-white/10 text-xs">
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-300">NCERT Syllabus Deep-dive</span>
                        <span className="text-green-400 font-bold">100% Covered</span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-300">Previous 10 Years Boards papers</span>
                        <span className="text-green-400 font-bold">Fully Solved</span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-300">Chapter-wise Merit Mock Series</span>
                        <span className="text-green-400 font-bold">Weekly Logged</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STATISTICS STATISTICS ROW */}
            <div className="mx-auto max-w-7xl px-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-md">
                {[
                  { value: '1000+', label: 'Happy Students Enrolled' },
                  { value: '95%', label: 'Board Examination Results' },
                  { value: '10+', label: 'Years Academic Heritage' },
                  { value: '100%', label: 'Individual Doubt Attention' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center p-3">
                    <span className="font-display text-3xl font-black text-brand-blue block mb-1">{stat.value}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WHY CHOOSE US WHY CHOOSE US */}
            <div className="mx-auto max-w-7xl px-4 py-8 bg-slate-100 rounded-3xl">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Our Credentials</span>
                <h3 className="font-display text-2xl font-black text-slate-800">Why Sunshine Classes Delivers Excellence</h3>
                <p className="text-xs text-slate-500 mt-2">Meticulously organized teaching methodology designed for robust concept assimilation.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: 'Weekly Merit Tests', desc: 'Chapter-wise examinations to evaluate performance metrics and weak nodes.' },
                  { title: 'Monthly Progress Reports', desc: 'Transparent feedback summaries compiled directly for parents review.' },
                  { title: 'NCERT Centered Path', desc: 'Deep-dive textual reading of standard NCERT textbook questions.' },
                  { title: 'Regular Parent Meetings', desc: 'Direct face-to-face sessions with Priyanshu sir to discuss performance.' }
                ].map((card, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold mb-4">
                      {idx + 1}
                    </div>
                    <h4 className="text-sm font-black text-slate-800 mb-1.5">{card.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* POPULAR COURSES PREVIEW */}
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
                <div>
                  <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Tuition Cohorts</span>
                  <h3 className="font-display text-2xl font-black text-slate-800">Available Coaching Batches</h3>
                </div>
                <button
                  id="home-btn-view-courses"
                  onClick={() => setActiveSection('courses')}
                  className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
                >
                  View All Classes <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-800 mb-2 leading-tight">{course.name}</h4>
                      <p className="text-xs text-brand-blue font-bold mb-4">Monthly Fee: ₹{course.fees}/month</p>
                      
                      <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                        {course.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-brand-orange">✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      id={`btn-course-enroll-${course.id}`}
                      onClick={() => {
                        setAdmClass(course.name.includes('10') ? 'Class 10' : course.name.includes('9') ? 'Class 9' : 'Class 8');
                        setActiveSection('admissions');
                      }}
                      className="w-full rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold py-2.5 shadow-sm transition-colors text-center"
                    >
                      Apply Online Admission
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* TESTIMONIALS & REVIEWS SECTION */}
            <div id="testimonials-review-section" className="mx-auto max-w-7xl px-4 py-16 border-t border-slate-100 dark:border-slate-800 mt-16 space-y-12">
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Testimonials</span>
                <h3 className="font-display text-2xl font-black text-slate-800 dark:text-white">Loved by Parents & Students</h3>
                <p className="text-xs text-slate-500 mt-1">Authentic reviews submitted by our active learning cohort and parent community in Pihani.</p>
              </div>

              {/* Grid of existing testimonials */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testi, idx) => (
                  <div key={testi.id || idx} className="rounded-2xl border border-slate-150 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 mb-3">
                        {Array.from({ length: testi.rating }).map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed mb-4">"{testi.content}"</p>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">{testi.name}</h4>
                        <span className="text-[10px] font-extrabold uppercase text-brand-blue tracking-widest">{testi.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Add Review Form Trigger */}
              <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 text-center space-y-3">
                <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">Share Your Sunshine Journey!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">Did Priyanshu sir help clear your doubts? Did our weekly tests help boost your grades? Let the Pihani community know!</p>
                <div className="pt-2">
                  <ReviewForm onSubmitReview={onAddReview} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ABOUT US */}
        {activeSection === 'about' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-16 animate-fade-in">
            {/* Mission Vision */}
            <div className="grid gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Our Foundation</span>
                <h3 className="font-display text-3xl font-black text-slate-800 dark:text-white">Nurturing Toppers in Pihani</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sunshine Classes was established with a singular focus: to strip away the phobia of complex calculations and equations and make quality, concept-driven science and mathematics education accessible to every student in Pihani, Hardoi. We combine structured academic discipline with empathetic personal mentorship.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-blue-50/50 dark:bg-slate-900/40 p-4 border border-blue-100/50 dark:border-blue-950/50">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase mb-1 flex items-center gap-1.5">
                      <GraduationCap className="text-brand-blue w-4 h-4" /> Our Mission
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">To build outstanding conceptual foundations in Math and Science, enabling students to conquer board exams effortlessly.</p>
                  </div>
                  <div className="rounded-xl bg-amber-50/50 dark:bg-slate-900/40 p-4 border border-amber-100/50 dark:border-amber-950/50">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase mb-1 flex items-center gap-1.5">
                      <Award className="text-brand-orange w-4 h-4" /> Our Vision
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">To remain the gold-standard coaching brand in Hardoi district, celebrating academic merit year after year.</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Quick Stat Box */}
              <div className="lg:col-span-6 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-brand-orange/10 rounded-full blur-2xl"></div>
                <h4 className="font-display font-bold text-sm uppercase text-amber-300 tracking-wider mb-4">Our Direct Impact Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="block text-xl font-extrabold text-amber-300">10+ Years</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Academic Heritage</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="block text-xl font-extrabold text-amber-300">98% Passed</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">First Division Boards</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="block text-xl font-extrabold text-amber-300">25:1 Max</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Student-Teacher Ratio</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="block text-xl font-extrabold text-amber-300">100% NCERT</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Pedagogic Fidelity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOUNDERS & KEY FACULTY DESK */}
            <div className="space-y-8">
              <div className="text-center max-w-xl mx-auto">
                <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Our Leadership</span>
                <h3 className="font-display text-2xl font-black text-slate-800 dark:text-white">Founder & Core Faculty Desk</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">The experienced, highly qualified minds shaping academic successes year after year.</p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {founders.map((fm) => (
                  <div key={fm.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-brand-blue/10 dark:bg-brand-blue/5 rounded-bl-3xl flex items-center justify-center text-brand-blue dark:text-indigo-400 text-lg font-black">
                      “
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {fm.photoUrl ? (
                          <img src={fm.photoUrl} alt={fm.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-inner border border-slate-250 dark:border-slate-850" />
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                            <Users size={28} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-display font-black text-base text-slate-800 dark:text-white">{fm.name}</h4>
                          <span className="text-[10px] text-brand-orange uppercase font-extrabold tracking-wider block">{fm.title}</span>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <GraduationCap size={12} className="text-slate-400" />
                            <span>{fm.qualification}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed pt-2">
                        "{fm.message}"
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400 uppercase font-black text-[9px] tracking-wider">Tuition Focus: {fm.tuitionFocus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Achievements */}
            <div className="space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h3 className="font-display font-black text-base text-slate-800 dark:text-white text-center uppercase tracking-wide">
                Our Journey of Academic Excellence
              </h3>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-1">
                    <span className="font-display text-xl font-black text-brand-orange block">{item.year}</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: COURSES DETAIL */}
        {activeSection === 'courses' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Our Programs</span>
              <h3 className="font-display text-3xl font-black text-slate-800">Tuition Courses & Fee Structure</h3>
              <p className="text-xs text-slate-500 mt-1">Classroom modules mapped meticulously against NCERT textbook guidelines for primary and board exams.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div key={course.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <span className="rounded bg-brand-orange/15 text-brand-orange text-[9px] font-bold px-2 py-0.5 uppercase block mb-3 w-max">
                      NCERT Mapped
                    </span>
                    <h4 className="font-display font-bold text-sm text-slate-800 mb-2 leading-snug">{course.name}</h4>
                    <p className="text-xs text-slate-500">Subjects: {course.subjects.join(', ')}</p>
                    <p className="text-xs font-bold text-brand-blue mt-2">Duration: {course.duration}</p>
                    
                    <div className="my-4 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                      {course.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-green-500">✔</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Monthly Fees</span>
                      <span className="font-display text-base font-black text-slate-800">₹{course.fees}/mo</span>
                    </div>
                    <button
                      id={`btn-course-apply-${course.id}`}
                      onClick={() => {
                        setAdmClass(course.name.includes('10') ? 'Class 10' : course.name.includes('9') ? 'Class 9' : 'Class 8');
                        setActiveSection('admissions');
                      }}
                      className="rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold px-4 py-2 shadow-sm"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: ONLINE ADMISSIONS FORM */}
        {activeSection === 'admissions' && (
          <div className="mx-auto max-w-3xl px-4 py-12">
            {!generatedAdmId ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
                <div className="text-center mb-8">
                  <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Enrolment Form</span>
                  <h3 className="font-display text-2xl font-black text-slate-800">Online Admission Application 2026-27</h3>
                  <p className="text-xs text-slate-500 mt-1">Submit digital parameters. Generated Admission IDs register student file under pending queue.</p>
                </div>

                <form onSubmit={handleAdmissionSubmit} className="space-y-6">
                  {/* Student Details */}
                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                      1. Student Identity Details
                    </h4>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <CloudinaryUpload
                          id="adm-photo-picker-main-cloudinary"
                          folder="students"
                          cloudName={subConfig.cloudinaryCloudName}
                          uploadPreset={subConfig.cloudinaryUploadPreset}
                          apiKey={subConfig.cloudinaryApiKey}
                          apiSecret={subConfig.cloudinaryApiSecret}
                          maxSizeMB={subConfig.cloudinaryMaxFileSize}
                          initialUrl={admPhotoUrl}
                          onUploadSuccess={(url) => setAdmPhotoUrl(url)}
                          onFileDeleted={() => setAdmPhotoUrl('')}
                          allowedTypes={['jpg', 'jpeg', 'png', 'webp']}
                          label="Student Passport Photo (Optional)"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Student Name</label>
                        <input
                          id="adm-input-name"
                          type="text"
                          required
                          value={admName}
                          onChange={(e) => setAdmName(e.target.value)}
                          placeholder="Type student name clearly..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                        />
                      </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Date of Birth</label>
                          <input
                            id="adm-input-dob"
                            type="date"
                            required
                            value={admDob}
                            onChange={(e) => setAdmDob(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Gender</label>
                          <select
                            id="adm-select-gender"
                            value={admGender}
                            onChange={(e) => setAdmGender(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Academic Class Intake</label>
                          <select
                            id="adm-select-class"
                            value={admClass}
                            onChange={(e) => {
                              const selectedClass = e.target.value;
                              setAdmClass(selectedClass);
                              if (selectedClass === 'Class 10') {
                                setAdmBatch('Class 10 - Evening Stars');
                                setAdmTiming('04:00 PM - 06:30 PM');
                              } else if (selectedClass === 'Class 9') {
                                setAdmBatch('Class 9 - Foundation Group');
                                setAdmTiming('03:00 PM - 05:00 PM');
                              } else if (['Class 8', 'Class 7', 'Class 6', 'Class 5'].includes(selectedClass)) {
                                setAdmBatch('Classes 5 to 8 - Apex Learning');
                                setAdmTiming('02:00 PM - 04:00 PM');
                              } else {
                                setAdmBatch('Classes 1 to 4 - Early Steps');
                                setAdmTiming('01:00 PM - 02:30 PM');
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          >
                            <option value="Class 10">Class 10</option>
                            <option value="Class 9">Class 9</option>
                            <option value="Class 8">Class 8</option>
                            <option value="Class 7">Class 7</option>
                            <option value="Class 6">Class 6</option>
                            <option value="Class 5">Class 5</option>
                            <option value="Class 4">Class 4</option>
                            <option value="Class 3">Class 3</option>
                            <option value="Class 2">Class 2</option>
                            <option value="Class 1">Class 1</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Previous School</label>
                          <input
                            id="adm-input-prev-school"
                            type="text"
                            value={admPrevSchool}
                            onChange={(e) => setAdmPrevSchool(e.target.value)}
                            placeholder="Type previous school name..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Aadhar Card Number</label>
                          <input
                            id="adm-input-aadhar"
                            type="text"
                            maxLength={12}
                            value={admAadhar}
                            onChange={(e) => setAdmAadhar(e.target.value.replace(/\D/g, ''))}
                            placeholder="12-digit Aadhar number..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Parental Details */}
                    <div className="space-y-4">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                        2. Parental details & contacts
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Father Name</label>
                          <input
                            id="adm-input-father"
                            type="text"
                            required
                            value={admFather}
                            onChange={(e) => setAdmFather(e.target.value)}
                            placeholder="e.g. Ram Pal Verma"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mother Name</label>
                          <input
                            id="adm-input-mother"
                            type="text"
                            required
                            value={admMother}
                            onChange={(e) => setAdmMother(e.target.value)}
                            placeholder="e.g. Shanti Devi"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Student WhatsApp Number *</label>
                          <input
                            id="adm-input-wa"
                            type="tel"
                            required
                            value={admWhatsapp}
                            onChange={(e) => setAdmWhatsapp(e.target.value)}
                            placeholder="Active Student WhatsApp number..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Student Email ID *</label>
                          <input
                            id="adm-input-email"
                            type="email"
                            required
                            value={admEmail}
                            onChange={(e) => setAdmEmail(e.target.value)}
                            placeholder="Active Student Email address..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Parent's WhatsApp Number *</label>
                          <input
                            id="adm-input-parent-wa"
                            type="tel"
                            required
                            value={admParentMobile}
                            onChange={(e) => setAdmParentMobile(e.target.value)}
                            placeholder="Parent's active WhatsApp number..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mobile Calling Number</label>
                          <input
                            id="adm-input-mobile"
                            type="tel"
                            required
                            value={admMobile}
                            onChange={(e) => setAdmMobile(e.target.value)}
                            placeholder="Calling phone number..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Complete details */}
                    <div className="space-y-4">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                        3. Home address & parameters
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Correspondence Address</label>
                          <textarea
                            id="adm-ta-address"
                            required
                            rows={2}
                            value={admAddress}
                            onChange={(e) => setAdmAddress(e.target.value)}
                            placeholder="e.g. Mohalla Mishrana, Opposite Subhash Park, Pihani, UP..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          ></textarea>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Preferred Batch</label>
                          <select
                            id="adm-select-batch"
                            value={admBatch}
                            onChange={(e) => setAdmBatch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          >
                            <option value="Class 10 - Evening Stars">Class 10 - Evening Stars</option>
                            <option value="Class 9 - Foundation Group">Class 9 - Foundation Group</option>
                            <option value="Classes 5 to 8 - Apex Learning">Classes 5 to 8 - Apex Learning</option>
                            <option value="Classes 1 to 4 - Early Steps">Classes 1 to 4 - Early Steps</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Preferred Timing</label>
                          <select
                            id="adm-select-timing"
                            value={admTiming}
                            onChange={(e) => setAdmTiming(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                          >
                            <option value="04:00 PM - 06:30 PM">04:00 PM - 06:30 PM</option>
                            <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                            <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                            <option value="01:00 PM - 02:30 PM">01:00 PM - 02:30 PM</option>
                            <option value="07:00 AM - 09:30 AM">07:00 AM - 09:30 AM</option>
                          </select>
                        </div>
                      </div>
                    </div>

                     {admError && (
                      <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs text-red-600 font-bold font-sans mt-4">
                        ⚠️ {admError}
                      </div>
                    )}

                    <div className="flex justify-end pt-2 items-center gap-4">
                      {isAdmLoading && (
                        <span className="text-xs text-slate-500 flex items-center gap-2 font-sans animate-pulse font-bold">
                          <span className="h-3 w-3 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></span>
                          Processing Admission File...
                        </span>
                      )}
                      <button
                        id="btn-admission-submit"
                        type="submit"
                        disabled={isAdmLoading}
                        className={`rounded-xl bg-brand-orange hover:bg-amber-500 text-white px-6 py-3 text-xs font-black shadow-md transition-all flex items-center gap-2 ${isAdmLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isAdmLoading ? "Submitting..." : "Submit Admission File"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* PREMIUM SUCCESS VIEW */
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 shadow-md text-center space-y-6 max-w-md mx-auto">
                  <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl font-black mx-auto">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-emerald-800">Admission Request Submitted!</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Sunshine Classes academic panel will evaluate your digital credentials file. Direct roll number allocated on admission approvals!
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm font-mono text-xs">
                    <span className="text-slate-400 block uppercase font-sans tracking-wider text-[10px] mb-1 font-bold">Your Application ID</span>
                    <span className="font-bold text-emerald-700 text-sm">{generatedAdmId}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      id="btn-admission-success-done"
                      onClick={() => setGeneratedAdmId(null)}
                      className="rounded-xl bg-brand-orange hover:bg-amber-500 text-white px-5 py-2.5 text-xs font-black shadow transition-all cursor-pointer"
                    >
                      Done / Apply Again
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* VIEW 5: RESULTS & BOARD TOPPERS */}
        {activeSection === 'results' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Our Proud Toppers</span>
              <h3 className="font-display text-3xl font-black text-slate-800">Class 10 State Merit Board list</h3>
              <p className="text-xs text-slate-500 mt-1">Exceptional score ratios secured by Class 10 board students of Sunshine Classes.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(toppers && toppers.length > 0 ? toppers : [
                { id: 'top1', name: 'Priya Mishra', score: '98.4%', rank: 'State Topper Rank 4', desc: 'Outstanding logical step marks in Math & Physics numerical sheets.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60' },
                { id: 'top2', name: 'Anuj Soni', score: '96.2%', rank: 'Hardoi District Rank 12', desc: 'Outstanding chemical reactions balancing with flawless grammar papers.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60' },
                { id: 'top3', name: 'Aditi Shukla', score: '95.0%', rank: 'District Rank 18', desc: 'Perfect scoring in Social Studies maps and English grammar assessments.', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60' }
              ]).map((top, idx) => (
                <div key={top.id || idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
                  <div className="h-20 w-20 rounded-full border-4 border-amber-300 overflow-hidden mx-auto mb-3 shadow">
                    <img src={top.img} alt={top.name} className="h-full w-full object-cover" />
                  </div>
                  <h4 className="font-display font-bold text-xs text-brand-orange uppercase">{top.rank}</h4>
                  <h3 className="font-display font-black text-base text-slate-800 mt-0.5">{top.name}</h3>
                  <span className="text-2xl font-black text-brand-blue block my-2">{top.score} Marks</span>
                  <p className="text-xs text-slate-500 leading-relaxed">{top.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: STUDY NOTES & RESOURCES HUB (Universal Hub) */}
        {activeSection === 'resources' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-12 animate-fade-in">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Universal Resource Desk</span>
              <h3 className="font-display text-3xl font-black text-slate-800 dark:text-white">Sunshine Study Notes & Revision Hub</h3>
              <p className="text-xs text-slate-500 mt-1">Access completely free, premium conceptual formulas and board mock paper archives.</p>
            </div>

            {/* Hub Filters & Search */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by title, subject or key terms..."
                    value={resourcesSearch}
                    onChange={(e) => setResourcesSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
                  <select
                    value={resourcesSubject}
                    onChange={(e) => setResourcesSubject(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs outline-none"
                  >
                    <option value="ALL">All Subjects</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                  </select>

                  <select
                    value={resourcesClass}
                    onChange={(e) => setResourcesClass(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs outline-none"
                  >
                    <option value="ALL">All Classes</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>
              </div>

              {/* Category selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-800">
                {['ALL', 'NOTES', 'QUESTION_PAPER'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setResourcesCategory(cat)}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                      resourcesCategory === cat
                        ? 'border-brand-blue text-brand-blue'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Downloads' : cat === 'NOTES' ? 'Chapter Formulas & Notes' : 'Previous Year Mock Papers'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Grid list */}
            {filteredResources.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <span className="text-3xl">📂</span>
                <h4 className="font-bold text-slate-800 dark:text-white mt-3 text-sm">No Study Materials Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try refining your keyword query, selected class, or subject category filter tags.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {filteredResources.map((item, idx) => (
                  <div key={item.id || idx} className="rounded-2xl border border-slate-100 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-blue bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                          {item.subject}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
                          {item.class}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                          {item.category === 'NOTES' ? 'Study Notes' : 'Question Paper'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                      
                      {item.date && (
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                          <span>Published: {item.date}</span>
                        </div>
                      )}
                    </div>

                    <button
                      id={`btn-landing-download-${item.id}`}
                      onClick={() => {
                        if (item.fileData) {
                          const link = document.createElement('a');
                          link.href = item.fileData;
                          link.download = item.file;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          alert(`Downloading Study File "${item.file}"... Standard NCERT reference guides are pre-bundled offline for easy access.`);
                        }
                      }}
                      className="rounded-xl p-3 bg-slate-50 hover:bg-brand-blue hover:text-white dark:bg-slate-800/80 dark:hover:bg-brand-blue border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all flex-shrink-0 cursor-pointer shadow-sm hover:scale-105"
                      title="Download PDF document"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: CAMPUS GALLERY */}
        {activeSection === 'gallery' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Campus Life</span>
              <h3 className="font-display text-3xl font-black text-slate-800">Our Interactive Infrastructure</h3>
              <p className="text-xs text-slate-500 mt-1">Explore classroom environments, annual celebration events, and mock examinations halls.</p>
            </div>

            {/* Gallery Category Filter buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['ALL', 'CLASSROOM', 'EVENTS', 'RESULTS', 'ACTIVITIES'].map((cat) => (
                <button
                  key={cat}
                  id={`btn-gallery-filter-${cat.toLowerCase()}`}
                  onClick={() => setGalleryFilter(cat)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    galleryFilter === cat ? 'bg-brand-blue text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Masonry image grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery
                .filter((g) => galleryFilter === 'ALL' || g.category === galleryFilter)
                .map((g) => (
                  <div key={g.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="h-48 overflow-hidden bg-slate-100 relative">
                      <img src={g.imageUrl} alt={g.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-3 left-3 rounded bg-brand-blue/90 text-white text-[8px] font-black uppercase px-2 py-0.5 backdrop-blur-sm">
                        {g.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{g.title}</h4>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 8: CONTACT US & INQUIRY */}
        {activeSection === 'contact' && (
          <div className="mx-auto max-w-7xl px-4 py-12 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5 space-y-6">
              <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Visit Campus</span>
              <h3 className="font-display text-3xl font-black text-slate-800">Our Office & Help Desk</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We welcome parent inquiry visits and walk-ins between our office operating cycles. Feel free to contact us over calling dial or schedule a campus walkthrough.
              </p>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="text-brand-orange flex-shrink-0" size={16} />
                  <div>
                    <strong>Campus Address:</strong>
                    <p className="text-slate-500 mt-0.5">Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="text-brand-orange flex-shrink-0" size={16} />
                  <div>
                    <strong>Office Operating Cycles:</strong>
                    <p className="text-slate-500 mt-0.5">10:00 AM to 07:00 PM (Monday to Sunday)</p>
                  </div>
                </div>
              </div>

              {/* Real social and call integration buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Quick Connect Channels</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="tel:+918707738284"
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/20 hover:border-blue-200 p-3 transition-all group cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-all">
                      <Phone size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Voice Call</span>
                      <span className="text-[11px] font-extrabold text-slate-700">8707738284</span>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/919161586254?text=Hello!%20I%20want%20to%20inquire%20about%20Sunshine%20Classes%20tuitions."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/15 hover:bg-emerald-50/40 hover:border-emerald-300 p-3 transition-all group cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-all">
                      <WhatsAppIcon size={15} className="text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">WhatsApp</span>
                      <span className="text-[11px] font-extrabold text-slate-700">9161586254</span>
                    </div>
                  </a>

                  <a
                    href="https://facebook.com/sunshineclassespihani"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/15 hover:border-blue-300 p-3 transition-all group cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-blue-700 group-hover:scale-105 transition-all">
                      <Facebook size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Facebook</span>
                      <span className="text-[11px] font-extrabold text-slate-700">@sunshine...</span>
                    </div>
                  </a>

                  <a
                    href="https://instagram.com/sunshineclassespihani"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-pink-50/15 hover:border-pink-300 p-3 transition-all group cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-pink-600 group-hover:scale-105 transition-all">
                      <Instagram size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Instagram</span>
                      <span className="text-[11px] font-extrabold text-slate-700">@sunshine...</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Real Google Maps interactive iframe */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-64 bg-slate-100 relative group">
                <iframe
                  title="Sunshine Classes Pihani Location Map"
                  src="https://maps.google.com/maps?q=Sunshine%20Classes,%20Pihani,%20Hardoi,%20Uttar%20Pradesh%20241406&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                  <MapPin size={12} className="text-brand-orange animate-pulse" />
                  <span>Sunshine Classes, Pihani</span>
                </div>
                <a
                  href="https://maps.app.goo.gl/Z7BuSwoBFkvghk5e8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 bg-brand-orange hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase cursor-pointer transition-all duration-300 transform hover:scale-105"
                >
                  <MapPin size={11} />
                  <span>Open Maps</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Offline inquiry desk form */}
            <div className="md:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <h3 className="font-display font-bold text-base text-slate-800 mb-2">Send Inquiry Dispatch</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Have a doubt? Enter parameters. Desk receptionist will follow up on WhatsApp within 12 hours.</p>

              {!isContactSubmitted ? (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Your Full Name</label>
                      <input
                        id="contact-input-name"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Sanjay Singh"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Calling Mobile</label>
                      <input
                        id="contact-input-mobile"
                        type="tel"
                        required
                        value={contactMobile}
                        onChange={(e) => setContactMobile(e.target.value)}
                        placeholder="e.g. 9161586254"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">What is your query details?</label>
                    <textarea
                      id="contact-ta-notes"
                      required
                      rows={4}
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                      placeholder="Ask about pre-board mock schedules, tuition slot availability, or discount parameters..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      id="btn-contact-submit"
                      type="submit"
                      className="rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all"
                    >
                      Disptach Enquiry
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <CheckCircle size={32} className="text-green-500 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800">Inquiry Dispatch Logged!</h4>
                  <p className="text-xs text-slate-500">Neha Sharma (Desk Registrar) will contact you over dial shortly.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Bars */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-slate-200/60 dark:border-slate-800/60">
        <a
          id="btn-sticky-call"
          href="tel:8707738284"
          className="flex h-9 items-center gap-1.5 rounded-full bg-brand-blue text-white px-3.5 hover:bg-indigo-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Call Admission Desk"
        >
          <Phone size={12} /> <span className="hidden sm:inline">Call Office</span>
        </a>
        
        <a
          id="btn-sticky-whatsapp"
          href="https://wa.me/919161586254?text=Hello!%20I%20am%20interested%20in%20Sunshine%20Classes."
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm cursor-pointer"
          title="Chat on WhatsApp"
        >
          <WhatsAppIcon size={14} />
        </a>

        <a
          id="btn-sticky-facebook"
          href="https://facebook.com/sunshineclassespihani"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm cursor-pointer"
          title="Visit Facebook Page"
        >
          <Facebook size={14} />
        </a>

        <a
          id="btn-sticky-instagram"
          href="https://instagram.com/sunshineclassespihani"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white transition-all shadow-sm cursor-pointer"
          title="Follow on Instagram"
        >
          <Instagram size={14} />
        </a>
      </div>

      {/* Dedicated Floating WhatsApp Hotline Button (Bottom Right) */}
      <a
        id="btn-dedicated-whatsapp-hotline"
        href="https://wa.me/919161586254?text=Hello!%20I%20want%20to%20inquire%20about%20Sunshine%20Classes%20tuitions."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 group cursor-pointer"
        title="Chat on WhatsApp (Hotline)"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping group-hover:opacity-100"></span>
        <WhatsAppIcon className="relative z-10 w-7 h-7" />
      </a>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="space-y-3">
            <button
              id="footer-logo-home"
              onClick={() => setActiveSection('home')}
              className="flex items-center gap-1.5 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-lg p-0.5 border-0 bg-transparent"
              title="Go to Home Page"
            >
              <SunshineLogo size="sm" showText={true} textColor="light" textSubTitle="Excellence in Education • Pihani, Hardoi" />
            </button>
            <p className="leading-relaxed">Building outstanding conceptual clarity in Mathematics, Science and English for Classes 1 to 10 board candidates.</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase mb-1">Tuition classes</h4>
            <div className="space-y-1">
              <div>• Class 10 Board Specialists (₹1,200/mo)</div>
              <div>• Class 9 Foundation Course (₹1,000/mo)</div>
              <div>• Classes 5 to 8 Apex Learning (₹700/mo)</div>
              <div>• Classes 1 to 4 Junior Sunshine (₹500/mo)</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase mb-1">Our Location</h4>
            <p className="leading-relaxed text-slate-400">Mohalla Mishrana, opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406)</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase mb-1">Contact & Socials</h4>
            <div className="space-y-2 text-slate-400 text-xs">
              <a href="tel:+918707738284" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <Phone size={13} className="text-brand-orange" />
                <span>Call Desk: +91 8707738284</span>
              </a>
              <a href="https://wa.me/919161586254?text=Hello!" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <WhatsAppIcon size={13} className="text-emerald-500" />
                <span>WhatsApp: +91 9161586254</span>
              </a>
              <a href="https://facebook.com/sunshineclassespihani" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <Facebook size={13} className="text-blue-500" />
                <span>Facebook Page</span>
              </a>
              <a href="https://instagram.com/sunshineclassespihani" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <Instagram size={13} className="text-pink-500" />
                <span>Instagram Profile</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 mt-8 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-500">
          © 2026-2027 Sunshine Classes Pihani. All Rights Reserved. Created under Educational Guidelines.
        </div>
      </footer>


    </div>
  );
}

function ReviewForm({ onSubmitReview }: { onSubmitReview: (review: Omit<Testimonial, 'id'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'PARENT' | 'STUDENT'>('STUDENT');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [customPhoto, setCustomPhoto] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      alert('Please fill in your name and review message.');
      return;
    }
    onSubmitReview({
      name: name.trim(),
      role,
      rating,
      content: content.trim(),
      avatarUrl: customPhoto || (role === 'STUDENT' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60' 
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60')
    });
    setSubmitted(true);
    setName('');
    setContent('');
    setCustomPhoto('');
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
    }, 2500);
  };

  if (!isOpen) {
    return (
      <button
        id="btn-open-review-form"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-bold px-5 py-2.5 shadow-sm transition-all cursor-pointer"
      >
        Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-left space-y-4 mt-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {submitted ? (
        <div className="text-center py-6 space-y-2">
          <span className="text-2xl">🎉</span>
          <h5 className="font-bold text-xs text-green-600">Review Submitted Successfully!</h5>
          <p className="text-[10px] text-slate-500">Thank you for your feedback. Your review has been added to our public page!</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Ramesh Kumar"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Your Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
              >
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
          </div>

          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/50">
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">Your Photo (Optional)</label>
            <div className="flex gap-3 items-center">
              {customPhoto && (
                <img src={customPhoto} alt="Reviewer preview" className="h-9 w-9 rounded-full object-cover border border-slate-200" />
              )}
              <div className="relative border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center flex-1 flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  id="landing-review-photo-picker"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCustomPhoto(reader.result as string);
                      };
                      reader.readAsDataURL(f);
                    }
                  }}
                />
                <label htmlFor="landing-review-photo-picker" className="cursor-pointer flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <Upload size={13} className="text-slate-400" />
                  <span className="font-bold text-brand-blue hover:underline">Choose Photo</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Rating</label>
            <div className="flex gap-1.5 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-amber-400 hover:scale-115 transition-transform cursor-pointer"
                >
                  <Star size={18} fill={star <= rating ? "currentColor" : "none"} />
                </button>
              ))}
              <span className="text-[10px] font-bold text-slate-500 ml-2">({rating} Stars)</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Your Review / Message</label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Tell other parents and students about your experience at Sunshine Classes..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-blue outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-blue text-white px-4 py-1.5 text-xs font-bold hover:bg-brand-blue-hover cursor-pointer shadow-sm"
            >
              Submit Review
            </button>
          </div>
        </>
      )}
    </form>
  );
}

