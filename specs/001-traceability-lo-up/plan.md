# Implementation Plan: Sistema de Trazabilidad LO+UP (Sprint 4)

**Branch**: `main` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-traceability-lo-up/spec.md` + decisiones técnicas de `.omc/specs/deep-interview-sprint4-loup.md` (ambigüedad 17%, PASSED)

## Summary

Reemplazar el modelo legacy de un solo `Lot` por un sistema de trazabilidad de dos niveles — **Lote Origen** (genealogía) + **Unidad de Producción** (presencia física) — con seguimiento almácigo→cosecha a través de traslados y raleos multi-destino, QR escaneables por unidad y por ubicación, y suite Playwright E2E sobre emulador. Switchover por **corte limpio**: lo viejo queda en vista histórica solo-lectura.

Enfoque técnico (resuelto en deep-interview): 4 colecciones Firestore separadas con el patrón RQ+Firestore existente (`onSnapshot`→`setQueryData`, una suscripción por colección), referencias por ID, raleo como `writeBatch` atómico online-only, y la persistencia offline ya activa (`persistentLocalCache`) para cosecha/traslado.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2

**Primary Dependencies**: Firebase 10 (Firestore + Auth), @tanstack/react-query 5, react-router-dom 7, zustand 5. **A añadir**: `qrcode.react` (generación QR), `html5-qrcode` (fallback escaneo), `@playwright/test` (E2E)

**Storage**: Cloud Firestore — 4 colecciones nuevas (`lotesOrigen`, `unidadesProduccion`, `ubicaciones`, `eventosHistorial`) + `lotes` legacy (solo-lectura). Persistencia offline IndexedDB ya activa (`persistentLocalCache` + `persistentMultipleTabManager`, `src/lib/firebase.ts:49`)

**Testing**: Vitest + Testing Library (unit/integration), Firebase Emulator (`emulators:exec` para reglas), Playwright sobre emulador (E2E). Cobertura mínima 80%

**Target Platform**: PWA móvil (navegador con cámara) + escritorio. Conexión intermitente en invernadero

**Project Type**: Web SPA (single project, feature-organized bajo `src/features/`)

**Performance Goals**: SC-001 siembra <60s; SC-002 raleo 3 destinos <3min; SC-004 consulta por QR <2s; SC-007 sin degradación con 50 UP activas

**Constraints**: Patrón RQ+Firestore obligatorio (sin arrayUnion ni padre-hijo embebido); raleo online-only (FR-014); `currentQuantity` derivada no persistida (FR-031); factores canónicos 135 lechugas/bandeja y 2 lechugas/paquete; 19 ubicaciones fijas; single-worker por invernadero (last-write-wins aceptable)

**Scale/Scope**: ~3.740 plantas actuales → hasta ~11k (3×), ≤50 UP activas, 19 ubicaciones, 6 componentes, variedad mayoritaria Milena

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Nota:** `.specify/memory/constitution.md` está sin instanciar (placeholders `[PRINCIPLE_*]`). No hay principios ratificados que evaluar. El gate cae a los principios de trabajo reales del proyecto (CLAUDE.md + reglas globales TS).

| Principio (fallback) | Estado | Nota |
|----------------------|--------|------|
| Cambios mínimos | ✅ PASS | Extiende `src/features/lotes/` y reusa patrones (RQ+Firestore, emulador). No reescribe lo que funciona. Raleo `writeBatch` es patrón nuevo justificado por atomicidad (FR-012). |
| Reality Check | ✅ PASS | E2E sobre emulador valida flujos reales; verificación manual post-switchover en quickstart. |
| TDD / 80% coverage (TS rules) | ✅ PASS | Plan exige tests primero por capa (API → hooks → componentes) + E2E. |
| Inmutabilidad / Zod en boundaries | ✅ PASS | Normalización de docs Firestore valida en boundary; updates inmutables. |
| Code-review protocolo único | ⚠ FLAG | Reglas Firestore + RBAC = zona crítica → requiere `gstack /code-review --ultra` antes de PR (no el reviewer por defecto). |

**Resultado:** PASS (sin violaciones que justificar en Complexity Tracking). Flag de seguridad anotado para la fase de implementación.

## Project Structure

### Documentation (this feature)

```text
specs/001-traceability-lo-up/
├── plan.md              # Este archivo
├── spec.md              # Spec de dominio (existente)
├── research.md          # Phase 0 — decisiones consolidadas
├── data-model.md        # Phase 1 — 4 colecciones + entidades
├── quickstart.md        # Phase 1 — cómo correr/verificar + switchover
├── contracts/
│   ├── data-layer.md    # Firmas de la capa de datos (api + hooks)
│   ├── routes-qr.md     # Rutas deep-link + esquema QR
│   └── firestore-rules.md # Contrato de reglas de seguridad (zona crítica)
└── checklists/
    └── requirements.md  # Existente
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── lotes/                    # EXISTENTE — legacy single-Lot (pasa a Histórico solo-lectura)
│   │   ├── HistoricoScreen.tsx   # NUEVO — vista read-only sobre colección `lotes`
│   │   └── ...                   # archivos legacy intactos (deshabilitar mutaciones)
│   └── trazabilidad/             # NUEVO — modelo LO+UP
│       ├── types.ts              # LoteOrigen, UnidadProduccion, Ubicacion, EventoHistorial
│       ├── lotesOrigenApi.ts     # subscribe + create
│       ├── unidadesApi.ts        # subscribe + traslado + cosecha
│       ├── raleoApi.ts           # writeBatch atómico
│       ├── ubicacionesApi.ts     # subscribe (catálogo seed)
│       ├── eventosApi.ts         # subscribe por upId
│       ├── useLotesOrigen.ts / useUnidades.ts / useUbicaciones.ts / useEventos.ts
│       ├── useTrazabilidadMutations.ts
│       ├── useFirestoreConnectivity.ts  # metadata.fromCache + navigator.onLine
│       ├── nombreAmigable.ts     # generación + sufijo colisión (FR-003)
│       ├── plantas.ts            # 135/bandeja, 2/paquete, currentQuantity derivada
│       ├── qr/ (QrCode.tsx, QrScanner.tsx, PrintableQr.tsx)
│       └── screens/ (CrearSiembra, TrasladarUp, RalearUp, CosecharUp, ConsultaUbicacion, UpDetail)
├── lib/firebase.ts               # EXISTENTE — persistencia ya activa
scripts/
└── seed-ubicaciones.ts           # NUEVO — pre-siembra de 19 ubicaciones (tsx + firebase-admin)
e2e/                              # NUEVO — Playwright
├── playwright.config.ts
├── fixtures/seed.ts
└── flujos/ (siembra-qr, raleo-multidestino, cosecha-autocierre).spec.ts
firestore.rules                   # EXISTENTE — extender con colecciones nuevas + lotes read-only
```

**Structure Decision**: Single-project Vite SPA, organización por feature. Se crea un módulo nuevo `src/features/trazabilidad/` para el modelo LO+UP en vez de mutar `src/features/lotes/` (que queda como Histórico solo-lectura), respetando *Cambios mínimos* — el código legacy no se reescribe, solo se le deshabilitan las mutaciones y se reusa para la vista histórica.

## Complexity Tracking

> Sin violaciones de constitución que justificar. El único patrón nuevo (raleo `writeBatch`) está justificado por el requisito de atomicidad FR-012 y no tiene alternativa más simple que preserve la invariante de suma exacta.
