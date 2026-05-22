# Fase A — Sprint 2: Pantalla Lotes con Firestore real

**Fecha:** 2026-05-22
**Estado:** Diseño aprobado, listo para plan de implementación
**Proyecto:** Nalhuitad (migración Fase A del stack legacy)
**Repo:** `C:\nalhuitad-vite\`

---

## 1. Objetivo

Primer screen de Fase A que lee datos reales de Firestore. Mostrar la lista de lotes de la operación con un dashboard panorámico, sincronizando en tiempo real con la colección `lotes` del proyecto `nalhuitad-d6758`. Sprint 2 es lectura pura — sin escrituras.

La app legacy en `C:\nalhuitad-app\www\index.html` permanece intocada y en producción durante esta fase.

## 2. Decisiones aprobadas en brainstorming

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Scope | MVP + dashboard header. Sin CRUD, sin sort selector, sin ISL, sin alertas overdue, sin progreso de raleo en tarjeta |
| 2 | Fetch | `onSnapshot` real-time listener |
| 3 | Offline | Firestore IndexedDB cache (`persistentLocalCache`) |
| 4 | Estado | `useQuery` + `setQueryData` alimentado desde el listener |
| 5 | Capacidad instalada | Constante hardcoded `3756` (Inv A 2.016 + Inv B 1.740) |
| 6 | Empty state | CTA navega a `/mas/nuevo` (placeholder existente) |
| 7 | Error state | Card con botón "Reintentar" que reinvalida la query |
| 8 | LotCard MVP | Stage badge + nombre/ubicación/fecha + stats inferiores |
| 9 | Tap en card | Navega a `/lotes/:id` (placeholder de detalle) |
| 10 | Cosechados | Sección separada al final de la lista |
| 11 | Testing | TDD para hook + lógica; smoke para componentes UI |
| 12 | Estructura | Plano dentro de `features/lotes/` (igual que `auth/`) |
| 13 | Factor almácigo→planta | `135` plantas por bandeja (`PLANTS_PER_TRAY_DEFAULT`) |

## 3. Fuera de scope (deliberado)

- Crear / editar / eliminar lote (Sprint 3+)
- Pantalla de detalle real `/lotes/:id` (Sprint 3+)
- Sort selector (6 modos del legacy)
- ISL, alertas overdue/warning, progreso de raleo en la tarjeta
- Fecha estimada de cosecha en la tarjeta
- Capacidad instalada editable / persistida en Firestore
- Toggle dark/light (ya diferido desde Sprint 1)
- Iconos definitivos (lucide-react u otra lib)

## 4. Estructura de archivos

### `src/features/lotes/` (nuevo)

```
src/features/lotes/
├── types.ts                      ← Lot, LotDoc, Stage, StageHistoryEntry, RaleoEntry, Location
├── stages.ts                     ← STAGE_LABELS, STAGE_CSS_VAR, STAGE_ORDER
├── plants.ts                     ← toPlants(trays), daysSince(iso)
├── plants.test.ts
├── aggregations.ts               ← countByStage, totalEnProduccion, pctCapacidad
├── aggregations.test.ts
├── lotesApi.ts                   ← normalizeLot, subscribeLotes
├── lotesApi.test.ts
├── useLotes.ts                   ← React Query + onSnapshot bridge
├── useLotes.test.ts
├── LotesScreen.tsx               ← container: orquesta useLotes + sub-componentes
├── LotesScreen.module.css
├── LotesScreen.test.tsx
├── LotesDashboard.tsx            ← donut SVG + barras + contadores por etapa
├── LotesDashboard.module.css
├── LotesDashboard.test.tsx
├── LotCard.tsx                   ← card individual para lotes activos
├── LotCard.module.css
├── LotCard.test.tsx
├── CosechadoCard.tsx             ← variante muted para lotes cosechados
├── CosechadoCard.module.css
├── EmptyState.tsx                ← "Sin lotes registrados" + CTA
├── EmptyState.module.css
├── ErrorState.tsx                ← "No pudimos cargar los lotes" + Reintentar
└── ErrorState.module.css
```

### Archivos existentes modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/firebase.ts` | Reemplazar `getFirestore` por `initializeFirestore` con `persistentLocalCache` |
| `src/router.tsx` | `lotes` → `<LotesScreen />`; agregar `lotes/:id` → `<PlaceholderScreen name="Detalle lote" />` |
| `src/tests/setup.ts` | Agregar mock de `firebase/firestore` al mock centralizado |

### Sin nuevas dependencias

