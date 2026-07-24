import { PasswordService } from './PasswordService';
import { JWTService, JWTPayload } from './JWTService';
import { AuditLogger } from './AuditLogger';

export class AuthService {
  /**
   * Helper to check if a user role can reset another role's password based on hierarchy
   */
  public static canResetPassword(resetterRole: string, targetRole: string): boolean {
    const r = resetterRole?.toUpperCase();
    const t = targetRole?.toUpperCase();

    if (r === 'SUPER_ADMIN') {
      return ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'TEACHER', 'STUDENT'].includes(t);
    }
    if (r === 'ADMIN') {
      return ['RECEPTIONIST', 'TEACHER', 'STUDENT'].includes(t);
    }
    if (r === 'RECEPTIONIST') {
      return t === 'STUDENT';
    }
    return false;
  }

  /**
   * Validates user login credentials and returns JWT tokens + account status.
   */
  public static async authenticateUser(
    user: any,
    passwordInput: string
  ): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: any;
    error?: string;
    mustChangePassword?: boolean;
    isLocked?: boolean;
    updatedUserFields?: any;
  }> {
    if (!user) {
      await AuditLogger.log('LOGIN', 'Unknown', 'Login failed: Username not found', 'FAILURE');
      return { success: false, error: 'Invalid username or password.' };
    }

    if (user.active === false || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      await AuditLogger.log('LOGIN', user.username, 'Login rejected: Account is disabled', 'FAILURE');
      return { success: false, error: 'Your account is disabled. Please contact the administrator.' };
    }

    if (user.isLocked || user.status === 'LOCKED') {
      await AuditLogger.log('LOGIN', user.username, 'Login rejected: Account is locked', 'FAILURE');
      return { success: false, error: 'Your account is locked due to security policy. Contact administrator.' };
    }

    const storedHash = user.passwordHash || user.password || '';
    const isValidPassword = await PasswordService.comparePassword(passwordInput, storedHash);

    if (!isValidPassword) {
      const currentAttempts = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = currentAttempts >= 5;

      const updatedUserFields: any = {
        failedLoginAttempts: isNowLocked ? 0 : currentAttempts,
        isLocked: isNowLocked ? true : (user.isLocked ?? false),
        status: isNowLocked ? 'LOCKED' : (user.status || 'ACTIVE'),
        updatedAt: new Date().toISOString()
      };

      if (isNowLocked) {
        await AuditLogger.log('ACCOUNT_LOCK', user.username, 'Account automatically locked after 5 consecutive failed login attempts.', 'FAILURE', user.id);
        return {
          success: false,
          error: 'Your account has been locked due to 5 consecutive failed login attempts. Please contact the administrator.',
          isLocked: true,
          updatedUserFields
        };
      }

      await AuditLogger.log('FAILED_LOGIN', user.username, `Failed login attempt ${currentAttempts}/5`, 'FAILURE', user.id);
      return {
        success: false,
        error: 'Invalid username or password.',
        updatedUserFields
      };
    }

    // Success! Reset failed login attempts
    const updatedUserFields: any = {
      failedLoginAttempts: 0,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const permissions = JWTService.getPermissionsForRole(user.role);

    const payload: JWTPayload = {
      userId: user.id,
      role: user.role,
      permissions,
      sessionId,
      tokenVersion: user.tokenVersion || 1,
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email
    };

    const accessToken = JWTService.signAccessToken(payload);
    const refreshToken = JWTService.signRefreshToken(payload);

    const mustChangePassword = !!(user.firstLogin || user.mustChangePassword || user.forcePasswordChange);

    await AuditLogger.log('LOGIN', user.username, `Login successful. Role: ${user.role}`, 'SUCCESS', user.id);

    return {
      success: true,
      accessToken,
      refreshToken,
      mustChangePassword,
      updatedUserFields,
      user: {
        id: user.id,
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions,
        email: user.email,
        active: user.active ?? true,
        mustChangePassword,
        firstLogin: mustChangePassword
      }
    };
  }
}

