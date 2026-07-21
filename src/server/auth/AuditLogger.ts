export class AuditLogger {
  public static log(action: string, username: string, details: string, status: 'SUCCESS' | 'FAILURE' = 'SUCCESS') {
    const timestamp = new Date().toISOString();
    console.log(`[ERP AUDIT LOG] [${timestamp}] [${status}] User: ${username} | Action: ${action} | Details: ${details}`);
  }
}
