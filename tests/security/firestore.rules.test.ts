import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'nalhuitad-rules-test';
const OWNER_UID = 'grigor-uid';
const OPERATOR_UID = 'worker-uid';
const OTHER_UID = 'intruder-uid';

let testEnv: RulesTestEnvironment;

const ownerDb = (): Firestore =>
  testEnv.authenticatedContext(OWNER_UID, { role: 'owner' }).firestore() as unknown as Firestore;
const operatorDb = (): Firestore =>
  testEnv.authenticatedContext(OPERATOR_UID, { role: 'operator' }).firestore() as unknown as Firestore;
const noRoleDb = (): Firestore =>
  testEnv.authenticatedContext(OTHER_UID).firestore() as unknown as Firestore;
const anonDb = (): Firestore =>
  testEnv.unauthenticatedContext().firestore() as unknown as Firestore;

const validLoteOrigen = (overrides: Record<string, unknown> = {}) => ({
  nombre: 'Milena 23-May',
  variedad: 'Milena',
  fechaSiembra: '2026-05-23',
  bandejas: 6,
  cantidadInicial: 6 * 135,
  estado: 'activo',
  notas: '',
  createdAt: new Date().toISOString(),
  createdBy: OPERATOR_UID,
  lastModifiedBy: OPERATOR_UID,
  lastModifiedAt: new Date().toISOString(),
  ...overrides,
});

const validUP = (overrides: Record<string, unknown> = {}) => ({
  refLoteOrigen: 'lote-abc',
  ubicacionId: 'INV-D-ALM',
  cantidad: 810,
  etapa: 'almacigo',
  estado: 'activa',
  fechaIngreso: '2026-05-23',
  historial: [],
  createdAt: new Date().toISOString(),
  createdBy: OPERATOR_UID,
  lastModifiedBy: OPERATOR_UID,
  lastModifiedAt: new Date().toISOString(),
  ...overrides,
});

const validCosecha = (overrides: Record<string, unknown> = {}) => ({
  refUnidadProduccion: 'up-xyz',
  refLoteOrigen: 'lote-abc',
  paquetes: 100,
  descarte: 10,
  lechugasEquivalentes: 200,
  fecha: '2026-06-15',
  notas: '',
  createdAt: new Date().toISOString(),
  createdBy: OPERATOR_UID,
  ...overrides,
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ============================================================
// AUTH & ROLES
// ============================================================
describe('auth & roles', () => {
  it('anonymous cannot read loteOrigen', async () => {
    await assertFails(getDoc(doc(anonDb(), 'loteOrigen/any')));
  });

  it('authenticated without role cannot read loteOrigen', async () => {
    await assertFails(getDoc(doc(noRoleDb(), 'loteOrigen/any')));
  });

  it('operator can read loteOrigen', async () => {
    await assertSucceeds(getDoc(doc(operatorDb(), 'loteOrigen/any')));
  });

  it('owner can read loteOrigen', async () => {
    await assertSucceeds(getDoc(doc(ownerDb(), 'loteOrigen/any')));
  });

  it('anonymous denied on default deny path', async () => {
    await assertFails(getDoc(doc(anonDb(), 'random-collection/x')));
  });

  it('authenticated denied on undeclared collection (default deny)', async () => {
    await assertFails(setDoc(doc(operatorDb(), 'random/x'), { a: 1 }));
  });
});

// ============================================================
// LOTE ORIGEN — CREATE
// ============================================================
describe('loteOrigen create', () => {
  it('operator creates valid loteOrigen', async () => {
    await assertSucceeds(setDoc(doc(operatorDb(), 'loteOrigen/l1'), validLoteOrigen()));
  });

  it('rejects cantidadInicial != bandejas * 135 (FR-004)', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'loteOrigen/l1'), validLoteOrigen({ cantidadInicial: 800 })),
    );
  });

  it('rejects bandejas = 0', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'loteOrigen/l1'),
        validLoteOrigen({ bandejas: 0, cantidadInicial: 0 }),
      ),
    );
  });

  it('rejects bandejas > 100', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'loteOrigen/l1'),
        validLoteOrigen({ bandejas: 200, cantidadInicial: 200 * 135 }),
      ),
    );
  });

  it('rejects estado != activo on create', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'loteOrigen/l1'), validLoteOrigen({ estado: 'cosechado' })),
    );
  });

  it('rejects malformed fechaSiembra', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'loteOrigen/l1'), validLoteOrigen({ fechaSiembra: '23/05/2026' })),
    );
  });

  it('rejects extra unknown field', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'loteOrigen/l1'),
        validLoteOrigen({ shadowField: 'malicious' }),
      ),
    );
  });

  it('rejects createdBy != auth uid (spoofing)', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'loteOrigen/l1'), validLoteOrigen({ createdBy: 'someone-else' })),
    );
  });

  it('rejects missing required field (variedad)', async () => {
    const { variedad: _v, ...partial } = validLoteOrigen();
    await assertFails(setDoc(doc(operatorDb(), 'loteOrigen/l1'), partial));
  });

  it('rejects empty variedad', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'loteOrigen/l1'), validLoteOrigen({ variedad: '' })),
    );
  });
});

