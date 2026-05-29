/**
 * Seed idempotente del catálogo de ubicaciones (FR-024).
 *
 * Uso (prod):     pnpm tsx scripts/seed-ubicaciones.ts        (requiere service-account.json en raíz)
 * Uso (emulador): $env:FIRESTORE_EMULATOR_HOST="localhost:8080"; pnpm tsx scripts/seed-ubicaciones.ts
 *
 * NOTA: este runner NO está cubierto por `pnpm typecheck` (scripts/ fuera de tsconfig `include`)
 * ni por unit tests — requiere credenciales/emulador para ejecutarse. Los DATOS del catálogo sí
 * están verificados en src/features/trazabilidad/ubicacionesSeed.test.ts.
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UBICACIONES_SEED } from '../src/features/trazabilidad/ubicacionesSeed';

function initAdmin(): void {
  if (getApps().length > 0) return;
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'nalhuitad-d6758' });
    return;
  }
  const saPath = resolve(process.cwd(), 'service-account.json');
  if (existsSync(saPath)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))) });
    return;
  }
  initializeApp({ credential: applicationDefault() });
}

async function main(): Promise<void> {
  initAdmin();
  const db = getFirestore();
  const batch = db.batch();
  for (const u of UBICACIONES_SEED) {
    batch.set(db.collection('ubicaciones').doc(u.id), u, { merge: true });
  }
  await batch.commit();
  console.log(`Seed completo: ${UBICACIONES_SEED.length} ubicaciones`);
}

main().catch((err) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
