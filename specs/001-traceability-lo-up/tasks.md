---
description: "Task list — Trazabilidad LO+UP (Sprint 4)"
---

# Tasks: Sistema de Trazabilidad LO+UP

**Input**: Design documents from `specs/001-traceability-lo-up/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: INCLUIDOS — el proyecto manda TDD + 80% cobertura (reglas TS) y el spec tiene componente E2E (Playwright). Escribir tests primero, verlos fallar, luego implementar.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: paralelizable (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1…US6 (mapea a las user stories del spec). Setup/Foundational/Polish sin label.

## Path Conventions
Vite SPA single-project, feature-organized. Módulo nuevo `src/features/trazabilidad/`; legacy `src/features/lotes/` pasa a Histórico solo-lectura. E2E en `e2e/`. Reglas en `firestore.rules`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencias y estructura base.

- [ ] T001 Añadir dependencias del feature: `pnpm add qrcode.react html5-qrcode` y `pnpm add -D @playwright/test`; luego `pnpm exec playwright install chromium`
- [ ] T002 [P] Crear estructura del módulo `src/features/trazabilidad/` (subcarpetas `qr/`, `screens/`) + `src/features/trazabilidad/index.ts` con barrel exports
- [ ] T003 [P] Crear `e2e/playwright.config.ts` apuntando a la app servida sobre el emulador (baseURL, projects chromium)
- [ ] T004 [P] Añadir script `"test:e2e": "firebase emulators:exec --only firestore,auth \"pnpm exec playwright test\""` a `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Ninguna user story puede empezar hasta completar esta fase.

- [ ] T005 Definir tipos del modelo LO+UP en `src/features/trazabilidad/types.ts` (LoteOrigen, UnidadProduccion, Ubicacion, EventoHistorial + inputs NuevaSiembraInput/TrasladoInput/RaleoInput/CosechaInput) según data-model.md
- [ ] T006 [P] Tests de helpers puros en `src/features/trazabilidad/plantas.test.ts` (calcularCurrentQuantity FR-031, paquetesALechugas ×2, validarSumaRaleo INV-1) — deben FALLAR primero
- [ ] T007 [P] Implementar helpers en `src/features/trazabilidad/plantas.ts` (135/bandeja, 2/paquete, currentQuantity derivada, validación suma) hasta que T006 pase
- [ ] T008 [P] `src/features/trazabilidad/ubicacionesApi.ts` (`subscribeUbicaciones`) + `useUbicaciones.ts` (patrón RQ+Firestore como `useLotes.ts`)
- [ ] T009 [P] `src/features/trazabilidad/eventosApi.ts` (`subscribeEventosPorUp`) + `useEventosPorUp.ts`
- [ ] T010 Crear `scripts/seed-ubicaciones.ts` (tsx + firebase-admin) que pre-siembra las 19 ubicaciones idempotentemente (doc id `INV-X-YYY`) según seed data del spec
- [ ] T011 Extender `firestore.rules`: colecciones `lotesOrigen`/`unidadesProduccion`/`ubicaciones`/`eventosHistorial` con roles + inmutabilidad; `eventosHistorial` create-only; `ubicaciones` deny client-write; **`lotes` legacy deny-all-write** (zona crítica, ver contracts/firestore-rules.md)
- [ ] T012 Tests de reglas en `tests/security/firestore.rules.test.ts` (lotes write denegado, ubicaciones client-write denegado, eventos update/delete denegado, roles en lotesOrigen/unidadesProduccion) + `pnpm test:rules` verde

**Checkpoint**: Fundación lista — las user stories pueden empezar (en paralelo si hay capacidad).

---

## Phase 3: User Story 1 - Sembrar y crear lote origen (Priority: P1) 🎯 MVP

**Goal**: Crear una siembra → LO + UP inicial en Inv D-Almácigo + QR imprimible.
**Independent Test**: Sembrar 6 bandejas Milena hoy → aparece "Milena DD-Mmm", UP en Inv D, QR imprimible (SC-001).

### Tests for User Story 1 ⚠️ (escribir y ver fallar primero)

- [ ] T013 [P] [US1] Unit test `src/features/trazabilidad/nombreAmigable.test.ts` (genera "Milena 23-May"; sufijo "#02" en colisión mismo día — FR-003)
- [ ] T014 [P] [US1] Integration test `src/features/trazabilidad/lotesOrigenApi.test.ts` sobre emulador: `createSiembra` crea LO + UP inicial (Inv D, cantidad = bandejas×135) atómicamente (FR-002, FR-004)
- [ ] T015 [P] [US1] Component test `src/features/trazabilidad/screens/CrearSiembraScreen.test.tsx` (form variedad/bandejas/fecha → confirma)

