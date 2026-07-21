import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog, SubscriptionConfig } from '../types';

export const adminService = {
  /**
   * Reads all central ERP security and event audit logs from 'audit_logs' collection
   */
  async fetchAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    const colRef = collection(db, 'audit_logs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  },

  /**
   * Appends an individual audit log document in the 'audit_logs' collection
   */
  async addAuditLog(userId: string, username: string, action: string, details: string): Promise<void> {
    try {
      const logId = `AUD-SYS-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newLog: AuditLog = {
        id: logId,
        userId: userId || 'SYSTEM',
        username: username || 'system',
        action,
        details,
        timestamp: new Date().toISOString()
      };
      const docRef = doc(db, 'audit_logs', logId);
      await setDoc(docRef, newLog, { merge: true });
    } catch (e) {
      console.warn("Failed to write admin service audit log:", e);
    }
  },

  /**
   * Reads central subscription and config parameters from 'settings/subscription_config'
   */
  async fetchSubscriptionConfig(): Promise<SubscriptionConfig | null> {
    const docRef = doc(db, 'settings', 'subscription_config');
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as SubscriptionConfig) : null;
  },

  /**
   * Updates central configuration parameters document
   */
  async updateSubscriptionConfig(config: SubscriptionConfig): Promise<void> {
    const docRef = doc(db, 'settings', 'subscription_config');
    await setDoc(docRef, config, { merge: true });
  }
};
