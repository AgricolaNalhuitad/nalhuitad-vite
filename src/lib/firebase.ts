import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
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

// Solo dev/E2E: conecta a los emuladores cuando VITE_USE_EMULATOR === 'true'.
// En el build de producción esa variable nunca se define, así que este bloque no corre
// y la app habla con Firebase real. Cambio en zona crítica → revisar con code-review --ultra.
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
