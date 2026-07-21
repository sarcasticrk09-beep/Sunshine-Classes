import { Request, Response } from 'express';
import { AuthService } from './AuthService';
import { PasswordService } from './PasswordService';
import { AuditLogger } from './AuditLogger';
import { AuthenticatedRequest } from './AuthMiddleware';

export class AuthController {
  public static async login(req: Request, res: Response, getUsersFn: () => Promise<any[]>) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const users = await getUsersFn();
      const targetUser = users.find((u: any) => u.username?.toLowerCase() === cleanUsername);

      const result = await AuthService.authenticateUser(targetUser, String(password));
      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      return res.status(200).json({
        success: true,
        token: result.token,
        mustChangePassword: result.mustChangePassword,
        user: result.user
      });
    } catch (err: any) {
      console.error('[AuthController.login] Error:', err);
      return res.status(500).json({ error: 'Authentication internal server error.' });
    }
  }

  public static async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    getUsersFn: () => Promise<any[]>,
    saveUsersFn: (users: any[]) => Promise<void>
  ) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      const users = await getUsersFn();
      const userIndex = users.findIndex((u: any) => u.id === req.user!.id || u.username?.toLowerCase() === req.user!.username?.toLowerCase());

      if (userIndex === -1) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      const user = users[userIndex];
      if (oldPassword) {
        const isOldValid = await PasswordService.comparePassword(oldPassword, user.passwordHash || user.password || '');
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
        forcePasswordChange: false,
        updatedAt: new Date().toISOString()
      };

      await saveUsersFn(users);
      AuditLogger.log('PASSWORD_CHANGE', user.username, 'Password updated successfully');

      return res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (err: any) {
      console.error('[AuthController.changePassword] Error:', err);
      return res.status(500).json({ error: 'Failed to update password.' });
    }
  }
}
