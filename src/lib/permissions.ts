/**
 * Centralized Permission System for Sunshine ERP
 */

export type PermissionKey =
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'fees.collect'
  | 'fees.edit'
  | 'fees.refund'
  | 'attendance.mark'
  | 'reports.view'
  | 'reports.class.view'
  | 'reports.own.view'
  | 'settings.manage'
  | 'users.manage';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'RECEPTIONIST' | 'TEACHER' | 'STUDENT';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: [
    'students.create',
    'students.edit',
    'students.delete',
    'teachers.create',
    'teachers.edit',
    'teachers.delete',
    'fees.collect',
    'fees.edit',
    'fees.refund',
    'attendance.mark',
    'reports.view',
    'reports.class.view',
    'reports.own.view',
    'settings.manage',
    'users.manage'
  ],
  ADMIN: [
    'students.create',
    'students.edit',
    'students.delete',
    'teachers.create',
    'teachers.edit',
    'fees.collect',
    'fees.edit',
    'fees.refund',
    'attendance.mark',
    'reports.view',
    'reports.class.view',
    'reports.own.view',
    'settings.manage'
  ],
  RECEPTIONIST: [
    'students.create',
    'students.edit',
    'fees.collect',
    'attendance.mark',
    'reports.view',
    'reports.class.view',
    'reports.own.view'
  ],
  TEACHER: [
    'attendance.mark',
    'reports.class.view',
    'reports.own.view'
  ],
  STUDENT: [
    'reports.own.view'
  ]
};

/**
 * Validates whether a given user role possesses the required permission.
 */
export function hasPermission(role: UserRole | string | null | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  const normalizedRole = (role.toUpperCase().trim() === 'FOUNDER' || role.toUpperCase().trim() === 'CO_FOUNDER') 
    ? 'SUPER_ADMIN' 
    : (role.toUpperCase().trim() as UserRole);

  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;

  return permissions.includes(permission);
}
