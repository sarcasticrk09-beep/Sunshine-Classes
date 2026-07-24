import { Request, Response } from 'express';
import { AuthService } from './AuthService';
import { PasswordService } from './PasswordService';
import { JWTService, JWTPayload } from './JWTService';
import { AuditLogger } from './AuditLogger';
import { AuthenticatedRequest } from './AuthMiddleware';

export class AuthController {
  public static async login(
    req: Request,
    res: Response,
    getUsersFn: () => Promise<any[]>,
    saveUsersFn?: (users: any[]) => Promise<void>
  ) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const users = await getUsersFn();
      const userIndex = users.findIndex((u: any) => u.username?.toLowerCase() === cleanUsername);
      const targetUser = userIndex !== -1 ? users[userIndex] : null;

      const result = await AuthService.authenticateUser(targetUser, String(password));

      // Persist any user updates (failed attempts counter, lock state, lastLoginAt)
      if (targetUser && result.updatedUserFields && saveUsersFn) {
        users[userIndex] = {
          ...targetUser,
          ...result.updatedUserFields
        };
        await saveUsersFn(users);
      }

      if (!result.success) {
        return res.status(401).json({ error: result.error, isLocked: result.isLocked });
      }

      const isProd = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        path: '/'
      };

      if (result.accessToken) {
        res.cookie('sunshine_access_token', result.accessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 }); // 60 mins
        res.cookie('sunshine_token', result.accessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
      }

      if (result.refreshToken) {
        res.cookie('sunshine_refresh_token', result.refreshToken, { ...cookieOpts, maxAge: 90 * 24 * 60 * 60 * 1000 }); // 90 days
      }

      return res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        token: result.accessToken, // Backward compatible field
        mustChangePassword: result.mustChangePassword,
        firstLogin: result.mustChangePassword,
        user: result.user
      });
    } catch (err: any) {
      console.error('[AuthController.login] Error:', err);
      return res.status(500).json({ error: 'Authentication internal server error.' });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user) {
        await AuditLogger.log('LOGOUT', req.user.username || 'user', 'User logged out', 'SUCCESS', req.user.userId || req.user.id);
      }

      res.clearCookie('sunshine_access_token', { path: '/' });
      res.clearCookie('sunshine_token', { path: '/' });
      res.clearCookie('sunshine_refresh_token', { path: '/' });

      return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to process logout.' });
    }
  }

  public static async refresh(
    req: Request,
    res: Response,
    getUsersFn: () => Promise<any[]>
  ) {
    try {
      const cookieRefreshToken = req.cookies?.sunshine_refresh_token;
      const { token, refreshToken } = req.body || {};
      const tokenToVerify = cookieRefreshToken || refreshToken || token;
      
      if (!tokenToVerify) {
        return res.status(400).json({ error: 'Refresh token is required.' });
      }

      const payload = JWTService.verifyRefreshToken(tokenToVerify) || JWTService.verifyToken(tokenToVerify);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired refresh token.' });
      }

      const userId = payload.userId || payload.id;
      const users = await getUsersFn();
      const user = users.find((u: any) => u.id === userId || u.username?.toLowerCase() === payload.username?.toLowerCase());

      if (!user || user.active === false || user.status === 'DISABLED' || user.isLocked) {
        return res.status(401).json({ error: 'User account inactive or locked.' });
      }

      const newPermissions = JWTService.getPermissionsForRole(user.role);
      const newPayload: JWTPayload = {
        userId: user.id,
        role: user.role,
        permissions: newPermissions,
        sessionId: payload.sessionId || `sess-${Date.now()}`,
        tokenVersion: user.tokenVersion || 1,
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      };

      const newAccessToken = JWTService.signAccessToken(newPayload);
      const newRefreshToken = JWTService.signRefreshToken(newPayload);

      const isProd = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        path: '/'
      };

      res.cookie('sunshine_access_token', newAccessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
      res.cookie('sunshine_token', newAccessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
      res.cookie('sunshine_refresh_token', newRefreshToken, { ...cookieOpts, maxAge: 90 * 24 * 60 * 60 * 1000 });

      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        token: newAccessToken
      });
    } catch (err: any) {
      console.error('[AuthController.refresh] Error:', err);
      return res.status(500).json({ error: 'Failed to refresh token.' });
    }
  }

  public static async me(
    req: AuthenticatedRequest,
    res: Response,
    getUsersFn: () => Promise<any[]>
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const userId = req.user.userId || req.user.id;
      const users = await getUsersFn();
      const user = users.find((u: any) => u.id === userId || u.username?.toLowerCase() === req.user?.username?.toLowerCase());

      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      if (user.active === false || user.status === 'DISABLED' || user.isLocked) {
        return res.status(401).json({ error: 'User account is inactive or locked.' });
      }

      const permissions = JWTService.getPermissionsForRole(user.role);

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          userId: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          permissions,
          active: user.active ?? true,
          mustChangePassword: !!(user.firstLogin || user.mustChangePassword || user.forcePasswordChange),
          firstLogin: !!(user.firstLogin || user.mustChangePassword || user.forcePasswordChange)
        }
      });
    } catch (err: any) {
      console.error('[AuthController.me] Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  }

  public static async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    getUsersFn: () => Promise<any[]>,
    saveUsersFn: (users: any[]) => Promise<void>
  ) {
    try {
      const { oldPassword, currentPassword, newPassword, confirmPassword } = req.body;
      const passToVerify = currentPassword || oldPassword;

      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirmation do not match.' });
      }

      const userId = req.user.userId || req.user.id;
      const users = await getUsersFn();
      const userIndex = users.findIndex((u: any) => u.id === userId || u.username?.toLowerCase() === req.user!.username?.toLowerCase());

      if (userIndex === -1) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      const user = users[userIndex];
      if (passToVerify) {
        const isOldValid = await PasswordService.comparePassword(passToVerify, user.passwordHash || user.password || '');
        if (!isOldValid) {
          return res.status(400).json({ error: 'Current password provided is incorrect.' });
        }
      }

      const newHash = await PasswordService.hashPassword(newPassword);
      users[userIndex] = {
        ...user,
        passwordHash: newHash,
        password: newHash,
        mustChangePassword: false,
        firstLogin: false,
        forcePasswordChange: false,
        updatedAt: new Date().toISOString()
      };

      await saveUsersFn(users);
      await AuditLogger.log('PASSWORD_CHANGE', user.username, 'Password updated successfully by user', 'SUCCESS', user.id);

      return res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (err: any) {
      console.error('[AuthController.changePassword] Error:', err);
      return res.status(500).json({ error: 'Failed to update password.' });
    }
  }

  public static async resetPassword(
    req: AuthenticatedRequest,
    res: Response,
    getUsersFn: () => Promise<any[]>,
    saveUsersFn: (users: any[]) => Promise<void>
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const { targetUserId, targetUsername, newPassword } = req.body;
      if (!targetUserId && !targetUsername) {
        return res.status(400).json({ error: 'Target user ID or username is required.' });
      }

      const users = await getUsersFn();
      const targetIndex = users.findIndex((u: any) => 
        (targetUserId && u.id === targetUserId) || 
        (targetUsername && u.username?.toLowerCase() === String(targetUsername).trim().toLowerCase())
      );

      if (targetIndex === -1) {
        return res.status(404).json({ error: 'Target user account not found.' });
      }

      const targetUser = users[targetIndex];
      const resetterRole = req.user.role;
      const targetRole = targetUser.role;

      // Enforce Hierarchy Rules
      const canReset = AuthService.canResetPassword(resetterRole, targetRole);
      if (!canReset) {
        await AuditLogger.log(
          'PASSWORD_RESET_DENIED',
          req.user.username || 'unknown',
          `Role ${resetterRole} denied reset password permission for target user ${targetUser.username} (${targetRole})`,
          'FAILURE',
          req.user.userId || req.user.id
        );
        return res.status(403).json({
          error: `Forbidden: ${resetterRole} is not permitted to reset passwords for ${targetRole} accounts.`
        });
      }

      const generatedPass = newPassword || PasswordService.generateTemporaryPassword(10);
      const newHash = await PasswordService.hashPassword(generatedPass);

      users[targetIndex] = {
        ...targetUser,
        passwordHash: newHash,
        password: newHash,
        mustChangePassword: true,
        firstLogin: true,
        forcePasswordChange: true,
        failedLoginAttempts: 0,
        isLocked: false,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      };

      await saveUsersFn(users);
      await AuditLogger.log(
        'PASSWORD_RESET',
        req.user.username || 'admin',
        `Reset password for ${targetUser.username} (${targetRole}). User forced to change password on first login.`,
        'SUCCESS',
        req.user.userId || req.user.id
      );

      return res.status(200).json({
        success: true,
        message: `Password reset successfully for ${targetUser.username}.`,
        tempPassword: generatedPass,
        mustChangePassword: true
      });
    } catch (err: any) {
      console.error('[AuthController.resetPassword] Error:', err);
      return res.status(500).json({ error: 'Failed to reset user password.' });
    }
  }

  public static async unlockAccount(
    req: AuthenticatedRequest,
    res: Response,
    getUsersFn: () => Promise<any[]>,
    saveUsersFn: (users: any[]) => Promise<void>
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const role = req.user.role?.toUpperCase();
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can unlock locked accounts.' });
      }

      const { targetUserId, targetUsername } = req.body;
      if (!targetUserId && !targetUsername) {
        return res.status(400).json({ error: 'Target user ID or username is required.' });
      }

      const users = await getUsersFn();
      const targetIndex = users.findIndex((u: any) => 
        (targetUserId && u.id === targetUserId) || 
        (targetUsername && u.username?.toLowerCase() === String(targetUsername).trim().toLowerCase())
      );

      if (targetIndex === -1) {
        return res.status(404).json({ error: 'Target user account not found.' });
      }

      const targetUser = users[targetIndex];
      users[targetIndex] = {
        ...targetUser,
        isLocked: false,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        updatedAt: new Date().toISOString()
      };

      await saveUsersFn(users);
      await AuditLogger.log(
        'UNLOCK_ACCOUNT',
        req.user.username || 'admin',
        `Unlocked account for ${targetUser.username} (${targetUser.role})`,
        'SUCCESS',
        req.user.userId || req.user.id
      );

      return res.status(200).json({
        success: true,
        message: `Account ${targetUser.username} has been unlocked successfully.`
      });
    } catch (err: any) {
      console.error('[AuthController.unlockAccount] Error:', err);
      return res.status(500).json({ error: 'Failed to unlock user account.' });
    }
  }
}

