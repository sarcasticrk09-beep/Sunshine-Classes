import { Response } from 'express';
import { FinanceReportService } from './FinanceReportService';

export class FinanceReportController {
  /**
   * Helper to verify RBAC permissions
   */
  private static checkAccess(req: any, res: Response, allowReceptionist: boolean = true): boolean {
    const role = req.user?.role;
    if (!role) {
      res.status(401).json({ error: 'Unauthorized user.' });
      return false;
    }

    if (role === 'TEACHER') {
      res.status(403).json({ error: 'Access denied. Teachers do not have access to Finance Reports.' });
      return false;
    }

    if (!allowReceptionist && role === 'RECEPTIONIST') {
      res.status(403).json({ error: 'Access denied. Admin rights required.' });
      return false;
    }

    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || (allowReceptionist && role === 'RECEPTIONIST')) {
      return true;
    }

    res.status(403).json({ error: 'Access denied.' });
    return false;
  }

  /**
   * GET /api/finance/dashboard
   */
  public static async getDashboardMetrics(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        academicSession: req.query.academicSession as string,
        classId: req.query.classId as string
      };

      const metrics = await FinanceReportService.getDashboardMetrics(db, filters);
      await FinanceReportService.logDashboardAccess(db, req.user);

      return res.json({ success: true, metrics });
    } catch (err: any) {
      console.error('[FinanceReportController] getDashboardMetrics error:', err);
      return res.status(500).json({ error: 'Failed to compute dashboard metrics: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/collections
   */
  public static async getCollectionAnalytics(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        classId: req.query.classId as string,
        paymentMode: req.query.paymentMode as string
      };

      const analytics = await FinanceReportService.getCollectionAnalytics(db, filters);
      return res.json({ success: true, analytics });
    } catch (err: any) {
      console.error('[FinanceReportController] getCollectionAnalytics error:', err);
      return res.status(500).json({ error: 'Failed to fetch collection analytics: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/class-wise
   */
  public static async getClassWiseReport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const sortBy = req.query.sortBy as 'highest_collection' | 'lowest_collection' | 'pending_amount';
      const report = await FinanceReportService.getClassWiseReport(db, { sortBy });

      return res.json({ success: true, report });
    } catch (err: any) {
      console.error('[FinanceReportController] getClassWiseReport error:', err);
      return res.status(500).json({ error: 'Failed to generate class-wise report: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/students
   */
  public static async getStudentReport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const queryParams = {
        search: req.query.search as string,
        classId: req.query.classId as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      };

      const report = await FinanceReportService.getStudentReport(db, queryParams);
      return res.json({ success: true, ...report });
    } catch (err: any) {
      console.error('[FinanceReportController] getStudentReport error:', err);
      return res.status(500).json({ error: 'Failed to generate student report: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/overdue
   */
  public static async getOverdueReport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const filters = {
        classId: req.query.classId as string
      };

      const report = await FinanceReportService.getOverdueReport(db, filters);
      return res.json({ success: true, report });
    } catch (err: any) {
      console.error('[FinanceReportController] getOverdueReport error:', err);
      return res.status(500).json({ error: 'Failed to generate overdue report: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/concessions
   */
  public static async getConcessionReport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const filters = {
        classId: req.query.classId as string
      };

      const report = await FinanceReportService.getConcessionReport(db, filters);
      return res.json({ success: true, report });
    } catch (err: any) {
      console.error('[FinanceReportController] getConcessionReport error:', err);
      return res.status(500).json({ error: 'Failed to generate concession report: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/payment-modes
   */
  public static async getPaymentModeReport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const report = await FinanceReportService.getPaymentModeReport(db);
      return res.json({ success: true, report });
    } catch (err: any) {
      console.error('[FinanceReportController] getPaymentModeReport error:', err);
      return res.status(500).json({ error: 'Failed to generate payment mode report: ' + err.message });
    }
  }

  /**
   * GET /api/finance/reports/receipts
   */
  public static async getReceiptReport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const queryParams = {
        search: req.query.search as string,
        paymentMode: req.query.paymentMode as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      };

      const report = await FinanceReportService.getReceiptReport(db, queryParams);
      return res.json({ success: true, ...report });
    } catch (err: any) {
      console.error('[FinanceReportController] getReceiptReport error:', err);
      return res.status(500).json({ error: 'Failed to generate receipt report: ' + err.message });
    }
  }

  /**
   * POST /api/finance/audit/log-export
   */
  public static async logReportExport(req: any, res: Response, db: any) {
    if (!FinanceReportController.checkAccess(req, res, true)) return;

    try {
      const { reportName, exportType, filtersUsed } = req.body;
      await FinanceReportService.logReportExport(db, req.user, reportName, exportType, filtersUsed);
      return res.json({ success: true, message: 'Export audit logged successfully.' });
    } catch (err: any) {
      console.error('[FinanceReportController] logReportExport error:', err);
      return res.status(500).json({ error: 'Failed to log export audit.' });
    }
  }
}
