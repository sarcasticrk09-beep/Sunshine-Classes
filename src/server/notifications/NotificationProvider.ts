import { FeeReminder } from '../../types';

export interface NotificationSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  getChannel(): 'MANUAL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH';
  send(reminder: FeeReminder, templateText?: string): Promise<NotificationSendResult>;
}

/**
 * Default implementation for Sunshine ERP FM-005.
 * Handles manual reminders and logs notifications safely without external dependencies.
 */
export class ManualNotificationProvider implements NotificationProvider {
  public getChannel(): 'MANUAL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH' {
    return 'MANUAL';
  }

  public async send(reminder: FeeReminder, templateText?: string): Promise<NotificationSendResult> {
    console.log(`[ManualNotificationProvider] Sending notification via MANUAL channel to Student ${reminder.studentName} (${reminder.studentId}):`, {
      reminderId: reminder.reminderId,
      feeRecordId: reminder.feeRecordId,
      reminderType: reminder.reminderType,
      amount: reminder.amount,
      dueDate: reminder.dueDate,
      text: templateText || reminder.message
    });

    return {
      success: true,
      messageId: `NOTIF-MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
  }
}

/**
 * Provider Registry for extensible multi-channel notifications.
 * Allows future WhatsApp, Email, SMS, and Push providers to plug in seamlessly.
 */
export class NotificationProviderFactory {
  private static providers: Map<string, NotificationProvider> = new Map();

  static {
    const manualProvider = new ManualNotificationProvider();
    this.providers.set('MANUAL', manualProvider);
    this.providers.set('WHATSAPP', manualProvider); // Fallback until WhatsApp API plugin
    this.providers.set('EMAIL', manualProvider);    // Fallback until SMTP plugin
    this.providers.set('SMS', manualProvider);      // Fallback until SMS Gateway plugin
    this.providers.set('PUSH', manualProvider);     // Fallback until Push Provider plugin
  }

  public static registerProvider(provider: NotificationProvider) {
    this.providers.set(provider.getChannel(), provider);
  }

  public static getProvider(channel: 'MANUAL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH'): NotificationProvider {
    return this.providers.get(channel) || this.providers.get('MANUAL')!;
  }
}
