# ADR 0001 — Corte limpio del modelo legacy `lotes` (Sprint 4)

- **Estado:** Aceptada
- **Fecha:** 2026-05-29
- **Feature:** [specs/001-traceability-lo-up](../../specs/001-traceability-lo-up/plan.md)

## Contexto

Sprint 4 introduce el modelo de trazabilidad **LO+UP** (lote origen + unidades de producción)
para reemplazar el modelo legacy de un solo `Lot` (colección `lotes`). El spec original
contemplaba una convivencia gestionada de ambos modelos: dual-listing, ventana de 30 días,
migración de datos y archivado admin (FR-027…FR-030).

El volumen real de la operación al momento del switchover es de unos pocos lotes activos
(almácigo + producción), no un dataset grande.

## Decisión

**Corte limpio (R6):** no se migran datos ni se mantiene convivencia dual-model.

- La colección `lotes` legacy queda intacta y pasa a **solo-lectura** vía la vista `/historico`
  (`HistoricoScreen`), sin acciones de mutación.
- No existe colección `lotes_legacy`, ni dual-listing, ni ventana de 30 días, ni archivado admin.
- **FR-027…FR-030 quedan descopeados.**
- Los lotes en curso al switchover se **recrean a mano** como LO+UP (operación humana
  documentada en `quickstart.md`): el volumen lo hace más seguro y simple que un script de migración.

## Consecuencias

**Positivas**

- Menos superficie de código y de reglas (sin dual-model ni migración).
- El modelo nuevo arranca limpio; la genealogía LO+UP no hereda inconsistencias del legacy.
- `firestore.rules`: `lotes` con `deny-delete` y (tras el switchover) `deny-write`; sin reglas de migración.

**Negativas / riesgos**

- La recreación manual exige disciplina operativa en el switchover (ventana fuera de horario,
  verificación de que los lotes activos se recrearon correctamente).
- El histórico es consulta pura: un lote viejo no se "continúa" en el modelo nuevo, solo se recrea.
- Campos del modelo legacy (`raleos`, `childrenIds`, `mortalidadAcumulada`, …) siguen en uso por las
  vistas legacy activas hasta el switchover; su limpieza es un follow-up posterior (T053).

## Referencias

- `specs/001-traceability-lo-up/` — `plan.md`, `data-model.md` (reconciliación 2026-05-29), `quickstart.md` (switchover)
- Incidente `e6d4aee` (deploy-gating de reglas RBAC) — ver header de `firestore.rules`
