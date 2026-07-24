import { Response } from 'express';
import { FeeCollectionService } from './FeeCollectionService';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';

export class FeeCollectionController {
  /**
   * Asserts that the authenticated user has permissions: SUPER_ADMIN, ADMIN, or RECEPTIONIST.
   */
  private static assertPermission(currentUser: any) {
    const role = (currentUser?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(role)) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Forbidden: You do not have permissions to access fee collection.'
      };
    }
  }

  /**
   * POST /api/fees/pay
   * Immediate cash payment processing.
   */
  public static async collectCash(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeCollectionController] [COLLECT_CASH] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertPermission(currentUser);

      const { studentId, feeRecordIds, amount, remarks } = req.body;
      if (!studentId || !feeRecordIds || !amount) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Missing required fields: studentId, feeRecordIds, and amount are required.'
        });
      }

      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Payment amount must be a positive number.'
        });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const device = req.headers['user-agent'] || 'Unknown Device';

      const result: any = await FeeCollectionService.collectCashPayment(
        studentId,
        feeRecordIds,
        parsedAmount,
        remarks || '',
        currentUser,
        db,
        ip,
        device
      );

      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'BAD_REQUEST',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, result.message, result.data, 201);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.collectCash');
    }
  }

  /**
   * POST /api/fees/payment/submit
   * Submit a payment verification (UPI, BANK_TRANSFER, CHEQUE) to queue.
   */
  public static async submitVerification(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeCollectionController] [SUBMIT_VERIFICATION] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertPermission(currentUser);

      const { studentId, feeRecordIds, amount, paymentMode, transactionId, proofUrl } = req.body;
      if (!studentId || !feeRecordIds || !amount || !paymentMode || !transactionId) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Missing required fields: studentId, feeRecordIds, amount, paymentMode, and transactionId are required.'
        });
      }

      const cleanMode = (paymentMode || '').toUpperCase();
      if (!['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(cleanMode)) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Invalid payment mode. Supported modes are: UPI, BANK_TRANSFER, CHEQUE.'
        });
      }

      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Payment amount must be a positive number.'
        });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const device = req.headers['user-agent'] || 'Unknown Device';

      const result = await FeeCollectionService.submitPaymentVerification(
        studentId,
        feeRecordIds,
        parsedAmount,
        cleanMode as any,
        transactionId,
        proofUrl,
        currentUser,
        db,
        ip,
        device
      );

      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'BAD_REQUEST',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, result.message, result.data, 201);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.submitVerification');
    }
  }

  /**
   * POST /api/fees/payment/approve
   * Admin approves a verification request.
   */
  public static async approveVerification(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeCollectionController] [APPROVE_VERIFICATION] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertPermission(currentUser);

      const { verificationId } = req.body;
      if (!verificationId) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'verificationId is required.'
        });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const device = req.headers['user-agent'] || 'Unknown Device';

      const result: any = await FeeCollectionService.approveVerification(verificationId, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'BAD_REQUEST',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, result.message, result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.approveVerification');
    }
  }

  /**
   * POST /api/fees/payment/reject
   * Admin rejects a verification request.
   */
  public static async rejectVerification(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeCollectionController] [REJECT_VERIFICATION] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertPermission(currentUser);

      const { verificationId, reason } = req.body;
      if (!verificationId || !reason) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'verificationId and reason are required.'
        });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const device = req.headers['user-agent'] || 'Unknown Device';

      const result = await FeeCollectionService.rejectVerification(verificationId, reason, currentUser, db, ip, device);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'BAD_REQUEST',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, result.message, result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.rejectVerification');
    }
  }

  /**
   * GET /api/fees/payments
   * List completed payments (paginated).
   */
  public static async listPayments(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeCollectionController] [LIST_PAYMENTS] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertPermission(currentUser);

      const filters = {
        studentId: req.query.studentId,
        paymentMode: req.query.paymentMode,
        class: req.query.class,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await FeeCollectionService.listPayments(filters, db);
      return ErrorStandardizer.success(res, 'Payments retrieved successfully.', {
        payments: result.data,
        meta: result.meta
      }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.listPayments');
    }
  }

  /**
   * GET /api/fees/payment/verifications
   * List the verification queue.
   */
  public static async listVerifications(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeCollectionController] [LIST_VERIFICATIONS] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      this.assertPermission(currentUser);

      const filters = {
        status: req.query.status,
        studentId: req.query.studentId
      };

      const result = await FeeCollectionService.listVerifications(filters, db);
      return ErrorStandardizer.success(res, 'Payment verifications queue retrieved successfully.', result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.listVerifications');
    }
  }

  /**
   * GET /api/fees/receipt/:receiptNumber
   * Fetch details of a single receipt.
   */
  public static async getReceipt(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    const { receiptNumber } = req.params;
    console.log(`[FeeCollectionController] [GET_RECEIPT] Hit by ${currentUser.username} (${currentUser.role}) for receipt: ${receiptNumber}`);

    try {
      this.assertPermission(currentUser);

      if (!receiptNumber) {
        return ErrorStandardizer.error(res, {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'receiptNumber parameter is required.'
        });
      }

      const result = await FeeCollectionService.getReceipt(receiptNumber, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 404,
          code: result.code || 'NOT_FOUND',
          message: result.message
        });
      }

      return ErrorStandardizer.success(res, 'Receipt retrieved successfully.', result.data);
    } catch (error: any) {
      if (error.statusCode) {
        return ErrorStandardizer.error(res, error);
      }
      return ErrorStandardizer.handleServerError(res, error, 'FeeCollectionController.getReceipt');
    }
  }
}
