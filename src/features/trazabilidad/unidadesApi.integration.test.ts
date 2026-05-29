import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'nalhuitad-integration-traslado';

const { fb, TESTER_UID } = vi.hoisted(() => ({
  fb: { db: null as Firestore | null },
  TESTER_UID: 'tester-operator',
}));

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: TESTER_UID } },
  get db(): Firestore {
    if (!fb.db) throw new Error('emulator db no inicializado (beforeAll)');
    return fb.db;
  },
}));

import { createSiembra } from './lotesOrigenApi';
import { registrarCosecha, trasladarUnidad } from './unidadesApi';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
  fb.db = testEnv
    .authenticatedContext(TESTER_UID, { role: 'operator' })
    .firestore() as unknown as Firestore;
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function leerUp(upId: string) {
  const snap = await getDoc(doc(fb.db as Firestore, 'unidadesProduccion', upId));
  return snap.data();
}

async function leerLote(loteId: string) {
  const snap = await getDoc(doc(fb.db as Firestore, 'loteOrigen', loteId));
  return snap.data();
}

describe('trasladarUnidad (integration · emulador)', () => {
  it('mueve la UP a la ubicación destino y registra el evento traslado (FR-005..007)', async () => {
    const { upId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 6,
    });

    await trasladarUnidad(upId, { ubicacionDestinoId: 'INV-C-P01', fecha: '2026-05-30' });

    const up = await leerUp(upId);
    expect(up?.ubicacionId).toBe('INV-C-P01');
    expect(up?.estado).toBe('activa');
    expect(up?.fechaIngreso).toBe('2026-05-30');

    const historial = up?.historial as Array<{
      tipoAccion: string;
      ubicacionPrevia?: string;
      ubicacionNueva?: string;
    }>;
    const traslado = historial.find((h) => h.tipoAccion === 'traslado');
    expect(traslado).toMatchObject({ ubicacionPrevia: 'INV-D-ALM', ubicacionNueva: 'INV-C-P01' });
  });

  it('bloquea el traslado a una ubicación ocupada por otra UP activa (INV-3)', async () => {
    const a = await createSiembra({ variedad: 'Milena', fechaSiembra: '2026-05-23', bandejas: 2 });
    await trasladarUnidad(a.upId, { ubicacionDestinoId: 'INV-C-P01', fecha: '2026-05-30' });

    const b = await createSiembra({ variedad: 'Milena', fechaSiembra: '2026-05-24', bandejas: 2 });
    await expect(
      trasladarUnidad(b.upId, { ubicacionDestinoId: 'INV-C-P01', fecha: '2026-05-30' }),
    ).rejects.toThrow();

    const upB = await leerUp(b.upId);
    expect(upB?.ubicacionId).toBe('INV-D-ALM'); // no se movió
  });
});

describe('registrarCosecha (integration · emulador)', () => {
  it('cosecha total → UP cosechada (cantidad 0) y lote auto-cerrado (FR-015..019)', async () => {
    const { upId, loteOrigenId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 2, // 270
    });

    await registrarCosecha(upId, { paquetes: 135, descarte: 0, fecha: '2026-06-20' }); // 270 lechugas

    const up = await leerUp(upId);
    expect(up?.estado).toBe('cosechada');
    expect(up?.cantidad).toBe(0);

    const lote = await leerLote(loteOrigenId);
    expect(lote?.estado).toBe('cosechado');

    const cosechas = await getDocs(collection(fb.db as Firestore, 'cosechas'));
    expect(cosechas.size).toBe(1);
    expect(cosechas.docs[0].data().lechugasEquivalentes).toBe(270);
  });

  it('cosecha parcial → UP sigue activa con cantidad reducida y lote activo', async () => {
    const { upId, loteOrigenId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 2, // 270
    });

    await registrarCosecha(upId, { paquetes: 100, descarte: 0, fecha: '2026-06-20' }); // 200

    const up = await leerUp(upId);
    expect(up?.estado).toBe('activa');
    expect(up?.cantidad).toBe(70);

    const lote = await leerLote(loteOrigenId);
    expect(lote?.estado).toBe('activo');
  });

  it('bloquea la cosecha que excede lo disponible (INV-4) sin modificar la UP', async () => {
    const { upId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 2, // 270
    });

    await expect(
      registrarCosecha(upId, { paquetes: 140, descarte: 0, fecha: '2026-06-20' }), // 280 > 270
    ).rejects.toThrow();

    const up = await leerUp(upId);
    expect(up?.estado).toBe('activa');
    expect(up?.cantidad).toBe(270);
  });
});
