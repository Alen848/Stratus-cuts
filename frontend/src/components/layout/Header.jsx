import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':          { title: 'Dashboard',  subtitle: 'Resumen general del negocio'     },
  '/turnos':    { title: 'Turnos',     subtitle: 'Gestión de citas y reservas'     },
  '/clientes':  { title: 'Clientes',   subtitle: 'Base de datos de clientes'       },
  '/empleados': { title: 'Empleados',  subtitle: 'Equipo de profesionales'         },
  '/servicios': { title: 'Servicios',  subtitle: 'Catálogo de servicios'           },
  '/caja':      { title: 'Caja',       subtitle: 'Ingresos, gastos y ganancias'    },
};

export default function Header() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: '', subtitle: '' };

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--bg-base)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 400,
          lineHeight: 1,
          color: 'var(--text-primary)',
        }}>
          {page.title}
        </h1>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.03em' }}>
          {page.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          fontSize: '12px', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '10px' }}>◷</span>
          <span style={{ textTransform: 'capitalize' }}>{dateStr}</span>
        </div>

        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '14px', color: 'var(--gold)',
          cursor: 'pointer',
        }}>
          A
        </div>
      </div>
    </header>
  );
}