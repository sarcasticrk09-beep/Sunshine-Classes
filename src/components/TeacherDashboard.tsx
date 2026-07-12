/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  BookOpen,
  Plus,
  Check,
  CheckCircle,
  FileText,
  Users,
  Award,
  AlertCircle,
  Star,
  CornerDownRight,
  TrendingUp,
  Clock,
  ChevronDown,
  Trash2,
  Settings,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { Teacher, Student, Attendance, Homework, HomeworkSubmission, Test, StudentMark, TimetableEntry, BatchBulletinPost, SubscriptionConfig } from '../types';
import { CloudinaryUpload } from './CloudinaryUpload';

interface TeacherDashboardProps {
  teacher: Teacher;
  students: Student[];
  attendanceList: Attendance[];
  homeworkList: Homework[];
  submissions: HomeworkSubmission[];
  tests: Test[];
  studentMarks: StudentMark[];
  onAddAttendance: (attendance: Omit<Attendance, 'id'>[]) => void;
  onAddHomework: (homework: Omit<Homework, 'id' | 'teacherId' | 'teacherName'>) => void;
  onEditHomework?: (homework: Homework) => void;
  onDeleteHomework?: (id: string) => void;
  onAddTest: (test: Omit<Test, 'id'>) => void;
  onAddMarks: (marks: Omit<StudentMark, 'id'>[]) => void;
  onReviewSubmission: (submissionId: string, remarks: string, score: string) => void;
  timetableList: TimetableEntry[];
  onUpdateTimetable: (timetable: TimetableEntry[]) => void;
  batchBulletins: BatchBulletinPost[];
  onAddBatchBulletinPost: (batchId: string, batchName: string, content: string) => void;
  onDeleteBatchBulletinPost: (postId: string) => void;
  subConfig: SubscriptionConfig;
}

