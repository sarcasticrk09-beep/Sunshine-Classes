import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  increment,
  runTransaction
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { auditLogsService } from "./firestoreDbService";

// ========================================================
// 1. WhatsApp Types and Interfaces
// ========================================================

export interface WhatsAppMessage {
  id?: string;
  conversationId: string;
  sender: "SYSTEM" | "BUSINESS" | "CUSTOMER";
  senderName: string;
  receiver: string; // phone number
  text: string;
  timestamp: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  mediaUrl?: string;
  mediaType?: "image" | "pdf" | "document" | "voice";
  templateUsed?: string;
  errorMessage?: string;
}

export interface WhatsAppChat {
  id?: string;
  phone: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "PARENT" | "GUEST";
  studentId?: string;
  teacherId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned: boolean;
  archived: boolean;
  muted: boolean;
  starred?: boolean;
  typing?: boolean;
  labels?: string[];
}

export interface WhatsAppTemplate {
  id?: string;
  name: string; // e.g. "admission_welcome", "fee_reminder_july"
  category: "Admission" | "Fee Reminder" | "Attendance" | "Homework" | "Exam" | "Holiday" | "Birthday" | "Festival" | "General Notice";
  language: string;
  body: string;
  variables: string[]; // e.g. ["student_name", "due_date", "amount"]
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export interface Broadcast {
  id?: string;
  title: string;
  templateId: string;
  audienceType: "CLASS" | "BATCH" | "STUDENTS" | "TEACHERS" | "PARENTS";
  audienceFilter: {
    className?: string;
    batchName?: string;
    targetIds?: string[]; // Specific student / teacher / parent IDs
  };
  scheduledTime?: string; // ISO String or null for immediate
  status: "PENDING" | "PROCESSING" | "SENT" | "CANCELLED";
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface ScheduledMessage {
  id?: string;
  chatId: string;
  phone: string;
  text: string;
  mediaUrl?: string;
  templateUsed?: string;
  sendAt: string; // ISO String
  status: "QUEUED" | "SENT" | "CANCELLED";
  createdAt: string;
}

export interface ContactLabel {
  id: string;
  name: string;
  color: string; // Tailwind bg-class or hex
}

// ========================================================
// 2. ConversationService (Real-time Firestore operations)
// ========================================================

export const ConversationService = {
  /**
   * Subscribes to WhatsApp Chats with filters for Real-time rendering
   */
  subscribeChats(callback: (chats: WhatsAppChat[]) => void) {
    const colRef = collection(db, "whatsappChats");
    // Sort by pinned (desc) and lastMessageTime (desc)
    const q = query(colRef, orderBy("pinned", "desc"), orderBy("lastMessageTime", "desc"));
    
    return onSnapshot(q, (snapshot) => {
      const chats: WhatsAppChat[] = [];
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as WhatsAppChat);
      });
      callback(chats);
    });
  },

  /**
   * Subscribes to WhatsApp Messages within a single conversation
   */
  subscribeMessages(conversationId: string, callback: (messages: WhatsAppMessage[]) => void) {
    const colRef = collection(db, "whatsappMessages");
    const q = query(
      colRef, 
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const messages: WhatsAppMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as WhatsAppMessage);
      });
      callback(messages);
    });
  },

  /**
   * Creates or retrieves a WhatsAppChat document for a given phone/contact
   */
  async getOrCreateChat(phone: string, details: Partial<WhatsAppChat>): Promise<string> {
    const chatId = phone.replace(/\D/g, ""); // standardized ID
    const docRef = doc(db, "whatsappChats", chatId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const payload: WhatsAppChat = {
        phone,
        name: details.name || "Unknown Contact",
        role: details.role || "GUEST",
        studentId: details.studentId || "",
        teacherId: details.teacherId || "",
        lastMessage: details.lastMessage || "Conversation started",
        lastMessageTime: new Date().toISOString(),
        unreadCount: details.unreadCount || 0,
        pinned: false,
        archived: false,
        muted: false,
        starred: false,
        typing: false,
        labels: details.labels || []
      };
      await setDoc(docRef, payload);
    }
    return chatId;
  },

  /**
   * Pins, archives, or mutes a chat
   */
  async updateChatStatus(chatId: string, updates: Partial<WhatsAppChat>): Promise<void> {
    const docRef = doc(db, "whatsappChats", chatId);
    await updateDoc(docRef, updates);
  },

  /**
   * Adds or removes a label for a contact
   */
  async updateContactLabels(chatId: string, labels: string[]): Promise<void> {
    const docRef = doc(db, "whatsappChats", chatId);
    await updateDoc(docRef, { labels });
  },

  /**
   * Resets the unread badge count for a chat
   */
  async markAsRead(chatId: string): Promise<void> {
    const docRef = doc(db, "whatsappChats", chatId);
    await updateDoc(docRef, { unreadCount: 0 });
  }
};

