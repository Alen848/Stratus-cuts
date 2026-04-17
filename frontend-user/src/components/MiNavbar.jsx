import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { getSalonSlug } from '../utils/slug';

const API_URL = import.meta.env.VITE_API_URL || '';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');

  /* -- Linea superior dorada -- */
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(139,111,71,0.2) 20%,
      rgba(139,111,71,0.35) 50%,
      rgba(139,111,71,0.2) 80%,
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
    background: rgba(250,247,242,0.88);
    backdrop-filter: blur(40px) saturate(1.4);
    -webkit-backdrop-filter: blur(40px) saturate(1.4);
    border-bottom: 1px solid rgba(44,36,32,0.06);
    transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  }

  .navbar.scrolled {
    background: rgba(250,247,242,0.96);
    border-bottom-color: rgba(139,111,71,0.1);
    box-shadow: 0 1px 12px rgba(44,36,32,0.04);
  }

  /* -- Brand -- */
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
    font-family: 'Bodoni Moda', serif;
    font-size: 1.5rem;
    font-weight: 400;
    color: #2C2420;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }

  .brand-tag {
    font-family: 'Jost', sans-serif;
    font-size: 0.46rem;
    font-weight: 400;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(139,111,71,0.45);
    line-height: 1;
  }

  /* -- Centro -- */
  .navbar-center {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-section-link {
    font-family: 'Jost', sans-serif;
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(44,36,32,0.4);
    text-decoration: none;
    padding: 0.45rem 1rem;
    border-radius: 4px;
    transition: color 0.2s ease, background 0.2s ease;
    white-space: nowrap;
  }
  .nav-section-link:hover {
    color: rgba(44,36,32,0.8);
    background: rgba(44,36,32,0.04);
  }

  .nav-sep {
    width: 1px; height: 10px;
    background: rgba(44,36,32,0.08);
    flex-shrink: 0;
  }

  /* -- Derecha -- */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .nav-link-plain {
    font-family: 'Jost', sans-serif;
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(44,36,32,0.4);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .nav-link-plain:hover { color: rgba(44,36,32,0.8); }

  .nav-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #FAF7F2;
    background: #2C2420;
    text-decoration: none;
    padding: 0.62rem 1.4rem;
    border-radius: 3px;
    transition: background 0.2s ease, transform 0.18s ease;
    white-space: nowrap;
  }
  .nav-cta:hover {
    background: #433832;
    transform: translateY(-1px);
  }
  .nav-cta svg { flex-shrink: 0; }

  /* -- Responsive -- */
  @media (max-width: 820px) {
    .navbar { padding: 0 1.5rem; }
    .navbar-center { display: none; }
    .brand-tag { display: none; }
  }
  @media (max-width: 480px) {
    .navbar { padding: 0 1.25rem; }
    .brand-name { font-size: 1.3rem; max-width: 170px; }
    .nav-link-plain { display: none; }
  }
`;

const Navbar = () => {
  const location   = useLocation();
  const isHome     = location.pathname === '/';
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
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
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
