import { Link } from 'react-router-dom';
import '../styles/footer.css';

const SALON_SLUG = import.meta.env.VITE_SALON_SLUG || '';
const API_URL    = import.meta.env.VITE_API_URL    || '';

import { useState, useEffect } from 'react';

const Footer = () => {
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    if (!SALON_SLUG || !API_URL) return;
    fetch(`${API_URL}/public/${SALON_SLUG}/info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.nombre) setSalonNombre(d.nombre); })
      .catch(() => {});
  }, []);

  const displayName = salonNombre || 'Peluquería';

  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="footer-brand-name">{displayName}</span>
          <span className="footer-brand-tag">Reservas online · Stratus Industries</span>
        </div>

        <div>
          <p className="footer-links-title">Navegación</p>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Inicio</Link></li>
            <li><Link to="/booking" className="footer-link">Reservar turno</Link></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <span className="footer-copy">
          © {new Date().getFullYear()} {displayName}
          <span className="footer-dot" />
          Todos los derechos reservados
        </span>
        <span className="footer-copy" style={{ color: 'rgba(198,191,182,0.25)', fontSize: '0.68rem', letterSpacing: '0.08em' }}>
          Powered by Stratus Industries
        </span>
      </div>
    </footer>
  );
};

export default Footer;
