import { LotesDashboard } from './LotesDashboard';
import { LotCard } from './LotCard';
import { CosechadoCard } from './CosechadoCard';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { useLotes } from './useLotes';
import { STAGE_ORDER } from './stages';
import type { Lot } from './types';
import styles from './LotesScreen.module.css';

function SkeletonList() {
  return (
    <div className={styles.skeletonList}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeleton} data-testid="skeleton" />
      ))}
    </div>
  );
}

function sortByStageAndDate(lots: Lot[]): Lot[] {
  return lots.toSorted((a, b) => {
    const diff = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
    if (diff !== 0) return diff;
    return (a.date || '').localeCompare(b.date || '');
  });
}

export function LotesScreen() {
  const { data, isLoading, isError, retry } = useLotes();

  if (isLoading) return <SkeletonList />;
  if (isError)   return <ErrorState onRetry={retry} />;

  const lots = data ?? [];

  if (lots.length === 0) return <EmptyState />;

  const activeLots    = sortByStageAndDate(lots.filter((l) => l.stage !== 'cosecha'));
  const cosechadoLots = lots.filter((l) => l.stage === 'cosecha');

  return (
    <div className={styles.root}>
      <LotesDashboard lots={activeLots} />

      {activeLots.length > 0 && (
        <>
          <p className={styles.sectionLabel}>
            En curso · {activeLots.length} lote{activeLots.length !== 1 ? 's' : ''}
          </p>
          {activeLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </>
      )}

      {cosechadoLots.length > 0 && (
        <>
          <p className={styles.sectionLabel}>
            Cosechados · {cosechadoLots.length}
          </p>
          {cosechadoLots.map((lot) => (
            <CosechadoCard key={lot.id} lot={lot} />
          ))}
        </>
      )}
    </div>
  );
}
