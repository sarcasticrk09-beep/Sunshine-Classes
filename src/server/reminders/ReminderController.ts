import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/AuthMiddleware';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';
import { ReminderService } from './ReminderService';
import { ReminderScheduler } from './ReminderScheduler';

export class ReminderController {
  /**
   * POST /api/reminders/send
   * Manual send for single student/reminder
   */
  public static async sendManual(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (user.role === 'TEACHER') {
        return ErrorStandardizer.error(res, { statusCode: 403, code: 'FORBIDDEN', message: 'Teachers do not have permission to trigger manual reminders' });
      }

      const { studentId, feeRecordId, reminderType, channel, messageOverride } = req.body;
      if (!studentId) {
        return ErrorStandardizer.error(res, { statusCode: 400, code: 'INVALID_INPUT', message: 'studentId is required' });
      }

      const reminder = await ReminderService.sendManualReminder(
        db,
        {
          studentId,
          feeRecordId,
          reminderType: reminderType || 'UPCOMING',
          channel: channel || 'MANUAL',
          messageOverride
        },
        { id: user.userId, username: user.username, role: user.role },
        { ip: req.ip, device: req.headers['user-agent'] }
      );

      return ErrorStandardizer.success(res, 'Manual reminder sent successfully', reminder, 201);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.sendManual');
    }
  }

  /**
   * POST /api/reminders/send-all
   * Triggers scheduler to scan pending fees and batch-send due reminders
   */
  public static async sendAll(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (user.role === 'TEACHER') {
        return ErrorStandardizer.error(res, { statusCode: 403, code: 'FORBIDDEN', message: 'Teachers do not have permission to trigger batch reminders' });
      }

      const result = await ReminderScheduler.run(db, user.username);
      return ErrorStandardizer.success(res, 'Batch reminder scan and send completed', result, 200);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.sendAll');
    }
  }

  /**
   * GET /api/reminders
   * List reminders with filters, search, and pagination
   */
  public static async getReminders(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      const { page, limit, className, month, status, reminderType, search } = req.query;

      const result = await ReminderService.getReminders(db, {
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
        className: className ? String(className) : undefined,
        month: month ? String(month) : undefined,
        status: status ? String(status) : undefined,
        reminderType: reminderType ? String(reminderType) : undefined,
        search: search ? String(search) : undefined
      });

      return ErrorStandardizer.success(res, 'Reminders fetched successfully', result, 200);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.getReminders');
    }
  }

  /**
   * GET /api/reminders/student/:studentId
   * Retrieve reminder history for a specific student
   */
  public static async getStudentReminders(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      const { studentId } = req.params;
      if (!studentId) {
        return ErrorStandardizer.error(res, { statusCode: 400, code: 'INVALID_INPUT', message: 'studentId is required' });
      }

      const reminders = await ReminderService.getStudentReminders(db, studentId);
      return ErrorStandardizer.success(res, 'Student reminders fetched successfully', reminders, 200);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.getStudentReminders');
    }
  }

  /**
   * GET /api/reminders/dashboard
   * Returns dashboard metrics for reminders
   */
  public static async getDashboardStats(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      const stats = await ReminderService.getDashboardStats(db);
      return ErrorStandardizer.success(res, 'Reminder dashboard statistics loaded', stats, 200);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.getDashboardStats');
    }
  }

  /**
   * PUT /api/reminders/template
   * Updates an existing notification template (SUPER_ADMIN and ADMIN only)
   */
  public static async updateTemplate(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return ErrorStandardizer.error(res, { statusCode: 403, code: 'FORBIDDEN', message: 'Only Admins can update notification templates' });
      }

      const { templateType, templateText } = req.body;
      if (!templateType || !templateText) {
        return ErrorStandardizer.error(res, { statusCode: 400, code: 'INVALID_INPUT', message: 'templateType and templateText are required' });
      }

      const updated = await ReminderService.updateTemplate(
        db,
        templateType,
        templateText,
        user.username,
        { ip: req.ip, device: req.headers['user-agent'] }
      );

      return ErrorStandardizer.success(res, 'Template updated successfully', updated, 200);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.updateTemplate');
    }
  }

  /**
   * GET /api/reminders/templates
   * Retrieves all notification templates
   */
  public static async getTemplates(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const user = req.user;
      if (!user) {
        return ErrorStandardizer.error(res, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      const templates = await ReminderService.getTemplates(db);
      return ErrorStandardizer.success(res, 'Templates loaded successfully', templates, 200);
    } catch (err: any) {
      return ErrorStandardizer.handleServerError(res, err, 'ReminderController.getTemplates');
    }
  }
}
