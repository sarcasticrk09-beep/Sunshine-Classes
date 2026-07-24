import { createContext } from 'react';
import { User, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  googleLoading: boolean;
  role: UserRole | null;
  login: (emailOrUsername: string, password: string, remember: boolean) => Promise<{ success: boolean; mustChangePassword?: boolean }>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<void>;
  resetUserPassword?: (targetUserId: string, targetUsername?: string, newPassword?: string) => Promise<{ success: boolean; tempPassword?: string }>;
  unlockUserAccount?: (targetUserId: string, targetUsername?: string) => Promise<void>;
  token?: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

