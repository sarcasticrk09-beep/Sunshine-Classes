import { runTransaction } from './db';

export class TransactionManager {
  /**
   * Safely runs a Firestore transaction, tracking performance metrics and implementing robust logging.
   */
  public static async run<T>(
    db: any,
    operationName: string,
    operation: (transaction: any) => Promise<T>,
    logger: any = console
  ): Promise<T> {
    const startTime = Date.now();
    logger.log(`[TransactionManager] [START] Transaction execution for "${operationName}"`);
    try {
      const result = await runTransaction(db, async (transaction) => {
        return await operation(transaction);
      });
      const duration = Date.now() - startTime;
      logger.log(`[TransactionManager] [SUCCESS] Transaction "${operationName}" completed in ${duration}ms`);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errMsg = error.message || String(error);
      const isDomainAbort = ['NOT_FOUND', 'CANNOT_UPDATE_DELETED', 'CONCURRENCY_CONFLICT'].includes(errMsg) || errMsg.startsWith('READ_ONLY_MODIFICATION:');
      
      if (isDomainAbort) {
        logger.warn(`[TransactionManager] [ABORTED] Transaction "${operationName}" intentionally aborted after ${duration}ms: ${errMsg}`);
      } else {
        logger.error(`[TransactionManager] [FAILED] Transaction "${operationName}" aborted after ${duration}ms. Error: ${errMsg}`);
      }
      throw error;
    }
  }
}
