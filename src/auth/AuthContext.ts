import { createContext } from 'react';
import { User, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  googleLoading: boolean;
  role: UserRole | null;
  login: (email: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
