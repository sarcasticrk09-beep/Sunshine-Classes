import { Response } from 'express';

export interface StandardApiResponse<T = any> {
  success: boolean;
  code?: string;
  message: string;
  data?: T;
  errors?: string[];
}

export class ErrorStandardizer {
  /**
   * Responds with a standardized 2xx success payload.
   */
  public static success<T>(res: Response, message: string, data?: T, statusCode = 200) {
    const payload: StandardApiResponse<T> = {
      success: true,
      message
    };
    if (data !== undefined) {
      payload.data = data;
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Responds with a standardized error payload based on specific application error codes.
   */
  public static error(
    res: Response,
    errorObj: {
      statusCode?: number;
      code?: string;
      message: string;
      errors?: string[];
    }
  ) {
    const statusCode = errorObj.statusCode || 400;
    const payload: StandardApiResponse = {
      success: false,
      code: errorObj.code || 'BAD_REQUEST',
      message: errorObj.message
    };
    if (errorObj.errors) {
      payload.errors = errorObj.errors;
    }
    if (statusCode >= 500) {
      console.error(`[ErrorStandardizer] API Error [${statusCode}] [${payload.code}]: ${payload.message}`, JSON.stringify(errorObj.errors || {}));
    } else {
      console.warn(`[ErrorStandardizer] API Response [${statusCode}] [${payload.code}]: ${payload.message}`, JSON.stringify(errorObj.errors || {}));
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Automatically handles system exceptions and turns them into a standard 500 payload.
   */
  public static handleServerError(res: Response, error: any, context = 'Unknown Context') {
    console.error(`[ErrorStandardizer] Server Exception in ${context}:`, error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected internal server error occurred.'
    });
  }
}
