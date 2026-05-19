import styles from './SplashScreen.module.css';

export function SplashScreen() {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <p className={styles.label}>Cargando…</p>
    </div>
  );
}
