import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/AuthMiddleware';
import { NotificationDispatcher } from './NotificationDispatcher';
import { TemplateManager } from './TemplateManager';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';
import { WhatsAppMessageType } from '../../types';

export class NotificationController {
  /**
   * POST /api/notifications/whatsapp/send
   */
  public static async sendSingle(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const user = req.user || { userId: 'SYSTEM', username: 'SYSTEM', role: 'ADMIN' };
      const currentUser = { id: user.userId, username: user.username, role: user.role };
      const { studentId, parentPhone, template, variables, messageOverride, studentName } = req.body;

      if (!parentPhone && !studentId) {
        ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Either studentId or parentPhone is required.'
        });
        return;
      }

      const log = await NotificationDispatcher.sendSingle(
        db,
        {
          studentId: studentId || 'UNKNOWN',
          parentPhone: parentPhone || '',
          template: template || 'CUSTOM_MESSAGE',
          variables,
          messageOverride,
          studentName
        },
        currentUser,
        { ip: req.ip, device: req.headers['user-agent'] }
      );

      ErrorStandardizer.success(res, 'WhatsApp notification queued and dispatched.', log, 201);
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.sendSingle');
    }
  }

  /**
   * POST /api/notifications/whatsapp/send-bulk
   */
  public static async sendBulk(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const user = req.user || { userId: 'SYSTEM', username: 'SYSTEM', role: 'ADMIN' };
      const currentUser = { id: user.userId, username: user.username, role: user.role };
      const { recipients } = req.body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'recipients array is required and must not be empty.'
        });
        return;
      }

      const result = await NotificationDispatcher.sendBulk(
        db,
        recipients,
        currentUser,
        { ip: req.ip, device: req.headers['user-agent'] }
      );

      ErrorStandardizer.success(
        res,
        `Bulk WhatsApp notification dispatch complete. Sent: ${result.sent}, Failed: ${result.failed}`,
        result
      );
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.sendBulk');
    }
  }

  /**
   * GET /api/notifications/whatsapp/history
   */
  public static async getHistory(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '10', 10);
      const status = req.query.status as string | undefined;
      const template = req.query.template as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await NotificationDispatcher.getHistory(db, {
        page,
        limit,
        status,
        template,
        search
      });

      ErrorStandardizer.success(res, 'Notification history retrieved successfully.', result);
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.getHistory');
    }
  }

  /**
   * POST /api/notifications/whatsapp/retry-failed
   */
  public static async retryFailed(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const user = req.user || { userId: 'SYSTEM', username: 'SYSTEM', role: 'ADMIN' };
      const currentUser = { id: user.userId, username: user.username, role: user.role };
      const { notificationId } = req.body;

      const result = await NotificationDispatcher.retryFailed(
        db,
        notificationId,
        currentUser
      );

      ErrorStandardizer.success(
        res,
        `Retry execution completed. Retried: ${result.retried}, Succeeded: ${result.succeeded}, Failed: ${result.failed}`,
        result
      );
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.retryFailed');
    }
  }

  /**
   * POST /api/notifications/whatsapp/cancel-pending
   */
  public static async cancelPending(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const { notificationId } = req.body;
      const cancelled = await NotificationDispatcher.cancelPending(db, notificationId);

      ErrorStandardizer.success(res, `Cancelled ${cancelled} pending notifications.`, { cancelled });
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.cancelPending');
    }
  }

  /**
   * GET /api/notifications/templates
   */
  public static async getTemplates(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const templates = await TemplateManager.getTemplates(db);
      ErrorStandardizer.success(res, 'WhatsApp notification templates retrieved successfully.', templates);
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.getTemplates');
    }
  }

  /**
   * PUT /api/notifications/templates
   */
  public static async updateTemplate(req: AuthenticatedRequest, res: Response, db: any): Promise<void> {
    try {
      const user = req.user || { username: 'SYSTEM' };
      const { type, templateText } = req.body;

      if (!type || !templateText) {
        ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'type and templateText are required.'
        });
        return;
      }

      const updated = await TemplateManager.updateTemplate(
        db,
        type as WhatsAppMessageType,
        templateText,
        user.username || 'ADMIN',
        { ip: req.ip, device: req.headers['user-agent'] }
      );

      ErrorStandardizer.success(res, `Template for ${type} updated successfully.`, updated);
    } catch (err: any) {
      ErrorStandardizer.handleServerError(res, err, 'NotificationController.updateTemplate');
    }
  }
}
