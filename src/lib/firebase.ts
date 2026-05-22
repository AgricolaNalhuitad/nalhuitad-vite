import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

function readConfig(): Record<RequiredVar, string> {
  const missing: RequiredVar[] = [];
  const config = {} as Record<RequiredVar, string>;
  for (const key of REQUIRED_VARS) {
    const value = import.meta.env[key];
    if (!value) {
      missing.push(key);
    } else {
      config[key] = value;
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Firebase config inválida — faltan variables de entorno: ${missing.join(', ')}. ` +
        `Copia .env.example a .env.local y completa los valores.`,
    );
  }
  return config;
}

const env = readConfig();

export const app: FirebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth: Auth = getAuth(app);
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
