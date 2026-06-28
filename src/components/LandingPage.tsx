/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, BlogPost, Testimonial, GalleryItem, Admission } from '../types';
import SunshineLogo from './SunshineLogo';

interface LandingPageProps {
  courses: Course[];
  blogs: BlogPost[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
  onNavigateToERP: () => void;
  onAddAdmission: (adm: Omit<Admission, 'id' | 'status' | 'date'>) => string;
}

export default function LandingPage({
  courses,
  blogs,
  testimonials,
  gallery,
  onNavigateToERP,
  onAddAdmission
}: LandingPageProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'courses' | 'admissions' | 'results' | 'gallery' | 'blog' | 'contact'>('home');
  const [galleryFilter, setGalleryFilter] = useState<string>('ALL');

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
  
  // Admission confirmation state
  const [generatedAdmId, setGeneratedAdmId] = useState<string | null>(null);

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

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const admId = onAddAdmission({
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
      preferredTiming: admTiming
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
  };

  // Static Facilities List
  const facilities = [
    { title: 'Interactive Smart Classrooms', desc: 'Syllabus topics explained using premium modern audio-visual visualization tools.', icon: Layers },
    { title: 'Small Batch Sizes (Max 25)', desc: 'Guarantees that each board aspirant gets personal, direct concept guidance.', icon: Users },
    { title: 'Doubt Clinics Rooms', desc: 'Daily post-class sessions with Suresh Sir to master difficult NCERT numerical tasks.', icon: BookOpen },
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
    <div id="landing-container" className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Sticky Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="mx-auto max-w-7xl px-4 py-3.5 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <SunshineLogo size="md" showText={true} textSubTitle="Excellence in Education" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-600">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'courses', label: 'Courses' },
              { id: 'admissions', label: 'Admissions 2026' },
              { id: 'results', label: 'Our Toppers' },
              { id: 'gallery', label: 'Campus Gallery' },
              { id: 'blog', label: 'Study Blogs' },
              { id: 'contact', label: 'Contact Us' }
            ].map((link) => (
              <button
                key={link.id}
                id={`nav-link-${link.id}`}
                onClick={() => {
                  setActiveSection(link.id as any);
                  setGeneratedAdmId(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeSection === link.id ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Login ERP trigger CTA */}
          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-erp"
              onClick={onNavigateToERP}
              className="rounded-xl bg-brand-orange hover:bg-amber-500 text-white px-4 py-2 text-xs font-black shadow-md transition-all flex items-center gap-1"
            >
              🔑 Student/Teacher ERP Portal
            </button>
          </div>
        </div>
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

                <div className="md:col-span-5 relative">
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
                  { title: 'Regular Parent Meetings', desc: 'Direct face-to-face sessions with Suresh sir to discuss performance.' }
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
          </div>
        )}

        {/* VIEW 2: ABOUT US */}
        {activeSection === 'about' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-16 animate-fade-in">
            {/* Mission Vision */}
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-6">
                <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Our Foundation</span>
                <h3 className="font-display text-3xl font-black text-slate-800">Nurturing Toppers in Pihani</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sunshine Classes was established with a singular focus: to strip away the phobia of complex calculations and equations and make quality, concept-driven science and mathematics education accessible to every student in Pihani, Hardoi.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100/50">
                    <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Our Mission</h4>
                    <p className="text-[11px] text-slate-500">To build outstanding conceptual foundations in Math and Science, enabling students to conquer board exams effortlessly.</p>
                  </div>
                  <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-100/50">
                    <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Our Vision</h4>
                    <p className="text-[11px] text-slate-500">To remain the gold-standard coaching brand in Hardoi district, celebrating academic merit year after year.</p>
                  </div>
                </div>
              </div>

              {/* Founder Message Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-brand-blue rounded-bl-3xl flex items-center justify-center text-white text-lg font-black">
                  “
                </div>
                <h4 className="font-display font-black text-base text-slate-800 mb-2">Message from Founder Directory</h4>
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  "At Sunshine Classes, we believe that education is not merely about cramming question banks. It is about kindling curiosity. When a student visualizes the reflection rays or understands why a quadratic solution represents a graphical curve, they don't just score marks — they become innovators. Our doors are always open to parents who wish to participate actively in their child's daily progress."
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-800">Shubham Shukla</h5>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Founder, Lead Mathematics Instructor</p>
                </div>
              </div>
            </div>

            {/* Timeline Achievements */}
            <div className="space-y-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="font-display font-black text-base text-slate-800 text-center uppercase tracking-wide">
                Our Journey of Academic Excellence
              </h3>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative border-l border-slate-200 pl-4 space-y-1">
                    <span className="font-display text-xl font-black text-brand-orange block">{item.year}</span>
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
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
                          onChange={(e) => setAdmClass(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
                        >
                          <option value="Class 10">Class 10 (Boards)</option>
                          <option value="Class 9">Class 9 (Foundation)</option>
                          <option value="Class 8">Class 8</option>
                          <option value="Class 5">Class 5</option>
                        </select>
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

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">WhatsApp Notification Number</label>
                        <input
                          id="adm-input-wa"
                          type="tel"
                          required
                          value={admWhatsapp}
                          onChange={(e) => setAdmWhatsapp(e.target.value)}
                          placeholder="Active WhatsApp number..."
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

                    <div>
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
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-admission-submit"
                      type="submit"
                      className="rounded-xl bg-brand-orange hover:bg-amber-500 text-white px-6 py-3 text-xs font-black shadow-md transition-all"
                    >
                      Submit Admission File
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

                <button
                  id="btn-admission-success-done"
                  onClick={() => setGeneratedAdmId(null)}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-xs font-bold shadow transition-all"
                >
                  Return to Admissions
                </button>
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
              {[
                { name: 'Priya Mishra', score: '98.4%', rank: 'State Topper Rank 4', desc: 'Outstanding logical step marks in Math & Physics numerical sheets.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60' },
                { name: 'Anuj Soni', score: '96.2%', rank: 'Hardoi District Rank 12', desc: 'Outstanding chemical reactions balancing with flawless grammar papers.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60' },
                { name: 'Aditi Shukla', score: '95.0%', rank: 'District Rank 18', desc: 'Perfect scoring in Social Studies maps and English grammar assessments.', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60' }
              ].map((top, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
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

        {/* VIEW 7: STUDY BLOGS */}
        {activeSection === 'blog' && (
          <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-black uppercase text-brand-orange tracking-widest block mb-1">Study Advice</span>
              <h3 className="font-display text-3xl font-black text-slate-800">Educational Articles & Tips</h3>
              <p className="text-xs text-slate-500 mt-1">Conquer pre-board syllabus stress using mental strategies crafted by our senior mentors.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {blogs.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="h-44 overflow-hidden bg-slate-100">
                      <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-5 space-y-3">
                      <span className="text-[9px] font-black text-brand-orange uppercase block">{b.category}</span>
                      <h4 className="font-display font-bold text-sm text-slate-800 leading-snug">{b.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{b.content}</p>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>By: {b.author}</span>
                    <span>{b.date}</span>
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
                  <Phone className="text-brand-orange flex-shrink-0" size={16} />
                  <div>
                    <strong>Direct Contacts:</strong>
                    <p className="text-slate-500 mt-0.5">Call: +91 8707738284 • WhatsApp: +91 9161586254</p>
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

              {/* simulated Google Maps card */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-48 bg-slate-100 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=60')" }}></div>
                <div className="z-10 text-center space-y-1 p-4">
                  <MapPin size={28} className="text-brand-red mx-auto animate-bounce" />
                  <span className="text-xs font-bold text-slate-800 block">SUNSHINE CLASSES PIHANI</span>
                  <span className="text-[10px] text-slate-400 block uppercase">Opposite Subhash Park</span>
                </div>
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
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2">
        <a
          id="btn-sticky-call"
          href="tel:8707738284"
          className="flex h-11 items-center gap-2 rounded-full bg-brand-blue text-white px-4 shadow-lg hover:bg-indigo-800 text-xs font-bold"
        >
          <Phone size={14} /> Call Office
        </a>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <SunshineLogo size="sm" showText={true} textColor="light" textSubTitle="Pihani, Hardoi" />
            </div>
            <p className="leading-relaxed">Building outstanding conceptual clarity in Mathematics, Science and English for Classes 1 to 10 board candidates.</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase mb-1">Tuition classes</h4>
            <div className="space-y-1">
              <div>• Class 10 Board Specialists</div>
              <div>• Class 9 Foundation course</div>
              <div>• Class 8 Apex Path</div>
              <div>• Class 1 to 5 Junior Sunshine</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase mb-1">Our Location</h4>
            <p className="leading-relaxed text-slate-400">Mohalla Mishrana, opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406)</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase mb-1">Contact Dial</h4>
            <div>📞 Call Desk: **8707738284**</div>
            <div>💬 WhatsApp: **9161586254**</div>
            <div>✉ Email: info@sunshineclasses.com</div>
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 mt-8 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-500">
          © 2026-2027 Sunshine Classes Pihani. All Rights Reserved. Created under Educational Guidelines.
        </div>
      </footer>
    </div>
  );
}
