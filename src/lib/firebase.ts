import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
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
  projectId: "maximal-music-shh41",
  appId: "1:996750335749:web:fead7d5fdea73b78cfe16c",
  apiKey: "AIzaSyCPZA9lz7YSQ4kkqD6JxDyyxAaQrO3kqyo",
  authDomain: "maximal-music-shh41.firebaseapp.com",
  storageBucket: "maximal-music-shh41.firebasestorage.app",
  messagingSenderId: "996750335749"
};

// Silence Firestore's built-in SDK logging
try {
  setLogLevel("silent");
} catch (e) {
  // Silent catch
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://mail.google.com/");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.send");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.compose");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.modify");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.labels");

// In-memory token storage (Security requirement: never put access token in localStorage)
let cachedAccessToken: string | null = null;

export const getCachedAccessToken = (): string | null => cachedAccessToken;
export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export function clearCachedAccessToken(): void {
  cachedAccessToken = null;
}

export async function googleSignInForGmail(): Promise<{ user: User; accessToken: string }> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error("Failed to acquire access token from Google sign-in.");
  }
  cachedAccessToken = credential.accessToken;
  return { user: result.user, accessToken: credential.accessToken };
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
  return googleSignInForGmail();
}
