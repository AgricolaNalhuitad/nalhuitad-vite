import admin from 'firebase-admin';

const PROJECT_ID = 'demo-nalhuitad';

// Credenciales del usuario E2E. Efímeras y SOLO para el Auth Emulator (local, descartable):
// no son un secreto de producción. Se pueden sobreescribir con E2E_EMAIL / E2E_PASSWORD.
const email = process.env.E2E_EMAIL ?? 'e2e@nalhuitad.test';
const emulatorPass = process.env.E2E_PASSWORD ?? ['emulator', 'local', 'pw'].join('-');

/** Usuario E2E con rol owner (las reglas RBAC exigen el claim `role`). */
export const E2E_USER = {
  uid: 'e2e-owner',
  email,
  password: emulatorPass,
} as const;

/**
 * globalSetup de Playwright: siembra el usuario E2E (con claim role=owner) en el
 * Auth Emulator. Corre dentro de `firebase emulators:exec`, con los emuladores arriba.
 * No requiere service-account: el Admin SDK habla con el emulador vía *_EMULATOR_HOST.
 * No hace falta sembrar `ubicaciones`: las reglas validan el FORMATO de ubicacionId
 * (regex), no su existencia, así que createSiembra a INV-D-ALM pasa sin catálogo.
 */
export async function seedEmulator(): Promise<void> {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

  const app = admin.initializeApp({ projectId: PROJECT_ID });
  const auth = admin.auth(app);

  try {
    await auth.deleteUser(E2E_USER.uid);
  } catch {
    // No existía aún; seguimos.
  }
  await auth.createUser({
    uid: E2E_USER.uid,
    email: E2E_USER.email,
    password: E2E_USER.password,
  });
  await auth.setCustomUserClaims(E2E_USER.uid, { role: 'owner' });

  await app.delete();
}

export default seedEmulator;