`firebase` y `@tanstack/react-query` ya están instalados. No se agregan paquetes.

## 5. Modelo de datos

### `types.ts`

```ts
export type Stage = 'almacigo' | 'transplante' | 'raleo' | 'cosecha';

export interface Location {
  invernadero: string;
  tipo: string;
  identificador: string;
}

export interface StageHistoryEntry {
  stage: Stage;
  date: string;        // ISO YYYY-MM-DD
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
  quantity?: number;           // bandejas de almácigo
  currentQuantity?: number;    // plantas vivas hoy
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
  currentQuantity: number;     // currentQuantity ?? toPlants(quantity)
  location: Location | null;
  stageHistory: StageHistoryEntry[];
  raleos: RaleoEntry[];
  childrenIds: string[];
}
```

### `plants.ts`

```ts
export const PLANTS_PER_TRAY_DEFAULT = 135; // bandejas de almácigo → plantas

export function toPlants(trays: number): number {
  return Math.round((trays ?? 0) * PLANTS_PER_TRAY_DEFAULT);
}

export function daysSince(iso: string): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
```

### `stages.ts`

```ts
import type { Stage } from './types';

export const STAGE_ORDER: Stage[] = ['almacigo', 'transplante', 'raleo', 'cosecha'];

export const STAGE_LABELS: Record<Stage, string> = {
  almacigo:   'Almácigo',
  transplante: 'Transplante',
  raleo:      'Raleo',
  cosecha:    'Cosecha',
};

export const STAGE_CSS_VAR: Record<Stage, string> = {
  almacigo:   'var(--stage-a)',
  transplante: 'var(--stage-t)',
  raleo:      'var(--stage-r)',
  cosecha:    'var(--stage-c)',
};
```

### `aggregations.ts`

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

## 6. Capa de datos

### `src/lib/firebase.ts` — persistencia offline

Reemplazar `getFirestore` por `initializeFirestore` con `persistentLocalCache`:

```ts
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

El export `db` mantiene el mismo nombre — ningún otro código existente se rompe. Si `persistentLocalCache` falla (Safari privado, cuota), Firestore degrada silenciosamente a memoria.

### `lotesApi.ts`

```ts
import { collection, onSnapshot, type Unsubscribe, type FirestoreError } from 'firebase/firestore';
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

### `useLotes.ts`

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLotes } from './lotesApi';
import type { Lot } from './types';

export const LOTES_QUERY_KEY = ['lotes'] as const;

export function useLotes() {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    qc.resetQueries({ queryKey: LOTES_QUERY_KEY });
    return subscribeLotes(
      (lots) => qc.setQueryData<Lot[]>(LOTES_QUERY_KEY, lots),
      (err) => {
        qc.getQueryCache()
          .find({ queryKey: LOTES_QUERY_KEY })
          ?.setState({ status: 'error', error: err });
      },
    );
  }, [qc, retryCount]); // retryCount como dependencia reinicia el listener

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);

  const query = useQuery<Lot[]>({
    queryKey: LOTES_QUERY_KEY,
    queryFn:  () => new Promise<Lot[]>(() => {}), // nunca resuelve; listener provee datos
    staleTime: Infinity,
    gcTime:    Infinity,
  });

  return { ...query, retry };
}
```

**Por qué `queryFn` nunca resuelve:** el listener es la única fuente de verdad. `useQuery` queda en `pending` hasta que el primer `setQueryData` del listener lo flipea a `success`. `staleTime: Infinity` evita refetches redundantes.

**Retry:** cuando Firestore emite un error, el listener queda muerto (el SDK no reintenta automáticamente en ese path). `retry()` incrementa `retryCount`, lo que hace que el `useEffect` limpie la suscripción vieja (`unsubscribe`) y registre una nueva. `qc.resetQueries` en el efecto devuelve el query a estado `pending` antes de que llegue el nuevo snapshot.

## 7. Componentes UI

### `LotesScreen.tsx`

```
isLoading → <SkeletonList />  (3 cards grises con animación pulse)
isError   → <ErrorState onRetry={retry} />
data === []→ <EmptyState />
else      → <LotesDashboard lots={activeLots} />
             sección "En curso · N lotes" → lista de <LotCard>
             sección "Cosechados · N"     → lista de <CosechadoCard>
