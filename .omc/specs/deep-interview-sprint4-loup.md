# Deep Interview Spec: Sprint 4 — Sistema de Trazabilidad LO+UP (decisiones técnicas)

## Metadata
- Interview ID: di-sprint4-loup
- Rounds: 5
- Final Ambiguity Score: 17%
- Type: brownfield
- Generated: 2026-05-28
- Threshold: 0.2
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED
- Spec de dominio (WHAT): `specs/001-traceability-lo-up/spec.md` (FR-001…FR-032, SC-001…SC-008)
- Este documento (HOW): decisiones técnicas resueltas vía Socratic interview, sobre el spec de dominio existente.

## Clarity Breakdown
| Dimensión | Score | Peso | Ponderado |
|-----------|-------|------|-----------|
| Goal Clarity | 0.85 | 0.35 | 0.2975 |
| Constraint Clarity | 0.85 | 0.25 | 0.2125 |
| Success Criteria | 0.80 | 0.25 | 0.200 |
| Context Clarity | 0.80 | 0.15 | 0.120 |
| **Total Clarity** | | | **0.83** |
| **Ambiguity** | | | **0.17** |

## Topology
Seis componentes top-level confirmados en Round 0. C5 colapsado en Round 4 (Contrarian) de "máquina de convivencia" a "vista histórica solo-lectura".

| Componente | Status | Descripción | Cobertura / Nota |
|-----------|--------|-------------|------------------|
| C1 Modelo de datos LO+UP | active | Colecciones separadas + migración conceptual | RQ+Firestore, colecciones separadas, refs por ID. Reemplaza el `lotes` de un solo nivel. |
| C2 Operaciones ciclo de vida | active | Siembra, traslado, raleo multi-destino, cosecha | Las 4 con acceptance del spec de dominio; raleo atómico + online-only resuelto. |
| C3 Catálogo de ubicaciones | active | Seed 19 ubicaciones + ocupación | Seed completo en spec de dominio; ocupación derivada de UP activa. |
| C4 QR | active | Generación/impresión + escaneo/consulta | Deep-link URL + cámara nativa + fallback in-app. |
| C5 Histórico solo-lectura | active (scope reducido) | Vista read-only sobre `lotes` actual | **Corte limpio:** sin migración a `lotes_legacy`, sin dual-model, sin ventana 30d, sin archivado admin. FR-027…030 descopeados. |
| C6 Playwright E2E | active | Harness + cobertura crítica | Emulador + 3 flujos felices + 3 guardrails. |

## Goal
Reemplazar el modelo legacy de un solo `Lot` por un sistema de trazabilidad de dos niveles — **Lote Origen (genealogía)** + **Unidad de Producción (presencia física)** — que permita seguir cada grupo de plantas desde el almácigo hasta la cosecha a través de traslados y raleos multi-destino, con QR escaneables por unidad y por ubicación, validado por E2E sobre emulador. El switchover es un **corte limpio**: lo viejo queda en una vista histórica solo-lectura, lo nuevo nace bajo LO+UP.

## Constraints
- **Patrón de datos obligatorio:** RQ+Firestore (React Query alimentado por `onSnapshot` vía `setQueryData`, una suscripción por colección), como en `useLotes.ts`/`useLot.ts`. **No** `arrayUnion`, **no** modelado padre-hijo embebido; genealogía por campos de ID.
- **Raleo online-only (FR-014):** operación atómica multi-doc; bloqueada offline, con borrador local para reintento.
- **Cosecha/traslado offline-friendly:** se apoyan en la persistencia ya activada (`persistentLocalCache`, `firebase.ts:49`); sin código offline especial.
- **Factores canónicos del dominio:** 135 lechugas/bandeja, 1 paquete = 2 lechugas, 19 ubicaciones (no parametrizables este sprint).
- **`currentQuantity` derivada (FR-031):** cantidad inicial − Σ descartes; no persistir campo derivado redundante (corrige el comportamiento actual que sí lo persiste).
- **PWA móvil con cámara** como dispositivo objetivo del trabajador.
- Protocolo de cambios mínimos del proyecto: tocar solo lo que el task requiere.

