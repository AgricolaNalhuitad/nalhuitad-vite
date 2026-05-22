# Sprint 3 — Detalle de Lote + CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implementar `/lotes/:id` (LotDetailScreen) con lectura real-time de un solo lote, más operaciones de escritura: crear lote, editar lote, avanzar etapa, registrar cosecha y registrar raleo.

**Architecture:** Mismo patrón TDD del Sprint 2. `subscribeLot` alimenta `useLot` vía React Query. Operaciones de escritura en `lotApi.ts` (singular) wrappedas en mutation hooks (`useLotMutations.ts`). Formularios como screens separadas; action sheets como componentes montados dentro de LotDetailScreen.

**Tech Stack:** React 19, TypeScript 5 strict, Firebase SDK v10 (`onSnapshot`, `doc`, `addDoc`, `updateDoc`, `arrayUnion`), React Query 5 (`useQuery`, `useMutation`, `useQueryClient`), React Router 7, Vitest 2 + RTL, CSS Modules, pnpm.

**Spec:** `docs/specs/2026-05-22-sprint-3-lote-detalle-crud.md`

**Baseline:** Sprint 2 completo — 81 tests pasando. Branch: `main`.

**NOTA CRÍTICA — patrón useLot.ts:** Los `setState` de reset (setFirestoreError, setIsListening) van en `retry()`, NO dentro del `useEffect`. El `useEffect` solo retorna el unsubscribe. Mismo patrón que `useLotes.ts` corregido en Sprint 2:

```ts
useEffect(() => {
  return subscribeLot(id, (lot) => { setIsListening(false); qc.setQueryData(...) }, (err) => { setIsListening(false); setFirestoreError(err); });
}, [id, qc, retryCount]);

const retry = useCallback(() => {
  setFirestoreError(null);
  setIsListening(true);
  setRetryCount((n) => n + 1);
}, []);
```

---

## Mapa de archivos

**Crear (nuevos):**
```
src/features/lotes/lotApi.ts               ← subscribeLot + 5 write fns
src/features/lotes/lotApi.test.ts
src/features/lotes/useLot.ts               ← hook real-time lote individual
src/features/lotes/useLot.test.tsx
src/features/lotes/useLotMutations.ts      ← mutation hooks (create/update/advance/harvest/raleo)
src/features/lotes/useLotMutations.test.ts
src/features/lotes/LotDetailScreen.tsx
src/features/lotes/LotDetailScreen.module.css
src/features/lotes/LotDetailScreen.test.tsx
src/features/lotes/CreateLotScreen.tsx
src/features/lotes/CreateLotScreen.module.css
src/features/lotes/CreateLotScreen.test.tsx
src/features/lotes/EditLotScreen.tsx
src/features/lotes/EditLotScreen.module.css
src/features/lotes/EditLotScreen.test.tsx
src/features/lotes/AdvanceStageSheet.tsx
src/features/lotes/AdvanceStageSheet.module.css
src/features/lotes/AdvanceStageSheet.test.tsx
src/features/lotes/HarvestSheet.tsx
src/features/lotes/HarvestSheet.module.css
src/features/lotes/HarvestSheet.test.tsx
src/features/lotes/RaleoSheet.tsx
src/features/lotes/RaleoSheet.module.css
src/features/lotes/RaleoSheet.test.tsx
```

**Modificar (existentes):**
```
src/features/lotes/types.ts    ← agregar tipos de input (NewLotInput, etc.)
src/tests/setup.ts             ← agregar mocks de Firestore write (doc, addDoc, updateDoc, arrayUnion)
src/router.tsx                 ← rutas /lotes/:id, /lotes/nuevo, /lotes/:id/editar
```

---

## Task 1: Extend types + update Firestore mock

**Files:**
- Modify: `src/features/lotes/types.ts`
- Modify: `src/tests/setup.ts`

No hay lógica — solo tipos y configuración de mocks. No se escriben tests propios.

- [ ] **Step 1: Agregar tipos de input a `src/features/lotes/types.ts`**

Añadir al final del archivo:

```ts
/** Input para crear un nuevo lote */
export interface NewLotInput {
  name: string;
  variety: string;
  date: string;           // ISO YYYY-MM-DD
  quantity: number;       // bandejas de almácigo
  location: Location;
}

/** Input para editar campos básicos del lote */
export interface UpdateLotInput {
  name?: string;
  variety?: string;
  location?: Location;
}

/** Input para avanzar a la siguiente etapa */
export interface AdvanceStageInput {
  newStage: Stage;
  date: string;           // ISO YYYY-MM-DD
  quantity?: number;      // nueva cantidad de plantas (si cambia)
  location?: Location;    // nueva ubicación (si cambia)
  notes?: string;
}

/** Input para registrar cosecha */
export interface HarvestInput {
  date: string;           // ISO YYYY-MM-DD
  notes?: string;
}

/** Input para registrar raleo */
export interface RaleoInput {
  cantidadRaleada: number;
  fecha: string;          // ISO YYYY-MM-DD
  destino?: Location;
}
```

- [ ] **Step 2: Actualizar mock de `firebase/firestore` en `src/tests/setup.ts`**

Reemplazar el bloque `vi.mock('firebase/firestore', ...)` por:

```ts
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-lot-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  arrayUnion: vi.fn((...items: unknown[]) => items),
}));
```

- [ ] **Step 3: Verificar que los 81 tests existentes siguen pasando**

```
pnpm test:run
```

Esperado: PASS (81 tests).

- [ ] **Step 4: Typecheck**

```
pnpm typecheck
```

Esperado: cero errores.

- [ ] **Step 5: Commit**

```
git add src/features/lotes/types.ts src/tests/setup.ts
git commit -m "feat(lotes): write input types + expand Firestore mock for Sprint 3"
```

---

## Task 2: lotApi.ts — subscribeLot + write functions (TDD)

**Files:**
- Create: `src/features/lotes/lotApi.test.ts`
- Create: `src/features/lotes/lotApi.ts`

> Nota: `lotApi.ts` (singular) es un archivo nuevo. `lotesApi.ts` (plural) sigue existiendo sin cambios.