// ============================================================
// LOTE ORIGEN — UPDATE
// ============================================================
describe('loteOrigen update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'loteOrigen/l1'), validLoteOrigen());
    });
  });

  it('allows transition activo → cosechado', async () => {
    await assertSucceeds(
      updateDoc(doc(operatorDb(), 'loteOrigen/l1'), {
        estado: 'cosechado',
        lastModifiedBy: OPERATOR_UID,
        lastModifiedAt: new Date().toISOString(),
      }),
    );
  });

  it('allows updating notas', async () => {
    await assertSucceeds(
      updateDoc(doc(operatorDb(), 'loteOrigen/l1'), {
        notas: 'lote sano',
        lastModifiedBy: OPERATOR_UID,
        lastModifiedAt: new Date().toISOString(),
      }),
    );
  });

  it('rejects changing variedad (immutable genealogía)', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'loteOrigen/l1'), {
        variedad: 'Romana',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects changing bandejas', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'loteOrigen/l1'), {
        bandejas: 10,
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects changing createdBy (audit trail)', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'loteOrigen/l1'), {
        createdBy: 'attacker',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects invalid estado', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'loteOrigen/l1'), {
        estado: 'eliminado',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects update by anonymous', async () => {
    await assertFails(
      updateDoc(doc(anonDb(), 'loteOrigen/l1'), { estado: 'cosechado' }),
    );
  });
});

// ============================================================
// LOTE ORIGEN — DELETE
// ============================================================
describe('loteOrigen delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'loteOrigen/l1'), validLoteOrigen());
    });
  });

  it('denies delete to operator', async () => {
    await assertFails(deleteDoc(doc(operatorDb(), 'loteOrigen/l1')));
  });

  it('denies delete even to owner (cliente nunca borra)', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), 'loteOrigen/l1')));
  });
});

// ============================================================
// UNIDAD DE PRODUCCIÓN — CREATE
// ============================================================
describe('unidadesProduccion create', () => {
  it('operator creates valid UP', async () => {
    await assertSucceeds(setDoc(doc(operatorDb(), 'unidadesProduccion/up1'), validUP()));
  });

  it('rejects invalid ubicacionId pattern', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'unidadesProduccion/up1'),
        validUP({ ubicacionId: 'INV-Z-XX' }),
      ),
    );
  });

  it('rejects estado != activa on create', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'unidadesProduccion/up1'),
        validUP({ estado: 'cosechada' }),
      ),
    );
  });

  it('rejects invalid etapa', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'unidadesProduccion/up1'),
        validUP({ etapa: 'germinacion' }),
      ),
    );
  });

  it('rejects empty refLoteOrigen (sin genealogía)', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'unidadesProduccion/up1'),
        validUP({ refLoteOrigen: '' }),
      ),
    );
  });

  it('rejects cantidad = 0', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'unidadesProduccion/up1'),
        validUP({ cantidad: 0 }),
      ),
    );
  });

  it('accepts UP with parentUpId (hija de raleo)', async () => {
    await assertSucceeds(
      setDoc(
        doc(operatorDb(), 'unidadesProduccion/up2'),
        validUP({ parentUpId: 'up1', ubicacionId: 'INV-A-P05', cantidad: 200, etapa: 'raleo' }),
      ),
    );
  });
});

// ============================================================
// UNIDAD DE PRODUCCIÓN — UPDATE
// ============================================================
describe('unidadesProduccion update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore() as unknown as Firestore, 'unidadesProduccion/up1'),
        validUP({ cantidad: 540 }),
      );
    });
  });

  it('allows cantidad decrease (cosecha parcial)', async () => {
    await assertSucceeds(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        cantidad: 300,
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects cantidad increase (no se permite inflar plantas)', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        cantidad: 600,
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('allows estado transition activa → trasladada (raleo)', async () => {
    await assertSucceeds(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        estado: 'trasladada',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('allows estado transition activa → cosechada', async () => {
    await assertSucceeds(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        estado: 'cosechada',
        cantidad: 0,
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('allows ubicacionId change (traslado)', async () => {
    await assertSucceeds(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        ubicacionId: 'INV-C-P02',
        etapa: 'transplante',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects changing refLoteOrigen (genealogía intocable)', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        refLoteOrigen: 'lote-otro',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects changing parentUpId', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        parentUpId: 'up-falso',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects invalid estado', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        estado: 'fantasma',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });

  it('rejects invalid ubicacionId after traslado', async () => {
    await assertFails(
      updateDoc(doc(operatorDb(), 'unidadesProduccion/up1'), {
        ubicacionId: 'PISCINA-3',
        lastModifiedBy: OPERATOR_UID,
      }),
    );
  });
});

// ============================================================
// UNIDAD DE PRODUCCIÓN — DELETE
// ============================================================
describe('unidadesProduccion delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore() as unknown as Firestore, 'unidadesProduccion/up1'),
        validUP(),
      );
    });
  });

  it('denies delete to operator', async () => {
    await assertFails(deleteDoc(doc(operatorDb(), 'unidadesProduccion/up1')));
  });

  it('denies delete to owner', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), 'unidadesProduccion/up1')));
  });
});

