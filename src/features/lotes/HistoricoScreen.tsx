import { useLotes } from './useLotes';
import { STAGE_CSS_VAR, STAGE_LABELS } from './stages';
import styles from './HistoricoScreen.module.css';

/**
 * Vista de consulta (solo lectura) sobre la colección `lotes` legacy (US6, corte limpio R6).
 * Reusa useLotes; NO expone acciones de mutación (avanzar etapa / ralear / cosechar / editar).
 */
export function HistoricoScreen() {
  const { data: lotes, isLoading, isError, retry } = useLotes();
  const items = lotes ?? [];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Histórico</h1>
        <span className={styles.readonly}>solo lectura</span>
      </header>
      <p className={styles.nota}>Lotes del modelo anterior. Vista de consulta — sin ediciones.</p>

      {isError && (
        <div className={styles.error} role="alert">
          <span>No se pudieron cargar los lotes históricos.</span>
          <button type="button" onClick={retry} className={styles.retry}>
            Reintentar
          </button>
        </div>
      )}

      {isLoading && !isError && <p className={styles.muted}>Cargando…</p>}

      {!isLoading && !isError && items.length === 0 && (
        <p className={styles.muted}>No hay lotes en el histórico.</p>
      )}

      <ul className={styles.list}>
        {items.map((lote) => (
          <li key={lote.id} className={styles.card}>
            <div className={styles.cardHead}>
              <p className={styles.nombre}>{lote.name}</p>
              <span className={styles.stage} style={{ color: STAGE_CSS_VAR[lote.stage] }}>
                {STAGE_LABELS[lote.stage]}
              </span>
            </div>
            <p className={styles.meta}>
              {lote.variety} · {lote.currentQuantity.toLocaleString('es-CL')} plantas · {lote.date}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
