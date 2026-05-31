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

const PROJECT_ID = 'nalhuitad-integration-raleo';

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
import { trasladarUnidad } from './unidadesApi';
import { ralear } from './raleoApi';

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

async function contarUps(): Promise<number> {
  const snap = await getDocs(collection(fb.db as Firestore, 'unidadesProduccion'));
  return snap.size;
}

describe('ralear (integration · emulador)', () => {
  it('divide la UP en N hijas, marca el origen trasladado y conserva la suma (INV-1, FR-008..012)', async () => {
    const { upId, loteOrigenId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 6, // 810
    });

    const { hijasIds } = await ralear(upId, {
      destinos: [
        { ubicacionId: 'INV-A-P01', cantidad: 270 },
        { ubicacionId: 'INV-A-P02', cantidad: 270 },
        { ubicacionId: 'INV-A-P03', cantidad: 270 },
      ],
      fecha: '2026-06-01',
    });

    expect(hijasIds).toHaveLength(3);

    const origen = await leerUp(upId);
    expect(origen?.estado).toBe('trasladada');

    const db = fb.db as Firestore;
    const snap = await getDocs(collection(db, 'unidadesProduccion'));
    const hijas = snap.docs.filter((d) => hijasIds.includes(d.id)).map((d) => d.data());
    expect(hijas).toHaveLength(3);
    expect(
      hijas.every(
        (h) => h.estado === 'activa' && h.parentUpId === upId && h.refLoteOrigen === loteOrigenId,
      ),
    ).toBe(true);
    expect(hijas.reduce((s, h) => s + (h.cantidad as number), 0)).toBe(810);
  });

  it('rechaza si la suma de destinos no iguala la cantidad del origen (INV-1), sin crear hijas', async () => {
    const { upId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 6, // 810
    });

    await expect(
      ralear(upId, {
        destinos: [
          { ubicacionId: 'INV-A-P01', cantidad: 200 },
          { ubicacionId: 'INV-A-P02', cantidad: 200 },
        ],
        fecha: '2026-06-01',
      }),
    ).rejects.toThrow();

    expect(await contarUps()).toBe(1); // solo el origen
    const origen = await leerUp(upId);
    expect(origen?.estado).toBe('activa'); // intacto
  });

  it('bloquea un destino ya ocupado por otra UP activa (INV-3)', async () => {
    const occ = await createSiembra({ variedad: 'Milena', fechaSiembra: '2026-05-20', bandejas: 2 });
    await trasladarUnidad(occ.upId, { ubicacionDestinoId: 'INV-A-P01', fecha: '2026-05-30' });

    const { upId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 6,
    });

    await expect(
      ralear(upId, { destinos: [{ ubicacionId: 'INV-A-P01', cantidad: 810 }], fecha: '2026-06-01' }),
    ).rejects.toThrow();

    const origen = await leerUp(upId);
    expect(origen?.estado).toBe('activa'); // no se raleó
  });
});