## Non-Goals (descopeados explícitamente)
- Script de migración a `lotes_legacy`, dual-listing legacy+nuevo, ventana de convivencia de 30 días, operación de archivado admin (FR-027…FR-030). Reemplazado por vista histórica solo-lectura + recreación manual de lotes en curso.
- Raleo offline.
- Listas predefinidas de variedades distintas a Milena (ingreso manual).
- Parametrización por lote de los factores 135 y 2.

## Acceptance Criteria
Hereda SC-001…SC-008 y FR-001…FR-026, FR-031, FR-032 del spec de dominio. Criterios técnicos añadidos por este interview:

- [ ] Existen colecciones Firestore separadas `lotesOrigen`, `unidadesProduccion`, `ubicaciones`, `eventosHistorial`, cada una con su hook de suscripción RQ+Firestore (patrón `useLotes`).
- [ ] Cada UP referencia `loteOrigenId` y, si nació de raleo, `parentUpId`, ambos resolubles (SC-003 = 100%).
- [ ] El raleo se ejecuta como un único `writeBatch` atómico (N UP hijas + origen→`trasladada` + libera ubicación origen); si falla, nada se persiste (FR-012).
- [ ] El raleo está deshabilitado cuando `useFirestoreConnectivity` reporta offline (derivado de `metadata.fromCache` + `navigator.onLine`); la captura se guarda como borrador local y se restaura al reconectar (FR-014).
- [ ] El QR de UP codifica `/up/{upId}` y el de ubicación `/ubicacion/{ubicacionId}`; escanear con cámara nativa abre la ruta en la PWA; existe fallback de escaneo in-app y buscador por nombre amigable (FR-020…FR-023).
- [ ] Vista imprimible de QR muestra QR + nombre amigable + variedad + fecha.
- [ ] Las 19 ubicaciones están pre-sembradas (FR-024); una ubicación tiene a lo sumo una UP activa (FR-026).
- [ ] La sección "Histórico" muestra los lotes del modelo viejo en solo-lectura (botones de modificación deshabilitados); ninguna escritura nueva usa la colección `lotes` legacy.
- [ ] Suite Playwright contra Firebase Emulator (`emulators:exec`) cubre 3 flujos felices (siembra→QR, raleo 3 destinos, cosecha→auto-cierre LO) + 3 guardrails (ubicación ocupada, suma de raleo no cuadra, cosecha excede) y corre en CI.

