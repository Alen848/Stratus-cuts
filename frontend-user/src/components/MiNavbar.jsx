import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const API_URL  = import.meta.env.VITE_API_URL  || '';
const SALON_SLUG = import.meta.env.VITE_SALON_SLUG || '';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');

  /* ── Línea de color en la parte superior de la página ── */
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(198,191,182,0.45) 25%,
      rgba(198,191,182,0.7) 50%,
      rgba(198,191,182,0.45) 75%,
      transparent 100%
    );
    z-index: 200;
    pointer-events: none;
  }

  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 68px;
    display: flex;
    align-items: center;
    padding: 0 2.5rem;
    background: rgba(12,12,11,0.92);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border-bottom: 1px solid rgba(255,255,255,0.055);
    transition: background 0.3s, border-color 0.3s;
  }

  .navbar.scrolled {
    background: rgba(12,12,11,0.98);
    border-bottom-color: rgba(198,191,182,0.1);
  }

  /* ── Layout de 3 zonas ── */
  .navbar-brand {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: opacity 0.2s;
    flex-shrink: 0;
    min-width: 0;
  }
  .navbar-brand:hover { opacity: 0.72; }

  .brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.45rem;
    font-weight: 400;
    color: #ece8e2;
    letter-spacing: 0.02em;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
  }

  .brand-tag {
    font-family: 'Inter', sans-serif;
    font-size: 0.5rem;
    font-weight: 400;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(198,191,182,0.45);
    line-height: 1;
  }

  /* Zona central — centrado absoluto real */
  .navbar-center {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-section-link {
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(236,232,226,0.42);
    text-decoration: none;
    padding: 0.4rem 0.9rem;
    border-radius: 4px;
    transition: color 0.18s, background 0.18s;
    white-space: nowrap;
  }
  .nav-section-link:hover {
    color: rgba(236,232,226,0.82);
    background: rgba(255,255,255,0.05);
  }

  .nav-sep {
    width: 1px; height: 10px;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  /* Zona derecha */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .nav-link-plain {
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(236,232,226,0.42);
    text-decoration: none;
    transition: color 0.18s;
  }
  .nav-link-plain:hover { color: rgba(236,232,226,0.8); }

  .nav-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #0c0c0b;
    background: #c6bfb6;
    text-decoration: none;
    padding: 0.6rem 1.35rem;
    border-radius: 3px;
    transition: background 0.2s, transform 0.18s;
    white-space: nowrap;
  }
  .nav-cta:hover {
    background: #dbd4cb;
    transform: translateY(-1px);
  }
  .nav-cta svg { flex-shrink: 0; }

  /* ── Responsive ── */
  @media (max-width: 820px) {
    .navbar { padding: 0 1.5rem; }
    .navbar-center { display: none; }
    .brand-tag { display: none; }
  }
  @media (max-width: 480px) {
    .navbar { padding: 0 1.25rem; }
    .brand-name { font-size: 1.25rem; max-width: 160px; }
    .nav-link-plain { display: none; }
  }
`;

const Navbar = () => {
  const location  = useLocation();
  const isHome    = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!SALON_SLUG || !API_URL) return;
    fetch(`${API_URL}/public/${SALON_SLUG}/info`)
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
          <span className="brand-tag">Reservas online · Stratus</span>
        </Link>

        {isHome && (
          <div className="navbar-center">
            <a href="#servicios" className="nav-section-link">Servicios</a>
            <span className="nav-sep" />
            <a href="#guia" className="nav-section-link">Guía de estilo</a>
          </div>
        )}

        <div className="navbar-right">
          {!isHome && (
            <Link to="/" className="nav-link-plain">Inicio</Link>
          )}
          <Link to="/booking" className="nav-cta">
            Reservar
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"/>
              <polyline points="7 7 17 7 17 17"/>
            </svg>
          </Link>
        </div>

      </nav>
    </>
  );
};

export default Navbar;
