import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  runTransaction,
  serverTimestamp,
  QueryConstraint,
  DocumentData
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface SyncOperationResult<T = any> {
  success: boolean;
  data?: T;
  verified: boolean;
  error?: string;
  timestamp: string;
}

export type SyncListener<T = any> = (collectionName: string, docId: string, data: T | null) => void;

class SyncServiceClass {
  private queue: Promise<any> = Promise.resolve();
  private listeners: Set<SyncListener> = new Set();
  private cache: Map<string, Map<string, any>> = new Map();

  /**
   * Serializes write/mutation execution via a task queue to prevent race conditions.
   */
  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const res = this.queue.then(() => task(), () => task());
    this.queue = res.catch(() => {});
    return res;
  }

  /**
   * Subscribe to data synchronization events across collections.
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(collectionName: string, docId: string, data: any): void {
    if (!this.cache.has(collectionName)) {
      this.cache.set(collectionName, new Map());
    }
    const colCache = this.cache.get(collectionName)!;
    if (data === null) {
      colCache.delete(docId);
    } else {
      colCache.set(docId, data);
    }

    this.listeners.forEach(fn => {
      try {
        fn(collectionName, docId, data);
      } catch (err) {
        console.error(`[SyncService] Subscriber notification error for ${collectionName}/${docId}:`, err);
      }
    });
  }

  /**
   * Fetches document from Firestore and updates local cache.
   */
  public async get<T = any>(collectionName: string, docId: string): Promise<T | null> {
    if (!docId) return null;
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      this.notifyListeners(collectionName, docId, null);
      return null;
    }
    const data = { id: snap.id, ...snap.data() } as T;
    this.notifyListeners(collectionName, docId, data);
    return data;
  }

  /**
   * Lists documents in a collection with optional query constraints.
   */
  public async list<T = any>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> {
    const colRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const snap = await getDocs(q);
    const items: T[] = [];
    snap.docs.forEach(d => {
      const item = { id: d.id, ...d.data() } as T;
      items.push(item);
      this.notifyListeners(collectionName, d.id, item);
    });
    return items;
  }

  /**
   * Writes/updates a document with enforced read-after-write verification.
   */
  public async set<T = any>(
    collectionName: string, 
    docId: string, 
    data: Record<string, any>, 
    options: { merge?: boolean } = { merge: true }
  ): Promise<SyncOperationResult<T>> {
    return this.enqueue(async () => {
      const docRef = doc(db, collectionName, docId);
      const payload = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, payload, options);

      // Read-After-Write Verification
      const verifiedSnap = await getDoc(docRef);
      if (!verifiedSnap.exists()) {
        throw new Error(`[SyncService] Read-After-Write verification failed for ${collectionName}/${docId}: Document not found after set.`);
      }

      const snapData = verifiedSnap.data() as Record<string, any>;
      const verifiedData = Object.assign({ id: verifiedSnap.id }, snapData) as T;
      this.notifyListeners(collectionName, docId, verifiedData);

      return {
        success: true,
        data: verifiedData,
        verified: true,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Updates fields in an existing document with enforced read-after-write verification.
   */
  public async update<T = any>(
    collectionName: string, 
    docId: string, 
    updates: Record<string, any>
  ): Promise<SyncOperationResult<T>> {
    return this.enqueue(async () => {
      const docRef = doc(db, collectionName, docId);
      const payload = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, payload);

      // Read-After-Write Verification
      const verifiedSnap = await getDoc(docRef);
      if (!verifiedSnap.exists()) {
        throw new Error(`[SyncService] Read-After-Write verification failed for ${collectionName}/${docId}: Document not found after update.`);
      }

      const snapData = verifiedSnap.data() as Record<string, any>;
      const verifiedData = Object.assign({ id: verifiedSnap.id }, snapData) as T;
      this.notifyListeners(collectionName, docId, verifiedData);

      return {
        success: true,
        data: verifiedData,
        verified: true,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Adds a new document with optional auto-generated or custom ID and enforces read-after-write verification.
   */
  public async add<T = any>(
    collectionName: string, 
    data: Record<string, any>, 
    customId?: string
  ): Promise<SyncOperationResult<T>> {
    return this.enqueue(async () => {
      let targetId = customId;
      let docRef;

      if (targetId) {
        docRef = doc(db, collectionName, targetId);
        await setDoc(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      } else {
        const colRef = collection(db, collectionName);
        docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        targetId = docRef.id;
      }

      // Read-After-Write Verification
      const verifiedSnap = await getDoc(docRef);
      if (!verifiedSnap.exists()) {
        throw new Error(`[SyncService] Read-After-Write verification failed for ${collectionName}/${targetId}: Document not found after add.`);
      }

      const snapData = verifiedSnap.data() as Record<string, any>;
      const verifiedData = Object.assign({ id: verifiedSnap.id }, snapData) as T;
      this.notifyListeners(collectionName, targetId, verifiedData);

      return {
        success: true,
        data: verifiedData,
        verified: true,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Deletes a document with read-after-write verification ensuring removal.
   */
  public async delete(
    collectionName: string, 
    docId: string
  ): Promise<SyncOperationResult<void>> {
    return this.enqueue(async () => {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);

      // Read-After-Write Verification: ensure document no longer exists
      const verifiedSnap = await getDoc(docRef);
      if (verifiedSnap.exists()) {
        throw new Error(`[SyncService] Read-After-Write verification failed for ${collectionName}/${docId}: Document still exists after deletion.`);
      }

      this.notifyListeners(collectionName, docId, null);

      return {
        success: true,
        verified: true,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Enqueues and executes a standardized transaction block ensuring order and verification.
   */
  public async runTransactionBlock<T>(
    transactionFn: (transaction: any) => Promise<T>
  ): Promise<T> {
    return this.enqueue(async () => {
      return await runTransaction(db, transactionFn);
    });
  }

  /**
   * Retrieves current cached document if present.
   */
  public getCached<T = any>(collectionName: string, docId: string): T | null {
    return this.cache.get(collectionName)?.get(docId) || null;
  }
}

export const SyncService = new SyncServiceClass();
