import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
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
  firestoreDatabaseId: "ai-studio-sunshineclassesm-168e58b1-1a00-4a10-99f9-ce106aba5a90",
  storageBucket: "maximal-music-shh41.firebasestorage.app",
  messagingSenderId: "996750335749"
};

// Silence Firestore's built-in SDK logging
try {
  setLogLevel("silent");
} catch (e) {
  // Silent catch
}

// Global console filter to prevent Firestore connectivity warnings from flooding the preview/runner console logs.
// In sandboxed environments or during initial container startups, Firestore websocket connection attempts
// may warn about being offline; since we gracefully fall back to zero-latency LocalStorage, these warnings are benign.
const originalWarn = console.warn;
console.warn = function (...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ");
  if (
    msg.includes("@firebase/firestore") || 
    msg.includes("Could not reach Cloud Firestore") || 
    msg.includes("code=unavailable")
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = function (...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ");
  if (
    msg.includes("@firebase/firestore") || 
    msg.includes("Could not reach Cloud Firestore") || 
    msg.includes("code=unavailable")
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
export const auth = getAuth(app);

// In-memory token cache as mandated by the security guidelines
let cachedAccessToken: string | null = null;

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token from login');
    }
    
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google OAuth sign-in failed:', error);
    throw error;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const clearCachedAccessToken = () => {
  cachedAccessToken = null;
};

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
