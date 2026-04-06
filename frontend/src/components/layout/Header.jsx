import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ThemeToggle from '../ui/ThemeToggle';
import styles from '../../styles/layout/Header.module.css';

const PAGE_TITLES = {
  '/':              { title: 'Dashboard',     subtitle: 'Resumen del día'                 },
  '/turnos':        { title: 'Turnos',        subtitle: 'Gestión de citas y reservas'     },
  '/clientes':      { title: 'Clientes',      subtitle: 'Base de datos de clientes'       },
  '/empleados':     { title: 'Empleados',     subtitle: 'Equipo de profesionales'         },
  '/servicios':     { title: 'Servicios',     subtitle: 'Catálogo de servicios'           },
  '/caja':          { title: 'Caja',          subtitle: 'Ingresos, gastos y cierre'       },
  '/analisis':      { title: 'Análisis',      subtitle: 'Estadísticas del negocio'        },
  '/recordatorios': { title: 'Recordatorios', subtitle: 'Avisos por WhatsApp a clientes'  },
  '/configuracion': { title: 'Configuración', subtitle: 'Ajustes del salón'               },
};

export default function Header() {
  const { pathname } = useLocation();
  const { toggleSidebar } = useApp();
  const page = PAGE_TITLES[pathname] ?? { title: '', subtitle: '' };

  const dateStr = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <header className={styles.header}>
      <button 
        className={styles.menuButton} 
        onClick={toggleSidebar}
        aria-label="Toggle Menu"
      >
        ☰
      </button>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.subtitle}>{page.subtitle}</p>
      </div>

      <div className={styles.right}>
        <div className={styles.date}>
          <span className={styles.dateIcon}>◷</span>
          <span className={styles.dateText}>{dateStr}</span>
        </div>
        <ThemeToggle />
        <div className={styles.userAvatar}>A</div>
      </div>
    </header>
  );
}
