import { NavLink } from 'react-router-dom';

const STYLES = `
  .sa-sidebar {
    width: 220px;
    min-width: 220px;
    background: #161b27;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
  }

  .sa-sidebar-brand {
    padding: 1.4rem 1.4rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .sa-sidebar-brand-name {
    font-size: 1rem;
    font-weight: 700;
    color: #e2e8f0;
    letter-spacing: 0.04em;
  }
  .sa-sidebar-brand-tag {
    font-size: 0.6rem;
    color: rgba(226,232,240,0.28);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .sa-nav {
    padding: 0.75rem 0.6rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sa-nav-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(226,232,240,0.2);
    padding: 0.6rem 0.75rem 0.35rem;
  }

  .sa-nav-link {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem;
    border-radius: 7px;
    font-size: 0.84rem;
    font-weight: 400;
    color: rgba(226,232,240,0.45);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .sa-nav-link:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(226,232,240,0.8);
  }
  .sa-nav-link.active {
    background: rgba(99,102,241,0.12);
    color: #c7d2fe;
  }
  .sa-nav-link svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.7;
  }
  .sa-nav-link.active svg { opacity: 1; }

  .sa-sidebar-footer {
    padding: 1rem 1rem;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .sa-sidebar-logout {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: none;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    color: rgba(226,232,240,0.35);
    font-size: 0.78rem;
    cursor: pointer;
    text-align: left;
    transition: color 0.2s, border-color 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sa-sidebar-logout:hover {
    color: rgba(226,232,240,0.7);
    border-color: rgba(255,255,255,0.15);
  }
`;

const IconSalones = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconPagos = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NAV_ITEMS = [
  { to: '/',      label: 'Salones',  Icon: IconSalones, end: true },
  { to: '/pagos', label: 'Pagos',    Icon: IconPagos },
];

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('sa_token');
    window.location.href = '/login';
  };

  return (
    <>
      <style>{STYLES}</style>
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <div className="sa-sidebar-brand-name">Stratus</div>
          <div className="sa-sidebar-brand-tag">Superadmin</div>
        </div>

        <nav className="sa-nav">
          <div className="sa-nav-label">General</div>
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sa-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sa-sidebar-footer">
          <button className="sa-sidebar-logout" onClick={handleLogout}>
            <IconLogout />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
