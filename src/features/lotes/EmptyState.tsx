import { useNavigate } from 'react-router-dom';
import styles from './EmptyState.module.css';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <section className={styles.root}>
      <div className={styles.iconWrap}>
        <svg
          width="32" height="32" viewBox="0 0 24 24"
          fill="none" stroke="var(--green)" strokeWidth="1.6" strokeLinecap="round"
        >
          <path d="M12 2a9 9 0 0 1 9 9c0 4.97-9 13-9 13S3 15.97 3 11a9 9 0 0 1 9-9z" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      </div>
      <p className={styles.title}>Sin lotes registrados</p>
      <p className={styles.subtitle}>
        Registrá tu primer lote para<br />empezar el seguimiento.
      </p>
      <button className={styles.cta} onClick={() => navigate('/mas/nuevo')}>
        + Registrar primer lote
      </button>
    </section>
  );
}
