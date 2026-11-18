import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/layout/SideBar.module.css';

const NAV_ITEMS = [
  { to: '/',              icon: '◈', label: 'Dashboard'     },
  { to: '/turnos',        icon: '◷', label: 'Turnos'        },
  { to: '/clientes',      icon: '◎', label: 'Clientes'      },
  { to: '/empleados',     icon: '◉', label: 'Empleados',     adminOnly: true },
  { to: '/servicios',     icon: '◆', label: 'Servicios',     adminOnly: true },
  { to: '/caja',          icon: '◈', label: 'Caja',          adminOnly: true },
  { to: '/analisis',      icon: '◑', label: 'Análisis',      adminOnly: true },
  { to: '/recordatorios', icon: '◎', label: 'Recordatorios', adminOnly: true },
  null,
  { to: '/configuracion', icon: '◇', label: 'Configuración', adminOnly: true },
];

export default function Sidebar() {
  const { salonName, isSidebarOpen, closeSidebar, isSidebarCollapsed, toggleCollapse } = useApp();
  const { user, logout } = useAuth();
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
  const visibleItems = NAV_ITEMS.filter(item => item === null || !item.adminOnly || isAdmin);

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      closeSidebar();
      logout();
    }
  };

  return (
    <aside className={`
      ${styles.sidebar}
      ${isSidebarOpen ? styles.sidebarOpen : ''}
      ${isSidebarCollapsed ? styles.collapsed : ''}
    `}>

      <div className={styles.logo}>
        <div className={styles.logoInner}>
          <div className={styles.logoIcon}>✦</div>
          <div className={styles.logoText}>
            <div className={styles.logoName}>{salonName}</div>
            <div className={styles.logoSub}>Panel Admin</div>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item, i) =>
          item === null ? (
            <div key={`divider-${i}`} className={styles.navDivider} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeSidebar}
              title={isSidebarCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <button className={styles.collapseBtn} onClick={toggleCollapse}>
        {isSidebarCollapsed ? '⇢' : '⇠'}
      </button>

      <div style={{ padding: '0 12px 4px' }}>
        <button
          type="button"
          onClick={handleLogout}
          title={isSidebarCollapsed ? 'Cerrar sesión' : ''}
          className={styles.navLink}
          style={{ width: '100%', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--danger)' }}
        >
          <span className={styles.navIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className={styles.navLabel}>Cerrar sesión</span>
        </button>
      </div>

      <div className={styles.footer}>
        {isSidebarCollapsed ? '©' : `Stratus Industries © ${new Date().getFullYear()}`}
      </div>
    </aside>
  );
}
