import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import styles from '../../styles/layout/SideBar.module.css';

const NAV_ITEMS = [
  { to: '/',          icon: '◈', label: 'Dashboard'  },
  { to: '/turnos',    icon: '◷', label: 'Turnos'     },
  { to: '/clientes',  icon: '◎', label: 'Clientes'   },
  { to: '/empleados', icon: '◉', label: 'Empleados'  },
  { to: '/servicios', icon: '◆', label: 'Servicios'  },
  { to: '/caja',          icon: '◈', label: 'Caja'          },
  { to: '/analisis',      icon: '◑', label: 'Análisis'      },
  { to: '/recordatorios', icon: '◎', label: 'Recordatorios' },
];

export default function Sidebar() {
  const { salonName } = useApp();

  return (
    <aside className={styles.sidebar}>

      <div className={styles.logo}>
        <div className={styles.logoInner}>
          <div className={styles.logoIcon}>✦</div>
          <div>
            <div className={styles.logoName}>{salonName}</div>
            <div className={styles.logoSub}>Panel Admin</div>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>Navegación</div>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navIcon}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        SaaS Turnera © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
