import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(),
  browserLocalPersistence: 'browserLocalPersistence',
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('@/lib/firebase', () => ({
  app: {},
  auth: {},
  db: {},
}));
