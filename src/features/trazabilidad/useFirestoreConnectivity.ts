import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Deriva la conectividad real con Firestore (FR-014): combina `navigator.onLine`
 * con `metadata.fromCache` de una suscripción liviana. Si el snapshot llega desde
 * cache (sin servidor), se considera offline para efectos del raleo.
 */
export function useFirestoreConnectivity(): { isOnline: boolean } {
  const [navOnline, setNavOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    const goOnline = () => setNavOnline(true);
    const goOffline = () => setNavOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const liviana = query(collection(db, 'ubicaciones'), limit(1));
    return onSnapshot(
      liviana,
      { includeMetadataChanges: true },
      (snap) => setFromCache(snap.metadata.fromCache),
      () => {
        /* errores de red no deben romper la UI; se refleja vía navigator.onLine */
      },
    );
  }, []);

  return { isOnline: navOnline && !fromCache };
}