## Assumptions Exposed & Resolved
| Supuesto | Desafío | Resolución |
|----------|---------|-----------|
| El modelo LO+UP ya estaba parcialmente construido (PR #1 merged) | Lectura del código: `lotApi.ts` es single-`Lot`, `registerRaleo` solo appendea array | PR #1 fue spec + scaffolding de tipos; el modelo real es construcción desde cero. |
| Modelar genealogía con padre-hijo / arrayUnion (como el código legacy) | "¿Cuál es el patrón real del repo?" | RQ+Firestore con colecciones separadas y refs por ID; el arrayUnion legacy se abandona. |
| Esquema de QR sin definir | Recomendación pedida | Deep-link URL + cámara nativa + fallback in-app + degradación a buscador por nombre. |
| Convivencia legacy de 30 días con migración + dual-model (spec FR-027…030) | **Contrarian:** ¿es el driver real o hábito? Volumen real ~3.740 plantas = pocos lotes | **Corte limpio:** vista histórica solo-lectura + recreación manual. Componente colapsado. |
| Offline del raleo requiere infraestructura nueva | Lectura: `persistentLocalCache` ya activado | Reutilizar caché existente; raleo bloqueado vía señal derivada de `metadata.fromCache`. |

## Technical Context (brownfield)
- **Patrón de datos:** `useLotes.ts:18` — `onSnapshot` → `qc.setQueryData`; `useQuery` con promesa infinita como store reactivo; normalización en `lotesApi.ts:11`.
- **Mutaciones:** `useLotMutations.ts` — `useMutation` + `invalidateQueries`. El raleo nuevo necesita `writeBatch` (patrón nuevo, atómico).
- **Persistencia offline:** `firebase.ts:49` — `initializeFirestore` con `persistentLocalCache` + `persistentMultipleTabManager` (ya activa).
- **Emulador:** `package.json` — `test:rules` usa `firebase emulators:exec --only firestore`; `vitest.security.config.ts` existe. Reutilizable para Playwright.
- **Dependencias a añadir:** `qrcode.react` (gen QR), `html5-qrcode` (fallback escaneo), `@playwright/test` (E2E). Ninguna presente hoy.
- **Tipos legacy:** `types.ts` tiene campos vestigiales (`locations[]`, `parentId`, `childrenIds`) no usados por la API — a reemplazar por los tipos LO+UP.

## Ontology (Key Entities)
| Entidad | Tipo | Campos | Relaciones |
|---------|------|--------|-----------|
| LoteOrigen | core domain | id, variety, fechaSiembra, bandejas, nombreAmigable, estado, notas | tiene muchas UnidadProduccion |
| UnidadProduccion | core domain | id, loteOrigenId, parentUpId?, ubicacionId, cantidadInicial, etapa, estado, fechaIngreso | pertenece a LoteOrigen; ocupa una Ubicacion; tiene muchos EventoHistorial |
| Ubicacion | supporting | id, invernadero, tipo, identificador, capacidadMax, estado(libre/ocupada) | ocupada por ≤1 UnidadProduccion activa |
| EventoHistorial | supporting | id, upId, fecha, tipoAccion, cantidades, ubicacionPrevia?, ubicacionNueva? | pertenece a UnidadProduccion |
| LoteHistorico | external/legacy | (forma del `Lot` viejo, solo-lectura) | sin escritura nueva |

## Ontology Convergence
| Ronda | Entidades | New | Changed | Stable | Stability |
|-------|-----------|-----|---------|--------|-----------|
| 1 | 5 | 5 | - | - | N/A |
| 2 | 5 | 0 | 0 | 5 | 100% |
| 3 | 5 | 0 | 0 | 5 | 100% |
| 4 | 5 | 0 | 1 (LoteLegacy→LoteHistorico) | 4 | 100% |
| 5 | 5 | 0 | 0 | 5 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (5 rounds)</summary>

### Round 0 — Topology
**Q:** ¿Topología de 6 componentes correcta? **A:** Correcta — los 6.

### Round 1 — C1 Modelo de datos (Context)
**Q:** ¿Estructura física LO+UP en Firestore y referencias entre niveles?
**A:** "El patrón actual del repo es RQ+Firestore, documentado en useLotes.ts. No usamos padre-hijo sino ese patrón. El diseño LO+UP debe ser coherente con RQ+Firestore, no con el arrayUnion del código legacy."
**Ambiguity:** 44% (Goal 0.60, Constraints 0.50, Criteria 0.60, Context 0.50)

### Round 2 — C4 QR (Context)
**Q:** ¿Qué codifica el QR y cómo se escanea? **A:** Recomiéndame.
**Resolución:** deep-link URL `/up/{id}` `/ubicacion/{id}`; `qrcode.react` gen; cámara nativa + BarcodeDetector/html5-qrcode; vista imprimible.
**Ambiguity:** 38%

### Round 3 — C6 Playwright E2E (Criteria+Constraints)
**Q:** ¿Entorno y flujos de cobertura? **A:** Recomiéndame.
**Resolución:** Emulador (`emulators:exec`) + 3 flujos felices + 3 guardrails, en CI.
**Ambiguity:** 28%

### Round 4 — C5 Legacy (Contrarian)
**Q:** ¿Máquina de convivencia completa o gold-plating? **A:** Corte limpio, sin convivencia.
**Resolución:** vista histórica solo-lectura + recreación manual; FR-027…030 descopeados.
**Ambiguity:** 25%

### Round 5 — C2 Operaciones / offline (Constraints)
**Q:** ¿Cómo bloquear raleo offline? **A:** Recomiéndame.
**Resolución:** `useFirestoreConnectivity` (metadata.fromCache + navigator.onLine); bloqueo + borrador local zustand; raleo como `writeBatch` atómico online-only.
**Ambiguity:** 17% — umbral alcanzado.

</details>
