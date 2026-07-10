import React from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '../types';
import { Unauthorized } from '../pages/Unauthorized';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallback }) => {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verifying Clearance...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !role || !allowedRoles.includes(role)) {
    return (fallback as React.ReactElement) || <Unauthorized />;
  }

  return <>{children}</>;
};
