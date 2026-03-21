import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { to: '/',          icon: '◈', label: 'Dashboard'  },
  { to: '/turnos',    icon: '◷', label: 'Turnos'     },
  { to: '/clientes',  icon: '◎', label: 'Clientes'   },
  { to: '/empleados', icon: '◉', label: 'Empleados'  },
  { to: '/servicios', icon: '◆', label: 'Servicios'  },
  { to: '/caja',      icon: '◈', label: 'Caja'       },
];

export default function Sidebar() {
  const { salonName } = useApp();

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 24px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '8px',
            background: 'var(--gold-dim)',
            border: '1px solid var(--gold-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: 'var(--gold)',
          }}>✦</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, lineHeight: 1.1 }}>
              {salonName}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
              Panel Admin
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 12px 10px' }}>
          Navegación
        </div>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
              background: isActive ? 'var(--gold-dim)' : 'transparent',
              border: isActive ? '1px solid var(--gold-border)' : '1px solid transparent',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: '14px', width: 18, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        letterSpacing: '0.04em',
      }}>
        SaaS Turnera © {new Date().getFullYear()}
      </div>
    </aside>
  );
}