### Implementation for User Story 1

- [ ] T016 [P] [US1] Implementar `src/features/trazabilidad/nombreAmigable.ts` (generación + sufijo colisión) hasta que T013 pase
- [ ] T017 [US1] `src/features/trazabilidad/lotesOrigenApi.ts` (`subscribeLotesOrigen`, `subscribeLoteOrigen`, `createSiembra` con writeBatch LO+UP+evento 'creacion') — depende de T005, T016
- [ ] T018 [P] [US1] Hooks `src/features/trazabilidad/useLotesOrigen.ts` y `useLoteOrigen.ts` (patrón RQ+Firestore)
- [ ] T019 [US1] `useCrearSiembra()` en `src/features/trazabilidad/useTrazabilidadMutations.ts` (useMutation + invalidateQueries)
- [ ] T020 [P] [US1] Componentes QR en `src/features/trazabilidad/qr/QrCode.tsx` (wrap qrcode.react) y `qr/PrintableQr.tsx` (QR + nombre + variedad + fecha, `@media print`) — FR-020
- [ ] T021 [US1] `src/features/trazabilidad/screens/CrearSiembraScreen.tsx` + `screens/TrazabilidadListScreen.tsx` (listado lotes activos) hasta que T015 pase
- [ ] T022 [US1] Registrar rutas `/trazabilidad`, `/trazabilidad/siembra`, `/up/:upId/qr` en el router (src/App.tsx o archivo de rutas)
- [ ] T023 [US1] E2E `e2e/flujos/siembra-qr.spec.ts` + fixture `e2e/fixtures/seed.ts`: siembra → aparece en listado → QR imprimible visible

**Checkpoint**: US1 funcional y testeable de forma independiente — **MVP demoable**.

---

## Phase 4: User Story 2 - Trasladar plantas entre invernaderos (Priority: P2)

**Goal**: Escanear/abrir una UP y trasladarla a otra ubicación, liberando la previa.
**Independent Test**: Trasladar UP de Inv D a INV-C-P02 → ubicación actualizada, previa libre, historial preservado.

### Tests for User Story 2 ⚠️

- [ ] T024 [P] [US2] Integration test `src/features/trazabilidad/unidadesApi.test.ts` (emulador): `trasladarUnidad` cambia ubicacionId, escribe evento 'traslado', bloquea destino ocupado (FR-005..007, INV-3)
- [ ] T025 [P] [US2] Component test `src/features/trazabilidad/screens/UpDetailScreen.test.tsx` (muestra genealogía + historial)

### Implementation for User Story 2

- [ ] T026 [US2] Añadir a `src/features/trazabilidad/unidadesApi.ts`: `subscribeUnidad`, `subscribeUnidades`, `subscribeUnidadActivaPorUbicacion`, `trasladarUnidad` (con guard de ocupación INV-3)
- [ ] T027 [P] [US2] Hooks `src/features/trazabilidad/useUnidad.ts` y `useUnidades.ts`
- [ ] T028 [US2] `useTrasladar(upId)` en `useTrazabilidadMutations.ts`
- [ ] T029 [US2] `src/features/trazabilidad/screens/UpDetailScreen.tsx` (detalle UP + genealogía hasta LO + historial vía useEventosPorUp)
- [ ] T030 [US2] `src/features/trazabilidad/screens/TrasladarUpScreen.tsx` + rutas `/up/:upId` y `/up/:upId/trasladar`

**Checkpoint**: US1 y US2 funcionan independientemente.

---

## Phase 5: User Story 3 - Ralear en múltiples ubicaciones (Priority: P3)

**Goal**: Dividir una UP en 1-5 hijas atómicamente, online-only, con borrador local.
**Independent Test**: Ralear 540 en 3 destinos (200/240/100) → 3 UP hijas mismo LO, origen 'trasladada', suma=540, 3 QR (SC-002, FR-008..014).

### Tests for User Story 3 ⚠️

- [ ] T031 [P] [US3] Integration test `src/features/trazabilidad/raleoApi.test.ts` (emulador): writeBatch atómico crea N hijas + origen 'trasladada' + libera ubicación; rollback si falla (FR-012); bloquea suma≠ (INV-1)
- [ ] T032 [P] [US3] Component test `src/features/trazabilidad/screens/RalearUpScreen.test.tsx` (multi-destino, advertencia capacidad sin bloqueo FR-013, bloqueo offline)

