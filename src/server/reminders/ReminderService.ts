import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from '../shared/db';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { FeeReminder, ReminderTemplate } from '../../types';
import { NotificationProviderFactory } from '../notifications/NotificationProvider';

export const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'TPL-UPCOMING',
    templateType: 'UPCOMING',
    title: 'Upcoming Fee Payment Notice',
    templateText: 'Dear {{studentName}} (Roll No: {{rollNumber}}), your fee of ₹{{amount}} for {{billingMonth}} (Class {{class}}) is due on {{dueDate}}. Please settle it before the due date.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TPL-DUE_TODAY',
    templateType: 'DUE_TODAY',
    title: 'Fee Payment Due Today',
    templateText: 'Dear {{studentName}} (Roll No: {{rollNumber}}), your fee of ₹{{amount}} for {{billingMonth}} is DUE TODAY ({{dueDate}}). Kindly complete the payment to avoid late charges.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TPL-OVERDUE',
    templateType: 'OVERDUE',
    title: 'Overdue Fee Payment Reminder',
    templateText: 'REMINDER: Dear {{studentName}} (Roll No: {{rollNumber}}), your fee payment of ₹{{amount}} for {{billingMonth}} was due on {{dueDate}} and is now OVERDUE. Please pay immediately.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TPL-FINAL_NOTICE',
    templateType: 'FINAL_NOTICE',
    title: 'Final Overdue Fee Notice',
    templateText: 'URGENT FINAL NOTICE: Dear {{studentName}}, the fee of ₹{{amount}} for {{billingMonth}} is severely overdue (Due: {{dueDate}}). Please clear the dues immediately to prevent administrative action.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  }
];

export class ReminderService {
  /**
   * Render template with student and fee placeholders
   */
  public static renderTemplate(templateText: string, data: {
    studentName: string;
    rollNumber: string;
    amount: number;
    dueDate: string;
    className: string;
    billingMonth: string;
    receiptNumber?: string;
  }): string {
    let result = templateText || '';
    result = result.replace(/\{\{studentName\}\}/g, data.studentName || 'Student');
    result = result.replace(/\{\{rollNumber\}\}/g, data.rollNumber || 'N/A');
    result = result.replace(/\{\{amount\}\}/g, String(data.amount || 0));
    result = result.replace(/\{\{dueDate\}\}/g, data.dueDate || 'N/A');
    result = result.replace(/\{\{class\}\}/g, data.className || 'N/A');
    result = result.replace(/\{\{className\}\}/g, data.className || 'N/A');
    result = result.replace(/\{\{billingMonth\}\}/g, data.billingMonth || 'N/A');
    result = result.replace(/\{\{receiptNumber\}\}/g, data.receiptNumber || 'N/A');
    return result;
  }

  /**
   * Retrieves all notification templates. Initializes defaults if empty.
   */
  public static async getTemplates(db: any): Promise<ReminderTemplate[]> {
    try {
      const snap = await getDocs(collection(db, 'reminder_templates'));
      if (!snap.empty && snap.docs.length > 0) {
        return snap.docs.map((d: any) => d.data() as ReminderTemplate);
      }
      
      // Initialize default templates
      for (const tpl of DEFAULT_TEMPLATES) {
        await setDoc(doc(db, 'reminder_templates', tpl.id), tpl);
      }
      return DEFAULT_TEMPLATES;
    } catch (err) {
      console.error('[ReminderService] Failed to load templates, returning defaults:', err);
      return DEFAULT_TEMPLATES;
    }
  }

  /**
   * Updates an existing template
   */
  public static async updateTemplate(
    db: any,
    templateType: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'FINAL_NOTICE',
    templateText: string,
    updatedBy: string,
    reqMeta?: { ip?: string; device?: string }
  ): Promise<ReminderTemplate> {
    const tplId = `TPL-${templateType}`;
    const nowIso = new Date().toISOString();
    
    let title = 'Fee Notification Template';
    const existing = DEFAULT_TEMPLATES.find(t => t.templateType === templateType);
    if (existing) title = existing.title;

    const updatedDoc: ReminderTemplate = {
      id: tplId,
      templateType,
      title,
      templateText,
      updatedBy,
      updatedAt: nowIso
    };

    await setDoc(doc(db, 'reminder_templates', tplId), updatedDoc);

    // Audit & Events
    await AuditService.log(
      db,
      updatedBy,
      updatedBy,
      'TEMPLATE_UPDATED',
      `Updated template for ${templateType}`,
      reqMeta?.ip,
      reqMeta?.device
    );

    await EventPublisher.publish(db, 'TemplateUpdated', updatedDoc);

    return updatedDoc;
  }