- [ ] **Step 1: Escribir tests fallidos en `src/features/lotes/lotApi.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addDoc, arrayUnion, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  subscribeLot,
  createLot,
  updateLot,
  advanceStage,
  registerHarvest,
  registerRaleo,
} from './lotApi';
import type { AdvanceStageInput, HarvestInput, NewLotInput, RaleoInput, UpdateLotInput } from './types';

const mockOnSnapshot = vi.mocked(onSnapshot);
const mockDoc = vi.mocked(doc);
const mockCollection = vi.mocked(collection);
const mockAddDoc = vi.mocked(addDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockArrayUnion = vi.mocked(arrayUnion);

beforeEach(() => {
  mockDoc.mockReturnValue({} as ReturnType<typeof doc>);
  mockCollection.mockReturnValue({} as ReturnType<typeof collection>);
  mockArrayUnion.mockImplementation((...items) => items as ReturnType<typeof arrayUnion>);
});

// ── subscribeLot ──────────────────────────────────────────────────────────────

describe('subscribeLot', () => {
  it('invoca onData con el lote normalizado al recibir snapshot que existe', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      (onNext as Function)({
        exists: () => true,
        id: 'lot1',
        data: () => ({ name: 'Milena', stage: 'almacigo', quantity: 10, date: '2026-01-01' }),
      });
      return mockUnsubscribe;
    });

    const onData = vi.fn();
    subscribeLot('lot1', onData, vi.fn());

    expect(onData).toHaveBeenCalledOnce();
    const [lot] = onData.mock.calls[0];
    expect(lot.id).toBe('lot1');
    expect(lot.name).toBe('Milena');
    expect(lot.currentQuantity).toBe(1350); // 10 × 135
  });

  it('invoca onData con null cuando el doc no existe', () => {
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      (onNext as Function)({ exists: () => false, id: 'lot-gone', data: () => null });
      return vi.fn();
    });

    const onData = vi.fn();
    subscribeLot('lot-gone', onData, vi.fn());
    expect(onData).toHaveBeenCalledWith(null);
  });

  it('invoca onError cuando Firestore emite error', () => {
    const fakeError = new Error('permission-denied');
    mockOnSnapshot.mockImplementation((_ref, _onNext, onError) => {
      (onError as Function)(fakeError);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeLot('lot1', vi.fn(), onError);
    expect(onError).toHaveBeenCalledWith(fakeError);
  });

  it('retorna la función unsubscribe de onSnapshot', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);
    const unsub = subscribeLot('lot1', vi.fn(), vi.fn());
    expect(unsub).toBe(mockUnsubscribe);
  });
});

// ── createLot ─────────────────────────────────────────────────────────────────

describe('createLot', () => {
  it('llama addDoc con los campos correctos y retorna el id nuevo', async () => {
    mockAddDoc.mockResolvedValue({ id: 'new-lot-123' } as ReturnType<typeof addDoc> extends Promise<infer T> ? T : never);

    const input: NewLotInput = {
      name: 'Fantasía Sur',
      variety: 'Fantasía',
      date: '2026-05-01',
      quantity: 15,
      location: { invernadero: 'B', tipo: 'piscina', identificador: 'P02' },
    };

    const id = await createLot(input);

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const [, data] = mockAddDoc.mock.calls[0];
    expect((data as Record<string, unknown>).name).toBe('Fantasía Sur');
    expect((data as Record<string, unknown>).stage).toBe('almacigo');
    expect((data as Record<string, unknown>).quantity).toBe(15);
    expect(id).toBe('new-lot-123');
  });
});

// ── updateLot ─────────────────────────────────────────────────────────────────

describe('updateLot', () => {
  it('llama updateDoc con los campos del input', async () => {
    const input: UpdateLotInput = { name: 'Nombre Nuevo', variety: 'Milena' };
    await updateLot('lot1', input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as Record<string, unknown>).name).toBe('Nombre Nuevo');
  });
});

// ── advanceStage ──────────────────────────────────────────────────────────────

describe('advanceStage', () => {
  it('llama updateDoc con el nuevo stage y agrega entrada a stageHistory', async () => {
    const input: AdvanceStageInput = {
      newStage: 'transplante',
      date: '2026-02-01',
      quantity: 2700,
    };
    await advanceStage('lot1', input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as Record<string, unknown>).stage).toBe('transplante');
    expect((data as Record<string, unknown>).currentQuantity).toBe(2700);
  });
});

// ── registerHarvest ───────────────────────────────────────────────────────────

describe('registerHarvest', () => {
  it('llama updateDoc con stage cosecha y agrega entrada a stageHistory', async () => {
    const input: HarvestInput = { date: '2026-04-01', notes: 'Cosecha exitosa' };
    await registerHarvest('lot1', input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as Record<string, unknown>).stage).toBe('cosecha');
  });
});

// ── registerRaleo ─────────────────────────────────────────────────────────────

describe('registerRaleo', () => {
  it('llama updateDoc con la entrada de raleo y decrementa currentQuantity', async () => {
    const input: RaleoInput = { cantidadRaleada: 300, fecha: '2026-03-01' };
    await registerRaleo('lot1', 2500, input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as Record<string, unknown>).currentQuantity).toBe(2200); // 2500 - 300
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/lotApi.test.ts
```

Esperado: FAIL — `lotApi` no existe.

- [ ] **Step 3: Crear `src/features/lotes/lotApi.ts`**

```ts
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeLot } from './lotesApi';
import type {
  AdvanceStageInput,
  HarvestInput,
  Lot,
  LotDoc,
  NewLotInput,
  RaleoInput,
  UpdateLotInput,
} from './types';

export function subscribeLot(
  id: string,
  onData: (lot: Lot | null) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'lotes', id),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(normalizeLot({ id: snap.id, ...(snap.data() as Omit<LotDoc, 'id'>) }));
    },
    onError,
  );
}

export async function createLot(input: NewLotInput): Promise<string> {
  const ref = await addDoc(collection(db, 'lotes'), {
    name:            input.name,
    variety:         input.variety,
    date:            input.date,
    quantity:        input.quantity,
    currentQuantity: input.quantity * 135,
    stage:           'almacigo',
    location:        input.location,
    stageHistory:    [{ stage: 'almacigo', date: input.date }],
    raleos:          [],
    childrenIds:     [],
  });
  return ref.id;
}

export async function updateLot(id: string, input: UpdateLotInput): Promise<void> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined)     data.name = input.name;
  if (input.variety !== undefined)  data.variety = input.variety;
  if (input.location !== undefined) data.location = input.location;
  await updateDoc(doc(db, 'lotes', id), data);
}

export async function advanceStage(id: string, input: AdvanceStageInput): Promise<void> {
  const entry = {
    stage:    input.newStage,
    date:     input.date,
    ...(input.quantity !== undefined && { quantity: input.quantity }),
    ...(input.notes    !== undefined && { notes: input.notes }),
    ...(input.location !== undefined && { location: input.location }),
  };
  const data: Record<string, unknown> = {
    stage:        input.newStage,
    stageHistory: arrayUnion(entry),
  };
  if (input.quantity !== undefined) data.currentQuantity = input.quantity;
  if (input.location !== undefined) data.location = input.location;
  await updateDoc(doc(db, 'lotes', id), data);
}

export async function registerHarvest(id: string, input: HarvestInput): Promise<void> {
  const entry = {
    stage: 'cosecha',
    date:  input.date,
    ...(input.notes !== undefined && { notes: input.notes }),
  };
  await updateDoc(doc(db, 'lotes', id), {
    stage:        'cosecha',
    stageHistory: arrayUnion(entry),
  });
}

export async function registerRaleo(
  id: string,
  currentQuantity: number,
  input: RaleoInput,
): Promise<void> {
  const entry = {
    fecha:            input.fecha,
    cantidadRaleada:  input.cantidadRaleada,
    ...(input.destino !== undefined && { destino: input.destino }),
  };
  await updateDoc(doc(db, 'lotes', id), {
    currentQuantity: currentQuantity - input.cantidadRaleada,
    raleos:          arrayUnion(entry),
  });
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/lotApi.test.ts
```

