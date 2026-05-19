import { useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { mapAuthError } from './errors';

export type SignInResult = { ok: true } | { ok: false; error: string };

export function useAuth() {
  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mapAuthError(e) };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await fbSignOut(auth);
  }, []);

  return { signIn, signOut };
}
