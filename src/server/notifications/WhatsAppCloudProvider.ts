import { NotificationProvider, NotificationSendResult, NotificationProviderFactory } from './NotificationProvider';
import { FeeReminder } from '../../types';

export interface WhatsAppSendOptions {
  toPhone: string;
  messageText: string;
  templateName?: string;
  templateLanguage?: string;
}

export class WhatsAppCloudProvider implements NotificationProvider {
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
  }

  public getChannel(): 'MANUAL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH' {
    return 'WHATSAPP';
  }

  /**
   * Clean and normalize phone number for Meta WhatsApp Cloud API (e.g., 91XXXXXXXXXX)
   */
  public static normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned; // Default to India (+91) if 10-digit number
    }
    return cleaned;
  }

  /**
   * Send notification via Meta WhatsApp Cloud API
   */
  public async send(reminder: FeeReminder, templateText?: string): Promise<NotificationSendResult> {
    const rawPhone = (reminder as any).parentPhone || (reminder as any).phone || '';
    const phone = WhatsAppCloudProvider.normalizePhoneNumber(rawPhone);
    const message = templateText || reminder.message || `Fee reminder for ${reminder.studentName}: ₹${reminder.amount}`;

    return this.sendDirectMessage(phone, message);
  }

  /**
   * Direct message dispatch to Meta Graph API
   */
  public async sendDirectMessage(toPhone: string, messageText: string): Promise<NotificationSendResult> {
    const targetPhone = WhatsAppCloudProvider.normalizePhoneNumber(toPhone);

    // If Meta API credentials are not set, return simulated response for dev environment
    if (!this.accessToken || !this.phoneNumberId) {
      console.log(`[WhatsAppCloudProvider DEV MOCK] Sending WhatsApp message to ${targetPhone}:`, messageText);
      const mockWamid = `wamid.HBgMOTE${Date.now()}${Math.random().toString(36).substring(2, 6)}`;
      return {
        success: true,
        messageId: mockWamid
      };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: targetPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorMsg = data.error?.message || data.error?.error_data?.details || `Meta API HTTP ${res.status}`;
        console.error('[WhatsAppCloudProvider Error]:', data.error || data);
        return {
          success: false,
          error: errorMsg
        };
      }

      const messageId = data.messages?.[0]?.id || `wamid.HBgMOTE${Date.now()}`;
      return {
        success: true,
        messageId
      };
    } catch (err: any) {
      console.error('[WhatsAppCloudProvider Exception]:', err);
      return {
        success: false,
        error: err.message || 'Meta Cloud API fetch network failure'
      };
    }
  }
}

// Auto-register with NotificationProviderFactory
NotificationProviderFactory.registerProvider(new WhatsAppCloudProvider());