Esperado: PASS (10 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/lotApi.ts src/features/lotes/lotApi.test.ts
git commit -m "feat(lotes): lotApi — subscribeLot + createLot/updateLot/advanceStage/registerHarvest/registerRaleo (TDD)"
```

---

## Task 3: useLot.ts hook (TDD)

**Files:**
- Create: `src/features/lotes/useLot.test.tsx`
- Create: `src/features/lotes/useLot.ts`

**NOTA CRÍTICA:** Los setState de reset van en `retry()`, NO dentro del `useEffect`. Ver nota al inicio del plan.

- [ ] **Step 1: Escribir tests fallidos en `src/features/lotes/useLot.test.tsx`**

```tsx
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as lotApiModule from './lotApi';
import { useLot } from './useLot';
import type { Lot } from './types';

vi.mock('./lotApi');

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

describe('useLot', () => {
  let capturedOnData: ((lot: Lot | null) => void) | null = null;
  let capturedOnError: ((err: Error) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.mocked(lotApiModule.subscribeLot).mockImplementation(
      (_id, onData, onError) => {
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
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.lot).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('data disponible tras snapshot simulado', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnData!(fakeLot);
    });
    expect(result.current.lot).toEqual(fakeLot);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('lot es null cuando el doc no existe en Firestore', () => {
    const { result } = renderHook(() => useLot('lot-gone'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnData!(null);
    });
    expect(result.current.lot).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('isError tras error simulado', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnError!(new Error('permission-denied'));
    });
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('retry reinicia la suscripción', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnError!(new Error('network'));
    });
    expect(result.current.isError).toBe(true);

    act(() => {
      result.current.retry();
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(vi.mocked(lotApiModule.subscribeLot)).toHaveBeenCalledTimes(2);
  });

  it('cleanup: invoca unsubscribe al desmontar', () => {
    const { unmount } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('suscripción cambia cuando cambia el id', () => {
    const { rerender } = renderHook(({ id }) => useLot(id), {
      wrapper: makeWrapper(),
      initialProps: { id: 'lot1' },
    });
    const callsBefore = vi.mocked(lotApiModule.subscribeLot).mock.calls.length;
    rerender({ id: 'lot2' });
    expect(vi.mocked(lotApiModule.subscribeLot).mock.calls.length).toBe(callsBefore + 1);
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/useLot.test.tsx
```

Esperado: FAIL — `useLot` no existe.

- [ ] **Step 3: Crear `src/features/lotes/useLot.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLot } from './lotApi';
import type { Lot } from './types';

export function lotQueryKey(id: string) {
  return ['lotes', id] as const;
}

export function useLot(id: string) {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeLot(
      id,
      (lot) => {
        setIsListening(false);
        qc.setQueryData<Lot | null>(lotQueryKey(id), lot);
      },
      (err) => {
        setIsListening(false);
        setFirestoreError(err);
      },
    );
  }, [id, qc, retryCount]);

  const retry = useCallback(() => {
    setFirestoreError(null);
    setIsListening(true);
    setRetryCount((n) => n + 1);
  }, []);

  const { data } = useQuery<Lot | null>({
    queryKey: lotQueryKey(id),
    queryFn: () => new Promise<Lot | null>(() => {}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    lot: data,
    isLoading: isListening,
    isError: firestoreError !== null,
    error: firestoreError,
    retry,
  };
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/useLot.test.tsx
```

Esperado: PASS (7 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/useLot.ts src/features/lotes/useLot.test.tsx
git commit -m "feat(lotes): useLot hook — onSnapshot real-time para lote individual (TDD)"
```

---

## Task 4: useLotMutations.ts (TDD)

**Files:**
- Create: `src/features/lotes/useLotMutations.test.ts`
- Create: `src/features/lotes/useLotMutations.ts`

- [ ] **Step 1: Escribir tests fallidos en `src/features/lotes/useLotMutations.test.ts`**

```ts
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as lotApiModule from './lotApi';
import {
  useCreateLot,
  useUpdateLot,
  useAdvanceStage,
  useRegisterHarvest,
  useRegisterRaleo,
} from './useLotMutations';
import type { AdvanceStageInput, HarvestInput, NewLotInput, RaleoInput, UpdateLotInput } from './types';

vi.mock('./lotApi');

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCreateLot', () => {
  it('llama createLot y retorna el id creado', async () => {
    vi.mocked(lotApiModule.createLot).mockResolvedValue('new-lot-id');

    const { result } = renderHook(() => useCreateLot(), { wrapper: makeWrapper() });
    let returnedId: string | undefined;

    await act(async () => {
      returnedId = await result.current.mutateAsync({
        name: 'Test', variety: 'Milena', date: '2026-01-01', quantity: 10,
        location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
      } satisfies NewLotInput);
    });

    expect(vi.mocked(lotApiModule.createLot)).toHaveBeenCalledOnce();
    expect(returnedId).toBe('new-lot-id');
  });
});

describe('useUpdateLot', () => {
  it('llama updateLot con el id y el input', async () => {
    vi.mocked(lotApiModule.updateLot).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateLot('lot1'), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Nuevo nombre' } satisfies UpdateLotInput);
    });

    expect(vi.mocked(lotApiModule.updateLot)).toHaveBeenCalledWith('lot1', { name: 'Nuevo nombre' });
  });
});

describe('useAdvanceStage', () => {
  it('llama advanceStage con el id y el input', async () => {
    vi.mocked(lotApiModule.advanceStage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdvanceStage('lot1'), { wrapper: makeWrapper() });

    const input: AdvanceStageInput = { newStage: 'transplante', date: '2026-02-01' };
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(vi.mocked(lotApiModule.advanceStage)).toHaveBeenCalledWith('lot1', input);
  });
});

describe('useRegisterHarvest', () => {
  it('llama registerHarvest con el id y el input', async () => {
    vi.mocked(lotApiModule.registerHarvest).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegisterHarvest('lot1'), { wrapper: makeWrapper() });

    const input: HarvestInput = { date: '2026-04-01' };
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(vi.mocked(lotApiModule.registerHarvest)).toHaveBeenCalledWith('lot1', input);
  });
});

describe('useRegisterRaleo', () => {
  it('llama registerRaleo con el id, currentQuantity y el input', async () => {
    vi.mocked(lotApiModule.registerRaleo).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useRegisterRaleo('lot1', 2500),
      { wrapper: makeWrapper() },
    );

    const input: RaleoInput = { cantidadRaleada: 300, fecha: '2026-03-01' };
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(vi.mocked(lotApiModule.registerRaleo)).toHaveBeenCalledWith('lot1', 2500, input);
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/useLotMutations.test.ts
```

- [ ] **Step 3: Crear `src/features/lotes/useLotMutations.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  advanceStage,
  createLot,
  registerHarvest,
  registerRaleo,
  updateLot,
} from './lotApi';
import { LOTES_QUERY_KEY } from './useLotes';
import { lotQueryKey } from './useLot';
import type { AdvanceStageInput, HarvestInput, NewLotInput, RaleoInput, UpdateLotInput } from './types';

export function useCreateLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLotInput) => createLot(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
    },
  });
}

export function useUpdateLot(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLotInput) => updateLot(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}

export function useAdvanceStage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvanceStageInput) => advanceStage(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}

export function useRegisterHarvest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HarvestInput) => registerHarvest(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}

export function useRegisterRaleo(id: string, currentQuantity: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RaleoInput) => registerRaleo(id, currentQuantity, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}
```

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/useLotMutations.test.ts
```

Esperado: PASS (5 tests).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/useLotMutations.ts src/features/lotes/useLotMutations.test.ts
git commit -m "feat(lotes): useLotMutations — create/update/advanceStage/harvest/raleo (TDD)"
```

---

## Task 5: LotDetailScreen (smoke tests)

**Files:**
- Create: `src/features/lotes/LotDetailScreen.test.tsx`
- Create: `src/features/lotes/LotDetailScreen.tsx`
- Create: `src/features/lotes/LotDetailScreen.module.css`

La pantalla lee el lote via `useLot(id)` y muestra: nombre, stage badge, ubicación, stats, historial de etapas, historial de raleos. Botones de acción (Avanzar etapa, Registrar raleo, Registrar cosecha) abren sheets inline. Estado de los botones:
- "Avanzar etapa": disabled si stage === 'cosecha'
- "Registrar raleo": visible si stage === 'raleo' o 'transplante'
- "Registrar cosecha": visible si stage === 'raleo'

Los sheets (AdvanceStageSheet, HarvestSheet, RaleoSheet) se implementan en Task 7. En esta task, LotDetailScreen importa los sheets pero solo necesita que existan — los tests de LotDetailScreen los mockean.

- [ ] **Step 1: Escribir tests fallidos en `src/features/lotes/LotDetailScreen.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as useLotModule from './useLot';
import { LotDetailScreen } from './LotDetailScreen';
import type { Lot } from './types';

vi.mock('./useLot');
vi.mock('./AdvanceStageSheet', () => ({ AdvanceStageSheet: () => null }));
vi.mock('./HarvestSheet', () => ({ HarvestSheet: () => null }));
vi.mock('./RaleoSheet', () => ({ RaleoSheet: () => null }));

const makeLot = (overrides: Partial<Lot>): Lot => ({
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
  ...overrides,
});

const mockRetry = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof useLotModule.useLot>>) {
  vi.mocked(useLotModule.useLot).mockReturnValue({
    lot: undefined,
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
    ...overrides,
  } as ReturnType<typeof useLotModule.useLot>);
}

function renderScreen(id = 'lot1') {
  return render(
    <MemoryRouter initialEntries={[`/lotes/${id}`]}>
      <Routes>
        <Route path="/lotes/:id" element={<LotDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LotDetailScreen', () => {
  it('muestra skeleton cuando isLoading', () => {
    mockHook({ isLoading: true });
    renderScreen();
    expect(document.querySelector('[data-testid="detail-skeleton"]')).toBeInTheDocument();
  });

  it('muestra error state cuando isError', () => {
    mockHook({ isError: true });
    renderScreen();
    expect(screen.getByText('No pudimos cargar el lote')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra "Lote no encontrado" cuando lot es null', () => {
    mockHook({ lot: null });
    renderScreen();
    expect(screen.getByText('Lote no encontrado')).toBeInTheDocument();
  });

  it('muestra el nombre y la etapa del lote', () => {
    mockHook({ lot: makeLot({}) });
    renderScreen();
    expect(screen.getByText('Milena Norte')).toBeInTheDocument();
    expect(screen.getByText('Almácigo')).toBeInTheDocument();
  });

  it('muestra stats de plantas', () => {
    mockHook({ lot: makeLot({}) });
    renderScreen();
    expect(screen.getByText('Sembradas')).toBeInTheDocument();
    expect(screen.getByText('En producción')).toBeInTheDocument();
  });

  it('botón "Avanzar etapa" está habilitado en almacigo', () => {
    mockHook({ lot: makeLot({ stage: 'almacigo' }) });
    renderScreen();
    const btn = screen.getByRole('button', { name: /Avanzar etapa/ });
    expect(btn).not.toBeDisabled();
  });

  it('botón "Avanzar etapa" está deshabilitado en cosecha', () => {
    mockHook({ lot: makeLot({ stage: 'cosecha' }) });
    renderScreen();
    const btn = screen.getByRole('button', { name: /Avanzar etapa/ });
    expect(btn).toBeDisabled();
  });

  it('muestra historial de etapas', () => {
    const lot = makeLot({
      stageHistory: [
        { stage: 'almacigo', date: '2026-01-15' },
        { stage: 'transplante', date: '2026-02-01' },
      ],
    });
    mockHook({ lot });
    renderScreen();
    expect(screen.getByText('Historial de etapas')).toBeInTheDocument();
    expect(screen.getAllByText(/Almácigo|Transplante/).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/LotDetailScreen.test.tsx
```

- [ ] **Step 3: Crear `src/features/lotes/LotDetailScreen.tsx`**

```tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLot } from './useLot';
import { AdvanceStageSheet } from './AdvanceStageSheet';
import { HarvestSheet } from './HarvestSheet';
import { RaleoSheet } from './RaleoSheet';
import { STAGE_LABELS, STAGE_CSS_VAR } from './stages';
import { formatDate, toPlants } from './plants';
import styles from './LotDetailScreen.module.css';

type ActiveSheet = 'advance' | 'harvest' | 'raleo' | null;

export function LotDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lot, isLoading, isError, retry } = useLot(id!);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  if (isLoading) {
    return <div className={styles.skeleton} data-testid="detail-skeleton" />;
  }

  if (isError) {
    return (
      <section className={styles.errorRoot}>
        <p className={styles.errorTitle}>No pudimos cargar el lote</p>
        <button className={styles.retryBtn} onClick={retry}>Reintentar</button>
      </section>
    );
  }

  if (!lot) {
    return (
      <section className={styles.errorRoot}>
        <p className={styles.errorTitle}>Lote no encontrado</p>
        <button className={styles.retryBtn} onClick={() => navigate('/lotes')}>
          Volver a Lotes
        </button>
      </section>
    );
  }

  const isCosecha = lot.stage === 'cosecha';
  const locationText = lot.location
    ? `INV-${lot.location.invernadero} · ${lot.location.tipo} ${lot.location.identificador}`
    : null;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/lotes')}>
          ← Lotes
        </button>
        <button className={styles.editBtn} onClick={() => navigate(`/lotes/${id}/editar`)}>
          Editar
        </button>
      </div>

      {/* Stage + nombre */}
      <p className={styles.stageLabel} style={{ color: STAGE_CSS_VAR[lot.stage] }}>
        {STAGE_LABELS[lot.stage]}
      </p>
      <h1 className={styles.name}>{lot.name}</h1>
      {locationText && <p className={styles.location}>{locationText}</p>}
      <p className={styles.date}>Sembrado {formatDate(lot.date)}</p>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Sembradas</p>
          <p className={styles.statValue}>{toPlants(lot.quantity).toLocaleString('es-CL')}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>En producción</p>
          <p className={styles.statValue}>{lot.currentQuantity.toLocaleString('es-CL')}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Variedad</p>
          <p className={styles.statValue}>{lot.variety || '—'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsRow}>
        <button
          className={styles.actionBtn}
          onClick={() => setActiveSheet('advance')}
          disabled={isCosecha}
        >
          Avanzar etapa
        </button>
        {(lot.stage === 'transplante' || lot.stage === 'raleo') && (
          <button className={styles.actionBtn} onClick={() => setActiveSheet('raleo')}>
            Registrar raleo
          </button>
        )}
        {lot.stage === 'raleo' && (
          <button className={styles.actionBtnPrimary} onClick={() => setActiveSheet('harvest')}>
            Registrar cosecha
          </button>
        )}
      </div>

      {/* Stage history */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Historial de etapas</p>
        {lot.stageHistory.map((entry, i) => (
          <div key={i} className={styles.historyItem}>
            <p className={styles.historyStage} style={{ color: STAGE_CSS_VAR[entry.stage] }}>
              {STAGE_LABELS[entry.stage]}
            </p>
            <p className={styles.historyDate}>{formatDate(entry.date)}</p>
          </div>
        ))}
      </div>

      {/* Raleo history */}
      {lot.raleos.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Raleos ({lot.raleos.length})</p>
          {lot.raleos.map((r, i) => (
            <div key={i} className={styles.historyItem}>
              <p className={styles.historyStage}>{r.cantidadRaleada.toLocaleString('es-CL')} plantas</p>
              <p className={styles.historyDate}>{formatDate(r.fecha)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sheets */}
      {activeSheet === 'advance' && (
        <AdvanceStageSheet lot={lot} onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'harvest' && (
        <HarvestSheet lotId={lot.id} onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'raleo' && (
        <RaleoSheet lot={lot} onClose={() => setActiveSheet(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/features/lotes/LotDetailScreen.module.css`**

```css
.root {
  padding: 0 16px 100px;
}

.skeleton {
  height: 100vh;
  background: var(--bg-card-h);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.errorRoot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
  padding: 32px;
}

.errorTitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
  text-align: center;
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 20px;
}

.backBtn {
  font-size: 14px;
  font-weight: 500;
  color: var(--green);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.editBtn {
  font-size: 14px;
  font-weight: 500;
  color: var(--green);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.stageLabel {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.name {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 4px;
}

.location {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 3px;
}

.date {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 20px;
}

.statsRow {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 14px;
  margin-bottom: 16px;
}

.stat { min-width: 0; }

.statLabel {
  font-size: 11px;
  color: var(--text-2);
  margin-bottom: 3px;
}

.statValue {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  font-family: 'DM Mono', monospace;
}

.actionsRow {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.actionBtn {
  padding: 13px;
  border-radius: 12px;
  border: 0.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-1);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.actionBtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.actionBtnPrimary {
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: var(--green);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.section {
  margin-bottom: 24px;
}

.sectionTitle {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-2);
  margin-bottom: 10px;
}

.historyItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  margin-bottom: 6px;
}

.historyStage {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
}

.historyDate {
  font-size: 12px;
  color: var(--text-3);
}
```

- [ ] **Step 5: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/LotDetailScreen.test.tsx
```

Esperado: PASS (8 tests).

- [ ] **Step 6: Commit**

```
git add src/features/lotes/LotDetailScreen.tsx src/features/lotes/LotDetailScreen.module.css src/features/lotes/LotDetailScreen.test.tsx
git commit -m "feat(lotes): LotDetailScreen — vista detalle con acciones y historial"
```

---

## Task 6: Action Sheets — AdvanceStageSheet, HarvestSheet, RaleoSheet (smoke tests)

**Files:**
- Create: `src/features/lotes/AdvanceStageSheet.tsx` + `.module.css` + `.test.tsx`
- Create: `src/features/lotes/HarvestSheet.tsx` + `.module.css` + `.test.tsx`
- Create: `src/features/lotes/RaleoSheet.tsx` + `.module.css` + `.test.tsx`

Los sheets son bottom drawers (position fixed, bottom 0) que se montan condicionalmente desde LotDetailScreen. Cada sheet tiene un formulario simple y un botón de submit que llama al mutation hook correspondiente.

**AdvanceStageSheet:** recibe `lot` (para calcular el siguiente stage: STAGE_ORDER[indexOf+1]). Campos: fecha (date, default hoy), cantidadActual (number, opcional), notas (text, opcional). Botón "Avanzar a {nextStage}".

**HarvestSheet:** recibe `lotId`. Campos: fecha (date, default hoy), notas (text, opcional). Botón "Confirmar cosecha".

**RaleoSheet:** recibe `lot`. Campos: cantidadRaleada (number, required), fecha (date, default hoy). Botón "Registrar raleo".

- [ ] **Step 1: Escribir tests fallidos para los tres sheets**

`src/features/lotes/AdvanceStageSheet.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { AdvanceStageSheet } from './AdvanceStageSheet';
import type { Lot } from './types';

vi.mock('./useLotMutations');

const fakeLot: Lot = {
  id: 'lot1', name: 'Milena', date: '2026-01-01', stage: 'almacigo',
  variety: '', quantity: 10, currentQuantity: 1350, location: null,
  stageHistory: [], raleos: [], childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('AdvanceStageSheet', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useAdvanceStage).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useAdvanceStage>);
  });

  it('renderiza sin crash', () => {
    render(
      <AdvanceStageSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Avanzar a/)).toBeInTheDocument();
  });

  it('muestra el next stage correcto (almacigo → transplante)', () => {
    render(
      <AdvanceStageSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Transplante/i)).toBeInTheDocument();
  });

  it('botón cerrar llama onClose', () => {
    const onClose = vi.fn();
    render(
      <AdvanceStageSheet lot={fakeLot} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    screen.getByRole('button', { name: /cancelar/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
```

`src/features/lotes/HarvestSheet.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { HarvestSheet } from './HarvestSheet';

vi.mock('./useLotMutations');

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('HarvestSheet', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useRegisterHarvest).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useRegisterHarvest>);
  });

  it('renderiza sin crash', () => {
    render(
      <HarvestSheet lotId="lot1" onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Confirmar cosecha/i)).toBeInTheDocument();
  });

  it('botón cancelar llama onClose', () => {
    const onClose = vi.fn();
    render(
      <HarvestSheet lotId="lot1" onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    screen.getByRole('button', { name: /cancelar/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
```

`src/features/lotes/RaleoSheet.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { RaleoSheet } from './RaleoSheet';
import type { Lot } from './types';

vi.mock('./useLotMutations');

const fakeLot: Lot = {
  id: 'lot1', name: 'Milena', date: '2026-01-01', stage: 'raleo',
  variety: '', quantity: 10, currentQuantity: 2500, location: null,
  stageHistory: [], raleos: [], childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('RaleoSheet', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useRegisterRaleo).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useRegisterRaleo>);
  });

  it('renderiza sin crash', () => {
    render(
      <RaleoSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Registrar raleo/i)).toBeInTheDocument();
  });

  it('muestra la cantidad actual disponible', () => {
    render(
      <RaleoSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/2\.500|2500/)).toBeInTheDocument();
  });

  it('botón cancelar llama onClose', () => {
    const onClose = vi.fn();
    render(
      <RaleoSheet lot={fakeLot} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    screen.getByRole('button', { name: /cancelar/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/AdvanceStageSheet.test.tsx src/features/lotes/HarvestSheet.test.tsx src/features/lotes/RaleoSheet.test.tsx
```

- [ ] **Step 3: Crear los tres sheets**

`src/features/lotes/AdvanceStageSheet.tsx`:
```tsx
import { useState } from 'react';
import { STAGE_ORDER, STAGE_LABELS } from './stages';
import { useAdvanceStage } from './useLotMutations';
import type { Lot } from './types';
import styles from './AdvanceStageSheet.module.css';

interface Props {
  lot: Lot;
  onClose: () => void;
}

export function AdvanceStageSheet({ lot, onClose }: Props) {
  const currentIdx = STAGE_ORDER.indexOf(lot.stage);
  const nextStage = STAGE_ORDER[currentIdx + 1] ?? 'cosecha';
  const nextLabel = STAGE_LABELS[nextStage];
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { mutateAsync, isPending } = useAdvanceStage(lot.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      newStage: nextStage,
      date,
      ...(quantity ? { quantity: Number(quantity) } : {}),
      ...(notes ? { notes } : {}),
    });
    onClose();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <p className={styles.title}>Avanzar a {nextLabel}</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Fecha
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={styles.input} required
            />
          </label>
          <label className={styles.label}>
            Cantidad actual (opcional)
            <input
              type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className={styles.input} placeholder="plantas"
            />
          </label>
          <label className={styles.label}>
            Notas (opcional)
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className={styles.input}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Guardando…' : `Avanzar a ${nextLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

`src/features/lotes/AdvanceStageSheet.module.css`:
```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: var(--bg);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px 40px;
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 20px;
  text-align: center;
}

.form { display: flex; flex-direction: column; gap: 14px; }

.label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.input {
  padding: 12px;
  border-radius: 10px;
  border: 0.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-1);
  font-size: 15px;
  width: 100%;
  box-sizing: border-box;
}

.actions { display: flex; gap: 10px; margin-top: 6px; }

.cancelBtn {
  flex: 1;
  padding: 13px;
  border-radius: 12px;
  border: 0.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-1);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.submitBtn {
  flex: 1;
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: var(--green);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.submitBtn:disabled { opacity: 0.5; cursor: not-allowed; }
```

`src/features/lotes/HarvestSheet.tsx`:
```tsx
import { useState } from 'react';
import { useRegisterHarvest } from './useLotMutations';
import styles from './HarvestSheet.module.css';

interface Props {
  lotId: string;
  onClose: () => void;
}

export function HarvestSheet({ lotId, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');

  const { mutateAsync, isPending } = useRegisterHarvest(lotId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({ date, ...(notes ? { notes } : {}) });
    onClose();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <p className={styles.title}>Registrar cosecha</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Fecha de cosecha
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={styles.input} required
            />
          </label>
          <label className={styles.label}>
            Notas (opcional)
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className={styles.input}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Confirmar cosecha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

`src/features/lotes/HarvestSheet.module.css` — igual que `AdvanceStageSheet.module.css` (copiar el CSS exacto).

`src/features/lotes/RaleoSheet.tsx`:
```tsx
import { useState } from 'react';
import { useRegisterRaleo } from './useLotMutations';
import type { Lot } from './types';
import styles from './RaleoSheet.module.css';

interface Props {
  lot: Lot;
  onClose: () => void;
}

export function RaleoSheet({ lot, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [cantidadRaleada, setCantidad] = useState<string>('');
  const [fecha, setFecha] = useState(today);

  const { mutateAsync, isPending } = useRegisterRaleo(lot.id, lot.currentQuantity);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({ cantidadRaleada: Number(cantidadRaleada), fecha });
    onClose();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <p className={styles.title}>Registrar raleo</p>
        <p className={styles.subtitle}>
          En producción: {lot.currentQuantity.toLocaleString('es-CL')} plantas
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Cantidad raleada (plantas)
            <input
              type="number" value={cantidadRaleada}
              onChange={(e) => setCantidad(e.target.value)}
              className={styles.input} required min="1"
              max={lot.currentQuantity}
            />
          </label>
          <label className={styles.label}>
            Fecha
            <input
              type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className={styles.input} required
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Registrar raleo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

`src/features/lotes/RaleoSheet.module.css` — igual que `AdvanceStageSheet.module.css`.

- [ ] **Step 4: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/AdvanceStageSheet.test.tsx src/features/lotes/HarvestSheet.test.tsx src/features/lotes/RaleoSheet.test.tsx
```

Esperado: PASS (8 tests total — 3 + 2 + 3).

- [ ] **Step 5: Commit**

```
git add src/features/lotes/AdvanceStageSheet.tsx src/features/lotes/AdvanceStageSheet.module.css src/features/lotes/AdvanceStageSheet.test.tsx src/features/lotes/HarvestSheet.tsx src/features/lotes/HarvestSheet.module.css src/features/lotes/HarvestSheet.test.tsx src/features/lotes/RaleoSheet.tsx src/features/lotes/RaleoSheet.module.css src/features/lotes/RaleoSheet.test.tsx
git commit -m "feat(lotes): AdvanceStageSheet + HarvestSheet + RaleoSheet — action bottom sheets"
```

---

## Task 7: CreateLotScreen (smoke tests)

**Files:**
- Create: `src/features/lotes/CreateLotScreen.test.tsx`
- Create: `src/features/lotes/CreateLotScreen.tsx`
- Create: `src/features/lotes/CreateLotScreen.module.css`

Formulario para crear un nuevo lote. Navega a `/lotes` al crear con éxito.
Campos: nombre (required), variedad (required), bandejas (number, required), fecha (date, default hoy), invernadero (A o B), tipo de cultivo (piscina/tubo/canal), identificador (text).

- [ ] **Step 1: Escribir tests fallidos en `src/features/lotes/CreateLotScreen.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { CreateLotScreen } from './CreateLotScreen';

vi.mock('./useLotMutations');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, createElement(MemoryRouter, {}, children));
}

describe('CreateLotScreen', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useCreateLot).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue('new-id'),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useCreateLot>);
  });

  it('renderiza el formulario', () => {
    render(<CreateLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByText('Nuevo lote')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/variedad/i)).toBeInTheDocument();
  });

  it('muestra botón "Crear lote"', () => {
    render(<CreateLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: /crear lote/i })).toBeInTheDocument();
  });

  it('botón cancelar navega a /lotes', () => {
    render(<CreateLotScreen />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/lotes');
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/CreateLotScreen.test.tsx
```

- [ ] **Step 3: Crear `src/features/lotes/CreateLotScreen.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLot } from './useLotMutations';
import styles from './CreateLotScreen.module.css';

export function CreateLotScreen() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(today);
  const [invernadero, setInvernadero] = useState<'A' | 'B'>('A');
  const [tipo, setTipo] = useState('piscina');
  const [identificador, setIdentificador] = useState('');

  const { mutateAsync, isPending } = useCreateLot();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      name,
      variety,
      date,
      quantity: Number(quantity),
      location: { invernadero, tipo, identificador },
    });
    navigate('/lotes');
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.cancelBtn} onClick={() => navigate('/lotes')}>Cancelar</button>
        <h1 className={styles.title}>Nuevo lote</h1>
        <span />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="name">
          Nombre
          <input
            id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={styles.input} placeholder="ej. Milena Norte" required
          />
        </label>

        <label className={styles.label} htmlFor="variety">
          Variedad
          <input
            id="variety" type="text" value={variety} onChange={(e) => setVariety(e.target.value)}
            className={styles.input} placeholder="ej. Milena" required
          />
        </label>

        <label className={styles.label} htmlFor="quantity">
          Bandejas
          <input
            id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className={styles.input} placeholder="ej. 21" required min="1"
          />
        </label>

        <label className={styles.label} htmlFor="date">
          Fecha de siembra
          <input
            id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className={styles.input} required
          />
        </label>

        <p className={styles.groupLabel}>Ubicación</p>

        <label className={styles.label} htmlFor="invernadero">
          Invernadero
          <select
            id="invernadero" value={invernadero}
            onChange={(e) => setInvernadero(e.target.value as 'A' | 'B')}
            className={styles.input}
          >
            <option value="A">Invernadero A</option>
            <option value="B">Invernadero B</option>
          </select>
        </label>

        <label className={styles.label} htmlFor="tipo">
          Tipo
          <select
            id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}
            className={styles.input}
          >
            <option value="piscina">Piscina</option>
            <option value="tubo">Tubo</option>
            <option value="canal">Canal</option>
          </select>
        </label>

        <label className={styles.label} htmlFor="identificador">
          Identificador
          <input
            id="identificador" type="text" value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            className={styles.input} placeholder="ej. P01" required
          />
        </label>

        <button type="submit" className={styles.submitBtn} disabled={isPending}>
          {isPending ? 'Creando…' : 'Crear lote'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/features/lotes/CreateLotScreen.module.css`**

```css
.root {
  padding: 0 16px 80px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 24px;
}

.cancelBtn {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.groupLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 6px;
  padding-bottom: 4px;
  border-bottom: 0.5px solid var(--sep);
}

.input {
  padding: 13px;
  border-radius: 10px;
  border: 0.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-1);
  font-size: 15px;
  width: 100%;
  box-sizing: border-box;
}

.submitBtn {
  padding: 15px;
  border-radius: 12px;
  border: none;
  background: var(--green);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
}

.submitBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/CreateLotScreen.test.tsx
```

Esperado: PASS (3 tests).

- [ ] **Step 6: Commit**

```
git add src/features/lotes/CreateLotScreen.tsx src/features/lotes/CreateLotScreen.module.css src/features/lotes/CreateLotScreen.test.tsx
git commit -m "feat(lotes): CreateLotScreen — formulario nuevo lote"
```

---

## Task 8: EditLotScreen (smoke tests)

**Files:**
- Create: `src/features/lotes/EditLotScreen.test.tsx`
- Create: `src/features/lotes/EditLotScreen.tsx`
- Create: `src/features/lotes/EditLotScreen.module.css`

Formulario pre-llenado para editar nombre, variedad y ubicación. Lee el lote via `useLot(id)`. Al guardar navega a `/lotes/:id`.

- [ ] **Step 1: Escribir tests fallidos en `src/features/lotes/EditLotScreen.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotModule from './useLot';
import * as useLotMutationsModule from './useLotMutations';
import { EditLotScreen } from './EditLotScreen';
import type { Lot } from './types';

vi.mock('./useLot');
vi.mock('./useLotMutations');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeLot: Lot = {
  id: 'lot1', name: 'Milena Norte', date: '2026-01-01', stage: 'almacigo',
  variety: 'Milena', quantity: 21, currentQuantity: 2700,
  location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
  stageHistory: [], raleos: [], childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider, { client: qc },
      createElement(MemoryRouter, { initialEntries: ['/lotes/lot1/editar'] },
        createElement(Routes, {},
          createElement(Route, { path: '/lotes/:id/editar', element: children as React.ReactElement })
        )
      )
    );
}

describe('EditLotScreen', () => {
  beforeEach(() => {
    vi.mocked(useLotModule.useLot).mockReturnValue({
      lot: fakeLot, isLoading: false, isError: false, error: null, retry: vi.fn(),
    } as ReturnType<typeof useLotModule.useLot>);
    vi.mocked(useLotMutationsModule.useUpdateLot).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useUpdateLot>);
  });

  it('renderiza el formulario con datos pre-llenados', () => {
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByDisplayValue('Milena Norte')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Milena')).toBeInTheDocument();
  });

  it('muestra el botón "Guardar cambios"', () => {
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('botón cancelar navega a /lotes/:id', () => {
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/lotes/lot1');
  });

  it('muestra skeleton si isLoading', () => {
    vi.mocked(useLotModule.useLot).mockReturnValue({
      lot: undefined, isLoading: true, isError: false, error: null, retry: vi.fn(),
    } as ReturnType<typeof useLotModule.useLot>);
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    expect(document.querySelector('[data-testid="edit-skeleton"]')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr tests — confirmar que fallan**

```
pnpm test:run src/features/lotes/EditLotScreen.test.tsx
```

- [ ] **Step 3: Crear `src/features/lotes/EditLotScreen.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLot } from './useLot';
import { useUpdateLot } from './useLotMutations';
import styles from './EditLotScreen.module.css';

export function EditLotScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lot, isLoading } = useLot(id!);
  const { mutateAsync, isPending } = useUpdateLot(id!);

  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [invernadero, setInvernadero] = useState<'A' | 'B'>('A');
  const [tipo, setTipo] = useState('piscina');
  const [identificador, setIdentificador] = useState('');

  useEffect(() => {
    if (lot) {
      setName(lot.name);
      setVariety(lot.variety);
      if (lot.location) {
        setInvernadero(lot.location.invernadero as 'A' | 'B');
        setTipo(lot.location.tipo);
        setIdentificador(lot.location.identificador);
      }
    }
  }, [lot]);

  if (isLoading) {
    return <div className={styles.skeleton} data-testid="edit-skeleton" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      name,
      variety,
      location: { invernadero, tipo, identificador },
    });
    navigate(`/lotes/${id}`);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.cancelBtn} onClick={() => navigate(`/lotes/${id}`)}>Cancelar</button>
        <h1 className={styles.title}>Editar lote</h1>
        <span />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="name">
          Nombre
          <input
            id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={styles.input} required
          />
        </label>

        <label className={styles.label} htmlFor="variety">
          Variedad
          <input
            id="variety" type="text" value={variety} onChange={(e) => setVariety(e.target.value)}
            className={styles.input} required
          />
        </label>

        <p className={styles.groupLabel}>Ubicación</p>

        <label className={styles.label} htmlFor="invernadero">
          Invernadero
          <select
            id="invernadero" value={invernadero}
            onChange={(e) => setInvernadero(e.target.value as 'A' | 'B')}
            className={styles.input}
          >
            <option value="A">Invernadero A</option>
            <option value="B">Invernadero B</option>
          </select>
        </label>

        <label className={styles.label} htmlFor="tipo">
          Tipo
          <select
            id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}
            className={styles.input}
          >
            <option value="piscina">Piscina</option>
            <option value="tubo">Tubo</option>
            <option value="canal">Canal</option>
          </select>
        </label>

        <label className={styles.label} htmlFor="identificador">
          Identificador
          <input
            id="identificador" type="text" value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            className={styles.input} required
          />
        </label>

        <button type="submit" className={styles.submitBtn} disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/features/lotes/EditLotScreen.module.css`** — idéntico a `CreateLotScreen.module.css` más:

```css
/* Mismos estilos que CreateLotScreen.module.css */
.root { padding: 0 16px 80px; }
.skeleton { height: 100vh; background: var(--bg-card-h); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0 24px; }
.cancelBtn { font-size: 14px; font-weight: 500; color: var(--text-2); background: none; border: none; cursor: pointer; padding: 0; }
.title { font-size: 17px; font-weight: 700; color: var(--text-1); }
.form { display: flex; flex-direction: column; gap: 16px; }
.label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.03em; }
.groupLabel { font-size: 12px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 6px; padding-bottom: 4px; border-bottom: 0.5px solid var(--sep); }
.input { padding: 13px; border-radius: 10px; border: 0.5px solid var(--border); background: var(--bg-card); color: var(--text-1); font-size: 15px; width: 100%; box-sizing: border-box; }
.submitBtn { padding: 15px; border-radius: 12px; border: none; background: var(--green); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
.submitBtn:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 5: Correr tests — confirmar que pasan**

```
pnpm test:run src/features/lotes/EditLotScreen.test.tsx
```

Esperado: PASS (4 tests).

- [ ] **Step 6: Commit**

```
git add src/features/lotes/EditLotScreen.tsx src/features/lotes/EditLotScreen.module.css src/features/lotes/EditLotScreen.test.tsx
git commit -m "feat(lotes): EditLotScreen — formulario edición de lote"
```

---

## Task 9: Router wiring + verificación final

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Actualizar `src/router.tsx`**

Reemplazar el archivo completo:

```tsx
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicRoute } from '@/features/auth/PublicRoute';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppShell } from '@/shared/components/AppShell';
import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';
import { MasMenu } from '@/shared/components/MasMenu';
import { LotesScreen } from '@/features/lotes/LotesScreen';
import { LotDetailScreen } from '@/features/lotes/LotDetailScreen';
import { CreateLotScreen } from '@/features/lotes/CreateLotScreen';
import { EditLotScreen } from '@/features/lotes/EditLotScreen';

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
      { path: 'lotes',            element: <LotesScreen /> },
      { path: 'lotes/nuevo',      element: <CreateLotScreen /> },
      { path: 'lotes/:id',        element: <LotDetailScreen /> },
      { path: 'lotes/:id/editar', element: <EditLotScreen /> },
      { path: 'dashboard',  element: <PlaceholderScreen name="Dashboard" /> },
      { path: 'alertas',    element: <PlaceholderScreen name="Alertas" /> },
      { path: 'produccion', element: <PlaceholderScreen name="Producción" /> },
      { path: 'mas',        element: <MasMenu /> },
      { path: 'mas/:screen', element: <MasSubScreen /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

**IMPORTANTE:** La ruta `lotes/nuevo` debe ir ANTES de `lotes/:id` para que React Router no interprete "nuevo" como un id de lote.

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

Esperado: todos los tests pasan (81 previos + nuevos del sprint). Anotar el total.

- [ ] **Step 5: Commit final**

```
git add src/router.tsx
git commit -m "feat(lotes): wire Sprint 3 — LotDetail, CreateLot, EditLot into router — Sprint 3 completo"
```

---

## Resumen de criterios de aceptación

| Check | Comando | Esperado |
|-------|---------|----------|
| TypeScript | `pnpm typecheck` | 0 errores |
| Linter | `pnpm lint` | 0 errores, 0 warnings |
| Tests | `pnpm test:run` | todos pasan (81+ nuevos) |
| Manual | — | /lotes/:id muestra detalle real, botones abren sheets, /lotes/nuevo crea lote, /lotes/:id/editar edita lote |
