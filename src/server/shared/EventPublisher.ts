import { doc, setDoc } from './db';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  payload: any;
  status: 'PUBLISHED' | 'FAILED';
  createdAt: string;
}

export class EventPublisher {
  /**
   * Publishes a domain event directly to the domain_events collection.
   */
  public static async publish(db: any, eventType: string, payload: any): Promise<DomainEvent> {
    const eventId = `ev-${eventType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventDoc: DomainEvent = {
      eventId,
      eventType,
      payload,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString()
    };
    try {
      console.log(`[EventPublisher] Publishing event: ${eventType}`, JSON.stringify(payload));
      await setDoc(doc(db, 'domain_events', eventId), eventDoc);
    } catch (err) {
      console.error(`[EventPublisher] Failed to publish event ${eventType}:`, err);
      eventDoc.status = 'FAILED';
    }
    return eventDoc;
  }

  /**
   * Publishes a domain event inside an active Firestore Transaction.
   */
  public static publishInTransaction(transaction: any, db: any, eventType: string, payload: any): string {
    const eventId = `ev-${eventType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventRef = doc(db, 'domain_events', eventId);
    const eventDoc = {
      eventId,
      eventType,
      payload,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString()
    };
    console.log(`[EventPublisher] Recording transaction-bound event: ${eventType}`, JSON.stringify(payload));
    transaction.set(eventRef, eventDoc);
    return eventId;
  }
}
