import { doc, setDoc } from './db';

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
  device?: string;
}

export class AuditService {
  /**
   * Logs an audit record directly to the audit_logs collection.
   */
  public static async log(
    db: any,
    userId: string,
    username: string,
    action: string,
    details: string,
    ip?: string,
    device?: string
  ): Promise<AuditLogEntry> {
    const logId = `L-STU-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const logDoc: AuditLogEntry = {
      id: logId,
      userId: userId || 'system',
      username: username || 'System',
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: ip || 'unknown',
      device: device || 'unknown'
    };
    try {
      console.log(`[AuditService] Logging audit: ${action} - ${details} [IP: ${logDoc.ip}, Device: ${logDoc.device}]`);
      await setDoc(doc(db, 'audit_logs', logId), logDoc);
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err);
    }
    return logDoc;
  }

  /**
   * Logs an audit record inside an active Firestore Transaction.
   */
  public static logInTransaction(
    transaction: any,
    db: any,
    userId: string,
    username: string,
    action: string,
    details: string,
    ip?: string,
    device?: string
  ): string {
    const logId = `L-STU-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const logRef = doc(db, 'audit_logs', logId);
    const logDoc = {
      id: logId,
      userId: userId || 'system',
      username: username || 'System',
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: ip || 'unknown',
      device: device || 'unknown'
    };
    console.log(`[AuditService] Recording transaction-bound audit: ${action} [IP: ${logDoc.ip}, Device: ${logDoc.device}]`);
    transaction.set(logRef, logDoc);
    return logId;
  }
}
