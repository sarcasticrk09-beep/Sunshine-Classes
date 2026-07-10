import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, UserRole } from '../types';

export const userService = {
  /**
   * Reads a user document from Firestore by Firebase UID
   */
  async fetchUser(uid: string): Promise<any | null> {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  /**
   * Retrieves all user profiles registered in Firestore
   */
  async fetchAllUsers(): Promise<any[]> {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Provisions or saves a new user profile document in Firestore
   */
  async createUser(uid: string, userData: {
    username: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    active: boolean;
    firstLogin?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
      firstLogin: userData.firstLogin ?? true
    });
  },

  /**
   * Updates an existing user document
   */
  async updateUser(uid: string, updates: Partial<User & { active?: boolean; firstLogin?: boolean; updatedAt?: string }>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Deactivates a user account (sets active = false)
   * Note: Owner (role === 'SUPER_ADMIN') cannot deactivate themselves!
   */
  async deactivateUser(uid: string, currentOperatorUid: string): Promise<void> {
    if (uid === currentOperatorUid) {
      throw new Error("You cannot deactivate your own administrative account.");
    }
    const user = await this.fetchUser(uid);
    if (user && (user.role === 'super_admin' || user.role === 'SUPER_ADMIN')) {
      throw new Error("The Owner (Super Admin) account cannot be deactivated.");
    }
    await this.updateUser(uid, { active: false });
  },

  /**
   * Activates a user account (sets active = true)
   */
  async activateUser(uid: string): Promise<void> {
    await this.updateUser(uid, { active: true });
  },

  /**
   * Deletes a user profile document from Firestore
   * Note: Owner (role === 'SUPER_ADMIN') cannot be deleted!
   */
  async deleteUser(uid: string, currentOperatorUid: string): Promise<void> {
    if (uid === currentOperatorUid) {
      throw new Error("You cannot delete your own active administrative account.");
    }
    const user = await this.fetchUser(uid);
    if (user && (user.role === 'super_admin' || user.role === 'SUPER_ADMIN')) {
      throw new Error("The Owner (Super Admin) account is protected and cannot be deleted.");
    }
    const docRef = doc(db, 'users', uid);
    await deleteDoc(docRef);
  }
};
