import { Response } from 'express';
import { MonthlyFeeGeneratorService } from './MonthlyFeeGeneratorService';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';

export class MonthlyFeeGeneratorController {
  /**
   * Helper to check authorization roles for write actions (Generate, Preview)
   * Only SUPER_ADMIN and ADMIN are allowed.
   */
  private static assertWritePermission(currentUser: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: Insufficient permissions to generate or modify fees.'
      };
    }
  }

  /**
   * Helper to check authorization roles for read actions
   * SUPER_ADMIN, ADMIN, and RECEPTIONIST are allowed.
   */
  private static assertReadPermission(currentUser: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(role)) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: Insufficient permissions to view monthly fees.'
      };
    }
  }

  /**
   * POST /api/fees/generate
   */
  public static async generate(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[MonthlyFeeGeneratorController] [GENERATE] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertWritePermission(currentUser);

      const { month, classId } = req.body;
      if (!month) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: "Target month is required in 'Month Year' format, e.g. 'July 2026'."
        });
      }

      const result = await MonthlyFeeGeneratorService.generateFees(month, classId || null, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'BAD_REQUEST',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, result.message || 'Monthly fees generated successfully.', result.data, 201);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'MonthlyFeeGeneratorController.generate');
    }
  }

  /**
   * POST /api/fees/generate/preview
   */
  public static async preview(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[MonthlyFeeGeneratorController] [PREVIEW] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertWritePermission(currentUser);

      const { month, classId } = req.body;
      if (!month) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: "Target month is required in 'Month Year' format, e.g. 'July 2026'."
        });
      }

      const result = await MonthlyFeeGeneratorService.generatePreview(month, classId || null, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'BAD_REQUEST',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, 'Fee generation preview generated successfully.', result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'MonthlyFeeGeneratorController.preview');
    }
  }

  /**
   * GET /api/fees/monthly
   */
  public static async list(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[MonthlyFeeGeneratorController] [LIST] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertReadPermission(currentUser);

      const filters = {
        studentId: req.query.studentId,
        class: req.query.class,
        month: req.query.month,
        status: req.query.status
      };

      const result = await MonthlyFeeGeneratorService.listMonthlyFees(filters, db);
      return ErrorStandardizer.success(res, 'Monthly generated fees retrieved successfully.', result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'MonthlyFeeGeneratorController.list');
    }
  }

  /**
   * GET /api/fees/monthly/student/:studentId
   */
  public static async getByStudent(req: any, res: Response, db: any) {
    const studentId = req.params.studentId;
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[MonthlyFeeGeneratorController] [GET_BY_STUDENT] Hit by ${currentUser.username} (${currentUser.role}) for student: ${studentId}`);

    try {
      this.assertReadPermission(currentUser);

      if (!studentId) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Student ID parameter is required.'
        });
      }

      const result = await MonthlyFeeGeneratorService.getMonthlyFeesByStudent(studentId, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 404,
          code: result.code || 'NOT_FOUND',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, 'Student monthly generated fees retrieved successfully.', result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'MonthlyFeeGeneratorController.getByStudent');
    }
  }

  /**
   * GET /api/fees/generation-reports
   */
  public static async getReports(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[MonthlyFeeGeneratorController] [GET_REPORTS] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertReadPermission(currentUser);

      const result = await MonthlyFeeGeneratorService.listGenerationReports(db);
      return ErrorStandardizer.success(res, 'Fee generation reports retrieved successfully.', result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'MonthlyFeeGeneratorController.getReports');
    }
  }
}
