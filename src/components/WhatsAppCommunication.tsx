import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Smile, 
  Search, 
  User, 
  Check, 
  CheckCheck, 
  Pin, 
  Clock, 
  Tag, 
  Settings, 
  VolumeX, 
  Star, 
  Archive, 
  Mic, 
  FileText, 
  Image, 
  File, 
  Calendar, 
  Plus, 
  Trash2, 
  Megaphone, 
  Eye, 
  BookOpen, 
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  ConversationService, 
  WhatsAppService, 
  TemplateService, 
  BroadcastService, 
  ScheduledMessageService, 
  WhatsAppChat, 
  WhatsAppMessage, 
  WhatsAppTemplate, 
  Broadcast, 
  ScheduledMessage, 
  contactLabels 
} from "../services/whatsappService";
import { CloudinaryUpload } from "./CloudinaryUpload";

interface WhatsAppCommunicationProps {
  currentUser: {
    id: string;
    username: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN" | "RECEPTIONIST" | "TEACHER" | "STUDENT";
  };
  // Hook targets to allow instant auto-navigation when coming from profile "Chat on WhatsApp"
  initialSelectedPhone?: string; 
  onClose?: () => void;
  studentsList?: any[];
  teachersList?: any[];
}

export const WhatsAppCommunication: React.FC<WhatsAppCommunicationProps> = ({
  currentUser,
  initialSelectedPhone = "",
  onClose,
  studentsList = [],
  teachersList = []
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<"CHATS" | "BROADCASTS" | "TEMPLATES" | "SCHEDULED" | "LABELS">("CHATS");
  
  // Real-time Database state
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [activeChat, setActiveChat] = useState<WhatsAppChat | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);

  // Filtering and Searching
  const [chatSearch, setChatSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "TEACHER" | "PARENT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "STARRED" | "PINNED">("ACTIVE");

  // Message Sending
  const [messageText, setMessageText] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<"image" | "pdf" | "document" | "voice" | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Active chat sidebar panel toggle
  const [showProfilePanel, setShowProfilePanel] = useState(true);

  // Modal / Composer states for Broadcast, Templates
  const [showCreateBroadcastModal, setShowCreateBroadcastModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  // Broadcast creation form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastTemplateId, setBroadcastTemplateId] = useState("");
  const [broadcastAudienceType, setBroadcastAudienceType] = useState<"STUDENTS" | "TEACHERS" | "PARENTS">("STUDENTS");
  const [broadcastClassFilter, setBroadcastClassFilter] = useState("");
  const [broadcastScheduledTime, setBroadcastScheduledTime] = useState("");

  // Template creation form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<WhatsAppTemplate["category"]>("Admission");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  // Typing indicator simulation
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------
  // Permissions Guard Helpers
  // --------------------------------------------------------
  const canSendBroadcast = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const canCreateTemplate = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";
  const isTeacherRestricted = currentUser.role === "TEACHER";
  const isStudentRestricted = currentUser.role === "STUDENT";

  // --------------------------------------------------------
  // Subscriptions & Initialization
  // --------------------------------------------------------
  useEffect(() => {
    // 1. Subscribe to real-time chat updates
    const unsubscribeChats = ConversationService.subscribeChats((updatedChats) => {
      // Role filtering for Teacher: own student batch messages only (or mock filtering)
      let filtered = updatedChats;
      if (isTeacherRestricted) {
        filtered = updatedChats.filter(c => c.role === "STUDENT" || c.role === "PARENT");
      } else if (isStudentRestricted) {
        // Students only see system or reception announcements
        filtered = updatedChats.filter(c => c.studentId === currentUser.id);
      }
      setChats(filtered);

      // Handle initialSelectedPhone routing
      if (initialSelectedPhone && filtered.length > 0) {
        const target = filtered.find(c => c.phone.replace(/\D/g, "") === initialSelectedPhone.replace(/\D/g, ""));
        if (target) {
          setActiveChat(target);
          setActiveTab("CHATS");
        }
      }
    });

    // 2. Load templates, broadcasts, scheduled queue
    TemplateService.fetchAll().then(setTemplates).catch(console.error);
    BroadcastService.fetchAll().then(setBroadcasts).catch(console.error);
    ScheduledMessageService.fetchAll().then(setScheduled).catch(console.error);

    return () => {
      unsubscribeChats();
    };
  }, [initialSelectedPhone, isTeacherRestricted, isStudentRestricted, currentUser.id]);

  // 3. Subscribe to real-time message stream for the active conversation
  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([]);
      return;
    }

    ConversationService.markAsRead(activeChat.id);

    const unsubscribeMessages = ConversationService.subscribeMessages(activeChat.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    // Simulate occasional incoming message when starting conversation
    if (activeChat.unreadCount > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      return () => {
        unsubscribeMessages();
        clearTimeout(timer);
      };
    }

    return () => {
      unsubscribeMessages();
    };
  }, [activeChat?.id]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --------------------------------------------------------
  // Action Handlers
  // --------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChat?.id || (!messageText.trim() && !attachmentUrl)) return;

    // Check teacher write permissions
    if (isTeacherRestricted && activeChat.role === "TEACHER") {
      alert("Permission Denied: Teachers can only exchange WhatsApp messages with students and parents.");
      return;
    }

    try {
      const optionPayload: any = {
        operatorId: currentUser.id,
        operatorUsername: currentUser.name
      };

      if (attachmentUrl && attachmentType) {
        optionPayload.mediaUrl = attachmentUrl;
        optionPayload.mediaType = attachmentType;
      }

      await WhatsAppService.sendMessage(activeChat.id, messageText, optionPayload);

      // Clean state
      setMessageText("");
      setAttachmentUrl("");
      setAttachmentType(null);
      setShowAttachmentMenu(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send message. Please review your server connectivity.");
    }
  };

  const handleApplyTemplate = (body: string, name: string) => {
    // Basic auto-interpolation of tags
    let interpolated = body;
    if (activeChat) {
      interpolated = interpolated
        .replace(/{{student_name}}/g, activeChat.name)
        .replace(/{{class_name}}/g, "Class X")
        .replace(/{{batch_name}}/g, "Evening Cohort")
        .replace(/{{amount}}/g, "1500")
        .replace(/{{due_date}}/g, "2026-07-20")
        .replace(/{{date}}/g, "2026-07-10")
        .replace(/{{subject_name}}/g, "Science")
        .replace(/{{teacher_name}}/g, currentUser.name);
    }
    setMessageText(interpolated);
    setShowTemplateSelector(false);
  };

  const handleTogglePin = async (chat: WhatsAppChat) => {
    if (!chat.id) return;
    await ConversationService.updateChatStatus(chat.id, { pinned: !chat.pinned });
  };

  const handleToggleArchive = async (chat: WhatsAppChat) => {
    if (!chat.id) return;
    await ConversationService.updateChatStatus(chat.id, { archived: !chat.archived });
    if (activeChat?.id === chat.id) {
      setActiveChat(null);
    }
  };

  const handleToggleMute = async (chat: WhatsAppChat) => {
    if (!chat.id) return;
    await ConversationService.updateChatStatus(chat.id, { muted: !chat.muted });
  };

  const handleToggleStar = async (chat: WhatsAppChat) => {
    if (!chat.id) return;
    await ConversationService.updateChatStatus(chat.id, { starred: !chat.starred });
  };

  const handleAddLabel = async (labelId: string) => {
    if (!activeChat?.id) return;
    const currentLabels = activeChat.labels || [];
    const updated = currentLabels.includes(labelId)
      ? currentLabels.filter(l => l !== labelId)
      : [...currentLabels, labelId];
    
    await ConversationService.updateContactLabels(activeChat.id, updated);
    setActiveChat({ ...activeChat, labels: updated });
  };

  // --------------------------------------------------------
  // Broadcast Logic
  // --------------------------------------------------------
  const handleCreateBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastTemplateId) return;

    // Build recipient list based on category
    let recipients: any[] = [];
    if (broadcastAudienceType === "STUDENTS") {
      recipients = studentsList.map(s => ({
        phone: s.whatsapp || s.parentMobile || s.mobile || "9999999999",
        name: s.name,
        studentId: s.id,
        role: "STUDENT" as const
      }));
    } else if (broadcastAudienceType === "TEACHERS") {
      recipients = teachersList.map(t => ({
        phone: t.mobile || "9999999999",
        name: t.name,
        teacherId: t.id,
        role: "TEACHER" as const
      }));
    }

    try {
      await BroadcastService.createBroadcast({
        title: broadcastTitle,
        templateId: broadcastTemplateId,
        audienceType: broadcastAudienceType,
        audienceFilter: {
          className: broadcastClassFilter || "ALL"
        },
        scheduledTime: broadcastScheduledTime || undefined
      }, recipients, currentUser.id, currentUser.name);

      // Refresh data
      const updatedBroadcasts = await BroadcastService.fetchAll();
      setBroadcasts(updatedBroadcasts);
      
      const updatedScheduled = await ScheduledMessageService.fetchAll();
      setScheduled(updatedScheduled);

      // Clean form
      setBroadcastTitle("");
      setBroadcastTemplateId("");
      setBroadcastClassFilter("");
      setBroadcastScheduledTime("");
      setShowCreateBroadcastModal(false);

      alert(broadcastScheduledTime ? "Broadcast successfully scheduled in Queue!" : "Broadcast sent successfully to all targets!");
    } catch (err) {
      console.error(err);
      alert("Error broadcasting messages. Verify collection setups.");
    }
  };

  // --------------------------------------------------------
  // Template Creation Logic
  // --------------------------------------------------------
  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateBody) return;

    try {
      await TemplateService.createTemplate({
        name: newTemplateName.toLowerCase().replace(/\s+/g, "_"),
        category: newTemplateCategory,
        language: "en_US",
        body: newTemplateBody,
        variables: [],
        status: "APPROVED"
      });

      const updated = await TemplateService.fetchAll();
      setTemplates(updated);

      setNewTemplateName("");
      setNewTemplateBody("");
      setShowCreateTemplateModal(false);
      alert("Template successfully stored and automatically approved!");
    } catch (err) {
      console.error(err);
      alert("Failed to store template.");
    }
  };

  // --------------------------------------------------------
  // Filtering Computation
  // --------------------------------------------------------
  const filteredChats = chats.filter(c => {
    // Search filter
    const matchesSearch = c.name.toLowerCase().includes(chatSearch.toLowerCase()) || c.phone.includes(chatSearch);
    
    // Role filter
    const matchesRole = roleFilter === "ALL" || c.role === roleFilter;

    // Status filter
    if (statusFilter === "PINNED") return matchesSearch && matchesRole && c.pinned;
    if (statusFilter === "ARCHIVED") return matchesSearch && matchesRole && c.archived;
    if (statusFilter === "STARRED") return matchesSearch && matchesRole && c.starred;
    
    // Default Active Tab
    return matchesSearch && matchesRole && !c.archived;
  });

  return (
    <div id="whatsapp-communication-center-module" className="flex flex-col h-[780px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* 1. Sub Header Panel */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">
              Communication Center
            </h2>
            <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">
              WhatsApp Business Engine Integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              id="whatsapp-close-btn"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side Navigation Tabs */}
        <div className="w-16 sm:w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-4">
          <div className="space-y-1.5 px-3">
            <button
              id="tab-btn-chats"
              onClick={() => setActiveTab("CHATS")}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                activeTab === "CHATS" 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold"
              }`}
            >
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline text-xs">Direct Chats</span>
            </button>

            {canSendBroadcast && (
              <button
                id="tab-btn-broadcasts"
                onClick={() => setActiveTab("CHATS")} // fall-through to keep active context
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                  activeTab === "BROADCASTS" 
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold"
                }`}
                onClickCapture={() => setActiveTab("BROADCASTS")}
              >
                <Megaphone className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline text-xs">Broadcasts</span>
              </button>
            )}

            <button
              id="tab-btn-templates"
              onClick={() => setActiveTab("TEMPLATES")}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                activeTab === "TEMPLATES" 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold"
              }`}
            >
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline text-xs">Message Templates</span>
            </button>

            <button
              id="tab-btn-scheduled"
              onClick={() => setActiveTab("SCHEDULED")}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                activeTab === "SCHEDULED" 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold"
              }`}
            >
              <Clock className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline text-xs">Scheduled Queue</span>
            </button>
          </div>

          <div className="px-5 text-center hidden sm:block">
            <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-1.5" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">Meta API Sandbox</span>
            </div>
          </div>
        </div>

        {/* 3. Subview Switcher */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ==========================================
              SUBVIEW: CHATS
             ========================================== */}
          {activeTab === "CHATS" && (
            <>
              {/* Chat Threads Left Sidebar */}
              <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                
                {/* Search & Filters */}
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="chat-search-input"
                      type="text"
                      placeholder="Search contacts..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 pl-9 pr-4 py-2.5 outline-none focus:border-emerald-500 focus:bg-white rounded-xl font-medium text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      id="filter-pill-all"
                      onClick={() => setRoleFilter("ALL")}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        roleFilter === "ALL" 
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" 
                          : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      All
                    </button>
                    <button
                      id="filter-pill-students"
                      onClick={() => setRoleFilter("STUDENT")}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        roleFilter === "STUDENT" 
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" 
                          : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Students
                    </button>
                    <button
                      id="filter-pill-teachers"
                      onClick={() => setRoleFilter("TEACHER")}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        roleFilter === "TEACHER" 
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" 
                          : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Teachers
                    </button>
                    <button
                      id="filter-pill-parents"
                      onClick={() => setRoleFilter("PARENT")}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        roleFilter === "PARENT" 
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" 
                          : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Parents
                    </button>
                  </div>

                  {/* Status Group Filter */}
                  <div className="flex gap-2 border-b border-slate-100 pb-2">
                    <button
                      onClick={() => setStatusFilter("ACTIVE")}
                      className={`text-xs font-bold ${statusFilter === "ACTIVE" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}
                    >
                      Inbox
                    </button>
                    <button
                      onClick={() => setStatusFilter("PINNED")}
                      className={`text-xs font-bold ${statusFilter === "PINNED" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}
                    >
                      Pinned
                    </button>
                    <button
                      onClick={() => setStatusFilter("STARRED")}
                      className={`text-xs font-bold ${statusFilter === "STARRED" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}
                    >
                      Starred
                    </button>
                    <button
                      onClick={() => setStatusFilter("ARCHIVED")}
                      className={`text-xs font-bold ${statusFilter === "ARCHIVED" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}
                    >
                      Archive
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence>
                    {filteredChats.map((chat) => (
                      <motion.div
                        id={`chat-thread-item-${chat.id}`}
                        key={chat.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveChat(chat)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                          activeChat?.id === chat.id 
                            ? "bg-slate-50 dark:bg-slate-800/50 border-l-4 border-emerald-500" 
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-display font-black text-xs text-slate-800 dark:text-slate-200 truncate">
                              {chat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-0.5">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {chat.role}
                            </span>
                            {chat.pinned && <Pin className="h-3.5 w-3.5 text-emerald-500 shrink-0 rotate-45" />}
                            {chat.muted && <VolumeX className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {chat.lastMessage}
                          </p>
                        </div>

                        {chat.unreadCount > 0 && (
                          <span className="absolute right-3 bottom-3 h-5 min-w-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredChats.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <MessageSquare className="h-8 w-8 mx-auto stroke-1 mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">No chats found in this view</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat View Panel */}
              <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-slate-900 relative">
                
                {activeChat ? (
                  <>
                    {/* Active Chat Header */}
                    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-black text-slate-800 dark:text-slate-200 text-sm">
                            {activeChat.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold">{activeChat.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTogglePin(activeChat)}
                          className={`p-2 hover:bg-slate-100 rounded-xl transition-all ${activeChat.pinned ? "text-emerald-500" : "text-slate-400"}`}
                          title="Pin Conversation"
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(activeChat)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                          title="Archive Conversation"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleMute(activeChat)}
                          className={`p-2 hover:bg-slate-100 rounded-xl transition-all ${activeChat.muted ? "text-red-500" : "text-slate-400"}`}
                          title="Mute Notifications"
                        >
                          {activeChat.muted ? <VolumeX className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setShowProfilePanel(!showProfilePanel)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all text-xs font-bold"
                        >
                          {showProfilePanel ? "Hide Details" : "View Details"}
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3.5 flex flex-col">
                      <div className="self-center bg-white/70 dark:bg-slate-800/70 border border-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Secure Encryption Active
                      </div>

                      <AnimatePresence>
                        {messages.map((msg) => {
                          const isMe = msg.sender === "BUSINESS";
                          return (
                            <motion.div
                              id={`chat-msg-bubble-${msg.id}`}
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex flex-col max-w-[70%] ${
                                isMe ? "self-end items-end" : "self-start items-start"
                              }`}
                            >
                              <div
                                className={`p-3 rounded-2xl shadow-xs text-xs font-medium leading-relaxed ${
                                  isMe 
                                    ? "bg-emerald-500 text-white rounded-tr-none" 
                                    : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                                }`}
                              >
                                {msg.mediaUrl && (
                                  <div className="mb-2">
                                    {msg.mediaType === "image" ? (
                                      <img
                                        src={msg.mediaUrl}
                                        alt="Media Attachment"
                                        className="max-h-48 rounded-lg object-cover"
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <a
                                        href={msg.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-black/10 p-2 rounded-lg text-white hover:bg-black/20"
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span>View Document</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                <span>{msg.text}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  <span>
                                    {msg.status === "READ" ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Simulated typing indicator */}
                      {isTyping && (
                        <div className="self-start bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Composer */}
                    <form
                      id="whatsapp-composer-form"
                      onSubmit={handleSendMessage}
                      className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0"
                    >
                      {/* Attachment Preview Box */}
                      {attachmentUrl && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {attachmentType === "image" ? <Image className="h-5 w-5 text-emerald-500" /> : <FileText className="h-5 w-5 text-red-500" />}
                            <span className="text-xs font-black truncate max-w-[200px]">Attachment Selected</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentUrl("");
                              setAttachmentType(null);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {/* 1. Emoji Inline toggle list */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors"
                            title="Insert Emoji"
                          >
                            <Smile className="h-5 w-5" />
                          </button>
                          
                          {showEmojiPicker && (
                            <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl grid grid-cols-6 gap-1 w-48 z-40">
                              {["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗"].map((emoji) => (
                                <button
                                  type="button"
                                  key={emoji}
                                  onClick={() => {
                                    setMessageText(prev => prev + emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-base"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. Attachment Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors"
                            title="Attach File"
                          >
                            <Paperclip className="h-5 w-5" />
                          </button>

                          {showAttachmentMenu && (
                            <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xl w-64 z-40 space-y-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Media Upload</p>
                              
                              <CloudinaryUpload
                                id="whatsapp-composer-attachment"
                                context="documents"
                                value={attachmentUrl}
                                onChange={(url) => {
                                  setAttachmentUrl(url);
                                  const ext = url.split(".").pop()?.toLowerCase();
                                  setAttachmentType(ext && ["jpg", "jpeg", "png", "webp"].includes(ext) ? "image" : "pdf");
                                }}
                                allowedTypes={["jpg", "jpeg", "png", "webp", "pdf"]}
                                label=""
                              />
                            </div>
                          )}
                        </div>

                        {/* 3. Text Area Input */}
                        <input
                          id="composer-text-input"
                          type="text"
                          placeholder="Type a message or select template..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white rounded-2xl font-semibold"
                        />

                        {/* 4. Template Selector Tool */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                            className="text-[10px] font-extrabold text-emerald-600 hover:bg-emerald-50 border border-emerald-100 dark:border-emerald-900 rounded-xl px-2.5 py-2 transition-all shrink-0"
                          >
                            Templates
                          </button>

                          {showTemplateSelector && (
                            <div className="absolute bottom-12 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl w-72 z-40 space-y-1.5 max-h-60 overflow-y-auto">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Quick Select Template</p>
                              {templates.map(t => (
                                <button
                                  type="button"
                                  key={t.id}
                                  onClick={() => handleApplyTemplate(t.body, t.name)}
                                  className="w-full text-left text-xs p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 truncate"
                                  title={t.body}
                                >
                                  <span className="block font-black text-[10px] text-emerald-600 uppercase">{t.category}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-300">{t.body}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 5. Voice Recording Simulator Button */}
                        <button
                          type="button"
                          onClick={() => alert("Microphone sandbox environment simulation loaded: Voice Note Recording placeholder captured.")}
                          className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                          title="Record Voice Note"
                        >
                          <Mic className="h-5 w-5" />
                        </button>

                        {/* 6. Send Dispatcher */}
                        <button
                          type="submit"
                          className="p-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl shadow-md transition-all shrink-0"
                        >
                          <Send className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="h-16 w-16 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-display font-black text-slate-700 dark:text-slate-300 text-base">
                      No Active Conversation
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Select a student, teacher, or parent contact from the list on the left to start real-time messaging.
                    </p>
                  </div>
                )}
              </div>

              {/* Active Profile Info Panel Right */}
              {activeChat && showProfilePanel && (
                <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col p-5 shrink-0 overflow-y-auto">
                  <div className="text-center pb-5 border-b border-slate-100">
                    <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <User className="h-8 w-8" />
                    </div>
                    <h4 className="font-display font-black text-slate-800 dark:text-slate-100 text-sm">
                      {activeChat.name}
                    </h4>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 rounded-md mt-1.5 uppercase">
                      {activeChat.role}
                    </span>
                  </div>

                  {/* Quick Metadata fields */}
                  <div className="space-y-4 py-5 border-b border-slate-100">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{activeChat.phone}</span>
                    </div>

                    {activeChat.studentId && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student ID Reference</span>
                        <span className="text-xs font-mono font-bold text-indigo-500">{activeChat.studentId}</span>
                      </div>
                    )}

                    {activeChat.teacherId && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher ID Reference</span>
                        <span className="text-xs font-mono font-bold text-indigo-500">{activeChat.teacherId}</span>
                      </div>
                    )}
                  </div>

                  {/* Labels Section */}
                  <div className="py-5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Contact Labels Tagger
                    </span>
                    <div className="space-y-1.5">
                      {contactLabels.map((lbl) => {
                        const isTagged = activeChat.labels?.includes(lbl.id);
                        return (
                          <button
                            key={lbl.id}
                            onClick={() => handleAddLabel(lbl.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-black transition-all ${
                              isTagged 
                                ? "bg-slate-100 dark:bg-slate-800 border-l-4 border-emerald-500" 
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${lbl.color.split(" ")[0]}`} />
                              <span>{lbl.name}</span>
                            </span>
                            {isTagged && <Check className="h-4 w-4 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              SUBVIEW: BROADCASTS
             ========================================== */}
          {activeTab === "BROADCASTS" && (
            <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base">
                    WhatsApp Broadcasting Logs
                  </h3>
                  <p className="text-xs text-slate-500">Create, monitor, and audit mass message queues.</p>
                </div>
                {canSendBroadcast && (
                  <button
                    id="btn-create-broadcast-trigger"
                    onClick={() => setShowCreateBroadcastModal(true)}
                    className="flex items-center gap-2 text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create Broadcast Campaign
                  </button>
                )}
              </div>

              {/* Logs Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Campaign Title</th>
                      <th className="p-4">Target Cohort</th>
                      <th className="p-4">Template ID</th>
                      <th className="p-4">Delivery Status</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dispatched Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {broadcasts.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-black text-slate-800 dark:text-slate-200">{b.title}</td>
                        <td className="p-4 font-bold text-slate-500">{b.audienceType} ({b.audienceFilter.className})</td>
                        <td className="p-4 font-mono text-indigo-500">{b.templateId}</td>
                        <td className="p-4">
                          <span className="text-emerald-600 font-bold">{b.sentCount} sent</span>
                          <span className="text-slate-300 mx-1.5">|</span>
                          <span className="text-red-500 font-bold">{b.failedCount} failed</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                            b.status === "SENT" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {broadcasts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                          No broadcasts campaigns found. Start your first campaign!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              SUBVIEW: TEMPLATES
             ========================================== */}
          {activeTab === "TEMPLATES" && (
            <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base">
                    Pre-Approved Meta Templates
                  </h3>
                  <p className="text-xs text-slate-500">Manage approved highly optimized WhatsApp structures.</p>
                </div>
                {canCreateTemplate && (
                  <button
                    id="btn-create-template-trigger"
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="flex items-center gap-2 text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Store New Template
                  </button>
                )}
              </div>

              {/* Grid of Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((t) => (
                  <div key={t.id} className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-lg">
                          {t.category}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{t.language}</span>
                      </div>
                      <h4 className="font-black text-xs text-slate-700 dark:text-slate-200 mb-2">{t.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {t.body}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Status: APPROVED</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              SUBVIEW: SCHEDULED QUEUE
             ========================================== */}
          {activeTab === "SCHEDULED" && (
            <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base">
                  Scheduled Automated Queue
                </h3>
                <p className="text-xs text-slate-500">Verify queue logs for automated fee warnings, milestones, and reports.</p>
              </div>

              {/* Queue List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Target Phone</th>
                      <th className="p-4">Queued Content Preview</th>
                      <th className="p-4">Scheduled Execution Time</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {scheduled.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-black text-slate-800 dark:text-slate-200">{s.phone}</td>
                        <td className="p-4 font-bold text-slate-500 truncate max-w-sm">{s.text}</td>
                        <td className="p-4 text-slate-500">{new Date(s.sendAt).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                            s.status === "QUEUED" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {s.status === "QUEUED" && (
                            <button
                              onClick={() => {
                                if (confirm("Cancel this scheduled queue?")) {
                                  ScheduledMessageService.cancelScheduledMessage(s.id!).then(() => {
                                    ScheduledMessageService.fetchAll().then(setScheduled);
                                  });
                                }
                              }}
                              className="text-xs text-red-500 font-extrabold hover:underline"
                            >
                              Cancel Queue
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {scheduled.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                          Queue list currently empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================
          MODALS & DIALOG POPUPS
         ======================================================== */}

      {/* 1. Create Broadcast Campaign Modal */}
      {showCreateBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-4">
              <Megaphone className="h-6 w-6 text-emerald-500" />
              <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base">New Broadcast Campaign</h3>
            </div>

            <form onSubmit={handleCreateBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Admission Open June 2026"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Audience Type</label>
                <select
                  value={broadcastAudienceType}
                  onChange={(e: any) => setBroadcastAudienceType(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                >
                  <option value="STUDENTS">All Registered Students</option>
                  <option value="TEACHERS">All Teachers & Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Approved Template</label>
                <select
                  required
                  value={broadcastTemplateId}
                  onChange={(e) => setBroadcastTemplateId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                >
                  <option value="">-- Choose Approved Message Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Schedule execution (Leave empty to send immediately)</label>
                <input
                  type="datetime-local"
                  value={broadcastScheduledTime}
                  onChange={(e) => setBroadcastScheduledTime(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBroadcastModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-emerald-500" />
              <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base">Store New Message Template</h3>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Template Tag/Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. holiday_festival_greetings"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e: any) => setNewTemplateCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                >
                  <option value="Admission">Admission Welcome</option>
                  <option value="Fee Reminder">Fee Reminder</option>
                  <option value="Attendance">Attendance Notification</option>
                  <option value="Homework">Homework Announcement</option>
                  <option value="Exam">Exam Results</option>
                  <option value="Holiday">Holiday & Festivals</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Body Text Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Use tags like {{student_name}}, {{class_name}}, {{due_date}} for automated interpolation."
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Store Template
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
