import styles from './ErrorState.module.css';

interface Props {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: Props) {
  return (
    <section className={styles.root}>
      <div className={styles.iconWrap}>
        <svg
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="var(--amber)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <p className={styles.title}>No pudimos cargar los lotes</p>
      <p className={styles.subtitle}>Revisá tu conexión e intentá de nuevo.</p>
      <button className={styles.retryBtn} onClick={onRetry}>
        Reintentar
      </button>
    </section>
  );
}
