import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Configuration from firebase-applet-config
const firebaseConfig = {
  projectId: "sunshine-classes-web",
  appId: "1:308447291099:web:574e371bb15c5e54404efe",
  apiKey: "AIzaSyCVg06N9JRbjbYyMlvrac-BKAd-d65hm-U",
  authDomain: "sunshine-classes-web.firebaseapp.com",
  storageBucket: "sunshine-classes-web.firebasestorage.app",
  messagingSenderId: "308447291099"
};

export const FirebaseAuthService = {
  /**
   * Configures Auth state persistence based on "Remember Me"
   */
  async setAuthPersistence(remember: boolean): Promise<void> {
    try {
      const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
    } catch (error) {
      console.warn("Failed to set authentication persistence:", error);
    }
  },

  /**
   * Logs in a user with Email and Password
   */
  async loginWithEmail(email: string, password: string, remember: boolean): Promise<FirebaseUser> {
    await this.setAuthPersistence(remember);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },

  /**
   * Google Sign-In helper (client-side)
   */
  async loginWithGoogle(remember: boolean): Promise<FirebaseUser> {
    await this.setAuthPersistence(remember);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },

  /**
   * Standard Firebase password reset
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Standard Firebase password update for current logged in user
   */
  async changePassword(newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user is currently active.");
    }
    await updatePassword(user, newPassword);
  },

  /**
   * Logs out the current session
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Provisions a brand new Firebase Auth account *without* logging out the current admin.
   * Leverages a secondary sandbox App instance.
   */
  async createAuthAccount(email: string, initialPassword: string): Promise<string> {
    const tempAppName = `temp-prov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    try {
      const tempAuth = getAuth(tempApp);
      const credential = await createUserWithEmailAndPassword(tempAuth, email, initialPassword);
      const uid = credential.user.uid;
      // Logout the created user on the sandbox app to clean up state
      await signOut(tempAuth);
      return uid;
    } catch (err: any) {
      console.error("Secondary Auth Provisioning Failed:", err);
      throw err;
    } finally {
      // Gracefully terminate the temp app instance
      await deleteApp(tempApp);
    }
  }
};
