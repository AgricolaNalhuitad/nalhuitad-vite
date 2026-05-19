import { useEffect } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useSessionStore } from './useSessionStore';

export function useAuthBootstrap(): void {
  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      useSessionStore.setState({
        user,
        status: user ? 'authenticated' : 'unauthenticated',
      });
    });
    return unsubscribe;
  }, []);
}
