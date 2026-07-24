import { getFirestore } from 'firebase-admin/firestore';

let adminDbInstance: any = null;

export function getAdminDb() {
  if (!adminDbInstance) {
    const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID;
    const finalDbId = (databaseId === '(default)' || databaseId === 'default' || !databaseId) ? undefined : databaseId;
    adminDbInstance = finalDbId ? getFirestore(finalDbId) : getFirestore();
  }
  return adminDbInstance;
}

export class AdminDocRefAdapter {
  constructor(public rawRef: any) {}
  get id() { return this.rawRef.id; }
  get path() { return this.rawRef.path; }
}

export class AdminDocSnapAdapter {
  constructor(public existsVal: boolean, public dataVal: any) {}
  exists() { return this.existsVal; }
  data() { return this.dataVal; }
}

export function doc(dbAny: any, collectionName: string, documentId: string): any {
  const db = getAdminDb();
  const rawRef = db.collection(collectionName).doc(documentId);
  return new AdminDocRefAdapter(rawRef);
}

export function collection(dbAny: any, collectionName: string): any {
  const db = getAdminDb();
  return db.collection(collectionName);
}

export async function getDoc(docRef: any): Promise<any> {
  const rawRef = (docRef as AdminDocRefAdapter).rawRef;
  const snap = await rawRef.get();
  return new AdminDocSnapAdapter(snap.exists, snap.data());
}

export async function getDocs(colRefAny: any): Promise<any> {
  const rawRef = colRefAny.rawRef || colRefAny;
  const snap: any = await rawRef.get();
  return {
    empty: snap.empty,
    docs: snap.docs.map((d: any) => ({
      id: d.id,
      data: () => d.data(),
      exists: () => d.exists
    }))
  };
}

export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }): Promise<void> {
  const rawRef = (docRef as AdminDocRefAdapter).rawRef;
  if (options && options.merge !== undefined) {
    await rawRef.set(data, { merge: options.merge });
  } else {
    await rawRef.set(data);
  }
}

export async function deleteDoc(docRef: any): Promise<void> {
  const rawRef = (docRef as AdminDocRefAdapter).rawRef;
  await rawRef.delete();
}

export async function runTransaction(dbAny: any, updateFunction: (transaction: any) => Promise<any>): Promise<any> {
  const db = getAdminDb();
  return await db.runTransaction(async (adminTx) => {
    const txAdapter = {
      async get(docRef: any) {
        const rawRef = (docRef as AdminDocRefAdapter).rawRef;
        const snap: any = await adminTx.get(rawRef);
        return new AdminDocSnapAdapter(snap.exists, snap.data());
      },
      set(docRef: any, data: any, options?: { merge?: boolean }) {
        const rawRef = (docRef as AdminDocRefAdapter).rawRef;
        if (options && options.merge !== undefined) {
          adminTx.set(rawRef, data, { merge: options.merge });
        } else {
          adminTx.set(rawRef, data);
        }
        return txAdapter;
      },
      update(docRef: any, data: any) {
        const rawRef = (docRef as AdminDocRefAdapter).rawRef;
        adminTx.update(rawRef, data);
        return txAdapter;
      },
      delete(docRef: any) {
        const rawRef = (docRef as AdminDocRefAdapter).rawRef;
        adminTx.delete(rawRef);
        return txAdapter;
      }
    };
    return await updateFunction(txAdapter);
  });
}
