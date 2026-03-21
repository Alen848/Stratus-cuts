import { Link } from 'react-router-dom';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="footer-brand-name">Turnera Villan</span>
          <span className="footer-brand-tag">Peluquería profesional</span>
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
          © 2025 Turnera Villan
          <span className="footer-dot" />
          Todos los derechos reservados
        </span>
        <span className="footer-copy">Mar del Plata, Argentina</span>
      </div>
    </footer>
  );
};

export default Footer;