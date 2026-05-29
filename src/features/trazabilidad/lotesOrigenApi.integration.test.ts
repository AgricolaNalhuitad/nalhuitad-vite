import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, getDocs, type Firestore } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'nalhuitad-integration-test';

// `vi.mock` se hoistea al tope del archivo, así que el holder y el uid que usa la factory
// deben crearse con `vi.hoisted` (también hoisteado) para existir cuando ésta corre.
// `db` se expone como getter: cada acceso lee el valor inicializado en beforeAll.
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

// Import tras el mock (el hoisting de vi.mock garantiza que aplique primero).
import { createSiembra } from './lotesOrigenApi';

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

describe('createSiembra (integration · emulador)', () => {
  it('crea lote origen + UP inicial en Inv D-Almácigo de forma atómica (FR-002, FR-004)', async () => {
    const { loteOrigenId, upId } = await createSiembra({
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 6,
    });

    expect(loteOrigenId).toBeTruthy();
    expect(upId).toBeTruthy();

    const db = fb.db as Firestore;
    const lotes = await getDocs(collection(db, 'loteOrigen'));
    const ups = await getDocs(collection(db, 'unidadesProduccion'));

    expect(lotes.size).toBe(1);
    expect(ups.size).toBe(1);

    const lote = lotes.docs[0];
    expect(lote.id).toBe(loteOrigenId);
    expect(lote.data()).toMatchObject({
      nombre: 'Milena 23-May',
      variedad: 'Milena',
      fechaSiembra: '2026-05-23',
      bandejas: 6,
      cantidadInicial: 810,
      estado: 'activo',
      createdBy: TESTER_UID,
    });

    const up = ups.docs[0];
    expect(up.id).toBe(upId);
    expect(up.data()).toMatchObject({
      refLoteOrigen: loteOrigenId,
      ubicacionId: 'INV-D-ALM',
      cantidad: 810,
      etapa: 'almacigo',
      estado: 'activa',
      fechaIngreso: '2026-05-23',
      createdBy: TESTER_UID,
    });

    const historial = up.data().historial as Array<{ tipoAccion: string; cantidad: number }>;
    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({ tipoAccion: 'creacion', cantidad: 810 });
  });

  it('genera nombre con sufijo de colisión para misma variedad+fecha (FR-003)', async () => {
    const a = await createSiembra({ variedad: 'Milena', fechaSiembra: '2026-05-23', bandejas: 2 });
    const b = await createSiembra({ variedad: 'Milena', fechaSiembra: '2026-05-23', bandejas: 2 });

    const db = fb.db as Firestore;
    const lotes = await getDocs(collection(db, 'loteOrigen'));
    const nombres = lotes.docs.map((d) => d.data().nombre as string);

    expect(lotes.size).toBe(2);
    expect(new Set(nombres).size).toBe(2); // nombres distintos por la resolución de colisión
    expect(nombres.every((n) => n.startsWith('Milena'))).toBe(true);
    expect(a.loteOrigenId).not.toBe(b.loteOrigenId);
  });

  it('rechaza bandejas inválidas sin dejar datos parciales (atomicidad + RBAC)', async () => {
    await expect(
      createSiembra({ variedad: 'Milena', fechaSiembra: '2026-05-23', bandejas: 0 }),
    ).rejects.toThrow();

    const db = fb.db as Firestore;
    const lotes = await getDocs(collection(db, 'loteOrigen'));
    const ups = await getDocs(collection(db, 'unidadesProduccion'));
    expect(lotes.size).toBe(0);
    expect(ups.size).toBe(0);
  });
});
