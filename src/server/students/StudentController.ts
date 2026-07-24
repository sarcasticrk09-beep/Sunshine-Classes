/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response } from 'express';
import { StudentService } from './StudentService';
import { ErrorStandardizer } from '../shared/ErrorStandardizer';

export class StudentController {
  /**
   * List students with filtering, search, and pagination.
   */
  public static async list(req: any, res: Response, db: any) {
    const startTime = Date.now();
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [LIST] Hit by ${currentUser.username} (${currentUser.role}) with queries:`, JSON.stringify(req.query));

    try {
      const options = {
        search: req.query.search as string,
        className: (req.query.className || req.query.class) as string,
        teacherId: req.query.teacherId as string,
        status: req.query.status as string,
        gender: req.query.gender as string,
        admissionYear: req.query.admissionYear as string,
        joinedDate: req.query.joinedDate as string,
        updatedDate: req.query.updatedDate as string,
        hasDocuments: req.query.hasDocuments as string,
        hasPhoto: req.query.hasPhoto as string,
        missingMobile: req.query.missingMobile as string,
        missingEmail: req.query.missingEmail as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 25,
        lastDocId: req.query.lastDocId as string
      };

      const result = await StudentService.listStudents(options, currentUser, db);
      const duration = Date.now() - startTime;
      console.log(`[StudentController] [LIST] Succeeded for ${currentUser.username} in ${duration}ms`);

      return ErrorStandardizer.success(res, 'Student directory retrieved successfully.', result);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.list');
    }
  }

  /**
   * Export students list as CSV or JSON.
   */
  public static async export(req: any, res: Response, db: any) {
    const startTime = Date.now();
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [EXPORT] Hit by ${currentUser.username} (${currentUser.role})`);