### Implementation for User Story 3

- [ ] T033 [P] [US3] `src/features/trazabilidad/useFirestoreConnectivity.ts` (deriva isOnline de metadata.fromCache + navigator.onLine)
- [ ] T034 [US3] `src/features/trazabilidad/raleoApi.ts` (`ralear` con writeBatch atómico, validación suma, gate online) — depende de T005, T007
- [ ] T035 [US3] `useRalear(upOrigenId)` en `useTrazabilidadMutations.ts` + borrador local con zustand+localStorage (restaura al reconectar, FR-014)
- [ ] T036 [US3] `src/features/trazabilidad/screens/RalearUpScreen.tsx` (1-5 destinos, validación suma en vivo, advertencia capacidad, confirmar deshabilitado offline) + ruta `/up/:upId/ralear`
- [ ] T037 [US3] E2E `e2e/flujos/raleo-multidestino.spec.ts`: raleo 3 destinos OK + guardrails (suma no cuadra bloquea, ubicación ocupada bloquea)

**Checkpoint**: US1-US3 funcionan independientemente.

---

## Phase 6: User Story 4 - Registrar cosecha con paquetes (Priority: P4)

**Goal**: Cosechar en paquetes (1 paq = 2 lechugas), cerrar UP, auto-cerrar LO.
**Independent Test**: Cosechar 100 paquetes + 10 descarte de UP con 210 → UP 'cosechada', ubicación libre, 200+10 registrados; si última UP del LO → LO 'cosechado' (FR-015..019).

### Tests for User Story 4 ⚠️

- [ ] T038 [P] [US4] Integration test en `src/features/trazabilidad/unidadesApi.test.ts`: `registrarCosecha` parcial→activa / total→cosechada; bloquea exceso (INV-4); auto-cierre LO cuando todas las UP cosechadas (FR-019)
- [ ] T039 [P] [US4] Component test `src/features/trazabilidad/screens/CosecharUpScreen.test.tsx` (UI en paquetes, persiste lechugas)

### Implementation for User Story 4

- [ ] T040 [US4] Añadir `registrarCosecha` a `src/features/trazabilidad/unidadesApi.ts` (paquetes×2, parcial/total, auto-cierre LO en writeBatch)
- [ ] T041 [US4] `useCosechar(upId)` en `useTrazabilidadMutations.ts`
- [ ] T042 [US4] `src/features/trazabilidad/screens/CosecharUpScreen.tsx` (input paquetes + descarte, validación INV-4) + ruta `/up/:upId/cosechar`
- [ ] T043 [US4] E2E `e2e/flujos/cosecha-autocierre.spec.ts`: cosecha total → UP cosechada + LO auto-cerrado + guardrail (cosecha excede bloquea)

**Checkpoint**: US1-US4 funcionan independientemente.

---

## Phase 7: User Story 5 - Consultar ubicación por QR (Priority: P5)

**Goal**: Escanear QR de unidad o ubicación y ver qué hay (genealogía, días, cantidad).
**Independent Test**: Escanear QR de INV-A-P05 ocupada → lote, fecha, días, cantidad, historial en <2s (SC-004, FR-021..023).

### Tests for User Story 5 ⚠️

- [ ] T044 [P] [US5] Unit test `src/features/trazabilidad/qr/parsePath.test.ts` (extrae /up/:id y /ubicacion/:id; ignora orígenes ajenos)
- [ ] T045 [P] [US5] Component test `src/features/trazabilidad/screens/ConsultaUbicacionScreen.test.tsx` (ocupada muestra UP+genealogía; libre muestra "Ubicación libre")

### Implementation for User Story 5

- [ ] T046 [P] [US5] `src/features/trazabilidad/qr/parsePath.ts` (URL escaneado → ruta interna)
- [ ] T047 [US5] `src/features/trazabilidad/qr/QrScanner.tsx` (BarcodeDetector con fallback html5-qrcode → navigate)
- [ ] T048 [US5] `src/features/trazabilidad/screens/ConsultaUbicacionScreen.tsx` (usa subscribeUnidadActivaPorUbicacion) + ruta `/ubicacion/:ubicacionId`
- [ ] T049 [US5] Buscador por nombre amigable (degradación FR-023) integrado en TrazabilidadListScreen + acceso al QrScanner desde la nav

**Checkpoint**: US1-US5 funcionan independientemente.

---

## Phase 8: User Story 6 - Histórico solo-lectura (Priority: P6) — corte limpio

