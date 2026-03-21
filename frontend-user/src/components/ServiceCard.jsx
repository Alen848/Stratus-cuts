import { useNavigate } from 'react-router-dom';

const ServiceCard = ({ service, index = 0 }) => {
  const navigate = useNavigate();

  const handleReservar = () => {
    navigate('/booking', { state: { selectedService: service } });
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
        cursor: 'default',
        animationDelay: `${index * 80}ms`,
        animation: 'fadeUp 0.5s ease both',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(74,124,247,0.35)';
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(74,124,247,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .btn-reservar {
          margin-top: auto;
          padding: 0.85rem 1.5rem;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
          width: 100%;
        }
        .btn-reservar:hover {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 0 20px var(--accent-glow);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Número decorativo */}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.8rem',
        color: 'var(--accent)',
        letterSpacing: '0.1em',
        opacity: 0.6,
      }}>
        0{(index + 1).toString().padStart(1, '0')}
      </span>

      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        fontWeight: 400,
        letterSpacing: '0.02em',
        color: 'var(--text)',
        lineHeight: 1.2,
      }}>
        {service.nombre}
      </h3>

      <p style={{
        fontSize: '0.9rem',
        color: 'var(--muted)',
        lineHeight: 1.6,
        flexGrow: 1,
      }}>
        {service.descripcion || 'Servicio profesional de calidad.'}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        marginTop: '0.5rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          letterSpacing: '0.06em',
        }}>
          {service.duracion_minutos} min
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--text)',
        }}>
          ${service.precio}
        </span>
      </div>

      <button className="btn-reservar" onClick={handleReservar}>
        Reservar turno
      </button>
    </div>
  );
};

export default ServiceCard;