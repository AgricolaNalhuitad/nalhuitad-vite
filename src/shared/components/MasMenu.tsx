import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import styles from './MasMenu.module.css';

const ITEMS = [
  { slug: 'nuevo', label: 'Nuevo lote' },
  { slug: 'historial', label: 'Historial' },
  { slug: 'notas', label: 'Notas' },
  { slug: 'clinica', label: 'Clínica' },
  { slug: 'sensores', label: 'Sensores' },
  { slug: 'config', label: 'Configuración' },
] as const;

export function MasMenu() {
  const { signOut } = useAuth();

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>Más</h1>
      <nav className={styles.list}>
        <Link to="/trazabilidad" className={styles.item}>
          Trazabilidad
        </Link>
        {ITEMS.map((item) => (
          <Link key={item.slug} to={`/mas/${item.slug}`} className={styles.item}>
            {item.label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={() => void signOut()} className={styles.signOut}>
        Cerrar sesión
      </button>
    </section>
  );
}
