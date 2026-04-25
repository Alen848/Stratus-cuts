import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSalonSlug } from '../utils/slug';

const API_URL = import.meta.env.VITE_API_URL || '';

const STYLES = `
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(var(--accent-rgb),0.2) 20%,
      rgba(var(--accent-rgb),0.35) 50%,
      rgba(var(--accent-rgb),0.2) 80%,
      transparent 100%
    );
    z-index: 500;
    pointer-events: none;
  }

  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 70px;
    display: flex;
    align-items: center;
    padding: 0 2.5rem;
    background: var(--nav-bg);
    backdrop-filter: blur(40px) saturate(1.4);
    -webkit-backdrop-filter: blur(40px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  }

  .navbar.scrolled {
    background: var(--nav-bg-solid);
    border-bottom-color: rgba(var(--accent-rgb),0.1);
    box-shadow: var(--nav-shadow);
  }

  .navbar-brand {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 3px;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }
  .navbar-brand:hover { opacity: 0.7; }

  .brand-name {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--text);
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }

  .brand-tag {
    font-family: var(--font-body);
    font-size: 0.46rem;
    font-weight: 400;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(var(--accent-rgb),0.45);
    line-height: 1;
  }

  .navbar-center {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-section-link {
    font-family: var(--font-body);
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-4);
    text-decoration: none;
    padding: 0.45rem 1rem;
    border-radius: 4px;
    transition: color 0.2s ease, background 0.2s ease;
    white-space: nowrap;
  }
  .nav-section-link:hover {
    color: var(--text);
    background: var(--hover);
  }

  .nav-sep {
    width: 1px; height: 10px;
    background: var(--border);
    flex-shrink: 0;
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .nav-link-plain {
    font-family: var(--font-body);
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-4);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .nav-link-plain:hover { color: var(--text); }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px; height: 38px;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    color: var(--text-3);
    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }
  .theme-toggle:hover {
    color: var(--accent);
    border-color: rgba(var(--accent-rgb),0.3);
    background: var(--hover);
  }

  @media (max-width: 820px) {
    .navbar { padding: 0 1.5rem; }
    .navbar-center { display: none; }
    .brand-tag { display: none; }
    /* Center the toggle in the navbar on mobile */
    .theme-toggle {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
  @media (max-width: 480px) {
    .navbar { padding: 0 1.25rem; height: 62px; }
    .brand-name { font-size: 1.3rem; max-width: 200px; }
    .theme-toggle { width: 34px; height: 34px; }
  }
`;

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Navbar = () => {
  const location   = useLocation();
  const isHome     = location.pathname === '/';
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const slug = getSalonSlug();
    if (!slug || !API_URL) return;
    fetch(`${API_URL}/public/${slug}/info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.nombre) setSalonNombre(d.nombre); })
      .catch(() => {});
  }, []);

  const displayName = salonNombre || 'Peluquería';

  return (
    <>
      <style>{STYLES}</style>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>

        <Link to="/" className="navbar-brand">
          <span className="brand-name">{displayName}</span>
          <span className="brand-tag">Reservas online</span>
        </Link>

        {isHome && (
          <div className="navbar-center">
            <a href="#guia" className="nav-section-link">Guía de estilo</a>
          </div>
        )}

        <div className="navbar-right">
          {!isHome && (
            <Link to="/" className="nav-link-plain">Inicio</Link>
          )}
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>

      </nav>
    </>
  );
};

export default Navbar;
