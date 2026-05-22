import { formatDate } from './plants';
import type { Lot } from './types';
import styles from './CosechadoCard.module.css';

interface Props {
  lot: Lot;
}

export function CosechadoCard({ lot }: Props) {
  const lastEntry = lot.stageHistory.at(-1);
  const harvestDate = lastEntry?.stage === 'cosecha' ? lastEntry.date : '';

  return (
    <div className={styles.card}>
      <p className={styles.stageLabel}>Cosecha</p>
      <p className={styles.name}>{lot.name || '(sin nombre)'}</p>
      {harvestDate && <p className={styles.date}>Cosechado {formatDate(harvestDate)}</p>}
    </div>
  );
}