// ============================================================
// COSECHAS — append-only
// ============================================================
describe('cosechas (append-only)', () => {
  it('operator creates valid cosecha', async () => {
    await assertSucceeds(setDoc(doc(operatorDb(), 'cosechas/c1'), validCosecha()));
  });

  it('rejects lechugasEquivalentes != paquetes * 2 (FR-016)', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'cosechas/c1'), validCosecha({ lechugasEquivalentes: 250 })),
    );
  });

  it('rejects paquetes > 210 (capacidad por viaje)', async () => {
    await assertFails(
      setDoc(
        doc(operatorDb(), 'cosechas/c1'),
        validCosecha({ paquetes: 250, lechugasEquivalentes: 500 }),
      ),
    );
  });

  it('rejects negative descarte', async () => {
    await assertFails(
      setDoc(doc(operatorDb(), 'cosechas/c1'), validCosecha({ descarte: -5 })),
    );
  });

  it('rejects update of existing cosecha', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'cosechas/c1'), validCosecha());
    });
    await assertFails(updateDoc(doc(operatorDb(), 'cosechas/c1'), { paquetes: 50 }));
  });

  it('rejects delete of existing cosecha', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'cosechas/c1'), validCosecha());
    });
    await assertFails(deleteDoc(doc(operatorDb(), 'cosechas/c1')));
  });
});

// ============================================================
// LOTES LEGACY — read-only
// ============================================================
describe('lotes legacy (read-only)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      await setDoc(doc(db, 'lotes/legacy1'), { name: 'old', variety: 'Milena' });
      await setDoc(doc(db, 'lotes_legacy/legacy2'), { name: 'archived' });
    });
  });

  it('operator can read lotes (legacy)', async () => {
    await assertSucceeds(getDoc(doc(operatorDb(), 'lotes/legacy1')));
  });

  it('operator can read lotes_legacy', async () => {
    await assertSucceeds(getDoc(doc(operatorDb(), 'lotes_legacy/legacy2')));
  });

  it('denies write to lotes even by owner', async () => {
    await assertFails(updateDoc(doc(ownerDb(), 'lotes/legacy1'), { name: 'tampered' }));
  });

  it('denies create new lote in legacy collection', async () => {
    await assertFails(setDoc(doc(operatorDb(), 'lotes/new1'), { name: 'inject' }));
  });

  it('denies delete in lotes_legacy', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), 'lotes_legacy/legacy2')));
  });
});

// ============================================================
// UBICACIONES — catálogo
// ============================================================
describe('ubicaciones (catálogo)', () => {
  it('any authenticated user can read', async () => {
    await assertSucceeds(getDoc(doc(operatorDb(), 'ubicaciones/INV-A-P05')));
    await assertSucceeds(getDoc(doc(noRoleDb(), 'ubicaciones/INV-A-P05')));
  });

  it('anonymous cannot read', async () => {
    await assertFails(getDoc(doc(anonDb(), 'ubicaciones/INV-A-P05')));
  });

  it('only owner can create catálogo entry', async () => {
    const payload = {
      invernadero: 'A',
      tipo: 'piscina DWC',
      identificador: 'P05',
      capacidadMaxima: 252,
      funcion: 'Producción raíz flotante',
      estado: 'libre',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await assertSucceeds(setDoc(doc(ownerDb(), 'ubicaciones/INV-A-P05'), payload));
    await assertFails(setDoc(doc(operatorDb(), 'ubicaciones/INV-A-P06'), payload));
  });

  it('rejects ubicacionId outside pattern', async () => {
    const payload = {
      invernadero: 'A',
      tipo: 'piscina',
      identificador: 'X',
      capacidadMaxima: 100,
      funcion: '',
      estado: 'libre',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await assertFails(setDoc(doc(ownerDb(), 'ubicaciones/BADID'), payload));
  });
});

// Smoke test for the helper functions to keep the test runner from optimizing them out.
describe('test helpers smoke', () => {
  it('builders return expected shape', () => {
    expect(validLoteOrigen().cantidadInicial).toBe(810);
    expect(validUP().estado).toBe('activa');
    expect(validCosecha().lechugasEquivalentes).toBe(200);
  });
});
