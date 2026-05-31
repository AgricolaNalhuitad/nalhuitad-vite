/**
 * Preflight de custom claims RBAC (T055) — desbloquea el deploy de firestore.rules.
 *
 * Contexto: firestore.rules usa isOwner()/isOperator() basados en el custom claim `role`.
 * El incidente e6d4aee (2026-05-24) fue un logout en prod por deployar esas reglas SIN el
 * claim asignado. Este script asigna los claims ANTES de re-deployar.
 *
 * Uso (EMULADOR — seguro):
 *   firebase emulators:exec --only auth "pnpm tsx scripts/set-custom-claims.ts --self-test"
 *   $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"; pnpm tsx scripts/set-custom-claims.ts --owner <uid>
 *
 * Uso (PROD — requiere service-account.json en la raíz; el UID se obtiene de
 * Firebase Console → Authentication → Users):
 *   pnpm tsx scripts/set-custom-claims.ts --owner <uid-grigor> [--operator <uid-socio>]
 *
 * ⚠️ NO deployar firestore.rules sin antes: (1) correr este script en PROD con el UID real,
 * (2) validar createLot end-to-end desde la app con la cuenta real (sin permission-denied).
 *
 * Idempotente: solo escribe si el claim difiere del deseado.
 * NOTA: no cubierto por `pnpm typecheck` (scripts/ fuera de tsconfig include).
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Role = 'owner' | 'operator';
const VALID_ROLES: readonly Role[] = ['owner', 'operator'];
const PROJECT_ID = 'nalhuitad-d6758';

function usingEmulator(): boolean {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

function initAdmin(): void {
  if (getApps().length > 0) return;
  if (usingEmulator()) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? PROJECT_ID });
    return;
  }
  const saPath = resolve(process.cwd(), 'service-account.json');
  if (existsSync(saPath)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))) });
    return;
  }
  initializeApp({ credential: applicationDefault() });
}

/** Idempotente: solo llama a setCustomUserClaims si el rol actual difiere. */
async function assignRole(uid: string, role: Role): Promise<'set' | 'unchanged'> {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  const current = (user.customClaims ?? {}) as { role?: string };
  if (current.role === role) return 'unchanged';
  await auth.setCustomUserClaims(uid, { ...user.customClaims, role });
  return 'set';
}

function parseAssignments(argv: readonly string[]): Array<{ uid: string; role: Role }> {
  const out: Array<{ uid: string; role: Role }> = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--owner' || flag === '--operator') {
      const uid = argv[i + 1];
      if (!uid) throw new Error(`Falta UID después de ${flag}`);
      out.push({ uid, role: flag === '--owner' ? 'owner' : 'operator' });
      i++;
    }
  }
  if (process.env.OWNER_UID) out.push({ uid: process.env.OWNER_UID, role: 'owner' });
  if (process.env.OPERATOR_UID) out.push({ uid: process.env.OPERATOR_UID, role: 'operator' });
  return out;
}

/** Verificación end-to-end contra el Auth Emulator (jamás prod). */
async function selfTest(): Promise<void> {
  if (!usingEmulator()) {
    throw new Error(
      '--self-test solo corre contra el Auth Emulator (FIREBASE_AUTH_EMULATOR_HOST no está seteado).',
    );
  }
  const auth = getAuth();
  const uid = 'selftest-owner-uid';
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({ uid, email: 'selftest@nalhuitad.test' });
  }

  const first = await assignRole(uid, 'owner');
  const second = await assignRole(uid, 'owner'); // debe ser idempotente
  const user = await auth.getUser(uid);
  const role = (user.customClaims as { role?: string } | undefined)?.role;

  console.log(`[self-test] 1ª asignación: ${first} | 2ª (idempotencia): ${second} | claim role=${role}`);
  if (role !== 'owner' || second !== 'unchanged') {
    console.error('[self-test] FALLÓ — el claim no quedó owner o no fue idempotente.');
    process.exit(1);
  }
  console.log('[self-test] OK — claim `owner` aplicado vía Admin SDK e idempotente en el emulador.');
}

async function main(): Promise<void> {
  initAdmin();

  if (process.argv.includes('--self-test')) {
    await selfTest();
    return;
  }

  const assignments = parseAssignments(process.argv.slice(2));
  if (assignments.length === 0) {
    console.error('Sin asignaciones. Uso:');
    console.error('  pnpm tsx scripts/set-custom-claims.ts --owner <uid> [--operator <uid>]');
    console.error('  (o env OWNER_UID / OPERATOR_UID). En PROD requiere service-account.json en la raíz.');
    process.exit(1);
  }

  for (const { uid, role } of assignments) {
    if (!VALID_ROLES.includes(role)) throw new Error(`Rol inválido: ${role}`);
    const result = await assignRole(uid, role);
    console.log(`${uid} → role:${role} [${result}]${usingEmulator() ? ' (emulador)' : ' (PROD)'}`);
  }
}

main().catch((err) => {
  console.error('set-custom-claims falló:', err);
  process.exit(1);
});
