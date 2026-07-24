import { Response } from 'express';
import { ReceiptService } from './ReceiptService';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';

export class ReceiptController {
  /**
   * Helper to extract IP and Device details from request
   */
  private static getClientMetadata(req: any) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Unknown Device';
    return { ip, device };
  }

  /**
   * POST /api/receipts/generate
   * Generates a digital receipt for a verified payment.
   * Access: SUPER_ADMIN, ADMIN
   */
  public static async generate(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[ReceiptController] [GENERATE] Hit by ${currentUser.username} (${currentUser.role})`);

    // Role Security
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return ErrorStandardizer.error(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: You do not have permission to generate receipts manually.'
      });
    }

    const { paymentId } = req.body;
    if (!paymentId) {
      return ErrorStandardizer.error(res, {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'paymentId is required.'
      });
    }

    const { ip, device } = this.getClientMetadata(req);

    try {
      const result = await ReceiptService.generateReceipt(paymentId, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: 'GENERATE_FAILED',
          message: result.message || 'Failed to generate receipt'
        });
      }
      return ErrorStandardizer.success(res, result.message || 'Receipt generated successfully.', result.data, 201);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.generate');
    }
  }

  /**
   * GET /api/receipts/:receiptId
   * Retrieves a receipt by document ID.
   * Access: SUPER_ADMIN, ADMIN, RECEPTIONIST (TEACHER blocked)
   */
  public static async getById(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    const { receiptId } = req.params;

    if (currentUser.role === 'TEACHER') {
      return ErrorStandardizer.error(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: Teachers do not have access to financial receipts.'
      });
    }

    const { ip, device } = this.getClientMetadata(req);

    try {
      const result = await ReceiptService.getReceiptById(receiptId, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 404,
          code: 'NOT_FOUND',
          message: result.message || 'Receipt not found.'
        });
      }
      return ErrorStandardizer.success(res, 'Receipt retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.getById');
    }
  }

  /**
   * GET /api/receipts/number/:receiptNumber
   * Retrieves a receipt by sequential number.
   * Access: SUPER_ADMIN, ADMIN, RECEPTIONIST (TEACHER blocked)
   */
  public static async getByNumber(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    const { receiptNumber } = req.params;

    if (currentUser.role === 'TEACHER') {
      return ErrorStandardizer.error(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: Teachers do not have access to financial receipts.'
      });
    }

    const { ip, device } = this.getClientMetadata(req);

    try {
      const result = await ReceiptService.getReceiptByNumber(receiptNumber, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 404,
          code: 'NOT_FOUND',
          message: result.message || 'Receipt not found.'
        });
      }
      return ErrorStandardizer.success(res, 'Receipt retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.getByNumber');
    }
  }

  /**
   * GET /api/receipts/student/:studentId
   * Retrieves all receipts of a specific student.
   * Access: SUPER_ADMIN, ADMIN, RECEPTIONIST (TEACHER blocked)
   */
  public static async getByStudent(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    const { studentId } = req.params;

    if (currentUser.role === 'TEACHER') {
      return ErrorStandardizer.error(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: Teachers do not have access to financial receipts.'
      });
    }

    try {
      const result = await ReceiptService.getReceiptsByStudent(studentId, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: 'RETRIEVE_FAILED',
          message: result.message || 'Failed to retrieve receipts'
        });
      }
      return ErrorStandardizer.success(res, 'Student receipts retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.getByStudent');
    }
  }

  /**
   * GET /verify/receipt/:receiptNumber
   * Public online receipt verification.
   * Access: PUBLIC (No authorization headers required)
   */
  public static async verifyPublic(req: any, res: Response, db: any) {
    const { receiptNumber } = req.params;
    const { ip, device } = this.getClientMetadata(req);

    try {
      const result = await ReceiptService.verifyReceipt(receiptNumber, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 404,
          code: 'INVALID_RECEIPT',
          message: result.message || 'Invalid Receipt'
        });
      }
      return ErrorStandardizer.success(res, 'Receipt verified successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.verifyPublic');
    }
  }

  /**
   * POST /api/receipts/resend
   * Publishes receipt resent event and logs audit log.
   * Access: SUPER_ADMIN, ADMIN
   */
  public static async resend(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[ReceiptController] [RESEND] Hit by ${currentUser.username} (${currentUser.role})`);

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return ErrorStandardizer.error(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: You do not have permission to trigger receipt notifications.'
      });
    }

    const { receiptId } = req.body;
    if (!receiptId) {
      return ErrorStandardizer.error(res, {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'receiptId is required.'
      });
    }

    const { ip, device } = this.getClientMetadata(req);

    try {
      const result = await ReceiptService.resendReceipt(receiptId, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: 'RESEND_FAILED',
          message: result.message || 'Failed to resend receipt'
        });
      }
      return ErrorStandardizer.success(res, 'Receipt resent notification triggered successfully.', null);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.resend');
    }
  }

  /**
   * POST /api/receipts/:receiptId/download
   * Logs a download audit event and publishes receipt downloaded event.
   * Access: SUPER_ADMIN, ADMIN, RECEPTIONIST (TEACHER blocked)
   */
  public static async logDownload(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    const { receiptId } = req.params;

    if (currentUser.role === 'TEACHER') {
      return ErrorStandardizer.error(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: Teachers cannot download receipts.'
      });
    }

    const { ip, device } = this.getClientMetadata(req);

    try {
      const result = await ReceiptService.recordDownload(receiptId, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: 'DOWNLOAD_LOG_FAILED',
          message: result.message || 'Failed to log receipt download'
        });
      }
      return ErrorStandardizer.success(res, 'Receipt download audited successfully.', null);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'ReceiptController.logDownload');
    }
  }
}