```

`const { data, isLoading, isError, retry } = useLotes();`

`SkeletonList` es inline en `LotesScreen` (3 `<div>` con `height:88px`, `borderRadius:14`, `background:var(--bg-card-h)`, animación `pulse` de `global.css`).

### `LotesDashboard.tsx`

Card `--bg-card` con tres bloques verticales separados por `var(--sep)`:

**Bloque 1 — donut + contadores:**
- SVG donut de dos anillos (80×80px):
  - Anillo exterior (r=34, strokeWidth=5): porcentaje de capacidad instalada, arco `var(--green)`.
  - Anillo interior (r=24, strokeWidth=11): distribución por etapa activa, segmentos `var(--stage-*)`.
  - Texto central: `totalActivo` (formato `3.7k` si > 999).
- A la derecha: label "Total en producción", número grande monospace, "N lotes activos", leyenda dot+label+número por etapa activa.

**Bloque 2 — barras de distribución:**
- Una barra por etapa activa: altura 5px, color `var(--stage-*)`, ancho = `count / totalActivo * 100%`.

**Bloque 3 — capacidad instalada:**
- Mini gauge SVG semicircular (arco `var(--green)` = `pctCapacidad%`).
- Texto: `"{totalActivo} de 3.756"`. Sin edición (hardcoded).

### `LotCard.tsx`

```
┌─────────────────────────────────────┐
│ ALMÁCIGO              (badge) 12d   │ ← stage label color + días en etapa
│ Milena Norte                        │ ← nombre, font-size 16, --text-1
│ INV-A · Piscina P01                 │ ← ubicación, --text-3, 11px (omitir si null)
│ Sembrado 15 mar 2026                │ ← formatDate(date), --text-2, 13px
├─────────────────────────────────────┤
│ Ciclo    Sembradas    En producción │
│  42d      2.835          2.310      │ ← Stat row
└─────────────────────────────────────┘
```

- Stage badge: texto `STAGE_LABELS[stage]` en `STAGE_CSS_VAR[stage]`, 11px uppercase, `letterSpacing: 0.03em`.
- Días en etapa: `daysSince(lot.stageHistory.at(-1)?.date ?? lot.date)`, badge `"{N}d"` top-right.
- Stats: "Ciclo total" = `daysSince(lot.date)`, "Sembradas" = `toPlants(lot.quantity)`, "En producción" = `lot.currentQuantity`. Todos con `.toLocaleString('es-CL')`.
- Toda la card es `<button>` que llama `navigate('/lotes/' + lot.id)`.
- `React.memo`.

### `CosechadoCard.tsx`

Variante simplificada de `LotCard`: solo nombre + etiqueta "Cosechado" + fecha (última entrada de `stageHistory`). Opacidad 0.55, sin stats footer, sin días en etapa, sin navegación (tap no hace nada por ahora).

### `EmptyState.tsx`

- Icono SVG (planta, mismo del legacy).
- "Sin lotes registrados" (17px, `--text-1`, bold).
- "Registrá tu primer lote para empezar el seguimiento." (14px, `--text-2`).
- Botón `+ Registrar primer lote` → `navigate('/mas/nuevo')`, `background: var(--green)`.

### `ErrorState.tsx`

- Icono ⚠ SVG.
- "No pudimos cargar los lotes" (15px, `--text-1`).
- "Revisá tu conexión e intentá de nuevo." (13px, `--text-2`).
- Botón "Reintentar" → `props.onRetry()`.

### `router.tsx` — cambios

```ts
{ path: 'lotes',    element: <LotesScreen /> },
{ path: 'lotes/:id', element: <PlaceholderScreen name="Detalle lote" /> },
```

La ruta `/mas/nuevo` ya existe vía `/mas/:screen` — sin cambio.

## 8. Manejo de errores

| Capa | Qué cubre | Respuesta |
|------|-----------|-----------|
| `onError` en `subscribeLotes` | Firestore rechaza suscripción (permisos, red, cuota) | Marca query como `error` → `<ErrorState>` |
| `onRetry` | Usuario toca "Reintentar" | `retry()` incrementa `retryCount` → `useEffect` limpia listener viejo y registra uno nuevo; `qc.resetQueries` devuelve query a `pending` |
| IndexedDB degrada silencioso | Safari privado, cuota llena | Firestore cae a memoria — app funciona sin mensaje de error |

Firestore Security Rules: sin cambio. El legacy ya permite leer `lotes` a usuarios autenticados; `onSnapshot` usa el mismo token Firebase.

## 9. Testing

### Estrategia

- **TDD rojo→verde** para toda lógica pura y el hook (`plants`, `aggregations`, `normalizeLot`, `subscribeLotes`, `useLotes`).
- **Smoke tests** para componentes UI (`LotCard`, `LotesDashboard`, `LotesScreen`).
- **Mock centralizado** en `src/tests/setup.ts` — no mocks ad-hoc por test.

### Mock adicional en `src/tests/setup.ts`

```ts
vi.mock('firebase/firestore', () => ({
  collection:                  vi.fn(),
  onSnapshot:                  vi.fn(() => vi.fn()), // retorna unsubscribe stub
  initializeFirestore:         vi.fn(() => ({})),
  persistentLocalCache:        vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}));
