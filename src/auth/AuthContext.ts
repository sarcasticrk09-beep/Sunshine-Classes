import { createContext } from 'react';
import { User, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  googleLoading: boolean;
  role: UserRole | null;
  login: (emailOrUsername: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
