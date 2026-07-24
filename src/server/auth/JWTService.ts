import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  tokenVersion: number;
  // Legacy fields for backward compatibility
  id?: string;
  username?: string;
  name?: string;
  email?: string;
}

export class JWTService {
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET || 'sunshine_erp_access_secret_key_2026';
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sunshine_erp_refresh_secret_key_2026';
  
  private static readonly ACCESS_EXPIRES_IN = '60m';
  private static readonly REFRESH_EXPIRES_IN = '90d';

  public static getPermissionsForRole(role: string): string[] {
    const r = role?.toUpperCase();
    switch (r) {
      case 'SUPER_ADMIN':
        return ['*'];
      case 'ADMIN':
        return ['manage_users', 'manage_students', 'manage_teachers', 'manage_fees', 'manage_admissions', 'view_reports'];
      case 'RECEPTIONIST':
        return ['manage_admissions', 'manage_students', 'reset_student_passwords', 'view_fees'];
      case 'TEACHER':
        return ['view_students', 'mark_attendance', 'view_schedules'];
      case 'STUDENT':
        return ['view_profile', 'view_fees', 'view_attendance'];
      default:
        return [];
    }
  }

  public static signAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, { expiresIn: this.ACCESS_EXPIRES_IN });
  }

  public static signRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.REFRESH_SECRET, { expiresIn: this.REFRESH_EXPIRES_IN });
  }

  public static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.ACCESS_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }

  public static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.REFRESH_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }

  // Convenience aliases for single-token callers
  public static signToken(payload: JWTPayload): string {
    return this.signAccessToken(payload);
  }

  public static verifyToken(token: string): JWTPayload | null {
    return this.verifyAccessToken(token) || this.verifyRefreshToken(token);
  }
}

