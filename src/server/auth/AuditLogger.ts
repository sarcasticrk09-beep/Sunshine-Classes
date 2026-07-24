export class AuditLogger {
  private static saveToFirestoreFn?: (logItem: any) => Promise<void>;

  public static setFirestoreLogger(fn: (logItem: any) => Promise<void>) {
    this.saveToFirestoreFn = fn;
  }

  public static async log(
    action: string,
    username: string,
    details: string,
    status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
    userId?: string
  ) {
    const timestamp = new Date().toISOString();
    console.log(`[ERP AUDIT LOG] [${timestamp}] [${status}] User: ${username} | Action: ${action} | Details: ${details}`);

    if (this.saveToFirestoreFn) {
      try {
        await this.saveToFirestoreFn({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: userId || username || 'SYSTEM',
          username: username || 'system',
          action,
          details: `[${status}] ${details}`,
          status,
          timestamp
        });
      } catch (err: any) {
        console.warn('[AuditLogger] Failed to persist audit log to Firestore:', err?.message);
      }
    }
  }
}

