# Sprint 2 — Pantalla Lotes con Firestore Real

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la pantalla `/lotes` con lectura real-time de Firestore, dashboard panorámico con donut SVG, lista de `LotCard`, y persistencia offline via IndexedDB.

**Architecture:** `onSnapshot` de Firestore alimenta `useQueryData` de React Query via un hook `useLotes`. Normalización de docs en `lotesApi.ts` (tolerante a schema heterogéneo de docs históricos). Dashboard y lista renderizados por `LotesScreen` que orquesta sub-componentes puros.

**Tech Stack:** React 19, TypeScript 5 strict, Firebase SDK v10 (`onSnapshot`, `initializeFirestore`, `persistentLocalCache`), React Query 5 (`useQuery`, `useQueryClient`), React Router 7 (`useNavigate`), Vitest 2 + RTL, CSS Modules, pnpm.

**Spec:** `docs/specs/2026-05-22-sprint-2-lotes-firestore.md`

---

## Mapa de archivos

**Crear (nuevos):**
```
src/features/lotes/types.ts
src/features/lotes/stages.ts
src/features/lotes/plants.ts
src/features/lotes/plants.test.ts
src/features/lotes/aggregations.ts
src/features/lotes/aggregations.test.ts
src/features/lotes/lotesApi.ts
src/features/lotes/lotesApi.test.ts
src/features/lotes/useLotes.ts
src/features/lotes/useLotes.test.tsx
src/features/lotes/EmptyState.tsx
src/features/lotes/EmptyState.module.css
src/features/lotes/ErrorState.tsx
src/features/lotes/ErrorState.module.css
src/features/lotes/LotCard.tsx
src/features/lotes/LotCard.module.css
src/features/lotes/LotCard.test.tsx
src/features/lotes/CosechadoCard.tsx
src/features/lotes/CosechadoCard.module.css
src/features/lotes/LotesDashboard.tsx
src/features/lotes/LotesDashboard.module.css
src/features/lotes/LotesDashboard.test.tsx
src/features/lotes/LotesScreen.tsx
src/features/lotes/LotesScreen.module.css
src/features/lotes/LotesScreen.test.tsx
```

**Modificar (existentes):**
```
src/lib/firebase.ts          — reemplazar getFirestore por initializeFirestore+persistentLocalCache
src/tests/setup.ts           — expandir mock firebase/firestore
src/router.tsx               — enchufar LotesScreen; agregar ruta lotes/:id
```

---

## Task 1: Firebase persistence + Firestore mock

**Files:**
- Modify: `src/lib/firebase.ts`
- Modify: `src/tests/setup.ts`

- [ ] **Step 1: Actualizar `src/lib/firebase.ts`**

Reemplazar el archivo completo con:

```ts
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
```

- [ ] **Step 2: Expandir el mock de `firebase/firestore` en `src/tests/setup.ts`**

El mock actual solo tiene `getFirestore`. Reemplazar el bloque `vi.mock('firebase/firestore', ...)` completo:

```ts
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
}));
```

El archivo completo `src/tests/setup.ts` queda:

```ts
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
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/firebase', () => ({
  app: {},
  auth: {},
  db: {},
}));
```

- [ ] **Step 3: Confirmar que los tests existentes siguen pasando**

```
pnpm test:run
```

Esperado: los 31 tests existentes pasan. Si alguno falla, el mock necesita otro export — agregar el que falta al bloque `firebase/firestore`.

- [ ] **Step 4: Commit**

```
git add src/lib/firebase.ts src/tests/setup.ts
git commit -m "feat: enable Firestore IndexedDB persistence + expand test mock"
```

---

## Task 2: Tipos y metadatos de etapas

**Files:**
- Create: `src/features/lotes/types.ts`
- Create: `src/features/lotes/stages.ts`

No hay lógica — solo definiciones de tipos y constantes. No se escriben tests para esto.

- [ ] **Step 1: Crear `src/features/lotes/types.ts`**

```ts
export type Stage = 'almacigo' | 'transplante' | 'raleo' | 'cosecha';

export interface Location {
  invernadero: string;
  tipo: string;
  identificador: string;
}

export interface StageHistoryEntry {
  stage: Stage;
  date: string;
  quantity?: number;
  notes?: string;
  location?: Location;
}

export interface RaleoEntry {
  fecha: string;
  cantidadRaleada: number;
  lotHijoId?: string;
  destino?: Location;
}

/** Forma cruda de Firestore — todos los campos opcionales para tolerar docs históricos */
export interface LotDoc {
  id: string;
  name?: string;
  date?: string;
  stage?: Stage;
  variety?: string;
  quantity?: number;
  currentQuantity?: number;
  mortalidadAcumulada?: number;
  location?: Location;
  locations?: Location[];
  stageHistory?: StageHistoryEntry[];
  raleos?: RaleoEntry[];
  childrenIds?: string[];
  parentId?: string;
}

/** Forma normalizada que consumen los componentes — defaults aplicados */
export interface Lot {
  id: string;
  name: string;
  date: string;
  stage: Stage;
  variety: string;
  quantity: number;
  currentQuantity: number;
  location: Location | null;
  stageHistory: StageHistoryEntry[];
  raleos: RaleoEntry[];
  childrenIds: string[];
}
```

- [ ] **Step 2: Crear `src/features/lotes/stages.ts`**

```ts
import type { Stage } from './types';

export const STAGE_ORDER: Stage[] = ['almacigo', 'transplante', 'raleo', 'cosecha'];

export const STAGE_LABELS: Record<Stage, string> = {
  almacigo:    'Almácigo',
  transplante: 'Transplante',
  raleo:       'Raleo',
  cosecha:     'Cosecha',
};

export const STAGE_CSS_VAR: Record<Stage, string> = {
  almacigo:    'var(--stage-a)',
  transplante: 'var(--stage-t)',
  raleo:       'var(--stage-r)',
  cosecha:     'var(--stage-c)',
};
```

