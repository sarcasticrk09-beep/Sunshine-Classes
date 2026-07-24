import { Request, Response } from 'express';

export class WebhookVerificationController {
  /**
   * GET /api/webhooks/meta
   * Meta WhatsApp Webhook verification handshake
   */
  public static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN || 'sunshine_whatsapp_verify_token_2026';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Meta Webhook Verified Successfully]');
      res.status(200).send(challenge);
      return;
    } else {
      console.warn('[Meta Webhook Verification Failed]: Token mismatch or invalid mode', { mode, token });
      res.status(403).json({ error: 'Webhook verification token mismatch' });
      return;
    }
  }
}
