import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSalonSlug } from '../utils/slug';
import logoLight from '../assets/logo-light.svg';
import logoDark from '../assets/logo-dark.svg';

const API_URL = import.meta.env.VITE_API_URL || '';

const STYLES = `
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 72px;
    display: flex;
    align-items: center;
    padding: 0 2.5rem;
    background: var(--nav-bg);
    backdrop-filter: blur(34px) saturate(1.4);
    -webkit-backdrop-filter: blur(34px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, height 0.35s ease;
  }
  .navbar.scrolled {
    background: var(--nav-bg-solid);
    border-bottom-color: var(--border);
    box-shadow: var(--nav-shadow);
  }

  /* Transparente sobre el hero oscuro (home, sin scroll) */
  .navbar.navbar--hero {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-bottom-color: transparent;
    box-shadow: none;
  }
  .navbar--hero .brand-tag  { color: rgba(255,255,255,0.65); }
  .navbar--hero .nav-section-link,
  .navbar--hero .nav-link-plain { color: rgba(255,255,255,0.8); }
  .navbar--hero .nav-section-link:hover,
  .navbar--hero .nav-link-plain:hover { color: #fff; background: rgba(255,255,255,0.1); }
  .navbar--hero .theme-toggle {
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.3);
  }
  .navbar--hero .theme-toggle:hover {
    color: #fff; border-color: #fff; background: rgba(255,255,255,0.1);
  }

  .navbar-brand {
    text-decoration: none;
    display: flex; flex-direction: column; gap: 5px;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }
  .navbar-brand:hover { opacity: 0.75; }

  .brand-logo {
    height: 34px; width: auto; display: block;
  }
  .brand-tag {
    font-family: var(--font-body);
    font-size: 0.46rem; font-weight: 600;
    letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--gold); line-height: 1;
  }

  .navbar-center {
    display: flex; align-items: center; gap: 0.2rem;
    position: absolute; left: 50%; transform: translateX(-50%);
  }
  .nav-section-link {
    font-family: var(--font-body);
    font-size: 0.68rem; font-weight: 500;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-3); text-decoration: none;
    padding: 0.45rem 1rem; border-radius: 3px;
    transition: color 0.2s ease, background 0.2s ease;
    white-space: nowrap;
  }
  .nav-section-link:hover { color: var(--text); background: var(--hover); }

  .navbar-right {
    display: flex; align-items: center; gap: 1.1rem;
    margin-left: auto; flex-shrink: 0;
  }
  .nav-link-plain {
    font-family: var(--font-body);
    font-size: 0.68rem; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-3); text-decoration: none;
    transition: color 0.2s ease;
  }
  .nav-link-plain:hover { color: var(--text); }

  .nav-book-btn {
    font-family: var(--font-body);
    font-size: 0.66rem; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--cta-text); background: var(--cta);
    text-decoration: none; padding: 0.7rem 1.4rem; border-radius: 2px;
    transition: background 0.2s ease, transform 0.2s ease;
  }
  .nav-book-btn:hover { background: var(--cta-hover); transform: translateY(-1px); }
  .navbar--hero .nav-book-btn { background: #F2EEE2; color: #35392E; }
  .navbar--hero .nav-book-btn:hover { background: #fff; }

  .theme-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px;
    border: 1px solid var(--border-md); border-radius: 50%;
    background: transparent; cursor: pointer;
    color: var(--text-3);
    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }
  .theme-toggle:hover {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--hover);
  }

  @media (max-width: 860px) {
    .navbar { padding: 0 1.5rem; }
    .navbar-center { display: none; }
    .nav-book-btn { display: none; }
  }
  @media (max-width: 480px) {
    .navbar { padding: 0 1.25rem; height: 64px; }
    .brand-logo { height: 28px; }
    .theme-toggle { width: 36px; height: 36px; }
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
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const slug = getSalonSlug();
    if (!slug || !API_URL) return;
    fetch(`${API_URL}/public/${slug}/info`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.nombre) setSalonNombre(d.nombre); })
      .catch(() => {});
  }, []);

  const displayName = salonNombre || 'Blue Moon';
  const heroMode = isHome && !scrolled;

  return (
    <>
      <style>{STYLES}</style>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}${heroMode ? ' navbar--hero' : ''}`}>

        <Link to="/" className="navbar-brand">
          <img
            className="brand-logo"
            src={heroMode || theme === 'dark' ? logoDark : logoLight}
            alt={displayName}
          />
          <span className="brand-tag">Centro de Estética</span>
        </Link>

        {isHome && (
          <div className="navbar-center">
            <a href="#filosofia" className="nav-section-link">Nosotras</a>
            <a href="#servicios" className="nav-section-link">Servicios</a>
          </div>
        )}

        <div className="navbar-right">
          {!isHome && <Link to="/" className="nav-link-plain">Inicio</Link>}
          <Link to="/booking" className="nav-book-btn">Reservar</Link>
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
