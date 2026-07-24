import { Response } from 'express';
import { StudentFeeSettingService } from './StudentFeeSettingService';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';

export class StudentFeeSettingController {
  /**
   * Check RBAC for fee settings:
   * SUPER_ADMIN & ADMIN: Full Access
   * RECEPTIONIST: View only
   * TEACHER: No Access
   */
  private static checkAccess(req: any, isWrite: boolean): { allowed: boolean; message?: string; statusCode?: number } {
    const userRole = (req.user?.role || req.currentUser?.role || '').toUpperCase();

    if (userRole === 'TEACHER') {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Teachers do not have access to Student Fee Settings.'
      };
    }

    if (isWrite && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Only Administrators have permission to assign or modify fee concessions.'
      };
    }

    return { allowed: true };
  }

  /**
   * GET /api/students/:studentId/fee-settings
   */
  public static async getSetting(req: any, res: Response, db: any) {
    try {
      const access = this.checkAccess(req, false);
      if (!access.allowed) {
        return res.status(access.statusCode || 403).json({
          success: false,
          code: 'FORBIDDEN',
          message: access.message
        });
      }

      const { studentId } = req.params;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'Student ID parameter is required.'
        });
      }

      const result = await StudentFeeSettingService.getStudentFeeSetting(studentId, db);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return ErrorStandardizer.success(res, 'Student fee settings retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentFeeSettingController.getSetting');
    }
  }

  /**
   * POST /api/students/:studentId/fee-settings
   * PUT /api/students/:studentId/fee-settings
   */
  public static async saveSetting(req: any, res: Response, db: any) {
    try {
      const access = this.checkAccess(req, true);
      if (!access.allowed) {
        return res.status(access.statusCode || 403).json({
          success: false,
          code: 'FORBIDDEN',
          message: access.message
        });
      }

      const { studentId } = req.params;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'Student ID parameter is required.'
        });
      }

      const currentUser = req.user || req.currentUser;
      const result = await StudentFeeSettingService.saveStudentFeeSetting(studentId, req.body, currentUser, db);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(result.statusCode || 200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentFeeSettingController.saveSetting');
    }
  }

  /**
   * DELETE /api/students/:studentId/fee-settings
   */
  public static async removeSetting(req: any, res: Response, db: any) {
    try {
      const access = this.checkAccess(req, true);
      if (!access.allowed) {
        return res.status(access.statusCode || 403).json({
          success: false,
          code: 'FORBIDDEN',
          message: access.message
        });
      }

      const { studentId } = req.params;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'Student ID parameter is required.'
        });
      }

      const currentUser = req.user || req.currentUser;
      const result = await StudentFeeSettingService.removeStudentFeeSetting(studentId, currentUser, db);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return ErrorStandardizer.success(res, result.message, result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentFeeSettingController.removeSetting');
    }
  }

  /**
   * GET /api/students/concessions/search
   */
  public static async searchConcessions(req: any, res: Response, db: any) {
    try {
      const access = this.checkAccess(req, false);
      if (!access.allowed) {
        return res.status(access.statusCode || 403).json({
          success: false,
          code: 'FORBIDDEN',
          message: access.message
        });
      }

      const filters = {
        hasConcession: req.query.hasConcession as string,
        concessionPercentage: req.query.concessionPercentage as string,
        className: (req.query.className || req.query.class) as string,
        search: req.query.search as string
      };

      const result = await StudentFeeSettingService.searchConcessions(filters, db);
      return ErrorStandardizer.success(res, 'Student concessions retrieved successfully.', result);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentFeeSettingController.searchConcessions');
    }
  }
}
