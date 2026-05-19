import { NavLink, Outlet } from 'react-router-dom';
import styles from './AppShell.module.css';

const TABS = [
  { to: '/lotes', label: 'Lotes', icon: '🌱' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/alertas', label: 'Alertas', icon: '🔔' },
  { to: '/produccion', label: 'Producción', icon: '📦' },
  { to: '/mas', label: 'Más', icon: '⋯' },
] as const;

export function AppShell() {
  return (
    <div className={styles.root}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <nav className={styles.nav} aria-label="Navegación principal">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ''}`.trim()
            }
          >
            <span className={styles.icon} aria-hidden="true">
              {tab.icon}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