// ========================================================
// 3. WhatsAppService (Meta API Connector Layer)
// ========================================================

export const WhatsAppService = {
  /**
   * Dispatches a live message. If Meta Business API is connected later, 
   * this is the single entry-point for the payload request.
   */
  async sendMessage(
    chatId: string, 
    text: string, 
    options: {
      mediaUrl?: string, 
      mediaType?: "image" | "pdf" | "document" | "voice", 
      templateUsed?: string,
      operatorId: string,
      operatorUsername: string
    }
  ): Promise<string> {
    const chatDocRef = doc(db, "whatsappChats", chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) {
      throw new Error("Target chat does not exist");
    }

    const chatData = chatSnap.data() as WhatsAppChat;
    const messagePayload: WhatsAppMessage = {
      conversationId: chatId,
      sender: "BUSINESS",
      senderName: options.operatorUsername || "Staff",
      receiver: chatData.phone,
      text,
      timestamp: new Date().toISOString(),
      status: "SENT", // Simulates delivered status instantly
      mediaUrl: options.mediaUrl || "",
      mediaType: options.mediaType,
      templateUsed: options.templateUsed || ""
    };

    // 1. Save message to Firestore database
    const msgColRef = collection(db, "whatsappMessages");
    const msgDocRef = await addDoc(msgColRef, messagePayload);

    // 2. Update chat head index
    await updateDoc(chatDocRef, {
      lastMessage: text || (options.mediaType ? `📎 Attached ${options.mediaType}` : "Template message"),
      lastMessageTime: new Date().toISOString()
    });

    // 3. Simulate automatic receiver response in Sandbox environment
    setTimeout(async () => {
      // Automatic simulation for non-production to keep system lively
      await updateDoc(doc(db, "whatsappMessages", msgDocRef.id), {
        status: "READ"
      });
    }, 1200);

    return msgDocRef.id;
  },

  /**
   * Receives incoming webhooks from Meta Cloud API
   */
  async receiveIncomingWebhook(payload: any): Promise<void> {
    // Standard template for future developer integration
    console.log("Future Webhook Endpoint Received Meta API Payload: ", payload);
  }
};

// ========================================================
// 4. TemplateService (WhatsApp Business Template Manager)
// ========================================================

export const TemplateService = {
  async fetchAll(): Promise<WhatsAppTemplate[]> {
    const colRef = collection(db, "whatsappTemplates");
    const snap = await getDocs(colRef);
    const list: WhatsAppTemplate[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as WhatsAppTemplate);
    });

    // Seed default approved templates if collection is empty
    if (list.length === 0) {
      const defaults: WhatsAppTemplate[] = [
        {
          name: "admission_welcome",
          category: "Admission",
          language: "en_US",
          body: "Hello {{student_name}}, Welcome to Sunshine Classes! Your enrollment is successful for Class {{class_name}}, Batch {{batch_name}}. Best wishes!",
          variables: ["student_name", "class_name", "batch_name"],
          status: "APPROVED",
          createdAt: new Date().toISOString()
        },
        {
          name: "fee_pending_alert",
          category: "Fee Reminder",
          language: "en_US",
          body: "Dear Parent, this is a friendly reminder that the pending tuition fee of ₹{{amount}} for {{student_name}} is due on {{due_date}}. Please clear it soon.",
          variables: ["student_name", "amount", "due_date"],
          status: "APPROVED",
          createdAt: new Date().toISOString()
        },
        {
          name: "attendance_absent",
          category: "Attendance",
          language: "en_US",
          body: "Dear Parent, your child {{student_name}} was marked ABSENT for Class on {{date}}. Please contact administrative office if unexcused.",
          variables: ["student_name", "date"],
          status: "APPROVED",
          createdAt: new Date().toISOString()
        },
        {
          name: "homework_assigned",
          category: "Homework",
          language: "en_US",
          body: "Hello Students, new homework for Class {{class_name}} (Subject: {{subject_name}}) has been posted by your teacher {{teacher_name}}. Due date is {{due_date}}.",
          variables: ["class_name", "subject_name", "teacher_name", "due_date"],
          status: "APPROVED",
          createdAt: new Date().toISOString()
        },
        {
          name: "exam_results_published",
          category: "Exam",
          language: "en_US",
          body: "Dear Parents/Students, the results for {{exam_name}} are now published. {{student_name}} scored {{percentage}}% and obtained Grade {{grade}}.",
          variables: ["exam_name", "student_name", "percentage", "grade"],
          status: "APPROVED",
          createdAt: new Date().toISOString()
        }
      ];

      for (const t of defaults) {
        const ref = await addDoc(collection(db, "whatsappTemplates"), t);
        list.push({ id: ref.id, ...t });
      }
    }

    return list;
  },

  async createTemplate(template: Omit<WhatsAppTemplate, "createdAt">): Promise<string> {
    const payload = {
      ...template,
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(collection(db, "whatsappTemplates"), payload);
    return ref.id;
  },

  async deleteTemplate(id: string): Promise<void> {
    await deleteDoc(doc(db, "whatsappTemplates", id));
  }
};

