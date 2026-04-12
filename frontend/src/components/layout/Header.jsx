import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ThemeToggle from '../ui/ThemeToggle';
import HelpPanel from '../ui/HelpPanel';
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
  const [helpOpen, setHelpOpen] = useState(false);

  const dateStr = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
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
          <button
            className={styles.helpBtn}
            onClick={() => setHelpOpen(true)}
            aria-label="Ayuda de esta sección"
            title="Ayuda"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
          </button>
          <ThemeToggle />
          <div className={styles.userAvatar}>A</div>
        </div>
      </header>

      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
