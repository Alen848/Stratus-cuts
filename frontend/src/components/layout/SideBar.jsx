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
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
  const visibleItems = NAV_ITEMS.filter(item => item === null || !item.adminOnly || isAdmin);

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

      <div className={styles.footer}>
        {isSidebarCollapsed ? '©' : `Stratus Industries © ${new Date().getFullYear()}`}
      </div>
    </aside>
  );
}
