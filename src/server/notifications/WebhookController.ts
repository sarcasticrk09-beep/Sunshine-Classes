import { Request, Response } from 'express';
import crypto from 'crypto';
import { getAdminDb } from '../shared/db';
import { NotificationDispatcher } from './NotificationDispatcher';
import { NotificationStatus } from '../../types';

export class WebhookController {
  /**
   * Validate Meta webhook HMAC SHA256 signature if app secret is configured
   */
  private static verifySignature(req: Request): boolean {
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) return true; // Skip strict signature check if no secret configured in dev

    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) return false;

    const elements = signature.split('=');
    const signatureHash = elements[1];
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return signatureHash === expectedHash;
  }

  /**
   * POST /api/webhooks/meta
   * Handles incoming delivery status callbacks from Meta WhatsApp Cloud API
   */
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      if (!WebhookController.verifySignature(req)) {
        console.warn('[WebhookController] Invalid Meta Webhook signature');
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      const body = req.body;
      const db = getAdminDb();

      // Ensure this is a WhatsApp status update
      if (body?.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              const value = change.value;
              if (value && Array.isArray(value.statuses)) {
                for (const statusObj of value.statuses) {
                  const messageId = statusObj.id;
                  const rawStatus = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

                  let mappedStatus: NotificationStatus = 'SENT';
                  if (rawStatus === 'delivered') mappedStatus = 'DELIVERED';
                  else if (rawStatus === 'read') mappedStatus = 'READ';
                  else if (rawStatus === 'failed') mappedStatus = 'FAILED';

                  const errorMsg = statusObj.errors?.[0]?.message || statusObj.errors?.[0]?.title;

                  await NotificationDispatcher.updateDeliveryStatus(
                    db,
                    messageId,
                    mappedStatus,
                    errorMsg
                  );
                }
              }
            }
          }
        }
      }

      // Always respond with HTTP 200 to acknowledge Meta webhook
      res.status(200).json({ status: 'ok' });
    } catch (err: any) {
      console.error('[WebhookController Exception]:', err);
      // Still return 200 so Meta doesn't disable the webhook endpoint
      res.status(200).json({ status: 'error_handled', error: err.message });
    }
  }
}
