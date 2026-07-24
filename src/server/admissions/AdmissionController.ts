/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/AuthMiddleware';
import { AdmissionService } from './AdmissionService';

export class AdmissionController {
  /**
   * POST /api/admissions - Create new admission
   */
  public static async create(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const createdBy = {
        username: req.user?.username || req.user?.name || 'Admin',
        userId: req.user?.userId || req.user?.id || 'admin',
        role: req.user?.role || 'ADMIN'
      };

      const result = await AdmissionService.createAdmission(req.body, createdBy, db);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          error: result.error,
          message: result.message,
          details: result.details
        });
      }

      return res.status(201).json(result);
    } catch (err: any) {
      console.error('[AdmissionController.create] Error:', err);
      return res.status(500).json({ error: 'Failed to process admission.', message: err.message });
    }
  }

  /**
   * GET /api/admissions - List / Filter admissions
   */
  public static async list(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const { page, limit, search, className, status, startDate, endDate } = req.query;

      const result = await AdmissionService.getAdmissions(
        {
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          search: search ? String(search) : undefined,
          className: className ? String(className) : undefined,
          status: status ? String(status) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined
        },
        req.user,
        db
      );

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[AdmissionController.list] Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve admissions.', message: err.message });
    }
  }

  /**
   * GET /api/admissions/search - Dedicated Search
   */
  public static async search(req: AuthenticatedRequest, res: Response, db: any) {
    return AdmissionController.list(req, res, db);
  }

  /**
   * GET /api/admissions/:id - Get single admission
   */
  public static async getById(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Admission ID parameter is required.' });
      }

      const result = await AdmissionService.getAdmissionById(id, req.user, db);
      if (!result.success) {
        return res.status(result.statusCode || 404).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[AdmissionController.getById] Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve admission details.', message: err.message });
    }
  }

  /**
   * PUT /api/admissions/:id - Update admission
   */
  public static async update(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Admission ID parameter is required.' });
      }

      const updatedBy = {
        username: req.user?.username || req.user?.name || 'Admin',
        userId: req.user?.userId || req.user?.id || 'admin',
        role: req.user?.role || 'ADMIN'
      };

      const result = await AdmissionService.updateAdmission(id, req.body, updatedBy, db);
      if (!result.success) {
        return res.status(result.statusCode || 400).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[AdmissionController.update] Error:', err);
      return res.status(500).json({ error: 'Failed to update admission.', message: err.message });
    }
  }

  /**
   * DELETE /api/admissions/:id - Delete admission
   */
  public static async remove(req: AuthenticatedRequest, res: Response, db: any) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Admission ID parameter is required.' });
      }

      const deletedBy = {
        username: req.user?.username || req.user?.name || 'Admin',
        userId: req.user?.userId || req.user?.id || 'admin',
        role: req.user?.role || 'ADMIN'
      };

      const result = await AdmissionService.deleteAdmission(id, deletedBy, db);
      if (!result.success) {
        return res.status(result.statusCode || 400).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[AdmissionController.remove] Error:', err);
      return res.status(500).json({ error: 'Failed to delete admission.', message: err.message });
    }
  }
}
