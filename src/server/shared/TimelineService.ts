import { doc, setDoc } from './db';

export interface TimelineEntry {
  id: string;
  studentId: string;
  eventType: string;
  title: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  createdAt: string;
}

export class TimelineService {
  /**
   * Records a timeline event directly to the student_timelines collection.
   */
  public static async record(
    db: any,
    studentId: string,
    eventType: string,
    title: string,
    description: string,
    performedBy: string,
    performedByRole: string
  ): Promise<TimelineEntry> {
    const entryId = `TL-${studentId}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const entryDoc: TimelineEntry = {
      id: entryId,
      studentId,
      eventType,
      title,
      description,
      performedBy: performedBy || 'System',
      performedByRole: performedByRole || 'ADMIN',
      createdAt: new Date().toISOString()
    };
    try {
      console.log(`[TimelineService] Recording timeline: ${eventType} - ${title} on Student ${studentId}`);
      await setDoc(doc(db, 'student_timelines', entryId), entryDoc);
    } catch (err) {
      console.error('[TimelineService] Failed to write timeline:', err);
    }
    return entryDoc;
  }

  /**
   * Records a timeline event inside an active Firestore Transaction.
   */
  public static recordInTransaction(
    transaction: any,
    db: any,
    studentId: string,
    eventType: string,
    title: string,
    description: string,
    performedBy: string,
    performedByRole: string
  ): string {
    const entryId = `TL-${studentId}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const entryRef = doc(db, 'student_timelines', entryId);
    const entryDoc = {
      id: entryId,
      studentId,
      eventType,
      title,
      description,
      performedBy: performedBy || 'System',
      performedByRole: performedByRole || 'ADMIN',
      createdAt: new Date().toISOString()
    };
    console.log(`[TimelineService] Recording transaction-bound timeline event: ${eventType}`);
    transaction.set(entryRef, entryDoc);
    return entryId;
  }
}
