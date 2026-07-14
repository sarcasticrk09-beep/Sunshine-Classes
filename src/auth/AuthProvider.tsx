import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthContext } from './AuthContext';
import { User, UserRole, AuditLog } from '../types';
import { SEED_USERS, SEED_STUDENTS, SEED_TEACHERS } from '../data';

// Simple helper to hash passwords matching existing database standards
function simpleSecureHash(password: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return 'sha256_mock_' + (hash >>> 0).toString(16).padStart(8, '0');
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  // Load active session from sessionStorage or localStorage on startup
  useEffect(() => {
    const loadSession = () => {
      try {
        const tempSession = sessionStorage.getItem('sunshine_active_session');
        const permSession = localStorage.getItem('sunshine_active_session');
        const sessionStr = tempSession || permSession;

        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session && session.user && session.role) {
            setCurrentUser(session.user);
            setRole(session.role);
          }
        }
      } catch (err) {
        console.error("Failed to parse stored authentication session:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Safe fetch helper for ERP data from Firestore or local cache
  const getERPData = async <T,>(key: string, seed: T[]): Promise<T[]> => {
    try {
      const docRef = doc(db, 'sunshine_erp_state', key);
      const snap = await Promise.race([
        getDoc(docRef),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
      ]);
      if (snap.exists()) {
        const list = snap.data()?.data;
        if (Array.isArray(list)) {
          return list as T[];
        }
      }
    } catch (err) {
      console.warn(`Firestore lookup for ${key} failed, falling back to local storage or seeds:`, err);
    }

    // Local Storage fallback
    try {
      const cached = localStorage.getItem(`sunshine_${key}`);
      if (cached) {
        return JSON.parse(cached) as T[];
      }
    } catch (err) {
      console.error(`Failed to parse cache for ${key}:`, err);
    }

    return seed;
  };

  // Sync state back to Firestore and Local Storage helper
  const syncERPData = async <T,>(key: string, data: T[]): Promise<void> => {
    try {
      // Update local storage cache immediately
      localStorage.setItem(`sunshine_${key}`, JSON.stringify(data));

      // Attempt to save to cloud firestore
      const docRef = doc(db, 'sunshine_erp_state', key);
      await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn(`Failed to sync ERP state for ${key} to cloud database:`, err);
    }
  };

  // Log user activity
  const writeAuditLog = async (userId: string, username: string, action: string, details: string) => {
    try {
      const logs = await getERPData<AuditLog>('audit_logs', []);
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        username,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      const updated = [newLog, ...logs].slice(0, 500); // Caps logs at 500
      await syncERPData('audit_logs', updated);
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  };

  /**
   * Username / Password Login (For Teachers and Students)
   */
  const login = async (emailOrUsername: string, password: string, remember: boolean): Promise<boolean> => {
    const trimmedInput = emailOrUsername.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedInput || !trimmedPassword) {
      throw new Error("Username and password are required.");
    }

    // Fetch latest lists of users, students, and teachers
    const [usersList, studentsList, teachersList] = await Promise.all([
      getERPData<any>('users', SEED_USERS),
      getERPData<any>('students', SEED_STUDENTS),
      getERPData<any>('teachers', SEED_TEACHERS)
    ]);

    let matchedUser: any = null;
    let userRole: UserRole | null = null;

    // 1. Check in core users table
    matchedUser = usersList.find((u: any) => 
      u.username?.toLowerCase() === trimmedInput || 
      u.email?.toLowerCase() === trimmedInput
    );

    if (matchedUser) {
      userRole = matchedUser.role as UserRole;
    }

    // 2. If not found, check teachers table (Fallback login)
    if (!matchedUser) {
      const matchedTeacher = teachersList.find((t: any) => {
        const baseName = t.name?.toLowerCase().replace(/\s+/g, '') || '';
        const phoneSuffix = t.phone ? t.phone.replace(/\D/g, '').slice(-4) : '';
        const generatedUsernameWithPhone = baseName + phoneSuffix;
        return t.email?.toLowerCase() === trimmedInput || 
               baseName === trimmedInput || 
               generatedUsernameWithPhone === trimmedInput;
      });

      if (matchedTeacher) {
        userRole = 'TEACHER';
        // Compute the expected student username to check fallback password matching
        const baseName = matchedTeacher.name.toLowerCase().replace(/\s+/g, '');
        const phoneSuffix = matchedTeacher.phone ? matchedTeacher.phone.replace(/\D/g, '').slice(-4) : '';
        matchedUser = {
          id: matchedTeacher.userId || `t-user-${matchedTeacher.id}`,
          username: baseName + phoneSuffix,
          name: matchedTeacher.name,
          email: matchedTeacher.email,
          role: 'TEACHER',
          phone: matchedTeacher.phone,
          active: true
        };
      }
    }

    // 3. If not found, check students table (Fallback login)
    if (!matchedUser) {
      const matchedStudent = studentsList.find((s: any) => {
        const baseName = s.name?.toLowerCase().replace(/\s+/g, '') || '';
        const phoneSuffix = s.mobile ? s.mobile.replace(/\D/g, '').slice(-4) : '';
        const generatedUsernameWithPhone = baseName + phoneSuffix;
        return s.email?.toLowerCase() === trimmedInput || 
               baseName === trimmedInput || 
               generatedUsernameWithPhone === trimmedInput;
      });

      if (matchedStudent) {
        userRole = 'STUDENT';
        const baseName = matchedStudent.name.toLowerCase().replace(/\s+/g, '');
        const phoneSuffix = matchedStudent.mobile ? matchedStudent.mobile.replace(/\D/g, '').slice(-4) : '';
        matchedUser = {
          id: matchedStudent.userId || `s-user-${matchedStudent.id}`,
          username: baseName + phoneSuffix,
          name: matchedStudent.name,
          email: matchedStudent.email,
          role: 'STUDENT',
          phone: matchedStudent.mobile,
          active: true
        };
      }
    }

    if (!matchedUser) {
      throw new Error("Invalid username/email or password.");
    }

    if (matchedUser.active === false) {
      throw new Error("Your account has been disabled.");
    }

    // Evaluate password correctness
    let isPasswordCorrect = false;

    // Check possible passwords for matched user (supports hashes, plain, and default generated passwords)
    const userPwd = matchedUser.password || '';
    const userPlain = matchedUser.plainPassword || '';
    
    // Fallback options for default student/teacher passwords to be extremely robust
    const lowerUser = matchedUser.username?.toLowerCase() || '';
    const baseNameOnly = matchedUser.name?.toLowerCase().replace(/\s+/g, '') || '';
    const fallbackPassword1 = `${lowerUser}123`;
    const fallbackPassword2 = `${baseNameOnly}123`;

    const possiblePasswords = [
      userPwd,
      userPlain,
      fallbackPassword1,
      fallbackPassword2
    ].filter(Boolean);

    for (const option of possiblePasswords) {
      if (option.startsWith('sha256_mock_')) {
        if (simpleSecureHash(trimmedPassword) === option) {
          isPasswordCorrect = true;
          break;
        }
      } else {
        if (trimmedPassword === option) {
          isPasswordCorrect = true;
          break;
        }
      }
    }

    if (!isPasswordCorrect) {
      throw new Error("Invalid username/email or password.");
    }

    // Set authenticated user state
    const verifiedUser: User = {
      id: matchedUser.id || `user-${Date.now()}`,
      username: matchedUser.username || lowerUser,
      name: matchedUser.name,
      email: matchedUser.email || `${matchedUser.username}@example.com`,
      role: userRole || 'STUDENT',
      phone: matchedUser.phone || matchedUser.mobile || '',
      avatarUrl: matchedUser.profilePhoto || ''
    };

    const sessionObj = {
      user: verifiedUser,
      role: verifiedUser.role
    };

    // Store in session or local storage
    sessionStorage.setItem('sunshine_active_session', JSON.stringify(sessionObj));
    if (remember) {
      localStorage.setItem('sunshine_active_session', JSON.stringify(sessionObj));
    }

    setCurrentUser(verifiedUser);
    setRole(verifiedUser.role);

    await writeAuditLog(verifiedUser.id, verifiedUser.username, 'USER_LOGIN', `User ${verifiedUser.username} successfully logged in to the ERP.`);

    return true;
  };

  /**
   * Google Sign-In (Exclusive for Admins, Super Admins, and Receptionists)
   */
  const googleLogin = async (): Promise<boolean> => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleEmail = result.user.email?.trim().toLowerCase();

      if (!googleEmail) {
        throw new Error("Failed to retrieve email address from Google Account.");
      }

      // Fetch authorised core users list
      const usersList = await getERPData<any>('users', SEED_USERS);
      const matchedAdmin = usersList.find((u: any) => u.email?.trim().toLowerCase() === googleEmail);

      if (!matchedAdmin) {
        await fbSignOut(auth);
        throw new Error(`Unauthorized: The Google Account "${googleEmail}" is not registered in the Sunshine Classes Admin database.`);
      }

      const roleStr = matchedAdmin.role?.toUpperCase();
      if (roleStr !== 'SUPER_ADMIN' && roleStr !== 'ADMIN' && roleStr !== 'RECEPTIONIST') {
        await fbSignOut(auth);
        throw new Error(`Unauthorized: The account "${googleEmail}" is registered as ${roleStr}. Only Admin accounts can access the Admin Portal via Google.`);
      }

      const verifiedUser: User = {
        id: matchedAdmin.id || result.user.uid,
        username: matchedAdmin.username || googleEmail.split('@')[0],
        name: matchedAdmin.name || result.user.displayName || 'Admin User',
        email: googleEmail,
        role: roleStr as UserRole,
        phone: matchedAdmin.phone || result.user.phoneNumber || ''
      };

      const sessionObj = {
        user: verifiedUser,
        role: verifiedUser.role
      };

      // Store in session
      sessionStorage.setItem('sunshine_active_session', JSON.stringify(sessionObj));
      localStorage.setItem('sunshine_active_session', JSON.stringify(sessionObj));

      setCurrentUser(verifiedUser);
      setRole(verifiedUser.role);

      await writeAuditLog(verifiedUser.id, verifiedUser.username, 'ADMIN_LOGIN_GOOGLE', `Administrator logged in using Google account verification: ${googleEmail}`);

      return true;
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      throw err;
    } finally {
      setGoogleLoading(false);
    }
  };

  /**
   * Terminate current active session (Logout)
   */
  const logout = async (): Promise<void> => {
    try {
      if (currentUser) {
        await writeAuditLog(currentUser.id, currentUser.username, 'USER_LOGOUT', `User ${currentUser.username} logged out.`);
      }

      // Sign out of Firebase Auth just in case
      await fbSignOut(auth);
    } catch (err) {
      console.warn("Error signing out of Firebase Auth:", err);
    }

    // Clear all stored credentials
    sessionStorage.removeItem('sunshine_active_session');
    localStorage.removeItem('sunshine_active_session');

    setCurrentUser(null);
    setRole(null);
  };

  /**
   * Passcode/Password update for currently logged-in user
   */
  const changePassword = async (newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error("No authenticated session active.");
    }

    const usersList = await getERPData<any>('users', SEED_USERS);
    const updatedUsers = usersList.map((u: any) => {
      if (u.id === currentUser.id || u.username?.toLowerCase() === currentUser.username?.toLowerCase()) {
        return {
          ...u,
          password: simpleSecureHash(newPassword),
          plainPassword: newPassword,
          firstLogin: false
        };
      }
      return u;
    });

    await syncERPData('users', updatedUsers);
    await writeAuditLog(currentUser.id, currentUser.username, 'PASSWORD_CHANGE', "User updated their login passcode successfully.");
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      role,
      loading,
      googleLoading,
      login,
      googleLogin,
      logout,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
