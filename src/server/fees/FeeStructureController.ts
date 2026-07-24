import { Response } from 'express';
import { FeeStructureService } from './FeeStructureService';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';

export class FeeStructureController {
  /**
   * Create a new fee structure.
   */
  public static async create(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeStructureController] [CREATE] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      const result = await FeeStructureService.createFeeStructure(req.body, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode,
          code: result.code,
          message: result.message
        });
      }
      return ErrorStandardizer.success(res, result.message || 'Fee structure created successfully.', result.data, 210);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'FeeStructureController.create');
    }
  }

  /**
   * Update an existing fee structure.
   */
  public static async update(req: any, res: Response, db: any) {
    const id = req.params.id;
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeStructureController] [UPDATE] Hit by ${currentUser.username} (${currentUser.role}) for ID: ${id}`);

    try {
      const result = await FeeStructureService.updateFeeStructure(id, req.body, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode,
          code: result.code,
          message: result.message
        });
      }
      return ErrorStandardizer.success(res, result.message || 'Fee structure updated successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'FeeStructureController.update');
    }
  }

  /**
   * Activate a fee structure.
   */
  public static async activate(req: any, res: Response, db: any) {
    const id = req.params.id;
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeStructureController] [ACTIVATE] Hit by ${currentUser.username} (${currentUser.role}) for ID: ${id}`);

    try {
      const result = await FeeStructureService.activateFeeStructure(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode,
          code: result.code,
          message: result.message
        });
      }
      return ErrorStandardizer.success(res, result.message || 'Fee structure activated successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'FeeStructureController.activate');
    }
  }

  /**
   * List all fee structures.
   */
  public static async list(req: any, res: Response, db: any) {
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeStructureController] [LIST] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      const result = await FeeStructureService.listFeeStructures(currentUser, db);
      return ErrorStandardizer.success(res, 'Fee structures retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'FeeStructureController.list');
    }
  }

  /**
   * Get details of a single fee structure.
   */
  public static async getById(req: any, res: Response, db: any) {
    const id = req.params.id;
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeStructureController] [GET_BY_ID] Hit by ${currentUser.username} (${currentUser.role}) for ID: ${id}`);

    try {
      const result = await FeeStructureService.getFeeStructureById(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode,
          code: result.code,
          message: result.message
        });
      }
      return ErrorStandardizer.success(res, 'Fee structure retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'FeeStructureController.getById');
    }
  }

  /**
   * Get version history for a fee structure's class + session.
   */
  public static async history(req: any, res: Response, db: any) {
    const id = req.params.id;
    const currentUser = req.user || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[FeeStructureController] [HISTORY] Hit by ${currentUser.username} (${currentUser.role}) for ID: ${id}`);

    try {
      const result = await FeeStructureService.getVersionHistory(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode,
          code: result.code,
          message: result.message
        });
      }
      return ErrorStandardizer.success(res, 'Fee structure version history retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'FeeStructureController.history');
    }
  }
}