- [ ] **Step 3: Verificar tipos**

```
pnpm typecheck
```

Esperado: cero errores.

- [ ] **Step 4: Commit**

```
git add src/features/lotes/types.ts src/features/lotes/stages.ts
git commit -m "feat(lotes): type definitions and stage metadata"
```

---

## Task 3: Utilidades de plantas (TDD)

**Files:**
- Create: `src/features/lotes/plants.test.ts`
- Create: `src/features/lotes/plants.ts`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/plants.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { toPlants, daysSince, formatDate, PLANTS_PER_TRAY_DEFAULT } from './plants';

describe('PLANTS_PER_TRAY_DEFAULT', () => {
  it('es 135', () => {
    expect(PLANTS_PER_TRAY_DEFAULT).toBe(135);
  });
});

describe('toPlants', () => {
  it('0 bandejas → 0 plantas', () => {
    expect(toPlants(0)).toBe(0);
  });

  it('21 bandejas → 2835 plantas (21 × 135)', () => {
    expect(toPlants(21)).toBe(2835);
  });

  it('NaN → 0 (sin crash)', () => {
    expect(toPlants(NaN)).toBe(0);
  });
});

describe('daysSince', () => {
  it('string vacío → 0', () => {
    expect(daysSince('')).toBe(0);
  });

  it('fecha de hoy → 0', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysSince(today)).toBe(0);
  });

  it('fecha de ayer → 1', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    expect(daysSince(yesterday)).toBe(1);
  });
});