    try {
      const options = {
        search: req.query.search as string,
        className: (req.query.className || req.query.class) as string,
        teacherId: req.query.teacherId as string,
        status: req.query.status as string,
        gender: req.query.gender as string,
        admissionYear: req.query.admissionYear as string,
        joinedDate: req.query.joinedDate as string,
        updatedDate: req.query.updatedDate as string,
        hasDocuments: req.query.hasDocuments as string,
        hasPhoto: req.query.hasPhoto as string,
        missingMobile: req.query.missingMobile as string,
        missingEmail: req.query.missingEmail as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: 1,
        limit: 10000 // Unlimited for export
      };

      const result = await StudentService.listStudents(options, currentUser, db);

      const format = (req.query.format || 'json').toString().toLowerCase();

      if (format === 'csv') {
        const students = result.data || [];
        const headers = ['Roll No', 'Name', 'Class', 'Assigned Teacher', 'Father Name', 'Mobile', 'Email', 'Status', 'Admission Date'];
        const rows = students.map((s: any) => [
          s.rollNo || s.rollNumber || '',
          `"${(s.name || s.personalInfo?.name || '').replace(/"/g, '""')}"`,
          `"${(s.class || s.className || '').replace(/"/g, '""')}"`,
          `"${(s.assignedTeacher || '').replace(/"/g, '""')}"`,
          `"${(s.fatherName || s.parentInfo?.fatherName || '').replace(/"/g, '""')}"`,
          s.mobile || s.contactInfo?.mobile || '',
          s.email || s.contactInfo?.email || '',
          s.status || 'ACTIVE',
          s.admissionDate || s.createdAt || ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="student_directory_export.csv"');
        const duration = Date.now() - startTime;
        console.log(`[StudentController] [EXPORT] CSV Succeeded for ${currentUser.username} in ${duration}ms`);
        return res.status(200).send(csvContent);
      }

      const duration = Date.now() - startTime;
      console.log(`[StudentController] [EXPORT] JSON Succeeded for ${currentUser.username} in ${duration}ms`);
      return ErrorStandardizer.success(res, 'Student export generated successfully.', {
        count: result.data.length,
        data: result.data
      });
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.export');
    }
  }

  /**
   * Search students across key fields.
   */
  public static async search(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [SEARCH] Hit by ${currentUser.username} (${currentUser.role}) with q:`, req.query.q);

    try {
      const q = (req.query.q || req.query.search || '') as string;
      const result = await StudentService.searchStudents(q, currentUser, db);
      return ErrorStandardizer.success(res, 'Search completed successfully.', result);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.search');
    }
  }

  /**
   * Get student profile by ID.
   */
  public static async getById(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [GET_BY_ID] Student ${req.params.id} requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.getStudentById(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'NOT_FOUND',
          message: result.message || 'Student not found.'
        });
      }
      return ErrorStandardizer.success(res, 'Student profile retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.getById');
    }
  }

  /**
   * Update student profile (PUT).
   */
  public static async update(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [UPDATE] Student ${req.params.id} update requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.updateStudent(id, req.body, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'UPDATE_FAILED',
          message: result.message || 'Update failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student profile updated successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.update');
    }
  }

  /**
   * Update student status.
   */
  public static async updateStatus(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [UPDATE_STATUS] Student ${req.params.id} to status ${req.body.status} requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await StudentService.updateStatus(id, status, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'STATUS_UPDATE_FAILED',
          message: result.message || 'Status update failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student status updated successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.updateStatus');
    }
  }

  /**
   * Update student class directly.
   */
  public static async updateClass(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [UPDATE_CLASS] Student ${req.params.id} direct class update requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const { className, class: classProp } = req.body;
      const result = await StudentService.updateClass(id, className || classProp, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'CLASS_UPDATE_FAILED',
          message: result.message || 'Class update failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student class reassigned successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.updateClass');
    }
  }

  /**
   * Change class with history tracking and pending fee adjustments.
   */
  public static async changeClass(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [CHANGE_CLASS] Student ${req.params.id} class change requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.changeClass(id, req.body, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'CLASS_TRANSFER_FAILED',
          message: result.message || 'Class transfer failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student class transferred successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.changeClass');
    }
  }

  /**
   * Get student class history.
   */
  public static async getClassHistory(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [GET_CLASS_HISTORY] Student ${req.params.id} class history requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.getClassHistory(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'FETCH_CLASS_HISTORY_FAILED',
          message: result.message || 'Failed to fetch class history.'
        });
      }
      return ErrorStandardizer.success(res, 'Class history retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.getClassHistory');
    }
  }

  /**
   * Assign teacher with wizard transaction tracking.
   */
  public static async assignTeacher(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [ASSIGN_TEACHER] Student ${req.params.id} teacher assignment requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.assignTeacher(id, req.body, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'TEACHER_ASSIGNMENT_FAILED',
          message: result.message || 'Teacher assignment failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Teacher assigned successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.assignTeacher');
    }
  }

  /**
   * Get student teacher history.
   */
  public static async getTeacherHistory(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [GET_TEACHER_HISTORY] Student ${req.params.id} teacher history requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.getTeacherHistory(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'FETCH_TEACHER_HISTORY_FAILED',
          message: result.message || 'Failed to fetch teacher history.'
        });
      }
      return ErrorStandardizer.success(res, 'Teacher history retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.getTeacherHistory');
    }
  }

  /**
   * Update teacher directly.
   */
  public static async updateTeacher(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [UPDATE_TEACHER] Student ${req.params.id} direct teacher update requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const { teacherId, teacherName, teacher } = req.body;
      const result = await StudentService.updateTeacher(id, teacherId || teacherName || teacher, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'TEACHER_UPDATE_FAILED',
          message: result.message || 'Teacher update failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student teacher updated successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.updateTeacher');
    }
  }

  /**
   * Update student document attachments.
   */
  public static async updateDocuments(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [UPDATE_DOCUMENTS] Student ${req.params.id} documents update requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.updateDocuments(id, req.body, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'DOCUMENTS_UPDATE_FAILED',
          message: result.message || 'Documents update failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student documents updated successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.updateDocuments');
    }
  }

  /**
   * Get student event timelines.
   */
  public static async getTimeline(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [GET_TIMELINE] Student ${req.params.id} timeline requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result = await StudentService.getStudentTimeline(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'FETCH_TIMELINE_FAILED',
          message: result.message || 'Failed to fetch timeline.'
        });
      }
      return ErrorStandardizer.success(res, 'Student timeline retrieved successfully.', result.data);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.getTimeline');
    }
  }

  /**
   * Soft-delete student record.
   */
  public static async remove(req: any, res: Response, db: any) {
    const currentUser = req.user || req.currentUser || { username: 'anonymous', role: 'UNKNOWN' };
    console.log(`[StudentController] [REMOVE] Student ${req.params.id} soft-delete requested by ${currentUser.username}`);

    try {
      const { id } = req.params;
      const result: any = await StudentService.softDeleteStudent(id, currentUser, db);
      if (!result.success) {
        return ErrorStandardizer.error(res, {
          statusCode: result.statusCode || 400,
          code: result.code || 'DELETE_FAILED',
          message: result.message || 'Soft delete failed.'
        });
      }
      return ErrorStandardizer.success(res, 'Student profile deleted successfully.', result);
    } catch (error: any) {
      return ErrorStandardizer.handleServerError(res, error, 'StudentController.remove');
    }
  }
}
