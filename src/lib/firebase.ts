import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch,
  addDoc,
  setLogLevel
} from "firebase/firestore";

// Config parsed from firebase-applet-config.json
const firebaseConfig = {
  projectId: "sunshine-classes-web",
  appId: "1:308447291099:web:574e371bb15c5e54404efe",
  apiKey: "AIzaSyCVg06N9JRbjbYyMlvrac-BKAd-d65hm-U",
  authDomain: "sunshine-classes-web.firebaseapp.com",
  storageBucket: "sunshine-classes-web.firebasestorage.app",
  messagingSenderId: "308447291099"
};

// Silence Firestore's built-in SDK logging
try {
  setLogLevel("silent");
} catch (e) {
  // Silent catch
}

// Global console filter to prevent Firestore connectivity warnings and stream cancellations from flooding logs.
const formatArg = (arg: any): string => {
  if (arg === null || arg === undefined) return "";
  if (arg instanceof Error) {
    return `${arg.name || "Error"}: ${arg.message || ""} ${arg.stack || ""} ${String(arg)}`;
  }
  if (typeof arg === "object") {
    try {
      const base = JSON.stringify(arg);
      const msg = arg.message || "";
      const code = arg.code || "";
      const name = arg.name || "";
      return `${base} ${msg} ${code} ${name} ${String(arg)}`;
    } catch {
      return String(arg);
    }
  }
  return String(arg);
};

const shouldIgnore = (args: any[]): boolean => {
  const msg = args.map(formatArg).join(" ");
  return (
    msg.includes("@firebase/firestore") ||
    msg.includes("Could not reach Cloud Firestore") ||
    msg.includes("code=unavailable") ||
    msg.includes("Disconnecting idle stream") ||
    msg.includes("Timed out waiting for new targets") ||
    msg.includes("CANCELLED") ||
    msg.includes("GrpcConnection RPC")
  );
};

const originalWarn = console.warn;
console.warn = function (...args) {
  if (shouldIgnore(args)) return;
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = function (...args) {
  if (shouldIgnore(args)) return;
  originalError.apply(console, args);
};

const originalLog = console.log;
console.log = function (...args) {
  if (shouldIgnore(args)) return;
  originalLog.apply(console, args);
};

const originalInfo = console.info;
console.info = function (...args) {
  if (shouldIgnore(args)) return;
  originalInfo.apply(console, args);
};

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason && shouldIgnore([reason])) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const error = event.error || event.message;
    if (error && shouldIgnore([error])) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

/**
 * Generic helper to fetch all items in a Firestore collection.
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as T);
    });
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Generic helper to save or update an item in a Firestore collection by ID.
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    // Remove the id field from document body to prevent duplication if desired, or keep it.
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error saving document in ${collectionName} with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Generic helper to add a new document and let Firestore auto-generate an ID.
 */
export async function addDocument(collectionName: string, data: any): Promise<string> {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Seeds Firestore with default local SEED data if collections are currently empty.
 */
export async function seedFirestoreIfEmpty(
  collectionName: string, 
  seedData: any[]
): Promise<boolean> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty && seedData.length > 0) {
      console.log(`Seeding Firestore collection: ${collectionName} with ${seedData.length} records...`);
      const batch = writeBatch(db);
      
      seedData.forEach((item) => {
        // Ensure every seed item has a unique, reliable ID
        const id = item.id || `seed-${Math.random().toString(36).substr(2, 9)}`;
        const docRef = doc(db, collectionName, id);
        batch.set(docRef, item);
      });
      
      await batch.commit();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error seeding collection ${collectionName}:`, error);
    return false;
  }
}

export async function googleSignIn(): Promise<any> {
  throw new Error("Google Sign-In is disabled. Please use Username & Password authentication.");
}

export function getCachedAccessToken(): string | null {
  return null;
}

export function clearCachedAccessToken(): void {
  // no-op
}
