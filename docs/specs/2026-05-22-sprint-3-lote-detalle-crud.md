# Fase A — Sprint 3: Detalle de Lote + CRUD

**Fecha:** 2026-05-22
**Estado:** Diseño aprobado — plan de implementación en docs/plans/2026-05-22-sprint-3-lote-detalle-crud.md
**Proyecto:** Nalhuitad (migración Fase A del stack legacy)

---

## 1. Objetivo

Implementar la pantalla de detalle `/lotes/:id` con lectura real-time del lote individual (Firestore `onSnapshot` en doc), más operaciones de escritura: crear lote, editar campos básicos, avanzar etapa, registrar raleo y registrar cosecha. Sprint 3 completa el CRUD mínimo viable.

## 2. Decisiones de diseño

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Detalle | LotDetailScreen vía `useLot(id)` — misma arquitectura que `useLotes` |
| 2 | Acciones | Bottom sheets montados condicionalmente en LotDetailScreen (no rutas) |
| 3 | Crear lote | Pantalla separada `/lotes/nuevo` |
| 4 | Editar lote | Pantalla separada `/lotes/:id/editar` |
| 5 | Avanzar etapa | nextStage = STAGE_ORDER[indexOf(currentStage) + 1] |
| 6 | Cosecha | Cambia stage a 'cosecha', agrega entrada en stageHistory |
| 7 | Raleo | Decrementa currentQuantity, agrega entrada en raleos[] |
| 8 | Writes | `addDoc` (crear) + `updateDoc` + `arrayUnion` (editar/acciones) |
| 9 | Mutations | React Query `useMutation` por operación, invalida ['lotes'] y ['lotes', id] |
| 10 | Testing | TDD para api + hooks; smoke tests para UI |

## 3. Fuera de scope Sprint 3

- Crear lote hijo desde raleo (lotHijoId)
- Capacidad instalada editable
- Alertas overdue / fecha estimada cosecha
- Eliminar lote
- Sort/filtro en LotesScreen
- Modo offline completo sin red (IndexedDB ya cubre esto del Sprint 2)

## 4. Estructura de archivos nuevos

```
src/features/lotes/
├── lotApi.ts / lotApi.test.ts         ← subscribeLot + 5 write fns (TDD)
├── useLot.ts / useLot.test.tsx        ← hook real-time lote individual (TDD)
├── useLotMutations.ts / .test.ts      ← mutation hooks (TDD)
├── LotDetailScreen.tsx / .module.css / .test.tsx
├── CreateLotScreen.tsx / .module.css / .test.tsx
├── EditLotScreen.tsx / .module.css / .test.tsx
├── AdvanceStageSheet.tsx / .module.css / .test.tsx
├── HarvestSheet.tsx / .module.css / .test.tsx
└── RaleoSheet.tsx / .module.css / .test.tsx
```

Modificados: `types.ts` (+ input types), `setup.ts` (+ write mocks), `router.tsx` (+ 3 rutas).

## 5. API de Firestore

### subscribeLot

```ts
subscribeLot(id: string, onData: (lot: Lot | null) => void, onError: (err: FirestoreError) => void): Unsubscribe
```

Usa `onSnapshot(doc(db, 'lotes', id), ...)`. Si `snap.exists() === false`, llama `onData(null)`.

### createLot

```ts
createLot(input: NewLotInput): Promise<string>
```

`addDoc(collection(db, 'lotes'), { ...campos })`. Inicializa `stage: 'almacigo'`, `currentQuantity: quantity * 135`, `stageHistory: [{ stage: 'almacigo', date: input.date }]`.

### updateLot

```ts
updateLot(id: string, input: UpdateLotInput): Promise<void>
```

`updateDoc(doc(db, 'lotes', id), { campos de UpdateLotInput })`. Solo actualiza name/variety/location si están definidos.

### advanceStage

```ts
advanceStage(id: string, input: AdvanceStageInput): Promise<void>
```

`updateDoc` con `stage: newStage`, `stageHistory: arrayUnion(entry)`, opcionalmente `currentQuantity` y `location`.

### registerHarvest

```ts
registerHarvest(id: string, input: HarvestInput): Promise<void>
```

`updateDoc` con `stage: 'cosecha'`, `stageHistory: arrayUnion({ stage: 'cosecha', date, notes? })`.

### registerRaleo

```ts
registerRaleo(id: string, currentQuantity: number, input: RaleoInput): Promise<void>
```

`updateDoc` con `currentQuantity: currentQuantity - cantidadRaleada`, `raleos: arrayUnion(entry)`.

## 6. Pantallas

### LotDetailScreen (`/lotes/:id`)

```
[← Lotes]                     [Editar]
ALMÁCIGO
Milena Norte
INV-A · Piscina P01
Sembrado 15 ene 2026

┌──────────────────────────────────┐
│ Sembradas  En producción  Variedad│
│  2.835       2.500        Milena  │
└──────────────────────────────────┘

[Avanzar etapa]          (disabled si cosecha)
[Registrar raleo]        (solo transplante/raleo)
[Registrar cosecha]      (solo raleo, primary)

Historial de etapas
─ Almácigo · 15 ene 2026
─ Transplante · 01 feb 2026

Raleos (1)
─ 300 plantas · 01 mar 2026
```

Estados: skeleton (isLoading), error (isError), "Lote no encontrado" (lot === null), datos.

### CreateLotScreen (`/lotes/nuevo`)

Formulario con campos: nombre, variedad, bandejas (→ quantity), fecha de siembra, ubicación (invernadero A/B, tipo piscina/tubo/canal, identificador). Submit → createLot → navigate('/lotes').

### EditLotScreen (`/lotes/:id/editar`)

Mismos campos que CreateLotScreen salvo bandejas y fecha (no editables post-creación). Pre-llenado desde useLot(id). Submit → updateLot → navigate('/lotes/:id').

### Action Sheets (bottom drawers, montados desde LotDetailScreen)

**AdvanceStageSheet:** fecha (default hoy), cantidad actual opcional, notas opcional. CTA: "Avanzar a {nextStage}".

**HarvestSheet:** fecha (default hoy), notas opcional. CTA: "Confirmar cosecha".

**RaleoSheet:** cantidadRaleada (required, max=currentQuantity), fecha (default hoy). CTA: "Registrar raleo". Muestra currentQuantity disponible.

## 7. Criterios de aceptación

1. `pnpm typecheck` — 0 errores
2. `pnpm lint` — 0 errores, 0 warnings
3. `pnpm test:run` — todos los tests pasan (81 + nuevos)
4. **Manual (Grigor):**
   - Tap en LotCard navega a LotDetailScreen con datos reales
   - "Avanzar etapa" abre sheet y avanza correctamente en Firestore
   - "Registrar raleo" decrementa currentQuantity en Firestore
   - "Registrar cosecha" cambia stage a cosecha
   - "Editar" pre-llena el formulario con datos actuales
   - `/lotes/nuevo` crea un lote nuevo visible en la lista
