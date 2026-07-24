import { collection, doc, getDoc, getDocs, setDoc } from '../shared/db';
import { NotificationLog, NotificationStatus, WhatsAppMessageType } from '../../types';
import { WhatsAppCloudProvider } from './WhatsAppCloudProvider';
import { TemplateManager } from './TemplateManager';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';

export const RETRY_DELAYS_MS = [
  1 * 60 * 1000,       // Retry 1: 1 Minute
  5 * 60 * 1000,       // Retry 2: 5 Minutes
  30 * 60 * 1000,      // Retry 3: 30 Minutes
  12 * 60 * 60 * 1000, // Retry 4: 12 Hours
  24 * 60 * 60 * 1000  // Retry 5: 24 Hours (Final guard)
];

export const MAX_RETRIES = 5;

export class NotificationDispatcher {
  private static provider = new WhatsAppCloudProvider();

  /**
   * Queue and send a single WhatsApp notification
   */
  public static async sendSingle(
    db: any,
    params: {
      studentId: string;
      parentPhone: string;
      template: WhatsAppMessageType | string;
      variables?: Record<string, any>;
      messageOverride?: string;
      studentName?: string;
    },
    currentUser?: { id: string; username: string; role: string },
    reqMeta?: { ip?: string; device?: string }
  ): Promise<NotificationLog> {
    const nowIso = new Date().toISOString();
    const notificationId = `NOTIF-WA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Fetch Student details if studentName not passed
    let studentName = params.studentName || 'Student';
    let className = params.variables?.class || params.variables?.className || 'N/A';
    let parentPhone = params.parentPhone;

    if (params.studentId && params.studentId !== 'SYSTEM' && !params.studentName) {
      try {
        const sSnap = await getDoc(doc(db, 'students', params.studentId));
        if (sSnap.exists()) {
          const sData = sSnap.data();
          studentName = sData.name || studentName;
          className = sData.class || className;
          if (!parentPhone) parentPhone = sData.parentPhone || sData.phone || '';
        }
      } catch (err) {
        console.warn(`[NotificationDispatcher] Student look up failed for ${params.studentId}:`, err);
      }
    }

    // 2. Render Template Message
    let messageText = params.messageOverride;
    if (!messageText) {
      const templates = await TemplateManager.getTemplates(db);
      const match = templates.find(t => t.type === params.template) || templates[0];
      messageText = TemplateManager.renderTemplate(match.templateText, {
        studentName,
        parentName: params.variables?.parentName || studentName,
        class: className,
        className,
        amount: params.variables?.amount,
        dueDate: params.variables?.dueDate,
        receiptNumber: params.variables?.receiptNumber,
        paymentMode: params.variables?.paymentMode
      });
    }

    // 3. Create NotificationLog record (QUEUED)
    const logDoc: NotificationLog = {
      id: notificationId,
      notificationId,
      studentId: params.studentId || 'UNKNOWN',
      studentName,
      parentPhone: parentPhone || '',
      provider: 'WHATSAPP',
      template: params.template,
      messageId: `PENDING-${notificationId}`,
      status: 'QUEUED',
      retryCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      messageText
    };

    try {
      await setDoc(doc(db, 'notification_logs', notificationId), logDoc);
      await EventPublisher.publish(db, 'NotificationQueued', logDoc);
    } catch (dbErr) {
      console.warn('[NotificationDispatcher] Firestore write error (Quota/DB fallback):', dbErr);
    }

    // 4. Dispatch immediately via WhatsApp Provider
    const result = await this.provider.sendDirectMessage(parentPhone, messageText);

    if (result.success && result.messageId) {
      logDoc.status = 'SENT';
      logDoc.messageId = result.messageId;
      logDoc.updatedAt = new Date().toISOString();
      try {
        await setDoc(doc(db, 'notification_logs', notificationId), logDoc);
        await EventPublisher.publish(db, 'NotificationSent', logDoc);

        if (currentUser) {
          await AuditService.log(
            db,
            currentUser.id,
            currentUser.username,
            'WHATSAPP_NOTIFICATION_SENT',
            `Sent WhatsApp notification (${params.template}) to ${parentPhone} for student ${studentName}`,
            reqMeta?.ip,
            reqMeta?.device
          );
        }

        if (params.studentId && params.studentId !== 'SYSTEM') {
          await TimelineService.record(
            db,
            params.studentId,
            'NOTIFICATION_SENT',
            `WhatsApp Notification Sent (${params.template})`,
            `Message sent to ${parentPhone} (ID: ${result.messageId})`,
            currentUser?.username || 'SYSTEM',
            currentUser?.role || 'SYSTEM'
          );
        }
      } catch (logErr) {
        console.warn('[NotificationDispatcher] Failed to update post-send Firestore log:', logErr);
      }
    } else {
      logDoc.status = 'FAILED';
      logDoc.errorMessage = result.error || 'WhatsApp delivery failed';
      logDoc.retryCount = 1;
      logDoc.nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[0]).toISOString();
      logDoc.updatedAt = new Date().toISOString();

      try {
        await setDoc(doc(db, 'notification_logs', notificationId), logDoc);
        await EventPublisher.publish(db, 'NotificationFailed', logDoc);
      } catch (logErr) {
        console.warn('[NotificationDispatcher] Failed to update failure log:', logErr);
      }
    }

    return logDoc;
  }

  /**
   * Send bulk WhatsApp notifications with rate-limited chunking
   */
  public static async sendBulk(
    db: any,
    recipients: Array<{
      studentId: string;
      parentPhone: string;
      template: WhatsAppMessageType | string;
      variables?: Record<string, any>;
      messageOverride?: string;
      studentName?: string;
    }>,
    currentUser?: { id: string; username: string; role: string },
    reqMeta?: { ip?: string; device?: string }
  ): Promise<{ total: number; queued: number; sent: number; failed: number; logs: NotificationLog[] }> {
    let sent = 0;
    let failed = 0;
    const logs: NotificationLog[] = [];

    // Batch process to prevent hitting Meta API rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(item => this.sendSingle(db, item, currentUser, reqMeta))
      );

      for (const log of results) {
        logs.push(log);
        if (log.status === 'SENT') sent++;
        else failed++;
      }

      // Small throttle pause between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return {
      total: recipients.length,
      queued: recipients.length,
      sent,
      failed,
      logs
    };
  }

  /**
   * Retry failed notifications following the exponential retry ladder
   */
  public static async retryFailed(
    db: any,
    targetNotificationId?: string,
    currentUser?: { id: string; username: string; role: string }
  ): Promise<{ retried: number; succeeded: number; failed: number }> {
    const snap = await getDocs(collection(db, 'notification_logs'));
    let failedLogs: NotificationLog[] = snap.docs
      .map((d: any) => d.data() as NotificationLog)
      .filter(n => n.status === 'FAILED' || n.status === 'ERROR');

    if (targetNotificationId) {
      failedLogs = failedLogs.filter(n => n.notificationId === targetNotificationId || n.id === targetNotificationId);
    }

    let retried = 0;
    let succeeded = 0;
    let failed = 0;

    for (const log of failedLogs) {
      if (log.retryCount >= MAX_RETRIES) {
        log.status = 'ERROR';
        log.errorMessage = `Exceeded max retry limit (${MAX_RETRIES})`;
        log.updatedAt = new Date().toISOString();
        await setDoc(doc(db, 'notification_logs', log.notificationId), log);
        continue;
      }

      retried++;
      log.retryCount = (log.retryCount || 0) + 1;

      const result = await this.provider.sendDirectMessage(log.parentPhone, log.messageText || '');

      if (result.success && result.messageId) {
        succeeded++;
        log.status = 'SENT';
        log.messageId = result.messageId;
        log.errorMessage = undefined;
        log.nextRetryAt = undefined;
        log.updatedAt = new Date().toISOString();

        await setDoc(doc(db, 'notification_logs', log.notificationId), log);
        await EventPublisher.publish(db, 'NotificationSent', log);
      } else {
        failed++;
        log.status = 'FAILED';
        log.errorMessage = result.error || 'Retry attempt failed';
        const delayIdx = Math.min(log.retryCount - 1, RETRY_DELAYS_MS.length - 1);
        log.nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[delayIdx]).toISOString();
        log.updatedAt = new Date().toISOString();

        await setDoc(doc(db, 'notification_logs', log.notificationId), log);
        await EventPublisher.publish(db, 'NotificationFailed', log);
      }
    }

    if (currentUser) {
      await AuditService.log(
        db,
        currentUser.id,
        currentUser.username,
        'WHATSAPP_RETRY_EXECUTED',
        `Retried ${retried} failed notifications. Succeeded: ${succeeded}, Failed: ${failed}`
      );
    }

    return { retried, succeeded, failed };
  }

  /**
   * Cancel pending queued notifications
   */
  public static async cancelPending(
    db: any,
    targetNotificationId?: string
  ): Promise<number> {
    const snap = await getDocs(collection(db, 'notification_logs'));
    let pendingLogs = snap.docs
      .map((d: any) => d.data() as NotificationLog)
      .filter(n => n.status === 'QUEUED');

    if (targetNotificationId) {
      pendingLogs = pendingLogs.filter(n => n.notificationId === targetNotificationId || n.id === targetNotificationId);
    }

    let cancelled = 0;
    for (const log of pendingLogs) {
      log.status = 'ERROR';
      log.errorMessage = 'Cancelled by administrator';
      log.updatedAt = new Date().toISOString();
      await setDoc(doc(db, 'notification_logs', log.notificationId), log);
      cancelled++;
    }

    return cancelled;
  }

  /**
   * Update delivery status from Meta Webhook (DELIVERED, READ, FAILED)
   */
  public static async updateDeliveryStatus(
    db: any,
    messageId: string,
    status: NotificationStatus,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, 'notification_logs'));
      const found = snap.docs
        .map((d: any) => d.data() as NotificationLog)
        .find(n => n.messageId === messageId);

      if (!found) {
        console.warn(`[NotificationDispatcher] Webhook status update: messageId ${messageId} not found in logs.`);
        return false;
      }

      found.status = status;
      if (errorMessage) found.errorMessage = errorMessage;
      found.updatedAt = new Date().toISOString();

      await setDoc(doc(db, 'notification_logs', found.notificationId), found);

      // Publish corresponding event
      if (status === 'DELIVERED') {
        await EventPublisher.publish(db, 'NotificationDelivered', found);
      } else if (status === 'READ') {
        await EventPublisher.publish(db, 'NotificationRead', found);
      } else if (status === 'FAILED' || status === 'ERROR') {
        await EventPublisher.publish(db, 'NotificationFailed', found);
      }

      console.log(`[NotificationDispatcher] Updated messageId ${messageId} to status ${status}`);
      return true;
    } catch (err) {
      console.error('[NotificationDispatcher] Error updating webhook status:', err);
      return false;
    }
  }

  /**
   * Retrieve notification history with filtering and pagination
   */
  public static async getHistory(
    db: any,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      template?: string;
      search?: string;
    }
  ): Promise<{
    logs: NotificationLog[];
    meta: { total: number; page: number; limit: number; pages: number };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));

    const snap = await getDocs(collection(db, 'notification_logs'));
    let list: NotificationLog[] = snap.docs.map((d: any) => d.data() as NotificationLog);

    if (options.status) {
      list = list.filter(l => l.status.toUpperCase() === options.status!.toUpperCase());
    }
    if (options.template) {
      list = list.filter(l => l.template.toUpperCase() === options.template!.toUpperCase());
    }
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(l =>
        (l.studentName && l.studentName.toLowerCase().includes(q)) ||
        l.parentPhone.includes(q) ||
        l.notificationId.toLowerCase().includes(q) ||
        l.messageId.toLowerCase().includes(q) ||
        l.studentId.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const pages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      logs: paginated,
      meta: { total, page, limit, pages }
    };
  }
}
