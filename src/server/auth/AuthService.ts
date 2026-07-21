import { PasswordService } from './PasswordService';
import { JWTService, JWTPayload } from './JWTService';
import { AuditLogger } from './AuditLogger';

export class AuthService {
  /**
   * Validates user login credentials against provided user data.
   */
  public static async authenticateUser(
    user: any,
    passwordInput: string
  ): Promise<{ success: boolean; token?: string; user?: any; error?: string; mustChangePassword?: boolean }> {
    if (!user) {
      AuditLogger.log('LOGIN', 'Unknown', 'Login failed: Username not found', 'FAILURE');
      return { success: false, error: 'Invalid username or password.' };
    }

    if (user.active === false || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      AuditLogger.log('LOGIN', user.username, 'Login rejected: Account is disabled or suspended', 'FAILURE');
      return { success: false, error: 'Account is disabled or suspended. Please contact administrator.' };
    }

    if (user.isLocked) {
      AuditLogger.log('LOGIN', user.username, 'Login rejected: Account is locked', 'FAILURE');
      return { success: false, error: 'Account is locked due to security policy. Contact administrator.' };
    }

    const storedHash = user.passwordHash || user.password || '';
    const isValidPassword = await PasswordService.comparePassword(passwordInput, storedHash);

    if (!isValidPassword) {
      AuditLogger.log('LOGIN', user.username, 'Login failed: Incorrect password', 'FAILURE');
      return { success: false, error: 'Invalid username or password.' };
    }

    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
    };

    const token = JWTService.signToken(payload);
    const mustChangePassword = !!(user.mustChangePassword || user.forcePasswordChange);

    AuditLogger.log('LOGIN', user.username, `Login successful. Role: ${user.role}`);

    return {
      success: true,
      token,
      mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        active: user.active ?? true,
        mustChangePassword
      }
    };
  }
}
