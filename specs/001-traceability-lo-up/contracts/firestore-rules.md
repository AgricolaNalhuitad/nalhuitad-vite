# Contract: Firestore Security Rules (ZONA CRÍTICA)

> ⚠ RBAC + reglas Firestore = zona crítica (CLAUDE.md). Cambios aquí requieren `gstack /code-review --ultra` y `pnpm test:rules` verde antes de PR. Verificar custom claims en cuentas existentes ANTES de deployar reglas (ver memoria: RBAC claims preflight).

## Requisitos de las reglas para las colecciones nuevas

| Colección | Read | Write | Notas |
|-----------|------|-------|-------|
| `lotesOrigen` | usuarios autenticados con rol operativo | create/update mismos roles | no delete (genealogía persiste) |
| `unidadesProduccion` | autenticados rol operativo | create/update mismos roles | update de `estado`/`ubicacionId` permitido; no delete |
| `ubicaciones` | autenticados | **deny client write** (solo seed admin) | catálogo inmutable en runtime (FR-024) |
| `eventosHistorial` | autenticados rol operativo | **create-only** (append-only) | deny update/delete (bitácora inmutable, FR-032) |
| `lotes` (legacy) | autenticados | **deny all write** | solo-lectura tras switchover (R6) |

## Validaciones en reglas (defensa en profundidad)

- `eventosHistorial`: `tipoAccion in ['creacion','traslado','raleo','cosecha','descarte']`; `upId` y `loteOrigenId` presentes.
- `unidadesProduccion`: `estado in ['activa','cosechada','descartada','trasladada']`; `cantidadInicial > 0`.
- `lotesOrigen`: `estado in ['activo','cosechado','descartado']`; `bandejas > 0`.
- Las invariantes de negocio multi-doc (suma de raleo, ocupación) NO se enforçan en reglas (cross-doc) — viven en la capa de app + tests E2E. Las reglas enforçan forma, roles e inmutabilidad.

## Tests (`pnpm test:rules`)

Extender `tests/security/firestore.rules.test.ts`:
- `lotes` legacy: write denegado para cualquier rol.
- `ubicaciones`: write de cliente denegado.
- `eventosHistorial`: create OK, update/delete denegado.
- `unidadesProduccion`/`lotesOrigen`: read/write según rol; no-autenticado denegado.