```

### `plants.test.ts`

```
toPlants(0)      → 0
toPlants(21)     → 2835   // 21 × 135
toPlants(NaN)    → 0
daysSince('')    → 0
daysSince(hoy)   → 0
daysSince(ayer)  → 1
formatDate('')   → '—'
formatDate('2026-03-15') → '15 mar 2026'
```

### `aggregations.test.ts`

Con array de lotes de ejemplo:
```
countByStage(lots, 'almacigo')     → suma currentQuantity de lotes en almacigo
totalEnProduccion(lots)            → excluye lotes en cosecha
pctCapacidad(3756)                 → 100
pctCapacidad(0)                    → 0
pctCapacidad(1878)                 → 50
pctCapacidad(9999)                 → 100  // clamped
```

### `lotesApi.test.ts`

`normalizeLot`:
```
doc completo             → Lot con todos los campos
doc sin quantity         → quantity: 0, currentQuantity: 0
doc sin stageHistory     → stageHistory: []
doc sin location + locations[{...}] → location = locations[0]
doc sin currentQuantity  → currentQuantity = toPlants(quantity)
doc sin stage            → stage: 'almacigo'
```

`subscribeLotes` (mock de `onSnapshot`):
```
invoca onData con lots normalizados al recibir snapshot
invoca onError cuando Firestore emite error
retorna función unsubscribe invocable
```

### `useLotes.test.ts`

```
estado inicial → isLoading: true
tras snapshot simulado → data correcta, isLoading: false
tras error simulado    → isError: true
retry() tras error     → reinicia suscripción, isLoading: true de nuevo
al desmontar           → invoca unsubscribe
```

### `LotCard.test.tsx`

```
renderiza nombre, stage label, ubicación, días en etapa, stats
navega a /lotes/:id al click
```

### `LotesScreen.test.tsx`

```
renderiza skeletons cuando isLoading
renderiza <EmptyState> cuando data=[]
renderiza dashboard + N cards cuando data tiene lotes activos
renderiza sección cosechados si hay lotes en cosecha
renderiza <ErrorState> cuando isError
```

### `LotesDashboard.test.tsx`

```
smoke: renderiza sin crash con array de lotes activos
```

## 10. Criterios de aceptación

Checks 1-3 los corre Claude antes de cerrar el sprint. Check 4 lo valida Grigor con datos reales.

1. `pnpm typecheck` — cero errores TypeScript
2. `pnpm lint` — cero errores, cero warnings
3. `pnpm test:run` — todos los tests pasan (31 existentes + nuevos del sprint)
4. **Manual (Grigor) con credencial real:**
   - `/lotes` muestra dashboard con donut + contadores + total de plantas reales
   - Lista de lotes muestra nombre, stage badge, ubicación, stats para cada lote activo
   - Sección "Cosechados" visible al final si hay lotes en esa etapa
   - Tap en una card navega a placeholder "Detalle lote"
   - Sin señal de red → datos del cache (IndexedDB) se muestran igual
   - Reconexión → datos actualizados sin recargar la página
   - Empty state: si no hay lotes, "Sin lotes registrados" con CTA

## 11. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| `persistentLocalCache` lanza en Safari privado/antiguo | Firestore lo detecta y degrada a memoria silenciosamente — documentado en la API |
| Schema heterogéneo de docs históricos (campos faltantes o `null`) | `normalizeLot` aplica defaults en todos los campos; testeado con casos de docs incompletos |
| `queryFn` que nunca resuelve confunde a devtools de RQ | Documentado en el código; en devtools se ve `fetching` perpetuo hasta el primer snapshot — comportamiento esperado |
| Snapshot inicial tarda (red lenta, sin cache) | Skeleton de 3 cards mientras `isLoading` — no pantalla en blanco |
| Firestore Security Rules bloquean `onSnapshot` | Las reglas del legacy ya permiten leer `lotes` a users autenticados; `onSnapshot` usa el mismo SDK token |

## 12. Próximo paso

Una vez aprobado este spec, invocar `superpowers:writing-plans` para producir el plan de implementación paso a paso.
