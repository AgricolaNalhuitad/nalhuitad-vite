import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLot } from './useLot';
import { AdvanceStageSheet } from './AdvanceStageSheet';
import { HarvestSheet } from './HarvestSheet';
import { RaleoSheet } from './RaleoSheet';
import { STAGE_LABELS, STAGE_CSS_VAR } from './stages';
import { formatDate, lotPlantasIniciales } from './plants';
import styles from './LotDetailScreen.module.css';

type ActiveSheet = 'advance' | 'harvest' | 'raleo' | null;

export function LotDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lot, isLoading, isError, retry } = useLot(id!);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  if (isLoading) {
    return <div className={styles.skeleton} data-testid="detail-skeleton" />;
  }

  if (isError) {
    return (
      <section className={styles.errorRoot}>
        <p className={styles.errorTitle}>No pudimos cargar el lote</p>
        <button className={styles.retryBtn} onClick={retry}>Reintentar</button>
      </section>
    );
  }

  if (!lot) {
    return (
      <section className={styles.errorRoot}>
        <p className={styles.errorTitle}>Lote no encontrado</p>
        <button className={styles.retryBtn} onClick={() => navigate('/lotes')}>
          Volver a Lotes
        </button>
      </section>
    );
  }

  const isCosecha = lot.stage === 'cosecha';
  const locationText = lot.location
    ? `INV-${lot.location.invernadero} · ${lot.location.tipo} ${lot.location.identificador}`
    : null;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/lotes')}>
          ← Lotes
        </button>
        <button className={styles.editBtn} onClick={() => navigate(`/lotes/${id}/editar`)}>
          Editar
        </button>
      </div>

      {/* Stage + nombre */}
      <p className={styles.stageLabel} style={{ color: STAGE_CSS_VAR[lot.stage] }}>
        {STAGE_LABELS[lot.stage]}
      </p>
      <h1 className={styles.name}>{lot.name}</h1>
      {locationText && <p className={styles.location}>{locationText}</p>}
      <p className={styles.date}>Sembrado {formatDate(lot.date)}</p>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Sembradas</p>
          <p className={styles.statValue}>{lotPlantasIniciales(lot).toLocaleString('es-CL')}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>En producción</p>
          <p className={styles.statValue}>{lot.currentQuantity.toLocaleString('es-CL')}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Variedad</p>
          <p className={styles.statValue}>{lot.variety || '—'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsRow}>
        <button
          className={styles.actionBtn}
          onClick={() => setActiveSheet('advance')}
          disabled={isCosecha}
        >
          Avanzar etapa
        </button>
        {(lot.stage === 'transplante' || lot.stage === 'raleo') && (
          <button className={styles.actionBtn} onClick={() => setActiveSheet('raleo')}>
            Registrar raleo
          </button>
        )}
        {lot.stage === 'raleo' && (
          <button className={styles.actionBtnPrimary} onClick={() => setActiveSheet('harvest')}>
            Registrar cosecha
          </button>
        )}
      </div>

      {/* Stage history */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Historial de etapas</p>
        {lot.stageHistory.map((entry, i) => (
          <div key={i} className={styles.historyItem}>
            <p className={styles.historyStage} style={{ color: STAGE_CSS_VAR[entry.stage] }}>
              {`· ${STAGE_LABELS[entry.stage]}`}
            </p>
            <p className={styles.historyDate}>{formatDate(entry.date)}</p>
          </div>
        ))}
      </div>

      {/* Raleo history */}
      {lot.raleos.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Raleos ({lot.raleos.length})</p>
          {lot.raleos.map((r, i) => (
            <div key={i} className={styles.historyItem}>
              <p className={styles.historyStage}>{r.cantidadRaleada.toLocaleString('es-CL')} plantas</p>
              <p className={styles.historyDate}>{formatDate(r.fecha)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sheets */}
      {activeSheet === 'advance' && (
        <AdvanceStageSheet lot={lot} onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'harvest' && (
        <HarvestSheet lotId={lot.id} onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'raleo' && (
        <RaleoSheet lot={lot} onClose={() => setActiveSheet(null)} />
      )}
    </div>
  );
}
