import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UseCollectionListenerOptions<T> {
  collectionName: string;
  onData: (data: T[]) => void;
  storageKey?: string;
  enabled?: boolean;
  reconnectSignal?: number;
  onHeartbeat?: (collectionName: string) => void;
}

// Global registry for heartbeat timestamps of Firestore listeners
const listenerHeartbeats: Record<string, number> = {};

/**
 * Hook to manage Firestore Connection Watchdog.
 * Periodically monitors snapshot listener activity and network state.
 * Automatically triggers controlled re-subscriptions on heartbeat stalls or connection recovery.
 */
export function useFirestoreConnectionWatchdog(checkIntervalMs: number = 30000) {
  const [reconnectSignal, setReconnectSignal] = useState<number>(0);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  const recordHeartbeat = useCallback((collectionName: string) => {
    listenerHeartbeats[collectionName] = Date.now();
  }, []);

  const triggerReconnect = useCallback(() => {
    console.log('[Firestore Watchdog] Triggering controlled re-subscription for active listeners...');
    setReconnectSignal((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Firestore Watchdog] Network connection restored. Forcing listener re-subscription.');
      triggerReconnect();
    };

    const handleFocus = () => {
      // Re-check health when tab comes back to foreground
      const now = Date.now();
      const collections = Object.keys(listenerHeartbeats);
      let staleFound = false;

      for (const col of collections) {
        if (now - listenerHeartbeats[col] > checkIntervalMs * 2) {
          staleFound = true;
          break;
        }
      }

      if (staleFound) {
        console.log('[Firestore Watchdog] Stale heartbeat detected upon window focus. Re-subscribing.');
        triggerReconnect();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      const now = Date.now();
      setLastCheck(now);

      if (!navigator.onLine) {
        setIsHealthy(false);
        return;
      }

      const collections = Object.keys(listenerHeartbeats);
      if (collections.length === 0) {
        setIsHealthy(true);
        return;
      }

      let allHealthy = true;
      let stallDetected = false;

      // If a collection hasn't produced a snapshot/heartbeat for more than 2.5x check interval, mark stall
      for (const col of collections) {
        const lastBeat = listenerHeartbeats[col];
        if (lastBeat && now - lastBeat > checkIntervalMs * 2.5) {
          stallDetected = true;
          allHealthy = false;
          console.warn(`[Firestore Watchdog] Listener stall detected for collection "${col}" (last beat ${Math.round((now - lastBeat) / 1000)}s ago)`);
        }
      }

      setIsHealthy(allHealthy);

      if (stallDetected) {
        triggerReconnect();
      }
    }, checkIntervalMs);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [checkIntervalMs, triggerReconnect]);

  return {
    reconnectSignal,
    isHealthy,
    lastCheck,
    recordHeartbeat,
    triggerReconnect,
  };
}

/**
 * Custom React hook for listening to a Firestore collection in real-time.
 * Features:
 * - Proper cleanup on unmount
 * - Resilient connection handling with auto-retry on dropout
 * - Watchdog heartbeat registration and re-subscription on signal change
 */
export function useCollectionListener<T = DocumentData>({
  collectionName,
  onData,
  storageKey,
  enabled = true,
  reconnectSignal = 0,
  onHeartbeat,
}: UseCollectionListenerOptions<T>) {
  const onDataRef = useRef(onData);
  const onHeartbeatRef = useRef(onHeartbeat);

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    onHeartbeatRef.current = onHeartbeat;
  }, [onHeartbeat]);

  useEffect(() => {
    if (!enabled || !collectionName) return;

    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const updateHeartbeat = () => {
      listenerHeartbeats[collectionName] = Date.now();
      if (onHeartbeatRef.current) {
        onHeartbeatRef.current(collectionName);
      }
    };

    const attachListener = () => {
      try {
        const colRef = collection(db, collectionName);
        
        // Initial heartbeat mark
        updateHeartbeat();

        unsubscribe = onSnapshot(
          colRef,
          { includeMetadataChanges: true },
          (snapshot: QuerySnapshot<DocumentData>) => {
            if (!isSubscribed) return;
            
            updateHeartbeat();

            if (!snapshot.empty) {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as unknown as T[];

              onDataRef.current(data);

              if (storageKey) {
                try {
                  localStorage.setItem(storageKey, JSON.stringify(data));
                } catch (e) {
                  console.warn(`[useCollectionListener] LocalStorage write error for ${storageKey}:`, e);
                }
              }
            }
          },
          (error) => {
            console.warn(`[useCollectionListener] Listener error on collection "${collectionName}":`, error);
            if (isSubscribed) {
              if (unsubscribe) {
                try {
                  unsubscribe();
                } catch (_) {}
                unsubscribe = null;
              }
              retryTimeout = setTimeout(() => {
                if (isSubscribed) {
                  attachListener();
                }
              }, 5000);
            }
          }
        );
      } catch (err) {
        console.error(`[useCollectionListener] Setup exception for collection "${collectionName}":`, err);
        if (isSubscribed) {
          retryTimeout = setTimeout(() => {
            if (isSubscribed) attachListener();
          }, 5000);
        }
      }
    };

    attachListener();

    return () => {
      isSubscribed = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (_) {}
        unsubscribe = null;
      }
    };
  }, [collectionName, storageKey, enabled, reconnectSignal]);
}

// Dedicated listener hooks with Watchdog reconnect support
export function useStudentsListener(
  onData: (students: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'students',
    storageKey: 'sunshine_students',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useTeachersListener(
  onData: (teachers: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'teachers',
    storageKey: 'sunshine_teachers',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useAdmissionsListener(
  onData: (admissions: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'admissions',
    storageKey: 'sunshine_admissions',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useFeeStatusesListener(
  onData: (feeStatuses: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'fee_statuses',
    storageKey: 'sunshine_fee_statuses',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useUsersListener(
  onData: (users: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'users',
    storageKey: 'sunshine_users',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useClassesListener(
  onData: (classes: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'classes',
    storageKey: 'sunshine_classes',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useFeesListener(
  onData: (fees: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'fees',
    storageKey: 'sunshine_fees',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function usePaymentsListener(
  onData: (payments: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'payments',
    storageKey: 'sunshine_payments',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useAttendanceListener(
  onData: (attendance: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'attendance',
    storageKey: 'sunshine_attendance',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useNotificationsListener(
  onData: (notifications: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'notifications',
    storageKey: 'sunshine_notifications',
    onData,
    reconnectSignal,
    enabled,
  });
}

export function useAuditLogsListener(
  onData: (auditLogs: any[]) => void,
  reconnectSignal?: number,
  enabled: boolean = true
) {
  useCollectionListener({
    collectionName: 'audit_logs',
    storageKey: 'sunshine_audit_logs',
    onData,
    reconnectSignal,
    enabled,
  });
}

