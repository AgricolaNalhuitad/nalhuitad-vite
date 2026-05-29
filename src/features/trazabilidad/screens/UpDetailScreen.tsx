import { Link, useParams } from 'react-router-dom';
import { useUnidad } from '../useUnidad';
import { useLotesOrigen } from '../useLotesOrigen';
import type { HistorialTipo, Stage } from '../types';
import styles from './UpDetailScreen.module.css';

const ETAPA_LABEL: Record<Stage, string> = {
  almacigo: 'Almácigo',
  transplante: 'Transplante',
  raleo: 'Raleo',
  cosecha: 'Cosecha',
};

const ACCION_LABEL: Record<HistorialTipo, string> = {
  creacion: 'Creación',
  traslado: 'Traslado',
  raleo: 'Raleo',
  cosecha: 'Cosecha',
  descarte: 'Descarte',
};

export function UpDetailScreen() {
  const { upId } = useParams<{ upId: string }>();
  const { data: up, isLoading } = useUnidad(upId ?? '');
  const { data: lotes } = useLotesOrigen();
  const lote = up ? (lotes ?? []).find((l) => l.id === up.refLoteOrigen) : undefined;

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <p className={styles.muted}>Cargando…</p>
      </div>
    );
  }

  if (!up) {
    return (
      <div className={styles.screen}>
        <Link to="/trazabilidad" className={styles.back}>
          ← Volver
        </Link>
        <p className={styles.muted} role="alert">
          Unidad de producción no encontrada.
        </p>
      </div>
    );
  }

  const historial = [...(up.historial ?? [])].reverse(); // más reciente primero

  return (
    <div className={styles.screen}>
      <Link to="/trazabilidad" className={styles.back}>
        ← Volver
      </Link>

      <header className={styles.header}>
        <h1 className={styles.heading}>{lote?.nombre ?? 'Unidad'}</h1>
        <span className={styles.estado} data-estado={up.estado}>
          {up.estado}
        </span>
      </header>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Variedad</dt>
          <dd>{lote?.variedad ?? '—'}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Ubicación</dt>
          <dd>{up.ubicacionId}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Cantidad</dt>
          <dd>{up.cantidad.toLocaleString('es-CL')}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Etapa</dt>
          <dd>{ETAPA_LABEL[up.etapa]}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Ingreso</dt>
          <dd>{up.fechaIngreso}</dd>
        </div>
      </dl>

      {up.estado === 'activa' && (
        <div className={styles.actions}>
          <Link to={`/up/${up.id}/trasladar`} className={styles.action}>
            Trasladar
          </Link>
          <Link to={`/up/${up.id}/ralear`} className={styles.action}>
            Ralear
          </Link>
          <Link to={`/up/${up.id}/qr`} className={styles.actionSecondary}>
            QR
          </Link>
        </div>
      )}

      <section className={styles.historialBlock}>
        <h2 className={styles.subheading}>Historial</h2>
        <ul className={styles.historial}>
          {historial.map((h, i) => (
            <li key={`${h.fecha}-${h.tipoAccion}-${i}`} className={styles.evento}>
              <span className={styles.eventoAccion}>{ACCION_LABEL[h.tipoAccion]}</span>
              <span className={styles.eventoFecha}>{h.fecha}</span>
              {h.tipoAccion === 'traslado' && h.ubicacionPrevia && (
                <span className={styles.eventoDetalle}>
                  {h.ubicacionPrevia} → {h.ubicacionNueva}
                </span>
              )}
              {typeof h.cantidad === 'number' && (
                <span className={styles.eventoDetalle}>
                  {h.cantidad.toLocaleString('es-CL')} plantas
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