export default function TeacherDashboard({
  teacher,
  students,
  attendanceList,
  homeworkList,
  submissions,
  tests,
  studentMarks,
  onAddAttendance,
  onAddHomework,
  onEditHomework,
  onDeleteHomework,
  onAddTest,
  onAddMarks,
  onReviewSubmission,
  timetableList,
  onUpdateTimetable,
  batchBulletins,
  onAddBatchBulletinPost,
  onDeleteBatchBulletinPost,
  subConfig
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'homework-assign' | 'homework-review' | 'test-marks' | 'schedule' | 'bulletin'>('overview');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState<string>('Class 10 Board Specialists');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' }>({});

  // Homework Assign States
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwSubject, setHwSubject] = useState('Mathematics');
  const [hwClass, setHwClass] = useState('Class 10 Board Specialists');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwFileUrl, setHwFileUrl] = useState('');
  const [viewerFileUrl, setViewerFileUrl] = useState<string | null>(null);
  const [viewerFileTitle, setViewerFileTitle] = useState<string>('');

  // Homework Management & Filters States
  const [filterHwClass, setFilterHwClass] = useState('All');
  const [filterHwSubject, setFilterHwSubject] = useState('All');
  const [filterHwDate, setFilterHwDate] = useState('');
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [editHwTitle, setEditHwTitle] = useState('');
  const [editHwDesc, setEditHwDesc] = useState('');
  const [editHwSubject, setEditHwSubject] = useState('Mathematics');
  const [editHwClass, setEditHwClass] = useState('Class 10 Board Specialists');
  const [editHwDueDate, setEditHwDueDate] = useState('');
  const [editHwFileUrl, setEditHwFileUrl] = useState('');

  // Batch Bulletin States
  const [bulletinInputText, setBulletinInputText] = useState('');
  const [bulletinSelectedBatch, setBulletinSelectedBatch] = useState<string>(teacher.batches[0] || 'Class 10 - Evening Stars');

  // Test Creation States
  const [testTitle, setTestTitle] = useState('');
  const [testClass, setTestClass] = useState('Class 10 Board Specialists');
  const [testSubject, setTestSubject] = useState('Mathematics');
  const [testChapter, setTestChapter] = useState('');
  const [testTotalMarks, setTestTotalMarks] = useState(30);
  const [testDate, setTestDate] = useState('');

  // Marks Entry States
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [testMarksEntry, setTestMarksEntry] = useState<{ [studentId: string]: { marks: number, remarks: string } }>({});

  // Review states
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewScore, setReviewScore] = useState('Excellent');

  // Schedule Management States
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [slotDay, setSlotDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');
  const [slotClass, setSlotClass] = useState('Class 10 Board Specialists');
  const [slotSubject, setSlotSubject] = useState('Mathematics');
  const [slotRoom, setSlotRoom] = useState('Room A');
  const [slotStartTime, setSlotStartTime] = useState('10:00 AM');
  const [slotEndTime, setSlotEndTime] = useState('11:30 AM');
  const [slotIsHoliday, setSlotIsHoliday] = useState(false);
  const [slotHolidayReason, setSlotHolidayReason] = useState('');

  // Filter students based on selected class
  const filteredStudents = students.filter((s) => s.class === selectedClass);

  // Initialize attendance records when class is changed
  const handleClassSelection = (cls: string) => {
    setSelectedClass(cls);
    const initialRecords: typeof attendanceRecords = {};
    students.filter((s) => s.class === cls).forEach((s) => {
      initialRecords[s.id] = 'PRESENT';
    });
    setAttendanceRecords(initialRecords);
  };

  const handleMarkAttendanceStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const batchStudents = students.filter((s) => s.class === selectedClass);
    
    const logs = batchStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      class: selectedClass,
      date: attendanceDate,
      status: attendanceRecords[s.id] || 'PRESENT',
      markedBy: teacher.name
    }));

    onAddAttendance(logs);
    alert(`Success! Marked digital attendance logs for ${batchStudents.length} students in ${selectedClass}.`);
  };

  const handleExportLiveDraft = () => {
    const batchStudents = students.filter((s) => s.class === selectedClass);
    if (batchStudents.length === 0) {
      alert(`No student records found for ${selectedClass} to export.`);
      return;
    }

    const headers = ['Roll No', 'Student Name', 'Class', 'Date', 'Status', 'Marked By'];
    const rows = batchStudents.map((s) => {
      const rollNo = s.rollNo || '';
      const status = attendanceRecords[s.id] || 'PRESENT';
      return [
        rollNo,
        s.name,
        selectedClass,
        attendanceDate,
        status,
        teacher.name
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_draft_${selectedClass.replace(/\s+/g, '_')}_${attendanceDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHistory = () => {
    const classHistory = attendanceList.filter((a) => a.class === selectedClass);
    if (classHistory.length === 0) {
      alert(`No historical attendance logs found in database for ${selectedClass}. Try submitting some roll calls first!`);
      return;
    }

    const headers = ['Record ID', 'Roll No', 'Student Name', 'Class', 'Session Date', 'Status', 'Marked By'];
    const rows = classHistory.map((a) => {
      const student = students.find((s) => s.id === a.studentId);
      const rollNo = student ? (student.rollNo || '') : '';
      return [
        a.id,
        rollNo,
        a.studentName,
        a.class,
        a.date,
        a.status,
        a.markedBy
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_history_${selectedClass.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHomework({
      title: hwTitle,
      description: hwDesc,
      class: hwClass,
      subject: hwSubject,
      dueDate: hwDueDate,
      date: new Date().toISOString().split('T')[0],
      fileUrl: hwFileUrl || undefined
    });

    setHwTitle('');
    setHwDesc('');
    setHwDueDate('');
    setHwFileUrl('');
    alert("New homework uploaded and sent to board students.");
  };

  const handleSaveEditHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomework) return;
    if (onEditHomework) {
      onEditHomework({
        ...editingHomework,
        title: editHwTitle,
        description: editHwDesc,
        class: editHwClass,
        subject: editHwSubject,
        dueDate: editHwDueDate,
        fileUrl: editHwFileUrl || undefined
      });
    }
    setEditingHomework(null);
    alert("Homework assignment updated successfully.");
  };

  const handleTriggerEditHomework = (hw: Homework) => {
    setEditingHomework(hw);
    setEditHwTitle(hw.title);
    setEditHwDesc(hw.description);
    setEditHwSubject(hw.subject);
    setEditHwClass(hw.class);
    setEditHwDueDate(hw.dueDate);
    setEditHwFileUrl(hw.fileUrl || '');
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTest({
      title: testTitle,
      class: testClass,
      subject: testSubject,
      chapter: testChapter,
      totalMarks: Number(testTotalMarks),
      date: testDate
    });

    setTestTitle('');
    setTestChapter('');
    setTestDate('');
    alert("Official test registered. Select 'Enter Test Marks' tab to grade students.");
  };

  const handleOpenMarksEntry = (testId: string) => {
    setSelectedTestId(testId);
    const testObj = tests.find((t) => t.id === testId);
    if (!testObj) return;

    const initialMarks: typeof testMarksEntry = {};
    students.filter((s) => s.class === testObj.class).forEach((s) => {
      // Find if existing marks
      const existing = studentMarks.find((m) => m.testId === testId && m.studentId === s.id);
      initialMarks[s.id] = {
        marks: existing ? existing.marksObtained : 0,
        remarks: existing ? existing.remarks || '' : ''
      };
    });
    setTestMarksEntry(initialMarks);
  };

  const handleSubmitMarks = (e: React.FormEvent) => {
    e.preventDefault();
    const testObj = tests.find((t) => t.id === selectedTestId);
    if (!testObj) return;

    const marksRecords = students.filter((s) => s.class === testObj.class).map((s) => ({
      testId: selectedTestId,
      studentId: s.id,
      studentName: s.name,
      class: testObj.class,
      marksObtained: Number(testMarksEntry[s.id]?.marks || 0),
      remarks: testMarksEntry[s.id]?.remarks || ''
    }));

    onAddMarks(marksRecords);
    setSelectedTestId('');
    alert(`Syllabus grades saved. Automated student rankings updated for test: "${testObj.title}"`);
  };

  const handleReviewHomework = (subId: string) => {
    setSelectedSubmissionId(subId);
    const sub = submissions.find((s) => s.id === subId);
    if (sub) {
      setReviewRemarks(sub.remarks || '');
      setReviewScore(sub.score || 'Excellent');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;

    onReviewSubmission(selectedSubmissionId, reviewRemarks, reviewScore);
    setSelectedSubmissionId(null);
    alert("Evaluation comments dispatched to student progress file.");
  };

  const handleCreateTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: TimetableEntry = {
      id: `tt-${Date.now()}`,
      day: slotDay,
      className: slotClass,
      subject: slotSubject,
      teacherName: teacher.name,
      room: slotRoom,
      startTime: slotStartTime,
      endTime: slotEndTime,
      isHoliday: slotIsHoliday,
      holidayReason: slotHolidayReason
    };
    onUpdateTimetable([...timetableList, newEntry]);
    setIsAddSlotOpen(false);
    setSlotHolidayReason('');
    alert("New lecture slot registered successfully on the smart database!");
  };

  const handleDeleteTimetableSlot = (id: string) => {
    const filtered = timetableList.filter((t) => t.id !== id);
    onUpdateTimetable(filtered);
    alert("Timetable slot deleted.");
  };

  // Filter submissions assigned to this teacher's subject / classes
  const classesTaught = ['Class 10 Board Specialists', 'Class 9 Foundation Course', 'Classes 5 to 8 Apex Learning', 'Classes 1 to 4 Junior Sunshine'];
  const relevantSubmissions = submissions.filter((sub) => classesTaught.includes(sub.class));

  return (
    <div id="teacher-portal" className="mx-auto max-w-7xl px-4 py-8">
      {/* Teacher Profile Card */}
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-emerald-800 p-6 text-white md:flex-row md:items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-emerald-800 text-2xl font-black shadow">
            {teacher.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-2xl font-black">{teacher.name}</h2>
            <p className="text-sm text-emerald-100">{teacher.qualification} • Senior Board Expert</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {teacher.specialty.map((s, idx) => (
                <span key={idx} className="rounded bg-emerald-700/80 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">Core Faculty ID</span>
          <span className="font-mono text-sm font-bold text-amber-300">FACULTY-{teacher.id.toUpperCase()}</span>
        </div>
      </div>

      {/* Main ERP Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar / Mobile Switcher */}
        <div className="lg:col-span-1">
          {(() => {
            const tabsList = [
              { id: 'overview', label: 'Teacher Dashboard Overview', icon: <Award size={16} /> },
              { id: 'attendance', label: 'Daily Attendance Register', icon: <Users size={16} /> },
              { id: 'homework-assign', label: 'Upload Homework Assignments', icon: <BookOpen size={16} /> },
              { id: 'homework-review', label: `Review Homework submissions (${relevantSubmissions.filter(s => s.status === 'SUBMITTED').length})`, icon: <CheckCircle size={16} /> },
              { id: 'test-marks', label: 'Test Creation & Grading Ledger', icon: <FileText size={16} /> },
              { id: 'bulletin', label: 'Batch Bulletin Board', icon: <MessageSquare size={16} /> }
            ] as const;

            const activeTabObj = tabsList.find(t => t.id === activeTab);

            return (
              <>
                {/* Mobile Tab Dropdown Selector (Visible on < lg) */}
                <div className="block lg:hidden mb-4 relative">
                  <button
                    id="teacher-mobile-tab-dropdown-btn"
                    type="button"
                    onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-emerald-200 active:bg-slate-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700">
                        {activeTabObj?.icon}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {activeTabObj?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Menu</span>
                      <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isTabDropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown on tap outside */}
                      <div 
                        className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-3xs" 
                        onClick={() => setIsTabDropdownOpen(false)} 
                      />
                      
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                        <div className="px-3 py-1.5 mb-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Navigate Faculty Desk
                        </div>
                        <div className="pt-1.5 space-y-1">
                          {tabsList.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                id={`teacher-mobile-tab-opt-${tab.id}`}
                                type="button"
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  if (tab.id === 'attendance') {
                                    handleClassSelection(selectedClass);
                                  }
                                  setIsTabDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-emerald-700 text-white shadow-sm font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                                  {tab.icon}
                                </span>
                                <span className="text-left font-semibold text-xs flex-1">{tab.label}</span>
                                {isSelected && (
                                  <Check size={14} className="text-amber-400 font-bold" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Desktop Navigation Sidebar (Visible on >= lg) */}
                <div className="hidden lg:block">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 lg:p-4 shadow-sm space-y-1">
                    <span className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Controls</span>
                    <div className="flex flex-col gap-1">
                      {tabsList.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            id={`teacher-desktop-tab-${tab.id}`}
                            onClick={() => {
                              setActiveTab(tab.id);
                              if (tab.id === 'attendance') {
                                handleClassSelection(selectedClass);
                              }
                            }}
                            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Dynamic content screen */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Syllabus Batches</span>
                  <span className="font-display text-2xl font-black text-slate-800">{teacher.batches.length} Active</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Class 10 Specialists</span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Homework Pending Review</span>
                  <span className="font-display text-2xl font-black text-slate-800">
                    {relevantSubmissions.filter((s) => s.status === 'SUBMITTED').length} submissions
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Review queue active</span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Registered Tests Taught</span>
                  <span className="font-display text-2xl font-black text-slate-800">{tests.length} tests</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Chapter wise ranking</span>
                </div>
              </div>

              {/* Taught Batches / Classes card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-display font-bold text-sm text-slate-800 mb-4">Your Batch Schedules Today</h3>
                <div className="space-y-3">
                  {teacher.batches.map((bName, idx) => {
                    const matchedBatch = bName.includes('Morning') ? '07:00 AM - 09:30 AM' : '04:00 PM - 06:30 PM';
                    return (
                      <div key={idx} className="rounded-xl border border-slate-100 p-4 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{bName}</h4>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar size={11} /> {matchedBatch}
                          </p>
                        </div>
                        <span className="inline-flex rounded bg-emerald-50 text-emerald-800 px-2.5 py-1 text-[10px] font-bold">
                          Daily Attendance OK
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rapid Homework Submission summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-display font-bold text-sm text-slate-800 mb-4">Recent Submissions Waiting Feedback</h3>
                <div className="space-y-3">
                  {relevantSubmissions.filter(s => s.status === 'SUBMITTED').slice(0, 2).map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">{sub.class} • {sub.studentName}</span>
                        <h4 className="text-xs font-bold text-slate-800">Completed Exercise Solution</h4>
                      </div>
                      <button
                        id={`btn-hw-review-quick-${sub.id}`}
                        onClick={() => {
                          setActiveTab('homework-review');
                          handleReviewHomework(sub.id);
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white shadow hover:bg-emerald-700"
                      >
                        Grade Submission
                      </button>
                    </div>
                  ))}
                  {relevantSubmissions.filter(s => s.status === 'SUBMITTED').length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">Great job! All student homework copies have been reviewed.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Daily Student Attendance Portal</h3>
                <p className="text-xs text-slate-500 mb-6">Select appropriate class cohort and enter daily session statistics.</p>

                <form onSubmit={handleSubmitAttendance} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Academic Cohort</label>
                      <select
                        id="select-attendance-class"
                        value={selectedClass}
                        onChange={(e) => handleClassSelection(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      >
                        <option value="Class 10 Board Specialists">Class 10 Board Specialists (₹1,200/mo)</option>
                        <option value="Class 9 Foundation Course">Class 9 Foundation Course (₹1,000/mo)</option>
                        <option value="Classes 5 to 8 Apex Learning">Classes 5 to 8 Apex Learning (₹700/mo)</option>
                        <option value="Classes 1 to 4 Junior Sunshine">Classes 1 to 4 Junior Sunshine (₹500/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Session Date</label>
                      <input
                        id="input-attendance-date"
                        type="date"
                        required
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Students check-list */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 p-3 flex justify-between font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      <span>Student Profile</span>
                      <span>Attendance Status</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">No students registered in {selectedClass} cohort.</div>
                      ) : (
                        filteredStudents.map((s) => {
                          const statusValue = attendanceRecords[s.id] || 'PRESENT';
                          return (
                            <div key={s.id} className="p-3 flex justify-between items-center hover:bg-slate-50/30">
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 block">{s.rollNo}</span>
                                <span className="text-xs font-bold text-slate-800">{s.name}</span>
                              </div>

                              <div className="flex gap-1.5">
                                {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((st) => (
                                  <button
                                    key={st}
                                    id={`btn-mark-${s.id}-${st.toLowerCase()}`}
                                    type="button"
                                    onClick={() => handleMarkAttendanceStatus(s.id, st)}
                                    className={`rounded-lg px-2.5 py-1 text-[9px] font-bold border transition-colors ${
                                      statusValue === st
                                        ? st === 'PRESENT' ? 'bg-green-600 text-white border-green-600 shadow-sm' :
                                          st === 'ABSENT' ? 'bg-red-600 text-white border-red-600 shadow-sm' :
                                          st === 'LATE' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-brand-blue text-white border-brand-blue shadow-sm'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-attendance-submit"
                      type="submit"
                      disabled={filteredStudents.length === 0}
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                    >
                      Register Roll Call Attendance
                    </button>
                  </div>
                </form>
              </div>

              {/* Attendance Reports & CSV Export Actions Sidebar */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                        <FileSpreadsheet size={18} />
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-800">Attendance Exports</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Export attendance reports to downloadable CSV files for offline spreadsheets, backup logs, or administrative records.
                    </p>

                    <div className="space-y-4">
                      {/* Active Draft Exporter */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:border-slate-200 transition-all">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          Live Session Draft
                        </span>
                        <p className="text-[11px] text-slate-500 mb-2.5">
                          Download a CSV copy of the {selectedClass} roster with the exact status choices currently selected above on the screen.
                        </p>
                        <button
                          id="btn-export-live-draft"
                          type="button"
                          onClick={handleExportLiveDraft}
                          disabled={filteredStudents.length === 0}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/10 py-2 text-[11px] font-bold text-slate-700 hover:text-emerald-700 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download size={13} />
                          Download Live Draft (.CSV)
                        </button>
                      </div>

                      {/* Historical DB Exporter */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:border-slate-200 transition-all">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          Saved Class Records
                        </span>
                        <p className="text-[11px] text-slate-500 mb-2.5">
                          Download ALL saved historical roll call records for {selectedClass} ever submitted to the database.
                        </p>
                        <button
                          id="btn-export-historical-csv"
                          type="button"
                          onClick={handleExportHistory}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 py-2 text-[11px] font-bold text-white transition-all shadow cursor-pointer"
                        >
                          <Download size={13} />
                          Export All saved {selectedClass} Logs (.CSV)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-normal">
                    💡 <strong>Tips:</strong> CSV files are pre-formatted for Microsoft Excel, Google Sheets, or LibreOffice. Columns contain Student Roll Numbers, Names, Session Dates, Attendance Status, and the marking instructor's identity.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOMEWORK ASSIGN */}
          {activeTab === 'homework-assign' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display font-bold text-base text-slate-800 mb-1">Create Homework Tasks</h3>
              <p className="text-xs text-slate-500 mb-6">Upload detailed conceptual questions based on NCERT syllabus sheets.</p>

              <form onSubmit={handleCreateHomework} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Homework Title</label>
                    <input
                      id="input-hw-title"
                      type="text"
                      required
                      placeholder="e.g. Exercise 4.3 Quadratic Formula"
                      value={hwTitle}
                      onChange={(e) => setHwTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Subject Specialty</label>
                    <select
                      id="select-hw-subject"
                      value={hwSubject}
                      onChange={(e) => setHwSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science (Phy/Chem/Bio)</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Assigned Cohort Class</label>
                    <select
                      id="select-hw-class"
                      value={hwClass}
                      onChange={(e) => setHwClass(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                    >
                      <option value="Class 10 Board Specialists">Class 10 Board Specialists (₹1,200/mo)</option>
                      <option value="Class 9 Foundation Course">Class 9 Foundation Course (₹1,000/mo)</option>
                      <option value="Classes 5 to 8 Apex Learning">Classes 5 to 8 Apex Learning (₹700/mo)</option>
                      <option value="Classes 1 to 4 Junior Sunshine">Classes 1 to 4 Junior Sunshine (₹500/mo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Submission Due Date</label>
                    <input
                      id="input-hw-due-date"
                      type="date"
                      required
                      value={hwDueDate}
                      onChange={(e) => setHwDueDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Homework Conceptual Guidelines</label>
                  <textarea
                    id="ta-hw-desc"
                    required
                    rows={4}
                    placeholder="Provide specific questions, NCERT page numbers, and instructions clearly..."
                    value={hwDesc}
                    onChange={(e) => setHwDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <CloudinaryUpload
                    id="teacher-homework-upload-cloudinary"
                    folder="assignments"
                    cloudName={subConfig.cloudinaryCloudName}
                    uploadPreset={subConfig.cloudinaryUploadPreset}
                    apiKey={subConfig.cloudinaryApiKey}
                    apiSecret={subConfig.cloudinaryApiSecret}
                    maxSizeMB={subConfig.cloudinaryMaxFileSize}
                    initialUrl={hwFileUrl}
                    onUploadSuccess={(url) => setHwFileUrl(url)}
                    onFileDeleted={() => setHwFileUrl('')}
                    allowedTypes={['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx']}
                    label="Attach Question Paper / PDF / Image (Optional)"
                  />
                </div>

                {hwFileUrl && (
                  <div className="mt-2.5 p-3 rounded-xl border border-slate-150 bg-slate-50/50 max-w-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Preview uploaded files before publishing:</span>
                    <div className="flex flex-wrap gap-2">
                      {hwFileUrl.split(',').filter(Boolean).map((url, idx) => (
                        <button
                          key={idx}
                          id={`btn-preview-publishing-${idx}`}
                          type="button"
                          onClick={() => {
                            setViewerFileUrl(url);
                            setViewerFileTitle(`Pre-publish Preview ${idx + 1}`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          👁 Preview Attachment {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    id="btn-hw-assign-submit"
                    type="submit"
                    className="rounded-xl bg-emerald-750 bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                  >
                    Broadcast Homework Assignment
                  </button>
                </div>
              </form>

              {/* Assigned Homework List Section */}
              <div className="mt-10 border-t border-slate-150 pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h4 className="font-display font-bold text-base text-slate-800">Assigned Homeworks Registry</h4>
                    <p className="text-xs text-slate-500">Manage, filter, edit, or remove class syllabus tasks previously sent to your cohorts.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Filter Class */}
                    <select
                      id="filter-assigned-class"
                      value={filterHwClass}
                      onChange={(e) => setFilterHwClass(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-700"
                    >
                      <option value="All">All Classes</option>
                      <option value="Class 10 Board Specialists">Class 10 Board</option>
                      <option value="Class 9 Foundation Course">Class 9 Foundation</option>
                      <option value="Classes 5 to 8 Apex Learning">Classes 5 to 8</option>
                      <option value="Classes 1 to 4 Junior Sunshine">Classes 1 to 4</option>
                    </select>

                    {/* Filter Subject */}
                    <select
                      id="filter-assigned-subject"
                      value={filterHwSubject}
                      onChange={(e) => setFilterHwSubject(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-700"
                    >
                      <option value="All">All Subjects</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                    </select>

                    {/* Filter Date */}
                    <input
                      id="filter-assigned-date"
                      type="date"
                      value={filterHwDate}
                      onChange={(e) => setFilterHwDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>

                {/* Homework Cards */}
                {(() => {
                  const filteredHws = homeworkList.filter(hw => {
                    // Check if assigned by this teacher
                    const isMyHw = hw.teacherId === teacher.id;
                    if (!isMyHw) return false;
                    
                    const matchesClass = filterHwClass === 'All' || hw.class === filterHwClass;
                    const matchesSubject = filterHwSubject === 'All' || hw.subject === filterHwSubject;
                    const matchesDate = !filterHwDate || hw.date === filterHwDate || hw.dueDate === filterHwDate;
                    return matchesClass && matchesSubject && matchesDate;
                  });

                  if (filteredHws.length === 0) {
                    return (
                      <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 text-slate-400 text-xs font-bold">
                        No assigned homework matching the filters found.
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredHws.map((hw) => {
                        const attachments = hw.fileUrl ? hw.fileUrl.split(',').filter(Boolean) : [];
                        return (
                          <div key={hw.id} className="rounded-xl border border-slate-150 p-4 bg-slate-50/15 flex flex-col justify-between gap-3 shadow-3xs hover:shadow-2xs transition-shadow">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                                    {hw.subject}
                                  </span>
                                  <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 truncate max-w-[130px]">
                                    {hw.class}
                                  </span>
                                </div>
                                <span className="text-[9.5px] font-medium text-slate-400">Assigned: {hw.date}</span>
                              </div>

                              <h5 className="text-xs font-black text-slate-800 leading-snug">{hw.title}</h5>
                              <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 whitespace-pre-line leading-relaxed">{hw.description}</p>

                              {/* Attachments List */}
                              {attachments.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Attached sheets ({attachments.length}):</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {attachments.map((url, idx) => {
                                      const ext = url.split('.').pop()?.toLowerCase() || '';
                                      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                                      return (
                                        <button
                                          key={idx}
                                          id={`btn-view-attached-${hw.id}-${idx}`}
                                          type="button"
                                          onClick={() => {
                                            setViewerFileUrl(url);
                                            setViewerFileTitle(`Assigned Attachment ${idx + 1}: ${hw.title}`);
                                          }}
                                          className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-md transition-all cursor-pointer"
                                        >
                                          👁 sheet {idx + 1} ({isImage ? 'image' : 'pdf'})
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                              <span className="text-[10px] font-bold text-amber-600">Due: {hw.dueDate}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  id={`btn-hw-edit-${hw.id}`}
                                  type="button"
                                  onClick={() => handleTriggerEditHomework(hw)}
                                  className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg shadow-3xs cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  id={`btn-hw-delete-${hw.id}`}
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you absolutely sure you want to delete the assignment "${hw.title}"? This cannot be undone.`)) {
                                      if (onDeleteHomework) onDeleteHomework(hw.id);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-white bg-red-650 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg shadow-3xs cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Edit Homework Modal Popup */}
          <AnimatePresence>
            {editingHomework && (
              <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-40 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4">
                    <h4 className="font-display font-bold text-sm text-slate-800">Edit Homework Assignment</h4>
                    <button
                      id="btn-close-edit-hw-modal"
                      type="button"
                      onClick={() => setEditingHomework(null)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditHomework} className="space-y-4 text-left">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Homework Title</label>
                        <input
                          id="edit-input-hw-title"
                          type="text"
                          required
                          value={editHwTitle}
                          onChange={(e) => setEditHwTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Subject Specialty</label>
                        <select
                          id="edit-select-hw-subject"
                          value={editHwSubject}
                          onChange={(e) => setEditHwSubject(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science (Phy/Chem/Bio)</option>
                          <option value="English">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Assigned Cohort Class</label>
                        <select
                          id="edit-select-hw-class"
                          value={editHwClass}
                          onChange={(e) => setEditHwClass(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                        >
                          <option value="Class 10 Board Specialists">Class 10 Board Specialists (₹1,200/mo)</option>
                          <option value="Class 9 Foundation Course">Class 9 Foundation Course (₹1,000/mo)</option>
                          <option value="Classes 5 to 8 Apex Learning">Classes 5 to 8 Apex Learning (₹700/mo)</option>
                          <option value="Classes 1 to 4 Junior Sunshine">Classes 1 to 4 Junior Sunshine (₹500/mo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Submission Due Date</label>
                        <input
                          id="edit-input-hw-due-date"
                          type="date"
                          required
                          value={editHwDueDate}
                          onChange={(e) => setEditHwDueDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Homework Conceptual Guidelines</label>
                      <textarea
                        id="edit-ta-hw-desc"
                        required
                        rows={4}
                        value={editHwDesc}
                        onChange={(e) => setEditHwDesc(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      ></textarea>
                    </div>

                    <div className="space-y-1">
                      <CloudinaryUpload
                        id="edit-homework-upload-cloudinary"
                        folder="assignments"
                        cloudName={subConfig.cloudinaryCloudName}
                        uploadPreset={subConfig.cloudinaryUploadPreset}
                        apiKey={subConfig.cloudinaryApiKey}
                        apiSecret={subConfig.cloudinaryApiSecret}
                        maxSizeMB={subConfig.cloudinaryMaxFileSize}
                        initialUrl={editHwFileUrl}
                        onUploadSuccess={(url) => setEditHwFileUrl(url)}
                        onFileDeleted={() => setEditHwFileUrl('')}
                        allowedTypes={['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx']}
                        label="Attach Question Paper / PDF / Image (Optional)"
                      />
                    </div>

                    {editHwFileUrl && (
                      <div className="p-3 rounded-xl border border-slate-150 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Preview current files:</span>
                        <div className="flex flex-wrap gap-2">
                          {editHwFileUrl.split(',').filter(Boolean).map((url, idx) => (
                            <button
                              key={idx}
                              id={`btn-preview-edit-publishing-${idx}`}
                              type="button"
                              onClick={() => {
                                setViewerFileUrl(url);
                                setViewerFileTitle(`Edit Preview ${idx + 1}`);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              👁 Preview Attachment {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-4">
                      <button
                        id="btn-edit-hw-cancel"
                        type="button"
                        onClick={() => setEditingHomework(null)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-edit-hw-submit"
                        type="submit"
                        className="rounded-xl bg-emerald-750 bg-emerald-700 hover:bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                      >
                        Save Homework Updates
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* TAB 4: HOMEWORK REVIEW SUBMISSIONS */}
          {activeTab === 'homework-review' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display font-bold text-base text-slate-800 mb-1">Homework Submissions Waiting Evaluation</h3>
              <p className="text-xs text-slate-500 mb-6">Review student homework answers, give numerical/grading feedback, and add supportive guidelines remarks.</p>

              <div className="space-y-4">
                {relevantSubmissions.map((sub) => {
                  const origHw = homeworkList.find((h) => h.id === sub.homeworkId);
                  return (
                    <div key={sub.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
                      <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase text-brand-blue">{sub.class} Student</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              sub.status === 'REVIEWED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-brand-orange animate-pulse'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">Submitted by: {sub.studentName}</h4>
                          <p className="text-[10px] text-slate-400">Date: {sub.submissionDate}</p>

                          {origHw && (
                            <div className="mt-2.5 mb-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 max-w-2xl">
                              <span className="text-[9px] font-bold text-indigo-700 uppercase block mb-1">📋 Original Homework Assignment:</span>
                              <h5 className="text-xs font-bold text-slate-800">{origHw.title}</h5>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{origHw.description}</p>
                              {origHw.fileUrl && (
                                <div className="mt-2 p-2 bg-white rounded-lg border border-indigo-100 max-w-md">
                                  <span className="text-[9px] font-bold text-indigo-600 uppercase block mb-1">Attached Question Sheet:</span>
                                  {origHw.fileUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || origHw.fileUrl.startsWith('data:image/') ? (
                                    <div className="space-y-1">
                                      <img
                                        src={origHw.fileUrl}
                                        alt="Homework Question Attachment Preview"
                                        className="max-h-24 rounded border border-slate-100 object-contain bg-slate-50"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="flex flex-wrap gap-2.5 mt-1.5">
                                        <button
                                          id={`btn-view-orig-hw-preview-${sub.id}`}
                                          type="button"
                                          onClick={() => {
                                            setViewerFileUrl(origHw.fileUrl!);
                                            setViewerFileTitle(`Original Assignment: ${origHw.title}`);
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all"
                                        >
                                          👁 View Directly
                                        </button>
                                        <a
                                          href={origHw.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:underline pt-0.5"
                                        >
                                          Open Photo ↗
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <FileText size={14} className="text-indigo-600" />
                                      <div>
                                        <span className="block text-[10px] font-semibold text-slate-700">Question Attachment File</span>
                                        <div className="flex flex-wrap gap-2.5 mt-1">
                                          <button
                                            id={`btn-view-orig-hw-pdf-${sub.id}`}
                                            type="button"
                                            onClick={() => {
                                              setViewerFileUrl(origHw.fileUrl!);
                                              setViewerFileTitle(`Original Assignment: ${origHw.title}`);
                                            }}
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all"
                                          >
                                            👁 View Directly
                                          </button>
                                          <a
                                            href={origHw.fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:underline pt-0.5"
                                          >
                                            Open PDF ↗
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {sub.textAnswer && (
                            <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3 text-xs text-slate-600 font-sans whitespace-pre-wrap">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Student Answer Details:</span>
                              {sub.textAnswer}
                            </div>
                          )}

                          {sub.fileUrl && (
                            <div className="mt-3 rounded-lg border border-slate-150 bg-slate-50 p-3 text-xs text-slate-700">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1.5">Attached Homework Document:</span>
                              {sub.fileUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)/) ? (
                                <div className="space-y-2">
                                  <img 
                                    src={sub.fileUrl} 
                                    alt="Submitted Homework Preview" 
                                    referrerPolicy="no-referrer"
                                    className="max-h-60 rounded-lg border border-slate-200 object-contain hover:scale-[1.01] transition-transform" 
                                  />
                                  <div className="flex flex-wrap gap-2.5 mt-1.5">
                                    <button
                                      id={`btn-view-sub-preview-${sub.id}`}
                                      type="button"
                                      onClick={() => {
                                        setViewerFileUrl(sub.fileUrl!);
                                        setViewerFileTitle(`Student Submission: ${sub.studentName}`);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                                    >
                                      👁 View in Browser
                                    </button>
                                    <a 
                                      href={sub.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline pt-1"
                                    >
                                      Open Image in New Tab
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                                    <FileText size={20} />
                                  </div>
                                  <div>
                                    <span className="block text-xs font-bold text-slate-800 mb-1">PDF Homework Submission</span>
                                    <div className="flex flex-wrap gap-2.5">
                                      <button
                                        id={`btn-view-sub-pdf-${sub.id}`}
                                        type="button"
                                        onClick={() => {
                                          setViewerFileUrl(sub.fileUrl!);
                                          setViewerFileTitle(`Student Submission: ${sub.studentName}`);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                                      >
                                        👁 View in Browser
                                      </button>
                                      <a 
                                        href={sub.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline pt-1"
                                      >
                                        View PDF / Download Document
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {sub.status === 'SUBMITTED' ? (
                            <button
                              id={`btn-hw-review-${sub.id}`}
                              onClick={() => handleReviewHomework(sub.id)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow"
                            >
                              Grade Copy
                            </button>
                          ) : (
                            <div className="text-right text-xs">
                              <span className="font-bold text-slate-700 block">Grade: {sub.score}</span>
                              <span className="text-[10px] text-slate-400 italic block">"{sub.remarks}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {relevantSubmissions.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No assignments have been submitted yet.</p>
                )}
              </div>

              {/* Review Input Section Modal */}
              {selectedSubmissionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <h3 className="font-display font-bold text-base text-slate-800 mb-1">Homework Copy Grading Form</h3>
                    <p className="text-xs text-slate-500 mb-4">Provide constructive remarks and grading index.</p>

                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Grading / Score Index</label>
                        <select
                          id="select-review-score"
                          value={reviewScore}
                          onChange={(e) => setReviewScore(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                        >
                          <option value="Excellent">Excellent (Outstanding Steps)</option>
                          <option value="Good">Good (Concepts Correct, minor mistakes)</option>
                          <option value="Needs Improvement">Needs Improvement (Revise Chapter thoroughly)</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Teacher Constructive Remarks</label>
                        <textarea
                          id="ta-review-remarks"
                          required
                          rows={3}
                          value={reviewRemarks}
                          onChange={(e) => setReviewRemarks(e.target.value)}
                          placeholder="Provide descriptive tips. e.g. Revise ray Diagrams on page 142 of NCERT..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                        ></textarea>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          id="btn-review-cancel"
                          type="button"
                          onClick={() => setSelectedSubmissionId(null)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Close
                        </button>
                        <button
                          id="btn-review-submit"
                          type="submit"
                          className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800"
                        >
                          Disptach Grade
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TEST CREATION & MARKS ENTRY */}
          {activeTab === 'test-marks' && (
            <div className="space-y-6">
              {/* Test Creation Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">Create New Academic Assessment</h3>
                <p className="text-xs text-slate-500 mb-4">Define chapter goals and total test points parameters.</p>

                <form onSubmit={handleCreateTest} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Test Title</label>
                      <input
                        id="input-test-title"
                        type="text"
                        required
                        placeholder="e.g. Science Chapter 4 Test"
                        value={testTitle}
                        onChange={(e) => setTestTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Academic Cohort</label>
                      <select
                        id="select-test-class"
                        value={testClass}
                        onChange={(e) => setTestClass(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      >
                        <option value="Class 10 Board Specialists">Class 10 Board Specialists (₹1,200/mo)</option>
                        <option value="Class 9 Foundation Course">Class 9 Foundation Course (₹1,000/mo)</option>
                        <option value="Classes 5 to 8 Apex Learning">Classes 5 to 8 Apex Learning (₹700/mo)</option>
                        <option value="Classes 1 to 4 Junior Sunshine">Classes 1 to 4 Junior Sunshine (₹500/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Subject Specialty</label>
                      <select
                        id="select-test-subject"
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Chapter / Chapter Name</label>
                      <input
                        id="input-test-chapter"
                        type="text"
                        required
                        placeholder="e.g. Triangles & Trigonometry"
                        value={testChapter}
                        onChange={(e) => setTestChapter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Total Marks Value</label>
                      <input
                        id="input-test-marks"
                        type="number"
                        required
                        value={testTotalMarks}
                        onChange={(e) => setTestTotalMarks(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Test Conducted Date</label>
                      <input
                        id="input-test-date"
                        type="date"
                        required
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="btn-create-test"
                      type="submit"
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
                    >
                      Register New Test
                    </button>
                  </div>
                </form>
              </div>

              {/* Test Grading List */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-800 mb-4">Enter Student Grades & Marks</h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {tests.map((test) => (
                    <div key={test.id} className="rounded-xl border border-slate-100 p-4 hover:border-slate-300 transition-all">
                      <span className="text-[9px] font-black text-brand-blue block mb-1 uppercase">
                        {test.class} • {test.subject}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{test.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Syllabus: {test.chapter}</p>
                      <p className="text-[10px] text-slate-400">Total Points: {test.totalMarks} • Date: {test.date}</p>

                      <button
                        id={`btn-open-grading-${test.id}`}
                        onClick={() => handleOpenMarksEntry(test.id)}
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-emerald-700 hover:text-white border border-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors"
                      >
                        <Plus size={14} /> Grade Student Scores
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enter Marks Form Dialog */}
              {selectedTestId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
                    <h3 className="font-display font-bold text-base text-slate-800 mb-1">Enter Marks Directory</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Test: **{tests.find(t => t.id === selectedTestId)?.title}** (Total Marks: {tests.find(t => t.id === selectedTestId)?.totalMarks})
                    </p>

                    <form onSubmit={handleSubmitMarks} className="space-y-4">
                      <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {students.filter(s => s.class === tests.find(t => t.id === selectedTestId)?.class).map((student) => (
                          <div key={student.id} className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
                            <div className="col-span-1">
                              <span className="text-[10px] text-slate-400 block font-mono">{student.rollNo}</span>
                              <span className="text-xs font-bold text-slate-800">{student.name}</span>
                            </div>

                            <div className="col-span-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Marks Scored</label>
                              <input
                                id={`input-marks-${student.id}`}
                                type="number"
                                max={tests.find(t => t.id === selectedTestId)?.totalMarks}
                                min={0}
                                required
                                value={testMarksEntry[student.id]?.marks || 0}
                                onChange={(e) => setTestMarksEntry(prev => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    marks: Number(e.target.value)
                                  }
                                }))}
                                className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-slate-50"
                              />
                            </div>

                            <div className="col-span-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Remarks Comments</label>
                              <input
                                id={`input-remarks-${student.id}`}
                                type="text"
                                placeholder="e.g. Excellent formula steps!"
                                value={testMarksEntry[student.id]?.remarks || ''}
                                onChange={(e) => setTestMarksEntry(prev => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    remarks: e.target.value
                                  }
                                }))}
                                className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-slate-50"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          id="btn-grading-cancel"
                          type="button"
                          onClick={() => setSelectedTestId('')}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          id="btn-grading-submit"
                          type="submit"
                          className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800"
                        >
                          Publish Report Grades
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SCHEDULE PLANNER */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-800">Smart Lecture Scheduler</h3>
                    <p className="text-xs text-slate-500">Add, edit, or remove classroom allocations, lecture timings, and post holiday updates for students.</p>
                  </div>
                  <button
                    id="btn-open-add-slot-modal"
                    onClick={() => setIsAddSlotOpen(true)}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Add Lecture / Holiday Notice
                  </button>
                </div>

                {/* Filters */}
                <div className="border border-slate-100 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse block md:table">
                    <thead className="hidden md:table-header-group">
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-3">Day</th>
                        <th className="p-3">Target Class</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Faculty / Teacher</th>
                        <th className="p-3">Time Window</th>
                        <th className="p-3">Room / Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y md:divide-slate-50 text-xs">
                      {timetableList.length === 0 ? (
                        <tr className="block md:table-row">
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-medium block md:table-cell">No schedule slots registered in Sunshine Classes database yet.</td>
                        </tr>
                      ) : (
                        timetableList.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50/30 block md:table-row p-3 md:p-0">
                            <td className="py-1 px-3 font-bold text-slate-800 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Day:</span>{entry.day}</td>
                            <td className="py-1 px-3 font-semibold text-slate-600 block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Class:</span>{entry.className}</td>
                            <td className="py-1 px-3 block md:table-cell md:p-3">
                              <span className="inline-block md:hidden font-bold text-slate-400 w-28">Subject:</span>
                              <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 text-[10px]">
                                {entry.subject}
                              </span>
                            </td>
                            <td className="py-1 px-3 text-slate-600 font-medium block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Faculty:</span>{entry.teacherName}</td>
                            <td className="py-1 px-3 text-slate-500 font-mono text-[10px] block md:table-cell md:p-3"><span className="inline-block md:hidden font-bold text-slate-400 w-28">Time:</span>{entry.startTime} - {entry.endTime}</td>
                            <td className="py-1 px-3 block md:table-cell md:p-3">
                              <span className="inline-block md:hidden font-bold text-slate-400 w-28">Room/Status:</span>
                              {entry.isHoliday ? (
                                <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                                  Holiday: {entry.holidayReason || 'N/A'}
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                  {entry.room}
                                </span>
                              )}
                            </td>
                            <td className="py-1 px-3 text-left md:text-right block md:table-cell md:p-3">
                              <span className="inline-block md:hidden font-bold text-slate-400 w-28">Actions:</span>
                              <button
                                id={`btn-delete-slot-${entry.id}`}
                                onClick={() => handleDeleteTimetableSlot(entry.id)}
                                className="rounded p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors inline-block align-middle"
                                title="Delete Slot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Slot Dialog Modal */}
              {isAddSlotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <h3 className="font-display font-bold text-base text-slate-800 mb-1">Create Lecture or Holiday Notice</h3>
                    <p className="text-xs text-slate-500 mb-4">Draft slot timings, classroom allocations or schedule general holiday suspensions.</p>

                    <form onSubmit={handleCreateTimetableSlot} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Day</label>
                          <select
                            id="select-slot-day"
                            value={slotDay}
                            onChange={(e: any) => setSlotDay(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Target Class</label>
                          <select
                            id="select-slot-class"
                            value={slotClass}
                            onChange={(e) => setSlotClass(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                          >
                            {['Class 10 Board Specialists', 'Class 9 Foundation Course', 'Classes 5 to 8 Apex Learning', 'Classes 1 to 4 Junior Sunshine'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Subject Name</label>
                          <select
                            id="select-slot-subject"
                            value={slotSubject}
                            onChange={(e) => setSlotSubject(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                          >
                            {['Mathematics', 'Science (Phy/Chem/Bio)', 'English Literature & Grammar', 'Social Studies', 'Physics', 'Chemistry', 'Biology'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Room / Lecture Hall</label>
                          <input
                            id="input-slot-room"
                            type="text"
                            required
                            placeholder="e.g. Room A, Lab 3"
                            value={slotRoom}
                            onChange={(e) => setSlotRoom(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Time</label>
                          <input
                            id="input-slot-start"
                            type="text"
                            required
                            placeholder="e.g. 10:00 AM"
                            value={slotStartTime}
                            onChange={(e) => setSlotStartTime(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Time</label>
                          <input
                            id="input-slot-end"
                            type="text"
                            required
                            placeholder="e.g. 11:30 AM"
                            value={slotEndTime}
                            onChange={(e) => setSlotEndTime(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Holiday toggle */}
                      <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            id="input-slot-holiday"
                            type="checkbox"
                            checked={slotIsHoliday}
                            onChange={(e) => setSlotIsHoliday(e.target.checked)}
                            className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                          />
                          Mark as Holiday Notice (Suspends Lectures)
                        </label>

                        {slotIsHoliday && (
                          <div>
                            <label className="mb-1.5 block text-[10px] font-bold text-rose-700 uppercase">Reason for Holiday Notice</label>
                            <input
                              id="input-slot-holiday-reason"
                              type="text"
                              required
                              placeholder="e.g. Christmas Vacation, Teacher Training Seminar"
                              value={slotHolidayReason}
                              onChange={(e) => setSlotHolidayReason(e.target.value)}
                              className="w-full rounded-xl border border-rose-200 bg-rose-50/30 px-3 py-2 text-xs text-rose-900 outline-none focus:border-rose-500 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          id="btn-slot-cancel"
                          type="button"
                          onClick={() => setIsAddSlotOpen(false)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          id="btn-slot-submit"
                          type="submit"
                          className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold shadow-md cursor-pointer"
                        >
                          Publish Slot
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: BATCH BULLETIN BOARD */}
          {activeTab === 'bulletin' && (() => {
            const filteredBulletins = batchBulletins.filter(
              p => p.batchName.toLowerCase() === bulletinSelectedBatch.toLowerCase()
            );

            const handlePostSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              if (!bulletinInputText.trim()) return;
              onAddBatchBulletinPost(
                bulletinSelectedBatch === 'Class 10 - Morning Excellence' ? 'b1' : 
                bulletinSelectedBatch === 'Class 10 - Evening Stars' ? 'b2' : 
                bulletinSelectedBatch === 'Class 9 - Foundation Group' ? 'b3' : 
                bulletinSelectedBatch === 'Class 8 - Apex Batch' ? 'b4' : 'b5',
                bulletinSelectedBatch,
                bulletinInputText.trim()
              );
              setBulletinInputText('');
            };

            return (
              <div className="space-y-6 animate-fade-in" id="teacher-batch-bulletin-container">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-800">Batch Bulletin Board</h3>
                      <p className="text-xs text-slate-500">Post batch-specific announcements, homework alerts, exam routines, and coordinate discussions.</p>
                    </div>

                    {/* Batch Selector Dropdown */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Select Batch:</label>
                      <select
                        value={bulletinSelectedBatch}
                        onChange={(e) => setBulletinSelectedBatch(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
                      >
                        {teacher.batches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Create Announcement Form */}
                  <form onSubmit={handlePostSubmit} className="mb-8 border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Compose Batch Announcement</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bulletinInputText}
                        onChange={(e) => setBulletinInputText(e.target.value)}
                        placeholder={`Announce something to ${bulletinSelectedBatch}...`}
                        className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 bg-white font-medium text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={!bulletinInputText.trim()}
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} /> Send
                      </button>
                    </div>
                  </form>

                  {/* Bulletins List */}
                  <div className="space-y-4">
                    {filteredBulletins.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                        <MessageSquare className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
                        <p className="text-sm text-slate-500 font-bold">No posts in this bulletin yet!</p>
                        <p className="text-xs text-slate-400 mt-1">Announce study updates, test schedules, or clear student doubts here.</p>
                      </div>
                    ) : (
                      filteredBulletins.map((post) => {
                        const dateObj = new Date(post.timestamp);
                        const formattedTime = isNaN(dateObj.getTime()) 
                          ? post.timestamp 
                          : dateObj.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                        const initials = post.authorName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        // Role styling
                        let roleColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        if (post.authorRole === 'TEACHER') {
                          roleColor = 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold';
                        } else if (post.authorRole === 'ADMIN') {
                          roleColor = 'bg-red-50 text-red-700 border-red-200 font-extrabold';
                        }

                        return (
                          <div 
                            key={post.id} 
                            className="rounded-xl border border-slate-100 p-4 bg-white hover:border-slate-200 transition-all flex gap-3.5 items-start relative group"
                          >
                            {/* Avatar */}
                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 font-display font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0">
                              {initials}
                            </div>

                            {/* Content */}
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-800">{post.authorName}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded border ${roleColor}`}>
                                  {post.authorRole}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono ml-auto">{formattedTime}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/40 p-2.5 rounded-lg border border-slate-50/50 whitespace-pre-wrap">{post.content}</p>
                              
                              {/* Read receipts list */}
                              {post.readBy && post.readBy.length > 0 ? (
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                  <span className="font-bold text-emerald-600 flex items-center gap-0.5 mr-1">
                                    <CheckCircle size={10} /> Read by ({post.readBy.length}):
                                  </span>
                                  {post.readBy.map((r, idx) => {
                                    const readDate = new Date(r.timestamp);
                                    const readTimeStr = isNaN(readDate.getTime()) 
                                      ? r.timestamp 
                                      : readDate.toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        });
                                    return (
                                      <span 
                                        key={idx} 
                                        className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full px-2 py-0.5 font-medium transition-colors hover:bg-emerald-100"
                                        title={`Read at ${readTimeStr}`}
                                      >
                                        {r.studentName}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                                  Not viewed by any students yet.
                                </div>
                              )}
                            </div>

                            {/* Delete button (allow teachers to delete any post for moderation) */}
                            <button
                              onClick={() => onDeleteBatchBulletinPost(post.id)}
                              className="text-slate-355 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-2 self-start cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete or moderate post"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          </motion.div>
        </div>
      </div>

      {/* MODAL 5: MODAL-BASED DOCUMENT VIEWER FOR ATTACHED PDF / IMAGES */}
      {viewerFileUrl && (
        <div id="modal-teacher-doc-viewer-overlay" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 text-left">
          <div id="modal-teacher-doc-viewer-content" className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-slate-100">
            <div id="teacher-doc-viewer-header" className="flex items-center justify-between border-b border-slate-150 px-6 py-4 bg-slate-50">
              <div className="min-w-0 pr-4">
                <h3 id="teacher-doc-viewer-title" className="font-display font-black text-sm text-slate-800 truncate">{viewerFileTitle || 'Document Viewer'}</h3>
                <p id="teacher-doc-viewer-subtitle" className="text-[10px] text-slate-400 font-mono select-all truncate max-w-lg mt-0.5" title={viewerFileUrl}>{viewerFileUrl}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  id="btn-teacher-doc-viewer-download"
                  href={viewerFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Download File ↗
                </a>
                <button
                  id="btn-teacher-doc-viewer-close"
                  onClick={() => { setViewerFileUrl(null); setViewerFileTitle(''); }}
                  className="rounded-xl bg-slate-200 hover:bg-slate-300 p-2 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
                  title="Close Document"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div id="teacher-doc-viewer-body" className="flex-1 bg-slate-900/5 p-4 overflow-auto flex items-center justify-center relative min-h-[300px]">
              {viewerFileUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || viewerFileUrl.startsWith('data:image/') ? (
                <img
                  id="img-teacher-doc-viewer-rendering"
                  src={viewerFileUrl}
                  alt="Rendered Document Attachment"
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg bg-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <iframe
                  id="iframe-teacher-doc-viewer-rendering"
                  src={viewerFileUrl}
                  title="Document Attachment Viewer"
                  className="w-full h-full rounded-lg border-0 bg-white shadow-inner"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
