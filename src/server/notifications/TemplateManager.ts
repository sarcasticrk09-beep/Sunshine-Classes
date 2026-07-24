import { collection, doc, getDocs, setDoc } from '../shared/db';
import { WhatsAppTemplate, WhatsAppMessageType } from '../../types';
import { AuditService } from '../shared/AuditService';
import { EventPublisher } from '../shared/EventPublisher';

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'WA-TPL-FEE_REMINDER',
    type: 'FEE_REMINDER',
    title: 'Fee Payment Reminder',
    templateText: 'Hello {{parentName}}, this is a reminder regarding {{studentName}} (Class: {{class}}). The fee of ₹{{amount}} is due on {{dueDate}}. Kindly clear the dues via Sunshine portal or cash/UPI.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'WA-TPL-PAYMENT_CONFIRMATION',
    type: 'PAYMENT_CONFIRMATION',
    title: 'Payment Received Confirmation',
    templateText: 'Dear {{parentName}}, we have received a payment of ₹{{amount}} for {{studentName}} (Class: {{class}}) via {{paymentMode}}. Receipt No: {{receiptNumber}}. Thank you!',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'WA-TPL-ADMISSION_CONFIRMATION',
    type: 'ADMISSION_CONFIRMATION',
    title: 'Admission Confirmation Notice',
    templateText: 'Congratulations {{parentName}}! The admission for {{studentName}} in {{class}} at Sunshine Classes is confirmed. Receipt No: {{receiptNumber}}.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'WA-TPL-RECEIPT_GENERATED',
    type: 'RECEIPT_GENERATED',
    title: 'Official Fee Receipt Generated',
    templateText: 'Fee receipt {{receiptNumber}} of amount ₹{{amount}} has been issued for {{studentName}} (Class: {{class}}). Payment mode: {{paymentMode}}.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'WA-TPL-GENERAL_ANNOUNCEMENT',
    type: 'GENERAL_ANNOUNCEMENT',
    title: 'General Academy Announcement',
    templateText: 'Notice for {{studentName}} (Class: {{class}}): Sunshine Classes update. Please check your student portal for important details.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'WA-TPL-CUSTOM_MESSAGE',
    type: 'CUSTOM_MESSAGE',
    title: 'Custom Direct Message',
    templateText: 'Dear {{parentName}}, message regarding {{studentName}} (Class: {{class}}): {{amount}} due on {{dueDate}}.',
    updatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString()
  }
];

export class TemplateManager {
  /**
   * Render template text with standard variables
   */
  public static renderTemplate(
    templateText: string,
    data: {
      studentName?: string;
      parentName?: string;
      class?: string;
      className?: string;
      amount?: number | string;
      dueDate?: string;
      receiptNumber?: string;
      paymentMode?: string;
      [key: string]: any;
    }
  ): string {
    let text = templateText || '';
    text = text.replace(/\{\{studentName\}\}/g, data.studentName || 'Student');
    text = text.replace(/\{\{parentName\}\}/g, data.parentName || data.studentName || 'Parent/Guardian');
    text = text.replace(/\{\{class\}\}/g, data.class || data.className || 'N/A');
    text = text.replace(/\{\{className\}\}/g, data.class || data.className || 'N/A');
    text = text.replace(/\{\{amount\}\}/g, String(data.amount !== undefined ? data.amount : '0'));
    text = text.replace(/\{\{dueDate\}\}/g, data.dueDate || 'N/A');
    text = text.replace(/\{\{receiptNumber\}\}/g, data.receiptNumber || 'N/A');
    text = text.replace(/\{\{paymentMode\}\}/g, data.paymentMode || 'Cash/Online');
    return text;
  }

  /**
   * Load all WhatsApp templates from database or initialize defaults
   */
  public static async getTemplates(db: any): Promise<WhatsAppTemplate[]> {
    try {
      const snap = await getDocs(collection(db, 'whatsapp_templates'));
      if (!snap.empty && snap.docs.length > 0) {
        return snap.docs.map((d: any) => d.data() as WhatsAppTemplate);
      }

      for (const tpl of DEFAULT_WHATSAPP_TEMPLATES) {
        await setDoc(doc(db, 'whatsapp_templates', tpl.id), tpl);
      }
      return DEFAULT_WHATSAPP_TEMPLATES;
    } catch (err) {
      console.error('[TemplateManager] Error reading templates, returning defaults:', err);
      return DEFAULT_WHATSAPP_TEMPLATES;
    }
  }

  /**
   * Update or create a WhatsApp template
   */
  public static async updateTemplate(
    db: any,
    type: WhatsAppMessageType,
    templateText: string,
    updatedBy: string,
    reqMeta?: { ip?: string; device?: string }
  ): Promise<WhatsAppTemplate> {
    const id = `WA-TPL-${type}`;
    const nowIso = new Date().toISOString();

    const existing = DEFAULT_WHATSAPP_TEMPLATES.find(t => t.type === type);
    const title = existing ? existing.title : `${type} Template`;

    const updatedDoc: WhatsAppTemplate = {
      id,
      type,
      title,
      templateText,
      updatedBy,
      updatedAt: nowIso
    };

    await setDoc(doc(db, 'whatsapp_templates', id), updatedDoc);

    await AuditService.log(
      db,
      updatedBy,
      updatedBy,
      'WHATSAPP_TEMPLATE_UPDATED',
      `Updated WhatsApp template for ${type}`,
      reqMeta?.ip,
      reqMeta?.device
    );

    await EventPublisher.publish(db, 'TemplateUpdated', updatedDoc);

    return updatedDoc;
  }
}