// ========================================================
// 5. BroadcastService (Queued Multi-Recipient Broadcasting)
// ========================================================

export const BroadcastService = {
  async fetchAll(): Promise<Broadcast[]> {
    const colRef = collection(db, "broadcasts");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: Broadcast[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Broadcast);
    });
    return list;
  },

  async createBroadcast(
    broadcast: Omit<Broadcast, "sentCount" | "failedCount" | "createdAt" | "status">,
    recipients: { phone: string, name: string, studentId?: string, teacherId?: string, role: WhatsAppChat["role"] }[],
    operatorId: string,
    operatorUsername: string
  ): Promise<string> {
    const payload: Broadcast = {
      ...broadcast,
      status: broadcast.scheduledTime ? "PENDING" : "SENT",
      sentCount: recipients.length,
      failedCount: 0,
      createdAt: new Date().toISOString()
    };

    // Save Broadcast record
    const bRef = await addDoc(collection(db, "broadcasts"), payload);

    // If scheduled, add to scheduledMessages collection
    if (broadcast.scheduledTime) {
      for (const rec of recipients) {
        const chatId = await ConversationService.getOrCreateChat(rec.phone, {
          name: rec.name,
          role: rec.role,
          studentId: rec.studentId || "",
          teacherId: rec.teacherId || ""
        });

        await addDoc(collection(db, "scheduledMessages"), {
          chatId,
          phone: rec.phone,
          text: `Broadcast: ${broadcast.title}`,
          templateUsed: broadcast.templateId,
          sendAt: broadcast.scheduledTime,
          status: "QUEUED",
          createdAt: new Date().toISOString()
        } as ScheduledMessage);
      }
    } else {
      // Send immediately (simulated for each recipient)
      for (const rec of recipients) {
        const chatId = await ConversationService.getOrCreateChat(rec.phone, {
          name: rec.name,
          role: rec.role,
          studentId: rec.studentId || "",
          teacherId: rec.teacherId || ""
        });

        await WhatsAppService.sendMessage(chatId, `Broadcast Alert: Hello ${rec.name}! This is an announcement for ${broadcast.title}.`, {
          templateUsed: broadcast.templateId,
          operatorId,
          operatorUsername
        });
      }

      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Broadcast Created",
        `Created immediate broadcast: "${broadcast.title}" targeting ${recipients.length} participants.`
      );
    }

    return bRef.id;
  }
};

// ========================================================
// 6. ScheduledMessageService (Queue operations)
// ========================================================

export const ScheduledMessageService = {
  async fetchAll(): Promise<ScheduledMessage[]> {
    const colRef = collection(db, "scheduledMessages");
    const q = query(colRef, orderBy("sendAt", "asc"));
    const snap = await getDocs(q);
    const list: ScheduledMessage[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as ScheduledMessage);
    });
    return list;
  },

  async cancelScheduledMessage(id: string): Promise<void> {
    const docRef = doc(db, "scheduledMessages", id);
    await updateDoc(docRef, { status: "CANCELLED" });
  },

  async rescheduleMessage(id: string, newSendAt: string): Promise<void> {
    const docRef = doc(db, "scheduledMessages", id);
    await updateDoc(docRef, { sendAt: newSendAt });
  }
};

// ========================================================
// 7. MediaService (Handles file validations before chat attach)
// ========================================================

export const MediaService = {
  validateMedia(file: File): { isValid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024; // 25MB standard
    if (file.size > maxSize) {
      return { isValid: false, error: "File size exceeds 25MB Meta platform limit." };
    }
    return { isValid: true };
  }
};

// ========================================================
// 8. Default Contact Labels Initializer
// ========================================================

export const contactLabels: ContactLabel[] = [
  { id: "new_lead", name: "New Lead", color: "bg-blue-100 text-blue-800" },
  { id: "fee_pending", name: "Fee Pending", color: "bg-red-100 text-red-800" },
  { id: "regular_student", name: "Regular Student", color: "bg-emerald-100 text-emerald-800" },
  { id: "vip_parent", name: "VIP Parent", color: "bg-purple-100 text-purple-800" },
  { id: "staff_member", name: "Staff Member", color: "bg-amber-100 text-amber-800" }
];