**Goal**: Consultar lotes del modelo viejo en solo-lectura. **Sin migración, sin dual-model, sin ventana 30d (R6 — FR-027…030 descopeados).**
**Independent Test**: Abrir `/historico` → lotes legacy visibles; botones de modificación deshabilitados.

- [ ] T050 [US6] `src/features/lotes/HistoricoScreen.tsx` (lista la colección `lotes` legacy en solo-lectura, reusa subscribeLotes existente) + ruta `/historico`
- [ ] T051 [US6] Deshabilitar/ocultar acciones de mutación (avanzar etapa, ralear, cosechar) en las vistas legacy reusadas; marcar visualmente "Histórico (solo lectura)"

**Checkpoint**: Las 6 user stories completas.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T052 [P] Verificar cobertura ≥80% (`pnpm test:coverage`) y completar tests faltantes en `src/features/trazabilidad/`
- [ ] T053 [P] Limpiar campos vestigiales en el modelo legacy si quedan sin uso (no romper Histórico) — anotar como follow-up si es fuera de scope
- [ ] T054 Ejecutar validación de quickstart.md (incluye pasos del switchover manual) y dejar evidencia
- [ ] T055 **Seguridad (zona crítica):** correr `gstack /code-review --ultra` sobre reglas Firestore + RBAC y `pnpm test:rules` verde ANTES de abrir PR; preflight de custom claims en cuentas existentes antes de `pnpm rules:deploy`
- [ ] T056 [P] ADR en `docs/adr/` documentando el corte limpio legacy (por qué FR-027…030 se descopearon)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (P1)**: sin dependencias.
- **Foundational (P2)**: depende de Setup. **BLOQUEA todas las user stories.**
- **User Stories (P3-P8)**: dependen de Foundational. Luego pueden ir en paralelo o en orden de prioridad.
- **Polish (P9)**: depende de las stories deseadas completas.

### User Story Dependencies
- **US1 (P1)**: tras Foundational. Sin dependencias de otras stories. (Crea QrCode/PrintableQr reusados luego.)
- **US2 (P2)**: tras Foundational. Crea UpDetailScreen + unidadesApi base que US3/US4 extienden.
- **US3 (P3)**: tras Foundational. Reusa UpDetail (US2) pero testeable solo.
- **US4 (P4)**: tras Foundational. Extiende unidadesApi (US2).
- **US5 (P5)**: tras Foundational. Reusa rutas /up y /ubicacion.
- **US6 (P6)**: independiente — solo toca legacy `lotes`. Puede hacerse en cualquier momento tras Setup.

### Within Each User Story
- Tests primero (deben fallar) → helpers/api → hooks → mutations → screens/rutas → E2E.
- Modelos antes que servicios; servicios antes que UI.

### Parallel Opportunities
- Setup: T002/T003/T004 en paralelo.
- Foundational: T006/T007, T008, T009 en paralelo (archivos distintos); T010-T012 secuencial (rules → tests).
- US6 (T050-T051) puede correr en paralelo con US1-US5 (toca solo legacy).
- Dentro de cada story, los tests marcados [P] van juntos.

---

## Parallel Example: User Story 1

```bash
# Tests US1 juntos (deben fallar primero):
Task: "Unit test nombreAmigable en src/features/trazabilidad/nombreAmigable.test.ts"
Task: "Integration test createSiembra en src/features/trazabilidad/lotesOrigenApi.test.ts"
Task: "Component test CrearSiembraScreen en src/features/trazabilidad/screens/CrearSiembraScreen.test.tsx"

# Luego implementación paralela donde aplica:
Task: "Implementar nombreAmigable.ts"
Task: "Componentes QR QrCode.tsx + PrintableQr.tsx"
```

---

## Implementation Strategy

### MVP First (solo US1)
1. Setup (Phase 1) → 2. Foundational (Phase 2, CRÍTICA) → 3. US1 (Phase 3) → **STOP y VALIDAR** siembra→QR independiente → demo.

### Incremental Delivery
Foundational listo → US1 (MVP, demo) → US2 → US3 → US4 → US5 → US6. Cada story agrega valor sin romper las previas. **Reality Check:** tras cada deploy, verificar en prod con datos reales, no asumir que CI verde = funcionando.

### Notas
- [P] = archivos distintos, sin dependencias. Commit por tarea o grupo lógico.
- Verificar que los tests fallan antes de implementar.
- Parar en cualquier checkpoint para validar una story de forma independiente.
- Zona crítica (T011, T012, T055): reglas Firestore + RBAC → `gstack /code-review --ultra` obligatorio antes de PR.
