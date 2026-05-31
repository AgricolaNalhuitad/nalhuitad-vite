import { useParams, useNavigate } from 'react-router-dom';
import { PrintableQr } from '../qr/PrintableQr';
import { useUnidades } from '../useUnidades';
import { useLotesOrigen } from '../useLotesOrigen';
import styles from './QrPrintScreen.module.css';

export function QrPrintScreen() {
  const { upId } = useParams<{ upId: string }>();
  const navigate = useNavigate();
  const { data: unidades, isLoading: upLoading } = useUnidades();
  const { data: lotes, isLoading: loteLoading } = useLotesOrigen();

  const up = (unidades ?? []).find((u) => u.id === upId);
  const lote = up ? (lotes ?? []).find((l) => l.id === up.refLoteOrigen) : undefined;
  const cargando = upLoading || loteLoading;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate('/trazabilidad')}>
          ← Volver
        </button>
        {up && lote && (
          <button type="button" className={styles.print} onClick={() => window.print()}>
            Imprimir
          </button>
        )}
      </header>

      {cargando && <p className={styles.muted}>Cargando…</p>}

      {!cargando && (!up || !lote) && (
        <p className={styles.muted} role="alert">
          No se encontró la unidad de producción.
        </p>
      )}

      {up && lote && (
        <div className={styles.labelWrap}>
          <PrintableQr
            upId={up.id}
            nombre={lote.nombre}
            variedad={lote.variedad}
            fechaSiembra={lote.fechaSiembra}
          />
        </div>
      )}
    </div>
  );
}
