import { Link } from 'react-router-dom';
import { useLotesOrigen } from '../useLotesOrigen';
import { useUnidades } from '../useUnidades';
import type { UnidadProduccion } from '../types';
import styles from './TrazabilidadListScreen.module.css';

export function TrazabilidadListScreen() {
  const { data: lotes, isLoading: lotesLoading, isError, retry } = useLotesOrigen();
  const { data: unidades, isLoading: unidadesLoading } = useUnidades();

  const cargando = lotesLoading || unidadesLoading;
  const activos = (lotes ?? []).filter((l) => l.estado === 'activo');

  const upsPorLote = new Map<string, UnidadProduccion[]>();
  for (const up of unidades ?? []) {
    if (up.estado !== 'activa') continue;
    const arr = upsPorLote.get(up.refLoteOrigen) ?? [];
    arr.push(up);
    upsPorLote.set(up.refLoteOrigen, arr);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Trazabilidad</h1>
        <Link to="/trazabilidad/siembra" className={styles.nueva}>
          + Nueva siembra
        </Link>
      </header>

      {isError && (
        <div className={styles.error} role="alert">
          <span>No se pudieron cargar los lotes.</span>
          <button type="button" onClick={retry} className={styles.retry}>
            Reintentar
          </button>
        </div>
      )}

      {cargando && !isError && <p className={styles.muted}>Cargando…</p>}

      {!cargando && !isError && activos.length === 0 && (
        <p className={styles.muted}>No hay lotes activos. Registra tu primera siembra.</p>
      )}

      <ul className={styles.list}>
        {activos.map((lote) => {
          const ups = upsPorLote.get(lote.id) ?? [];
          return (
            <li key={lote.id} className={styles.card}>
              <div className={styles.cardHead}>
                <p className={styles.nombre}>{lote.nombre}</p>
                <span className={styles.cantidad}>
                  {lote.cantidadInicial.toLocaleString('es-CL')} plantas
                </span>
              </div>
              <p className={styles.meta}>
                {lote.variedad} · sembrado {lote.fechaSiembra}
              </p>
              {ups.map((up) => (
                <div key={up.id} className={styles.up}>
                  <Link to={`/up/${up.id}`} className={styles.upLink}>
                    <span className={styles.ubicacion}>{up.ubicacionId}</span>
                    <span className={styles.upCantidad}>
                      {up.cantidad.toLocaleString('es-CL')}
                    </span>
                  </Link>
                  <Link to={`/up/${up.id}/qr`} className={styles.qrLink}>
                    QR
                  </Link>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
