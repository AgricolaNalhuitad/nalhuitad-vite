import { create } from 'zustand';
import type { User } from 'firebase/auth';

export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  user: User | null;
  status: SessionStatus;
}

export const useSessionStore = create<SessionState>(() => ({
  user: null,
  status: 'initializing',
}));