describe('formatDate', () => {
  it('string vacío → "—"', () => {
    expect(formatDate('')).toBe('—');
  });

  it('fecha ISO válida incluye día y año', () => {
    const result = formatDate('2026-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/plants.test.ts
```

Esperado: FAIL — `plants` no existe.

- [ ] **Step 3: Crear `src/features/lotes/plants.ts`**

```ts
export const PLANTS_PER_TRAY_DEFAULT = 135;

export function toPlants(trays: number): number {
  return Number.isFinite(trays) ? Math.round(trays * PLANTS_PER_TRAY_DEFAULT) : 0;
}

export function daysSince(iso: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/plants.test.ts
```

Esperado: PASS (6 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/plants.ts src/features/lotes/plants.test.ts
git commit -m "feat(lotes): plant utilities — toPlants, daysSince, formatDate (TDD)"
```

---

## Task 4: Funciones de agregación (TDD)

**Files:**
- Create: `src/features/lotes/aggregations.test.ts`
- Create: `src/features/lotes/aggregations.ts`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/aggregations.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
  countByStage,
  totalEnProduccion,
  pctCapacidad,
  CAPACIDAD_INSTALADA,
} from './aggregations';
import type { Lot } from './types';

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'x',
  name: 'Test',
  date: '2026-01-01',
  stage: 'almacigo',
  variety: '',
  quantity: 0,
  currentQuantity: 0,
  location: null,
  stageHistory: [],
  raleos: [],
  childrenIds: [],
  ...overrides,
});

const lots: Lot[] = [
  makeLot({ id: '1', stage: 'almacigo',    currentQuantity: 1000 }),
  makeLot({ id: '2', stage: 'transplante', currentQuantity: 500  }),
  makeLot({ id: '3', stage: 'raleo',       currentQuantity: 200  }),
  makeLot({ id: '4', stage: 'cosecha',     currentQuantity: 0    }),
];

describe('CAPACIDAD_INSTALADA', () => {
  it('es 3756', () => {
    expect(CAPACIDAD_INSTALADA).toBe(3756);
  });
});

describe('countByStage', () => {
  it('suma currentQuantity de la etapa indicada', () => {
    expect(countByStage(lots, 'almacigo')).toBe(1000);
    expect(countByStage(lots, 'transplante')).toBe(500);
    expect(countByStage(lots, 'raleo')).toBe(200);
  });

  it('incluye lotes cosechados si se pide cosecha', () => {
    expect(countByStage(lots, 'cosecha')).toBe(0);
  });

  it('array vacío → 0', () => {
    expect(countByStage([], 'almacigo')).toBe(0);
  });
});

describe('totalEnProduccion', () => {
  it('excluye lotes en etapa cosecha', () => {
    expect(totalEnProduccion(lots)).toBe(1700);
  });

  it('array vacío → 0', () => {
    expect(totalEnProduccion([])).toBe(0);
  });
});

describe('pctCapacidad', () => {
  it('3756 plantas → 100%', () => {
    expect(pctCapacidad(3756)).toBe(100);
  });

  it('0 plantas → 0%', () => {
    expect(pctCapacidad(0)).toBe(0);
  });

  it('1878 plantas → 50%', () => {
    expect(pctCapacidad(1878)).toBe(50);
  });

  it('más de la capacidad → clamped a 100%', () => {
    expect(pctCapacidad(9999)).toBe(100);
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/aggregations.test.ts
```

Esperado: FAIL — `aggregations` no existe.

- [ ] **Step 3: Crear `src/features/lotes/aggregations.ts`**

```ts
import type { Lot, Stage } from './types';

export const CAPACIDAD_INSTALADA = 3756; // Inv A (2.016) + Inv B (1.740)

export function countByStage(lots: Lot[], stage: Stage): number {
  return lots
    .filter((l) => l.stage === stage)
    .reduce((acc, l) => acc + l.currentQuantity, 0);
}

export function totalEnProduccion(lots: Lot[]): number {
  return lots
    .filter((l) => l.stage !== 'cosecha')
    .reduce((acc, l) => acc + l.currentQuantity, 0);
}

export function pctCapacidad(total: number): number {
  return Math.min(100, Math.round((total / CAPACIDAD_INSTALADA) * 100));
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/aggregations.test.ts
```

Esperado: PASS (9 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/aggregations.ts src/features/lotes/aggregations.test.ts
git commit -m "feat(lotes): aggregation functions — countByStage, totalEnProduccion, pctCapacidad (TDD)"
```

---

## Task 5: Capa de acceso a Firestore — normalizeLot + subscribeLotes (TDD)

**Files:**
- Create: `src/features/lotes/lotesApi.test.ts`
- Create: `src/features/lotes/lotesApi.ts`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/lotesApi.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collection, onSnapshot } from 'firebase/firestore';
import { normalizeLot, subscribeLotes } from './lotesApi';
import type { LotDoc } from './types';

const mockOnSnapshot = vi.mocked(onSnapshot);
const mockCollection = vi.mocked(collection);

beforeEach(() => {
  mockCollection.mockReturnValue({} as ReturnType<typeof collection>);
});

// ── normalizeLot ─────────────────────────────────────────────────────────────

describe('normalizeLot', () => {
  it('doc completo: todos los campos mapeados correctamente', () => {
    const doc: LotDoc = {
      id: 'lot1',
      name: 'Milena Norte',
      date: '2026-01-15',
      stage: 'raleo',
      variety: 'Milena',
      quantity: 21,
      currentQuantity: 2500,
      location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
      stageHistory: [{ stage: 'almacigo', date: '2026-01-15' }],
      raleos: [{ fecha: '2026-02-01', cantidadRaleada: 100 }],
      childrenIds: ['child1'],
    };
    const lot = normalizeLot(doc);
    expect(lot.id).toBe('lot1');
    expect(lot.name).toBe('Milena Norte');
    expect(lot.stage).toBe('raleo');
    expect(lot.currentQuantity).toBe(2500);
    expect(lot.location?.invernadero).toBe('A');
    expect(lot.childrenIds).toEqual(['child1']);
  });

  it('doc sin quantity: quantity=0, currentQuantity=0', () => {
    const doc: LotDoc = { id: 'lot2' };
    const lot = normalizeLot(doc);
    expect(lot.quantity).toBe(0);
    expect(lot.currentQuantity).toBe(0);
  });

  it('doc sin currentQuantity: se calcula toPlants(quantity)', () => {
    const doc: LotDoc = { id: 'lot3', quantity: 10 };
    const lot = normalizeLot(doc);
    expect(lot.currentQuantity).toBe(1350); // 10 × 135
  });

  it('doc sin stage: stage="almacigo"', () => {
    const doc: LotDoc = { id: 'lot4' };
    expect(normalizeLot(doc).stage).toBe('almacigo');
  });

  it('doc sin stageHistory: stageHistory=[]', () => {
    const doc: LotDoc = { id: 'lot5' };
    expect(normalizeLot(doc).stageHistory).toEqual([]);
  });

  it('doc sin location pero con locations[]: usa el primero', () => {
    const loc = { invernadero: 'B', tipo: 'tubo', identificador: 'T01' };
    const doc: LotDoc = { id: 'lot6', locations: [loc] };
    expect(normalizeLot(doc).location).toEqual(loc);
  });

  it('doc sin location ni locations: location=null', () => {
    const doc: LotDoc = { id: 'lot7' };
    expect(normalizeLot(doc).location).toBeNull();
  });
});

// ── subscribeLotes ────────────────────────────────────────────────────────────

describe('subscribeLotes', () => {
  it('invoca onData con lots normalizados al recibir snapshot', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      (onNext as Function)({
        docs: [
          {
            id: 'lot1',
            data: () => ({ name: 'Test', stage: 'almacigo', quantity: 5, date: '2026-01-01' }),
          },
        ],
      });
      return mockUnsubscribe;
    });

    const onData = vi.fn();
    subscribeLotes(onData, vi.fn());

    expect(onData).toHaveBeenCalledOnce();
    const [lots] = onData.mock.calls[0];
    expect(lots).toHaveLength(1);
    expect(lots[0].id).toBe('lot1');
    expect(lots[0].currentQuantity).toBe(675); // 5 × 135
  });

  it('invoca onError cuando Firestore emite error', () => {
    const fakeError = new Error('permission-denied');
    mockOnSnapshot.mockImplementation((_ref, _onNext, onError) => {
      (onError as Function)(fakeError);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeLotes(vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(fakeError);
  });

  it('retorna la función unsubscribe de onSnapshot', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const unsub = subscribeLotes(vi.fn(), vi.fn());
    expect(unsub).toBe(mockUnsubscribe);
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/lotesApi.test.ts
```

Esperado: FAIL — `lotesApi` no existe.

- [ ] **Step 3: Crear `src/features/lotes/lotesApi.ts`**

```ts
import {
  collection,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toPlants } from './plants';
import type { Lot, LotDoc } from './types';

export function normalizeLot(doc: LotDoc): Lot {
  const quantity = doc.quantity ?? 0;
  return {
    id:              doc.id,
    name:            doc.name ?? '',
    date:            doc.date ?? '',
    stage:           doc.stage ?? 'almacigo',
    variety:         doc.variety ?? '',
    quantity,
    currentQuantity: doc.currentQuantity ?? toPlants(quantity),
    location:        doc.location ?? doc.locations?.[0] ?? null,
    stageHistory:    doc.stageHistory ?? [],
    raleos:          doc.raleos ?? [],
    childrenIds:     doc.childrenIds ?? [],
  };
}

export function subscribeLotes(
  onData: (lots: Lot[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'lotes'),
    (snap) =>
      onData(
        snap.docs.map((d) =>
          normalizeLot({ id: d.id, ...(d.data() as Omit<LotDoc, 'id'>) }),
        ),
      ),
    onError,
  );
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/lotesApi.test.ts
```

Esperado: PASS (10 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/lotesApi.ts src/features/lotes/lotesApi.test.ts
git commit -m "feat(lotes): lotesApi — normalizeLot + subscribeLotes (TDD)"
```

---

## Task 6: Hook useLotes (TDD)

**Files:**
- Create: `src/features/lotes/useLotes.test.tsx`
- Create: `src/features/lotes/useLotes.ts`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/useLotes.test.tsx`**

```tsx
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as lotesApiModule from './lotesApi';
import { useLotes } from './useLotes';
import type { Lot } from './types';

vi.mock('./lotesApi');

const fakeLot: Lot = {
  id: 'lot1',
  name: 'Milena Norte',
  date: '2026-01-01',
  stage: 'almacigo',
  variety: '',
  quantity: 10,
  currentQuantity: 1350,
  location: null,
  stageHistory: [{ stage: 'almacigo', date: '2026-01-01' }],
  raleos: [],
  childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('useLotes', () => {
  let capturedOnData: ((lots: Lot[]) => void) | null = null;
  let capturedOnError: ((err: Error) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.mocked(lotesApiModule.subscribeLotes).mockImplementation(
      (onData, onError) => {
        capturedOnData = onData;
        capturedOnError = onError as (err: Error) => void;
        return mockUnsubscribe;
      },
    );
  });

  afterEach(() => {
    capturedOnData = null;
    capturedOnError = null;
  });

  it('estado inicial: isLoading true, sin data ni error', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('data disponible tras snapshot simulado', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnData!([fakeLot]);
    });
    expect(result.current.data).toEqual([fakeLot]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('isError tras error simulado', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnError!(new Error('permission-denied'));
    });
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('retry reinicia la suscripción', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    // simular error
    act(() => {
      capturedOnError!(new Error('network'));
    });
    expect(result.current.isError).toBe(true);

    // llamar retry → debe volver a isLoading
    act(() => {
      result.current.retry();
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    // subscribeLotes se llamó dos veces (mount + retry)
    expect(vi.mocked(lotesApiModule.subscribeLotes)).toHaveBeenCalledTimes(2);
  });

  it('cleanup: invoca unsubscribe al desmontar', () => {
    const { unmount } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/useLotes.test.tsx
```

Esperado: FAIL — `useLotes` no existe.

- [ ] **Step 3: Crear `src/features/lotes/useLotes.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLotes } from './lotesApi';
import type { Lot } from './types';

export const LOTES_QUERY_KEY = ['lotes'] as const;

export function useLotes() {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  useEffect(() => {
    setFirestoreError(null);
    void qc.resetQueries({ queryKey: LOTES_QUERY_KEY });
    return subscribeLotes(
      (lots) => qc.setQueryData<Lot[]>(LOTES_QUERY_KEY, lots),
      (err) => setFirestoreError(err),
    );
  }, [qc, retryCount]);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);

  const { data, isLoading } = useQuery<Lot[]>({
    queryKey: LOTES_QUERY_KEY,
    queryFn: () => new Promise<Lot[]>(() => {}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    data,
    isLoading: isLoading && firestoreError === null,
    isError: firestoreError !== null,
    error: firestoreError,
    retry,
  };
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/useLotes.test.tsx
```

Esperado: PASS (5 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/useLotes.ts src/features/lotes/useLotes.test.tsx
git commit -m "feat(lotes): useLotes hook — onSnapshot bridge con React Query (TDD)"
```

---

## Task 7: EmptyState + ErrorState

**Files:**
- Create: `src/features/lotes/EmptyState.tsx`
- Create: `src/features/lotes/EmptyState.module.css`
- Create: `src/features/lotes/ErrorState.tsx`
- Create: `src/features/lotes/ErrorState.module.css`

Estos componentes se prueban vía los smoke tests de `LotesScreen` en Task 11. No tienen tests propios.

- [ ] **Step 1: Crear `src/features/lotes/EmptyState.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import styles from './EmptyState.module.css';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <section className={styles.root}>
      <div className={styles.iconWrap}>
        <svg
          width="32" height="32" viewBox="0 0 24 24"
          fill="none" stroke="var(--green)" strokeWidth="1.6" strokeLinecap="round"
        >
          <path d="M12 2a9 9 0 0 1 9 9c0 4.97-9 13-9 13S3 15.97 3 11a9 9 0 0 1 9-9z" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      </div>
      <p className={styles.title}>Sin lotes registrados</p>
      <p className={styles.subtitle}>
        Registrá tu primer lote para<br />empezar el seguimiento.
      </p>
      <button className={styles.cta} onClick={() => navigate('/mas/nuevo')}>
        + Registrar primer lote
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Crear `src/features/lotes/EmptyState.module.css`**

```css
.root {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.iconWrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--bg-card-h);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 24px;
}

.cta {
  padding: 12px 28px;
  border-radius: 12px;
  border: none;
  background: var(--green);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 3: Crear `src/features/lotes/ErrorState.tsx`**

```tsx
import styles from './ErrorState.module.css';

interface Props {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: Props) {
  return (
    <section className={styles.root}>
      <div className={styles.iconWrap}>
        <svg
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="var(--amber)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <p className={styles.title}>No pudimos cargar los lotes</p>
      <p className={styles.subtitle}>Revisá tu conexión e intentá de nuevo.</p>
      <button className={styles.retryBtn} onClick={onRetry}>
        Reintentar
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Crear `src/features/lotes/ErrorState.module.css`**

```css
.root {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.iconWrap {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: var(--bg-card-h);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 6px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 24px;
}

.retryBtn {
  padding: 10px 24px;
  border-radius: 10px;
  border: 0.5px solid var(--border);
  background: var(--bg-card-h);
  color: var(--text-1);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 5: Typecheck**

```
pnpm typecheck
```

Esperado: cero errores.

- [ ] **Step 6: Commit**

```
git add src/features/lotes/EmptyState.tsx src/features/lotes/EmptyState.module.css src/features/lotes/ErrorState.tsx src/features/lotes/ErrorState.module.css
git commit -m "feat(lotes): EmptyState + ErrorState components"
```

---

## Task 8: LotCard (smoke test)

**Files:**
- Create: `src/features/lotes/LotCard.test.tsx`
- Create: `src/features/lotes/LotCard.tsx`
- Create: `src/features/lotes/LotCard.module.css`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/LotCard.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LotCard } from './LotCard';
import type { Lot } from './types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeLot: Lot = {
  id: 'lot1',
  name: 'Milena Norte',
  date: '2026-01-15',
  stage: 'almacigo',
  variety: 'Milena',
  quantity: 21,
  currentQuantity: 2700,
  location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
  stageHistory: [{ stage: 'almacigo', date: '2026-01-15' }],
  raleos: [],
  childrenIds: [],
};

function renderCard(lot: Lot = fakeLot) {
  return render(
    <MemoryRouter>
      <LotCard lot={lot} />
    </MemoryRouter>,
  );
}

describe('LotCard', () => {
  it('renderiza el nombre del lote', () => {
    renderCard();
    expect(screen.getByText('Milena Norte')).toBeInTheDocument();
  });

  it('renderiza la etiqueta de etapa', () => {
    renderCard();
    expect(screen.getByText('Almácigo')).toBeInTheDocument();
  });

  it('renderiza la ubicación', () => {
    renderCard();
    expect(screen.getByText(/INV-A/)).toBeInTheDocument();
    expect(screen.getByText(/P01/)).toBeInTheDocument();
  });

  it('renderiza "Sembrado" con la fecha', () => {
    renderCard();
    expect(screen.getByText(/Sembrado/)).toBeInTheDocument();
  });

  it('renderiza los stats de plantas', () => {
    renderCard();
    expect(screen.getByText('Sembradas')).toBeInTheDocument();
    expect(screen.getByText('En producción')).toBeInTheDocument();
  });

  it('navega a /lotes/:id al hacer click', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/lotes/lot1');
  });

  it('omite ubicación si location es null', () => {
    renderCard({ ...fakeLot, location: null });
    expect(screen.queryByText(/INV-/)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/LotCard.test.tsx
```

Esperado: FAIL — `LotCard` no existe.

- [ ] **Step 3: Crear `src/features/lotes/LotCard.tsx`**

```tsx
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { STAGE_CSS_VAR, STAGE_LABELS } from './stages';
import { daysSince, formatDate, toPlants } from './plants';
import type { Lot } from './types';
import styles from './LotCard.module.css';

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  );
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

interface Props {
  lot: Lot;
}

export const LotCard = memo(function LotCard({ lot }: Props) {
  const navigate = useNavigate();
  const stageEntry = lot.stageHistory.at(-1);
  const daysInStage = daysSince(stageEntry?.date ?? lot.date);
  const cycleDays = daysSince(lot.date);
  const locationText = lot.location
    ? `INV-${lot.location.invernadero} · ${capitalize(lot.location.tipo)} ${lot.location.identificador}`
    : null;

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/lotes/${lot.id}`)}
    >
      <div className={styles.header}>
        <div className={styles.meta}>
          <p className={styles.stageLabel} style={{ color: STAGE_CSS_VAR[lot.stage] }}>
            {STAGE_LABELS[lot.stage]}
          </p>
          <p className={styles.name}>{lot.name || '(sin nombre)'}</p>
          {locationText && <p className={styles.location}>{locationText}</p>}
          <p className={styles.date}>Sembrado {formatDate(lot.date)}</p>
        </div>
        <span className={styles.daysBadge}>{daysInStage}d</span>
      </div>
      <div className={styles.statsRow}>
        <Stat label="Ciclo total" value={`${cycleDays}d`} />
        <Stat label="Sembradas" value={toPlants(lot.quantity).toLocaleString('es-CL')} />
        <Stat label="En producción" value={lot.currentQuantity.toLocaleString('es-CL')} />
      </div>
    </button>
  );
});
```

- [ ] **Step 4: Crear `src/features/lotes/LotCard.module.css`**

```css
.card {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 10px;
  padding: 16px 18px;
  cursor: pointer;
}

.card:active {
  background: var(--bg-card-h);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.meta {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.stageLabel {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 3px;
}

.location {
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 3px;
}

.date {
  font-size: 13px;
  color: var(--text-2);
}

.daysBadge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  background: var(--bg-card-h);
  color: var(--text-2);
  white-space: nowrap;
  flex-shrink: 0;
}

.statsRow {
  display: flex;
  gap: 20px;
  padding-top: 10px;
  border-top: 0.5px solid var(--sep);
}

.stat {
  min-width: 0;
}

.statLabel {
  font-size: 11px;
  color: var(--text-2);
  margin-bottom: 3px;
  letter-spacing: 0.02em;
}

.statValue {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  font-family: 'DM Mono', monospace;
}
```

- [ ] **Step 5: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/LotCard.test.tsx
```

Esperado: PASS (7 tests).

- [ ] **Step 6: Commit**

```
git add src/features/lotes/LotCard.tsx src/features/lotes/LotCard.module.css src/features/lotes/LotCard.test.tsx
git commit -m "feat(lotes): LotCard component con smoke tests"
```

---

## Task 9: CosechadoCard

**Files:**
- Create: `src/features/lotes/CosechadoCard.tsx`
- Create: `src/features/lotes/CosechadoCard.module.css`

Verificado vía smoke tests de `LotesScreen` en Task 11.

- [ ] **Step 1: Crear `src/features/lotes/CosechadoCard.tsx`**

```tsx
import { formatDate } from './plants';
import type { Lot } from './types';
import styles from './CosechadoCard.module.css';

interface Props {
  lot: Lot;
}

export function CosechadoCard({ lot }: Props) {
  const lastEntry = lot.stageHistory.at(-1);
  const harvestDate = lastEntry?.stage === 'cosecha' ? lastEntry.date : '';

  return (
    <div className={styles.card}>
      <p className={styles.stageLabel}>Cosecha</p>
      <p className={styles.name}>{lot.name || '(sin nombre)'}</p>
      {harvestDate && <p className={styles.date}>Cosechado {formatDate(harvestDate)}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/features/lotes/CosechadoCard.module.css`**

```css
.card {
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 10px;
  padding: 14px 18px;
  opacity: 0.55;
}

.stageLabel {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--stage-c);
  margin-bottom: 3px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 2px;
}

.date {
  font-size: 12px;
  color: var(--text-3);
}
```

- [ ] **Step 3: Typecheck**

```
pnpm typecheck
```

Esperado: cero errores.

- [ ] **Step 4: Commit**

```
git add src/features/lotes/CosechadoCard.tsx src/features/lotes/CosechadoCard.module.css
git commit -m "feat(lotes): CosechadoCard component"
```

---

## Task 10: LotesDashboard (smoke test)

**Files:**
- Create: `src/features/lotes/LotesDashboard.test.tsx`
- Create: `src/features/lotes/LotesDashboard.tsx`
- Create: `src/features/lotes/LotesDashboard.module.css`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/LotesDashboard.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LotesDashboard } from './LotesDashboard';
import type { Lot } from './types';

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'x', name: 'Test', date: '2026-01-01', stage: 'almacigo',
  variety: '', quantity: 10, currentQuantity: 1350, location: null,
  stageHistory: [], raleos: [], childrenIds: [], ...overrides,
});

describe('LotesDashboard', () => {
  it('renderiza sin crash con lotes activos', () => {
    const lots = [
      makeLot({ id: '1', stage: 'almacigo',    currentQuantity: 1000 }),
      makeLot({ id: '2', stage: 'transplante', currentQuantity: 500  }),
    ];
    render(<LotesDashboard lots={lots} />);
    expect(screen.getByText('Total en producción')).toBeInTheDocument();
  });

  it('muestra el conteo de lotes activos', () => {
    const lots = [makeLot({ id: '1' }), makeLot({ id: '2' })];
    render(<LotesDashboard lots={lots} />);
    expect(screen.getByText(/2 lotes activos/)).toBeInTheDocument();
  });

  it('muestra "Capacidad instalada"', () => {
    render(<LotesDashboard lots={[makeLot({ id: '1' })]} />);
    expect(screen.getByText('Capacidad instalada')).toBeInTheDocument();
  });

  it('renderiza sin crash con array vacío', () => {
    render(<LotesDashboard lots={[]} />);
    expect(screen.getByText('Total en producción')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/LotesDashboard.test.tsx
```

Esperado: FAIL — `LotesDashboard` no existe.

- [ ] **Step 3: Crear `src/features/lotes/LotesDashboard.tsx`**

```tsx
import { useMemo } from 'react';
import {
  countByStage,
  totalEnProduccion,
  pctCapacidad,
  CAPACIDAD_INSTALADA,
} from './aggregations';
import { STAGE_CSS_VAR, STAGE_LABELS } from './stages';
import type { Lot, Stage } from './types';
import styles from './LotesDashboard.module.css';

const C_OUT = 213.6; // 2π × 34
const C_IN  = 150.8; // 2π × 24

const ACTIVE_STAGES: Stage[] = ['almacigo', 'transplante', 'raleo'];

interface Props {
  lots: Lot[];
}

export function LotesDashboard({ lots }: Props) {
  const { totalActivo, pct, segments } = useMemo(() => {
    const total = totalEnProduccion(lots);
    const pct = pctCapacidad(total);
    const stagesWithCount = ACTIVE_STAGES
      .map((s) => ({ stage: s, count: countByStage(lots, s) }))
      .filter((s) => s.count > 0);
    const totalDonut = stagesWithCount.reduce((a, s) => a + s.count, 0) || 1;
    let offset = 38;
    const segments = stagesWithCount.map((s) => {
      const arc = (s.count / totalDonut) * C_IN;
      const gap = C_IN - arc;
      const seg = { stage: s.stage, count: s.count, arc, gap, offset };
      offset -= arc;
      return seg;
    });
    return { totalActivo: total, pct, segments };
  }, [lots]);

  const capArc = (pct / 100) * C_OUT;
  const totalLabel =
    totalActivo > 999
      ? (totalActivo / 1000).toFixed(1) + 'k'
      : String(totalActivo);

  return (
    <div className={styles.card}>
      {/* Bloque 1: donut + contadores */}
      <div className={styles.donutRow}>
        <svg width="84" height="84" viewBox="0 0 80 80" className={styles.donutSvg} aria-hidden="true">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-card-h)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="var(--green)" strokeWidth="5"
            strokeDasharray={`${capArc} ${C_OUT - capArc}`}
            strokeDashoffset="53"
            strokeLinecap="round"
          />
          <circle cx="40" cy="40" r="24" fill="none" stroke="var(--bg-card-h)" strokeWidth="11" />
          {segments.map((s) => (
            <circle
              key={s.stage}
              cx="40" cy="40" r="24" fill="none"
              stroke={STAGE_CSS_VAR[s.stage]}
              strokeWidth="11"
              strokeDasharray={`${s.arc} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
          <text x="40" y="37" textAnchor="middle" fontSize="11" fontWeight="700"
            fill="var(--text-1)" fontFamily="'DM Mono', monospace">
            {totalLabel}
          </text>
          <text x="40" y="49" textAnchor="middle" fontSize="7"
            fill="var(--text-3)" fontFamily="sans-serif">
            plantas
          </text>
        </svg>

        <div className={styles.stats}>
          <p className={styles.totalLabel}>Total en producción</p>
          <p className={styles.totalNumber}>{totalActivo.toLocaleString('es-CL')}</p>
          <p className={styles.activeLots}>
            {lots.length} lote{lots.length !== 1 ? 's' : ''} activos
          </p>
          {segments.map((s) => (
            <div key={s.stage} className={styles.legendItem}>
              <div
                className={styles.legendDot}
                style={{ background: STAGE_CSS_VAR[s.stage] }}
              />
              <p className={styles.legendLabel}>
                {STAGE_LABELS[s.stage]}{' '}
                <span style={{ color: STAGE_CSS_VAR[s.stage], fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                  {s.count.toLocaleString('es-CL')}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sep} />

      {/* Bloque 2: barras de distribución */}
      {segments.length > 0 && (
        <div className={styles.bars}>
          {segments.map((s) => {
            const barW = totalActivo > 0 ? Math.round((s.count / totalActivo) * 100) : 0;
            return (
              <div key={s.stage} className={styles.barRow}>
                <div className={styles.barHeader}>
                  <p className={styles.barLabel} style={{ color: STAGE_CSS_VAR[s.stage] }}>
                    {STAGE_LABELS[s.stage]}
                  </p>
                  <p className={styles.barValue} style={{ color: STAGE_CSS_VAR[s.stage] }}>
                    {s.count.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: barW + '%', background: STAGE_CSS_VAR[s.stage] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.sep} />

      {/* Bloque 3: capacidad instalada */}
      <div className={styles.capacityRow}>
        <div>
          <p className={styles.capacityLabel}>Capacidad instalada</p>
          <p className={styles.capacityValue}>
            {totalActivo.toLocaleString('es-CL')}{' '}
            <span className={styles.capacityMuted}>de</span>{' '}
            {CAPACIDAD_INSTALADA.toLocaleString('es-CL')}
          </p>
        </div>
        <svg width="56" height="32" viewBox="0 0 56 32" aria-hidden="true">
          <path d="M4 29 A24 24 0 0 1 52 29" fill="none" stroke="var(--bg-card-h)" strokeWidth="7" strokeLinecap="round" />
          <path
            d="M4 29 A24 24 0 0 1 52 29"
            fill="none" stroke="var(--green)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${75 * pct / 100} 75`}
            strokeDashoffset="0"
          />
          <text x="28" y="26" textAnchor="middle" fontSize="10" fontWeight="700"
            fill="var(--green)" fontFamily="'DM Mono', monospace">
            {pct}%
          </text>
        </svg>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/features/lotes/LotesDashboard.module.css`**

```css
.card {
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
}

.donutRow {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.donutSvg {
  flex-shrink: 0;
}

.stats {
  flex: 1;
  min-width: 0;
}

.totalLabel {
  font-size: 10px;
  color: var(--text-3);
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.totalNumber {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-1);
  font-family: 'DM Mono', monospace;
  line-height: 1;
  margin-bottom: 5px;
}

.activeLots {
  font-size: 11px;
  color: var(--text-2);
  margin-bottom: 8px;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
}

.legendDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legendLabel {
  font-size: 10px;
  color: var(--text-2);
}

.sep {
  border-top: 0.5px solid var(--sep);
  margin-bottom: 12px;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 14px;
}

.barRow { /* layout container */ }

.barHeader {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}

.barLabel {
  font-size: 11px;
  font-weight: 500;
}

.barValue {
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  font-weight: 700;
}

.barTrack {
  height: 5px;
  background: var(--bg-card-h);
  border-radius: 3px;
  overflow: hidden;
}

.barFill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}

.capacityRow {
  background: var(--bg-card-h);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.capacityLabel {
  font-size: 10px;
  color: var(--green);
  font-weight: 600;
  margin-bottom: 2px;
}

.capacityValue {
  font-size: 12px;
  color: var(--text-1);
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  margin-top: 2px;
}

.capacityMuted {
  color: var(--text-3);
  font-weight: 400;
}
```

- [ ] **Step 5: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/LotesDashboard.test.tsx
```

Esperado: PASS (4 tests).

- [ ] **Step 6: Commit**

```
git add src/features/lotes/LotesDashboard.tsx src/features/lotes/LotesDashboard.module.css src/features/lotes/LotesDashboard.test.tsx
git commit -m "feat(lotes): LotesDashboard — donut SVG + barras + capacidad"
```

---

## Task 11: LotesScreen container (smoke tests)

**Files:**
- Create: `src/features/lotes/LotesScreen.test.tsx`
- Create: `src/features/lotes/LotesScreen.tsx`
- Create: `src/features/lotes/LotesScreen.module.css`

- [ ] **Step 1: Escribir los tests fallidos en `src/features/lotes/LotesScreen.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as useLotesModule from './useLotes';
import { LotesScreen } from './LotesScreen';
import type { Lot } from './types';

vi.mock('./useLotes');

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'x', name: 'Test', date: '2026-01-01', stage: 'almacigo',
  variety: '', quantity: 10, currentQuantity: 1350, location: null,
  stageHistory: [{ stage: 'almacigo', date: '2026-01-01' }],
  raleos: [], childrenIds: [], ...overrides,
});

const mockRetry = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof useLotesModule.useLotes>>) {
  vi.mocked(useLotesModule.useLotes).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
    ...overrides,
  } as ReturnType<typeof useLotesModule.useLotes>);
}

function renderScreen() {
  return render(
    <MemoryRouter>
      <LotesScreen />
    </MemoryRouter>,
  );
}

describe('LotesScreen', () => {
  it('muestra skeletons cuando isLoading', () => {
    mockHook({ isLoading: true });
    renderScreen();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBe(3);
  });

  it('muestra EmptyState cuando data es array vacío', () => {
    mockHook({ data: [] });
    renderScreen();
    expect(screen.getByText('Sin lotes registrados')).toBeInTheDocument();
  });

  it('muestra ErrorState cuando isError', () => {
    mockHook({ isError: true });
    renderScreen();
    expect(screen.getByText('No pudimos cargar los lotes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra dashboard y lista de lotes activos', () => {
    const lots = [
      makeLot({ id: '1', name: 'Lote A', stage: 'almacigo' }),
      makeLot({ id: '2', name: 'Lote B', stage: 'raleo'    }),
    ];
    mockHook({ data: lots });
    renderScreen();
    expect(screen.getByText('Total en producción')).toBeInTheDocument();
    expect(screen.getByText('Lote A')).toBeInTheDocument();
    expect(screen.getByText('Lote B')).toBeInTheDocument();
  });

  it('muestra sección cosechados si hay lotes cosechados', () => {
    const lots = [
      makeLot({ id: '1', name: 'Activo',    stage: 'raleo'   }),
      makeLot({ id: '2', name: 'Cosechado', stage: 'cosecha',
        stageHistory: [{ stage: 'cosecha', date: '2026-03-01' }] }),
    ];
    mockHook({ data: lots });
    renderScreen();
    expect(screen.getByText(/Cosechados/)).toBeInTheDocument();
    expect(screen.getByText('Cosechado')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/LotesScreen.test.tsx
```

Esperado: FAIL — `LotesScreen` no existe.

- [ ] **Step 3: Crear `src/features/lotes/LotesScreen.tsx`**

```tsx
import { LotesDashboard } from './LotesDashboard';
import { LotCard } from './LotCard';
import { CosechadoCard } from './CosechadoCard';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { useLotes } from './useLotes';
import { STAGE_ORDER } from './stages';
import type { Lot } from './types';
import styles from './LotesScreen.module.css';

function SkeletonList() {
  return (
    <div className={styles.skeletonList}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeleton} data-testid="skeleton" />
      ))}
    </div>
  );
}

function sortByStageAndDate(lots: Lot[]): Lot[] {
  return [...lots].sort((a, b) => {
    const diff = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
    if (diff !== 0) return diff;
    return (a.date || '').localeCompare(b.date || '');
  });
}

export function LotesScreen() {
  const { data, isLoading, isError, retry } = useLotes();

  if (isLoading) return <SkeletonList />;
  if (isError)   return <ErrorState onRetry={retry} />;

  const lots = data ?? [];

  if (lots.length === 0) return <EmptyState />;

  const activeLots    = sortByStageAndDate(lots.filter((l) => l.stage !== 'cosecha'));
  const cosechadoLots = lots.filter((l) => l.stage === 'cosecha');

  return (
    <div className={styles.root}>
      <LotesDashboard lots={activeLots} />

      {activeLots.length > 0 && (
        <>
          <p className={styles.sectionLabel}>
            En curso · {activeLots.length} lote{activeLots.length !== 1 ? 's' : ''}
          </p>
          {activeLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </>
      )}

      {cosechadoLots.length > 0 && (
        <>
          <p className={styles.sectionLabel}>
            Cosechados · {cosechadoLots.length}
          </p>
          {cosechadoLots.map((lot) => (
            <CosechadoCard key={lot.id} lot={lot} />
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/features/lotes/LotesScreen.module.css`**

```css
.root {
  padding: 16px 16px 80px;
}

.sectionLabel {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-2);
  text-transform: uppercase;
  margin: 20px 0 12px;
}

.skeletonList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

.skeleton {
  height: 88px;
  border-radius: 14px;
  background: var(--bg-card-h);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

- [ ] **Step 5: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/LotesScreen.test.tsx
```

Esperado: PASS (5 tests).

- [ ] **Step 6: Commit**

```
git add src/features/lotes/LotesScreen.tsx src/features/lotes/LotesScreen.module.css src/features/lotes/LotesScreen.test.tsx
git commit -m "feat(lotes): LotesScreen container con smoke tests"
```

---

## Task 12: Router wiring + verificación final

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Actualizar `src/router.tsx`**

Agregar el import de `LotesScreen` y actualizar las rutas. El archivo completo queda:

```tsx
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicRoute } from '@/features/auth/PublicRoute';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppShell } from '@/shared/components/AppShell';
import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';
import { MasMenu } from '@/shared/components/MasMenu';
import { LotesScreen } from '@/features/lotes/LotesScreen';

// eslint-disable-next-line react-refresh/only-export-components
function MasSubScreen() {
  const { screen } = useParams<{ screen: string }>();
  const label = screen ? screen.charAt(0).toUpperCase() + screen.slice(1) : 'Más';
  return <PlaceholderScreen name={label} />;
}

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginScreen />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/lotes" replace /> },
      { path: 'lotes', element: <LotesScreen /> },
      { path: 'lotes/:id', element: <PlaceholderScreen name="Detalle lote" /> },
      { path: 'dashboard', element: <PlaceholderScreen name="Dashboard" /> },
      { path: 'alertas', element: <PlaceholderScreen name="Alertas" /> },
      { path: 'produccion', element: <PlaceholderScreen name="Producción" /> },
      { path: 'mas', element: <MasMenu /> },
      { path: 'mas/:screen', element: <MasSubScreen /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

- [ ] **Step 2: TypeScript**

```
pnpm typecheck
```

Esperado: cero errores.

- [ ] **Step 3: Linter**

```
pnpm lint
```

Esperado: cero errores, cero warnings.

- [ ] **Step 4: Suite completa de tests**

```
pnpm test:run
```

Esperado: todos los tests pasan (31 previos + los nuevos del sprint). Anotar el total.

- [ ] **Step 5: Commit final**

```
git add src/router.tsx
git commit -m "feat(lotes): wire LotesScreen into router — Sprint 2 completo"
```

---

## Resumen de criterios de aceptación

Antes de dar el sprint por cerrado:

| Check | Comando | Esperado |
|-------|---------|----------|
| TypeScript | `pnpm typecheck` | 0 errores |
| Linter | `pnpm lint` | 0 errores, 0 warnings |
| Tests | `pnpm test:run` | todos pasan |
| Manual (Grigor) | — | dashboard con datos reales, lista, tap en card, offline cache, empty state |
