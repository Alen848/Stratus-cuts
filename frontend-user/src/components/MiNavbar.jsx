import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2.5rem;
    background: rgba(8, 12, 20, 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  .navbar.scrolled {
    background: rgba(8, 12, 20, 0.98);
    box-shadow: 0 1px 32px rgba(0,0,0,0.45);
    border-bottom-color: rgba(95,168,200,0.12);
  }

  /* Línea fina de acento arriba */
  .navbar::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(95,168,200,0.5) 30%,
      rgba(95,168,200,0.5) 70%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* ── Marca ── */
  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-decoration: none;
    transition: opacity 0.2s;
    flex-shrink: 0;
  }

  .navbar-brand:hover { opacity: 0.82; }

  .brand-monogram {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(95,168,200,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Serif Display', serif;
    font-size: 1rem;
    font-weight: 400;
    color: #5fa8c8;
    flex-shrink: 0;
    letter-spacing: 0.02em;
    transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  }

  .navbar-brand:hover .brand-monogram {
    border-color: rgba(95,168,200,0.7);
    box-shadow: 0 0 18px rgba(95,168,200,0.18);
    background: rgba(95,168,200,0.06);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .brand-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.15rem;
    font-weight: 400;
    color: #eeeae3;
    letter-spacing: 0.02em;
    line-height: 1;
  }

  .brand-tag {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.62rem;
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(95,168,200,0.7);
    line-height: 1;
  }

  /* ── Links centrales (absoluto para centrado real) ── */
  .navbar-center {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-section-link {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 400;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    padding: 0.42rem 1rem;
    border-radius: 4px;
    transition: color 0.2s, background 0.2s, transform 0.2s;
    white-space: nowrap;
  }

  .nav-section-link:hover {
    color: rgba(255,255,255,1);
    background: rgba(255,255,255,0.08);
    transform: translateY(-1px);
  }

  /* ── Derecha ── */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-shrink: 0;
  }

  .nav-link-plain {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 400;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: color 0.2s, transform 0.2s;
  }

  .nav-link-plain:hover {
    color: rgba(255,255,255,1);
    transform: translateY(-1px);
  }

  .nav-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.74rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #080c14;
    background: #5fa8c8;
    text-decoration: none;
    padding: 0.65rem 1.5rem;
    border-radius: 4px;
    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
    white-space: nowrap;
  }

  .nav-cta:hover {
    background: #7dbdd8;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(95,168,200,0.4);
  }

  .nav-cta svg { flex-shrink: 0; }

  /* ── Responsive ── */
  @media (max-width: 820px) {
    .navbar { padding: 0 1.5rem; }
    .navbar-center { display: none; }
    .brand-tag { display: none; }
  }

  @media (max-width: 480px) {
    .brand-text { display: none; }
    .navbar { padding: 0 1.25rem; }
  }
`;

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>

        {/* Marca */}
        <Link to="/" className="navbar-brand">
          <span className="brand-monogram">TV</span>
          <div className="brand-text">
            <span className="brand-name">Turnera Villan</span>
            <span className="brand-tag">Peluquería profesional</span>
          </div>
        </Link>

        {/* Links centrales — solo en Home */}
        {isHome && (
          <div className="navbar-center">
            <a href="#servicios" className="nav-section-link">Servicios</a>
            <a href="#guia" className="nav-section-link">Guía de estilo</a>
          </div>
        )}

        {/* Derecha */}
        <div className="navbar-right">
          {!isHome && (
            <Link to="/" className="nav-link-plain">Inicio</Link>
          )}
          <Link to="/booking" className="nav-cta">
            Reservar turno
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
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