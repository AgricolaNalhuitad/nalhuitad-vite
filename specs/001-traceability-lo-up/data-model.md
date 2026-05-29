# Phase 1 Data Model: Trazabilidad LO+UP

4 colecciones Firestore top-level. Refs por ID (string). Sin arrays embebidos para historial. Fechas operativas como ISO `YYYY-MM-DD` (string); timestamps de sistema como Firestore `Timestamp`.

## Colección `lotesOrigen/{loteOrigenId}`

Identidad genealógica de una siembra. Persiste hasta que todas sus UP están cosechadas.

| Campo | Tipo | Req | Notas |
|-------|------|-----|-------|
| `variety` | string | sí | Default "Milena" (FR-001) |
| `fechaSiembra` | string ISO | sí | |
| `bandejas` | number | sí | > 0 |
| `nombreAmigable` | string | sí | "Milena 23-May", sufijo "#NN" si colisión mismo día (FR-003) |
| `estado` | `'activo'\|'cosechado'\|'descartado'` | sí | |
| `notas` | string | no | |
| `createdAt` | Timestamp | sí | serverTimestamp |

**Derivado (no persistido):** `cantidadInicialTotal = bandejas × 135` (FR-004, 135 canónico).

**Validación:** `bandejas ≥ 1`; `nombreAmigable` único por `fechaSiembra` (resuelto con sufijo, no constraint duro).

## Colección `unidadesProduccion/{upId}`

Presencia física de plantas en una ubicación.

| Campo | Tipo | Req | Notas |
|-------|------|-----|-------|
| `loteOrigenId` | string ref | sí | → `lotesOrigen` (FR-011) |
| `parentUpId` | string ref | no | → `unidadesProduccion` si nació de raleo (FR-011) |
| `ubicacionId` | string ref | sí | → `ubicaciones` |
| `cantidadInicial` | number | sí | plantas al crear esta UP |
| `etapa` | `'almacigo'\|'transplante'\|'raleo'\|'cosecha'` | sí | reusa `Stage` existente |
| `estado` | `'activa'\|'cosechada'\|'descartada'\|'trasladada'` | sí | |
| `fechaIngreso` | string ISO | sí | ingreso a la ubicación actual |
| `createdAt` | Timestamp | sí | |

**Derivado (no persistido, FR-031):** `currentQuantity = cantidadInicial − Σ(eventosHistorial.cantidadDescartada where upId == this.id)`.

**Validación:** `cantidadInicial > 0`; `ubicacionId` existe; al activarse, la ubicación no debe tener otra UP `activa` (FR-026, guard pre-write).

## Colección `ubicaciones/{ubicacionId}`

Catálogo seed de 19 (FR-024). `ubicacionId` = `INV-{A|B|C|D}-{IDENT}` (ej. `INV-A-P05`).

| Campo | Tipo | Req | Notas |
|-------|------|-----|-------|
| `invernadero` | `'A'\|'B'\|'C'\|'D'` | sí | |
| `tipo` | `'almacigo'\|'piscina_intermedia'\|'piscina_dwc'\|'bancada_nft'` | sí | |
| `identificador` | string | sí | ALM, P01, B02… |
| `capacidadMax` | number | sí | solo advertencia (FR-025) |
| `funcion` | string | no | descripción del seed |

**Estado libre/ocupada:** NO persistido. Derivado en app: `ocupada ⇔ ∃ UP con ubicacionId==this.id && estado=='activa'`.

## Colección `eventosHistorial/{eventoId}`

Bitácora append-only por UP. Una entrada por acción (FR-032).

| Campo | Tipo | Req | Notas |
|-------|------|-----|-------|
| `upId` | string ref | sí | → `unidadesProduccion` |
| `loteOrigenId` | string ref | sí | denormalizado para query genealógica |
| `fecha` | string ISO | sí | |
| `tipoAccion` | `'creacion'\|'traslado'\|'raleo'\|'cosecha'\|'descarte'` | sí | |
| `cantidad` | number | no | plantas/paquetes según acción |
| `cantidadDescartada` | number | no | alimenta el cálculo de `currentQuantity` |
| `ubicacionPrevia` | string ref | no | |
| `ubicacionNueva` | string ref | no | |
| `notas` | string | no | |

## Relaciones

```text
LoteOrigen 1 ──< N UnidadProduccion        (loteOrigenId)
UnidadProduccion 1 ──< N UnidadProduccion  (parentUpId, vía raleo)
Ubicacion 1 ──< 1 UnidadProduccion activa  (ubicacionId, FR-026)
UnidadProduccion 1 ──< N EventoHistorial   (upId)
```

## Transiciones de estado

### UnidadProduccion
```text
(creación) → activa
activa ─[traslado]→ activa        (cambia ubicacionId, libera previa; evento 'traslado')
activa ─[raleo]→ trasladada       (origen; crea N hijas activas; evento 'raleo')  [writeBatch atómico, online-only]
activa ─[cosecha parcial]→ activa (currentQuantity baja; evento 'cosecha')
activa ─[cosecha total]→ cosechada (libera ubicación; evento 'cosecha')
activa ─[pérdida]→ activa         (evento 'descarte')
```

### LoteOrigen
```text
(creación) → activo
activo → cosechado   (automático cuando todas sus UP están 'cosechada', FR-019)
activo → descartado  (manual)
```

## Invariantes

- **INV-1 (FR-009):** En un raleo, `Σ(cantidadInicial de UP hijas) == currentQuantity de la UP origen`. Validado antes del `writeBatch`.
- **INV-2 (FR-012):** El raleo persiste todo o nada (`writeBatch`).
- **INV-3 (FR-026):** A lo sumo 1 UP `activa` por `ubicacionId`. Guard pre-write (single-worker, last-write-wins).
- **INV-4 (FR-017):** En cosecha, `(paquetes × 2) + descarte ≤ currentQuantity`.
- **INV-5 (SC-003):** Toda UP activa tiene `loteOrigenId` resoluble.

## Migración / Switchover (corte limpio, R6)

- La colección `lotes` (legacy) NO se migra ni se transforma. Queda intacta, solo-lectura, accesible vía vista "Histórico".
- Los lotes en curso al switchover se recrean manualmente como LO+UP (operación humana, documentada en quickstart).
- Sin colección `lotes_legacy`, sin dual-listing, sin ventana de 30 días, sin archivado admin.
