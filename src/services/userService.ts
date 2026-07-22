import { usersService } from './firestoreDbService';
import { User } from '../types';

/**
 * Unified User Service - Delegates to firestoreDbService as single repository source
 */
export const userService = {
  async fetchUser(uid: string): Promise<any | null> {
    return await usersService.fetchUser(uid);
  },

  async fetchAllUsers(): Promise<any[]> {
    return await usersService.fetchAll();
  },

  async createUser(uid: string, userData: any): Promise<void> {
    await usersService.create(uid, userData);
  },

  async updateUser(uid: string, updates: Partial<User & { active?: boolean; firstLogin?: boolean; updatedAt?: string }>): Promise<void> {
    await usersService.update(uid, updates);
  },

  async deactivateUser(uid: string, currentOperatorUid: string): Promise<void> {
    if (uid === currentOperatorUid) {
      throw new Error("You cannot deactivate your own administrative account.");
    }
    const user = await this.fetchUser(uid);
    if (user && (user.role === 'super_admin' || user.role === 'SUPER_ADMIN')) {
      throw new Error("The Owner (Super Admin) account cannot be deactivated.");
    }
    await usersService.update(uid, { active: false });
  },

  async activateUser(uid: string): Promise<void> {
    await usersService.update(uid, { active: true });
  },

  async deleteUser(uid: string, currentOperatorUid: string): Promise<void> {
    if (uid === currentOperatorUid) {
      throw new Error("You cannot delete your own active administrative account.");
    }
    const user = await this.fetchUser(uid);
    if (user && (user.role === 'super_admin' || user.role === 'SUPER_ADMIN')) {
      throw new Error("The Owner (Super Admin) account is protected and cannot be deleted.");
    }
    await usersService.delete(uid);
  }
};
