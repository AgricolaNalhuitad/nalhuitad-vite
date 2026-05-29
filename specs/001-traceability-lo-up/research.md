# Phase 0 Research: Trazabilidad LO+UP

**Origen:** Decisiones resueltas en deep-interview (`.omc/specs/deep-interview-sprint4-loup.md`, 5 rondas, ambigüedad final 17%). Este documento las consolida en formato Decision/Rationale/Alternatives. No quedan marcadores NEEDS CLARIFICATION.

## R1 — Estructura del modelo de datos

**Decision:** 4 colecciones Firestore top-level separadas — `lotesOrigen`, `unidadesProduccion`, `ubicaciones`, `eventosHistorial` — cada una con su propio hook de suscripción RQ+Firestore (`onSnapshot`→`qc.setQueryData`). Genealogía por campos de ID: `UnidadProduccion.loteOrigenId` y `UnidadProduccion.parentUpId?`. Historial en colección propia keyed por `upId`.

**Rationale:** Es el patrón ya establecido del repo (`useLotes.ts:18`, `useLot.ts`), confirmado explícitamente por el usuario en Round 1: "el patrón actual del repo es RQ+Firestore… no usamos padre-hijo". Colecciones separadas + refs por ID escalan mejor que arrays embebidos para historial creciente y permiten queries por ubicación/lote.

**Alternatives considered:**
- *arrayUnion / historial embebido* (como el `stageHistory`/`raleos` legacy): rechazado — el usuario lo descartó por incoherente con RQ+Firestore y por límites de tamaño de doc.
- *Subcolección `unidadesProduccion/{id}/eventos`*: rechazado — rompe el patrón de "una suscripción por colección" y complica reglas/queries transversales.
- *UP-céntrico denormalizado*: rechazado — duplica datos del LO.

## R2 — Atomicidad y offline del raleo

**Decision:** Raleo = `writeBatch` atómico (crea N UP hijas + marca origen `trasladada` + libera ubicación origen en un commit). **Online-only**: bloqueado cuando no hay conexión, vía hook `useFirestoreConnectivity` que deriva el estado de `snapshot.metadata.fromCache` + `navigator.onLine`. La captura se guarda como borrador local (zustand + persistencia localStorage) keyed por `upId` y se restaura al reconectar.

**Rationale:** FR-012 exige atomicidad (todo-o-nada). FR-014 exige conexión. Con `persistentLocalCache` activo, `writeBatch().commit()` resuelve desde caché aun offline (no lanza), así que no se puede confiar en el throw — hace falta un gate explícito de conectividad. `metadata.fromCache` ya está disponible en las suscripciones existentes → señal sin ping extra.

**Alternatives considered:**
- *Encolar el batch como cualquier escritura*: rechazado — viola FR-014 y arriesga aplicar la invariante de suma contra caché stale.
- *Ping HTTP a Firestore*: rechazado — `metadata.fromCache` da la misma señal sin red extra.
- *Bloquear sin borrador*: rechazado por el usuario — pierde la captura del trabajador en terreno.

## R3 — Cosecha y traslado offline

**Decision:** Sin código offline especial. Se apoyan en `persistentLocalCache` (`firebase.ts:49`, ya activo): escritura optimista nativa, `onSnapshot` refleja el cambio desde caché al instante, sincroniza al reconectar.

**Rationale:** La infraestructura ya soporta exactamente el comportamiento que el spec pide para operaciones simples (FR assumption). Agregar capa optimista propia sería redundante.

**Alternatives considered:** *React Query optimistic updates manuales*: rechazado — duplica lo que Firestore ya hace.

## R4 — `currentQuantity` derivada

**Decision:** No persistir `currentQuantity`. Calcularla como `cantidadInicial − Σ(descartes en eventosHistorial)` (FR-031).

**Rationale:** Evita un campo derivado que puede desincronizarse. El código legacy lo persistía (`lotApi.ts:47`) — se corrige en el modelo nuevo.

