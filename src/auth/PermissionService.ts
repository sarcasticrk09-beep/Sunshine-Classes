import { UserRole } from '../types';

export const PermissionService = {
  /**
   * Returns the dashboard identifier name matching the UserRole
   */
  getDashboardForRole(role: UserRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'owner';
      case 'ADMIN': return 'admin';
      case 'RECEPTIONIST': return 'reception';
      case 'TEACHER': return 'teacher';
      case 'STUDENT': return 'student';
      default: return 'unauthorized';
    }
  },

  /**
   * Verifies if a given role is allowed to access a specific route or layout view
   */
  canAccess(userRole: UserRole, targetRoute: string): boolean {
    const role = userRole.toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return true; // Admin and Super Admin have absolute unrestricted clearance
    }
    
    const cleanRoute = targetRoute.toLowerCase().replace(/^\//, '');

    if (cleanRoute === 'owner' || cleanRoute === 'super_admin') {
      return role === 'SUPER_ADMIN' || role === 'ADMIN';
    }
    if (cleanRoute === 'admin') {
      return role === 'ADMIN' || role === 'SUPER_ADMIN';
    }
    if (cleanRoute === 'reception' || cleanRoute === 'receptionist') {
      return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'RECEPTIONIST';
    }
    if (cleanRoute === 'teacher') {
      return role === 'TEACHER';
    }
    if (cleanRoute === 'student') {
      return role === 'STUDENT';
    }

    return false;
  }
};
