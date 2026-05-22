import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { STAGE_CSS_VAR, STAGE_LABELS } from './stages';
import { daysSince, formatDate, toPlants } from './plants';
import type { Lot } from './types';
import styles from './LotCard.module.css';

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  );
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

interface Props {
  lot: Lot;
}

export const LotCard = memo(function LotCard({ lot }: Props) {
  const navigate = useNavigate();
  const stageEntry = lot.stageHistory.at(-1);
  const daysInStage = daysSince(stageEntry?.date ?? lot.date);
  const cycleDays = daysSince(lot.date);
  const locationText = lot.location
    ? `INV-${lot.location.invernadero} · ${capitalize(lot.location.tipo)} ${lot.location.identificador}`
    : null;

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/lotes/${lot.id}`)}
    >
      <div className={styles.header}>
        <div className={styles.meta}>
          <p className={styles.stageLabel} style={{ color: STAGE_CSS_VAR[lot.stage] }}>
            {STAGE_LABELS[lot.stage]}
          </p>
          <p className={styles.name}>{lot.name || '(sin nombre)'}</p>
          {locationText && <p className={styles.location}>{locationText}</p>}
          <p className={styles.date}>Sembrado {formatDate(lot.date)}</p>
        </div>
        <span className={styles.daysBadge}>{daysInStage}d</span>
      </div>
      <div className={styles.statsRow}>
        <Stat label="Ciclo total" value={`${cycleDays}d`} />
        <Stat label="Sembradas" value={toPlants(lot.quantity).toLocaleString('es-CL')} />
        <Stat label="En producción" value={lot.currentQuantity.toLocaleString('es-CL')} />
      </div>
    </button>
  );
});
