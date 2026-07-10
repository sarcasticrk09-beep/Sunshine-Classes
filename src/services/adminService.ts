import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog, SubscriptionConfig } from '../types';

export const adminService = {
  /**
   * Reads all central ERP security and event audit logs
   */
  async fetchAuditLogs(): Promise<AuditLog[]> {
    const docRef = doc(db, 'sunshine_erp_state', 'audit_logs');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data || [] : [];
  },

  /**
   * Appends an audit log entry in a thread-safe synchronized manner
   */
  async addAuditLog(userId: string, username: string, action: string, details: string): Promise<void> {
    try {
      const docRef = doc(db, 'sunshine_erp_state', 'audit_logs');
      const snap = await getDoc(docRef);
      const existingLogs: AuditLog[] = snap.exists() ? snap.data().data || [] : [];
      
      const newLog: AuditLog = {
        id: `AUD-SYS-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        username,
        action,
        details,
        timestamp: new Date().toISOString()
      };

      const updated = [newLog, ...existingLogs].slice(0, 100);
      await setDoc(docRef, { data: updated }, { merge: false });
    } catch (e) {
      console.warn("Failed to write admin service audit log:", e);
    }
  },

  /**
   * Reads central subscription and WhatsApp configuration parameters
   */
  async fetchSubscriptionConfig(): Promise<SubscriptionConfig | null> {
    const docRef = doc(db, 'sunshine_erp_state', 'subscription_config');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data || null : null;
  },

  /**
   * Updates central configuration parameters
   */
  async updateSubscriptionConfig(config: SubscriptionConfig): Promise<void> {
    const docRef = doc(db, 'sunshine_erp_state', 'subscription_config');
    await setDoc(docRef, { data: config }, { merge: false });
  }
};