**Alternatives considered:** *Persistir y actualizar transaccionalmente*: rechazado por FR-031 explícito y riesgo de drift.

## R5 — QR: codificación y escaneo

**Decision:** QR codifica deep-link URLs de la PWA: `/up/{upId}` y `/ubicacion/{ubicacionId}`. Generación con `qrcode.react` (SVG, compatible React 19). Escaneo: cámara nativa del móvil (abre el deep-link) como ruta primaria; fallback in-app con `BarcodeDetector` del navegador y `html5-qrcode` como polyfill. Vista imprimible con QR + nombre amigable + variedad + fecha. Degradación a buscador por nombre cuando el QR es ilegible (FR-023).

**Rationale:** Cero fricción en terreno (el trabajador usa la cámara que ya conoce); deep-link entra a la PWA sin app store. `qrcode.react` es liviano y mantenido.

**Alternatives considered:**
- *ID opaco + escáner solo in-app*: rechazado — el QR no sirve con la cámara nativa fuera de la app.
- *Solo generación, escaneo diferido*: descartado por el usuario (quiere el flujo completo).

## R6 — Convivencia legacy: CORTE LIMPIO

**Decision:** Sin máquina de convivencia. Vista "Histórico" solo-lectura sobre la colección `lotes` existente desde día 1; los pocos lotes en curso se recrean a mano como LO+UP en el switchover. **FR-027, FR-028 (parcial), FR-029, FR-030 DESCOPEADOS.**

**Rationale:** (Contrarian, Round 4.) El volumen real es ~3.740 plantas = puñado de lotes activos (SC-007). Construir migración a `lotes_legacy` + dual-model + ventana 30 días + archivado admin es gold-plating para ese volumen. El valor real (consulta histórica) se logra con una vista read-only.

**Alternatives considered:**
- *Máquina completa FR-027…030*: rechazada por costo/valor dado el volumen.
- *Driver "dejar terminar el ciclo" con badge en lista única*: considerada, pero el usuario eligió corte aún más limpio (recreación manual).

## R7 — E2E con Playwright

**Decision:** Playwright contra Firebase Emulator (reusa el patrón `firebase emulators:exec` de `test:rules`). Cobertura = 3 flujos felices (siembra→QR, raleo 3 destinos, cosecha→auto-cierre LO) + 3 guardrails como aserciones (ubicación ocupada bloquea, suma de raleo no cuadra bloquea, cosecha excede bloquea). Seed determinista por test. Corre en CI.

**Rationale:** Los 3 guardrails son las clases de error operacional que SC-008 quiere <1/100; en trazabilidad, un raleo que no cuadra es corrupción genealógica → merece red E2E. Emulador valida reglas + persistencia reales, no mocks.

**Alternatives considered:**
- *Mock Firestore sin emulador*: rechazado — no valida reglas ni persistencia; frágil para flujos de datos.
- *Emulador + edge cases exhaustivos*: diferido — los 3 guardrails core cubren el riesgo de Sprint 4; el resto a unit tests.

## R8 — Seed del catálogo de ubicaciones

**Decision:** Script `scripts/seed-ubicaciones.ts` (tsx + firebase-admin, ambos ya en devDependencies) que pre-siembra las 19 ubicaciones idempotentemente (doc id = `INV-X-YYY`). Estado libre/ocupada NO se persiste: se deriva de las UP activas que referencian cada ubicación (coherente con R4).

**Rationale:** Seed reproducible fuera de horario; idempotente para re-correr sin duplicar. Ocupación derivada evita dual-write drift; el guard de ocupación (FR-007/FR-026) chequea UP activas al momento de escribir, bajo el supuesto single-worker (last-write-wins).

**Alternatives considered:** *Bootstrap en la app al primer arranque*: rechazado — mezcla seed con runtime y complica reglas de escritura.