  /**
   * Trigger manual reminder sending
   */
  public static async sendManualReminder(
    db: any,
    params: {
      studentId: string;
      feeRecordId?: string;
      reminderType: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'FINAL_NOTICE';
      channel?: 'MANUAL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH';
      messageOverride?: string;
    },
    currentUser: { id: string; username: string; role: string },
    reqMeta?: { ip?: string; device?: string }
  ): Promise<FeeReminder> {
    const nowIso = new Date().toISOString();
    const channel = params.channel || 'MANUAL';
    const reminderType = params.reminderType || 'UPCOMING';

    // 1. Fetch Student profile
    const studentSnap = await getDoc(doc(db, 'students', params.studentId));
    if (!studentSnap.exists()) {
      throw new Error(`Student with ID ${params.studentId} not found.`);
    }
    const studentData = studentSnap.data();

    // 2. Fetch Fee record if provided or latest pending fee
    let feeRecord: any = null;
    if (params.feeRecordId) {
      const feeSnap = await getDoc(doc(db, 'monthly_fees', params.feeRecordId));
      if (feeSnap.exists()) {
        feeRecord = feeSnap.data();
      }
    }

    if (!feeRecord) {
      // Find latest pending fee for student
      const monthlyFeesSnap = await getDocs(collection(db, 'monthly_fees'));
      const studentFees = monthlyFeesSnap.docs
        .map((d: any) => d.data())
        .filter((f: any) => f.studentId === params.studentId && f.status !== 'PAID');
      
      if (studentFees.length > 0) {
        feeRecord = studentFees[0];
      }
    }

    const feeRecordId = feeRecord ? feeRecord.id : `MANUAL-FEE-${Date.now()}`;
    const amount = feeRecord ? (feeRecord.pendingFee || feeRecord.totalFee || 0) : 0;
    const dueDate = feeRecord ? (feeRecord.dueDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
    const billingMonth = feeRecord ? (feeRecord.month || 'Current Month') : 'Current Month';
    let billingYear = String(new Date().getFullYear());
    if (feeRecord && feeRecord.month) {
      const match = feeRecord.month.match(/\d{4}/);
      if (match) billingYear = match[0];
    }

    // 3. Render message text
    let messageText = params.messageOverride;
    if (!messageText) {
      const templates = await this.getTemplates(db);
      const tpl = templates.find(t => t.templateType === reminderType) || DEFAULT_TEMPLATES[0];
      messageText = this.renderTemplate(tpl.templateText, {
        studentName: studentData.name,
        rollNumber: studentData.rollNo || studentData.id || '',
        amount,
        dueDate,
        className: studentData.class || '',
        billingMonth
      });
    }

    // 4. Create FeeReminder record
    const reminderId = `REM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const reminderRecord: FeeReminder = {
      id: reminderId,
      reminderId,
      studentId: params.studentId,
      studentName: studentData.name,
      rollNumber: studentData.rollNo || '',
      className: studentData.class || '',
      feeRecordId,
      billingMonth,
      billingYear,
      amount,
      dueDate,
      reminderType,
      channel,
      status: 'SENT',
      scheduledAt: nowIso,
      sentAt: nowIso,
      createdBy: currentUser.username,
      createdAt: nowIso,
      stageKey: `${feeRecordId}_MANUAL_${Date.now()}`,
      message: messageText
    };

    await setDoc(doc(db, 'fee_reminders', reminderId), reminderRecord);

    // 5. Send via Notification Provider
    const provider = NotificationProviderFactory.getProvider(channel);
    await provider.send(reminderRecord, messageText);

    // 6. Audit, Timeline & Events
    await AuditService.log(
      db,
      currentUser.id,
      currentUser.username,
      'MANUAL_REMINDER_SENT',
      `Manual ${reminderType} reminder sent to student ${studentData.name} (${params.studentId}) for fee ${feeRecordId}`,
      reqMeta?.ip,
      reqMeta?.device
    );

    await TimelineService.record(
      db,
      params.studentId,
      'REMINDER_SENT',
      `Fee Reminder Sent (${reminderType})`,
      `Manual notification sent for ${billingMonth} (Amount: ₹${amount}, Due: ${dueDate})`,
      currentUser.username,
      currentUser.role
    );

    await EventPublisher.publish(db, 'ReminderCreated', reminderRecord);
    await EventPublisher.publish(db, 'ReminderSent', reminderRecord);

    return reminderRecord;
  }

  /**
   * Automatically stops / cancels pending reminders for a fee when paid or verified
   */
  public static async cancelPendingRemindersForFee(db: any, feeRecordId: string, reason = 'FEE_PAID_OR_VERIFIED'): Promise<number> {
    let count = 0;
    try {
      const snap = await getDocs(collection(db, 'fee_reminders'));
      const pendingReminders = snap.docs
        .map((d: any) => d.data() as FeeReminder)
        .filter(r => r.feeRecordId === feeRecordId && r.status === 'PENDING');

      for (const rem of pendingReminders) {
        rem.status = 'CANCELLED';
        await setDoc(doc(db, 'fee_reminders', rem.reminderId), rem);
        count++;

        await EventPublisher.publish(db, 'ReminderCancelled', {
          reminderId: rem.reminderId,
          feeRecordId,
          reason
        });
      }
      if (count > 0) {
        console.log(`[ReminderService] Cancelled ${count} pending reminders for feeRecordId ${feeRecordId} due to ${reason}`);
      }
    } catch (err) {
      console.error('[ReminderService] Error cancelling pending reminders:', err);
    }
    return count;
  }

  /**
   * Retrieves list of fee reminders with search, filtering, and pagination
   */
  public static async getReminders(db: any, options: {
    page?: number;
    limit?: number;
    className?: string;
    month?: string;
    status?: string;
    reminderType?: string;
    search?: string;
  }): Promise<{
    reminders: FeeReminder[];
    meta: { total: number; page: number; limit: number; pages: number };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));

    const snap = await getDocs(collection(db, 'fee_reminders'));
    let list: FeeReminder[] = snap.docs.map((d: any) => d.data() as FeeReminder);

    // Apply Filters
    if (options.className) {
      list = list.filter(r => r.className.toLowerCase() === options.className!.toLowerCase());
    }
    if (options.month) {
      list = list.filter(r => r.billingMonth.toLowerCase().includes(options.month!.toLowerCase()));
    }
    if (options.status) {
      list = list.filter(r => r.status.toUpperCase() === options.status!.toUpperCase());
    }
    if (options.reminderType) {
      list = list.filter(r => r.reminderType.toUpperCase() === options.reminderType!.toUpperCase());
    }
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(r => 
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.reminderId.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const pages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      reminders: paginated,
      meta: { total, page, limit, pages }
    };
  }

  /**
   * Get all reminders for a specific student
   */
  public static async getStudentReminders(db: any, studentId: string): Promise<FeeReminder[]> {
    const snap = await getDocs(collection(db, 'fee_reminders'));
    const list: FeeReminder[] = snap.docs
      .map((d: any) => d.data() as FeeReminder)
      .filter(r => r.studentId === studentId);

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  /**
   * Computes reminder dashboard stats
   */
  public static async getDashboardStats(db: any): Promise<{
    upcomingToday: number;
    dueToday: number;
    overdue: number;
    sentToday: number;
    failed: number;
    manualReminders: number;
    totalReminders: number;
  }> {
    const snap = await getDocs(collection(db, 'fee_reminders'));
    const reminders: FeeReminder[] = snap.docs.map((d: any) => d.data() as FeeReminder);

    const todayStr = new Date().toISOString().split('T')[0];

    let upcomingToday = 0;
    let dueToday = 0;
    let overdue = 0;
    let sentToday = 0;
    let failed = 0;
    let manualReminders = 0;

    for (const r of reminders) {
      const createdDate = r.createdAt ? r.createdAt.split('T')[0] : '';
      const sentDate = r.sentAt ? r.sentAt.split('T')[0] : '';

      if (r.reminderType === 'UPCOMING' && createdDate === todayStr) {
        upcomingToday++;
      }
      if (r.reminderType === 'DUE_TODAY') {
        dueToday++;
      }
      if ((r.reminderType === 'OVERDUE' || r.reminderType === 'FINAL_NOTICE') && (r.status === 'SENT' || r.status === 'PENDING')) {
        overdue++;
      }
      if (sentDate === todayStr && r.status === 'SENT') {
        sentToday++;
      }
      if (r.status === 'FAILED') {
        failed++;
      }
      if (r.channel === 'MANUAL') {
        manualReminders++;
      }
    }

    return {
      upcomingToday,
      dueToday,
      overdue,
      sentToday,
      failed,
      manualReminders,
      totalReminders: reminders.length
    };
  }
}
