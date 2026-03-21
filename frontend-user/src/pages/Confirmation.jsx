import { useLocation, Link } from 'react-router-dom';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

  .conf-wrap {
    max-width: 520px;
    margin: 0 auto;
    padding: 5rem 2rem 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    font-family: 'DM Sans', sans-serif;
  }

  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .conf-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: checkPop 0.5s ease both;
    flex-shrink: 0;
  }

  .conf-heading {
    text-align: center;
    animation: fadeIn 0.5s ease 0.15s both;
  }

  .conf-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2.4rem;
    font-weight: 400;
    color: #eeeae3;
    margin-bottom: 0.5rem;
    letter-spacing: 0.02em;
  }

  .conf-subtitle {
    color: rgba(255,255,255,0.7);
    font-size: 0.95rem;
    font-weight: 300;
    line-height: 1.6;
  }

  .conf-card {
    width: 100%;
    background: #0d1220;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    overflow: hidden;
    animation: fadeIn 0.5s ease 0.3s both;
  }

  .conf-card-header {
    padding: 1rem 1.75rem;
    background: rgba(95,168,200,0.07);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .conf-card-header-label {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #5fa8c8;
    font-weight: 400;
  }

  .conf-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 1.75rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    gap: 1rem;
  }

  .conf-row:last-child { border-bottom: none; }

  .conf-row-label {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    padding-top: 1px;
    font-weight: 300;
  }

  .conf-row-value {
    font-size: 1rem;
    color: #eeeae3;
    text-align: right;
    line-height: 1.4;
    font-weight: 300;
  }

  .conf-cta {
    display: inline-block;
    padding: 0.85rem 2.2rem;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: border-color 0.2s, color 0.2s;
    animation: fadeIn 0.5s ease 0.45s both;
    font-weight: 400;
  }

  .conf-cta:hover {
    border-color: #5fa8c8;
    color: #eeeae3;
  }

  .conf-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1.5rem;
    font-family: 'DM Sans', sans-serif;
  }

  .conf-empty p {
    color: rgba(255,255,255,0.35);
    font-size: 0.9rem;
    font-weight: 300;
  }

  .conf-empty a {
    color: #5fa8c8;
    text-decoration: none;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 400;
  }
`;

const Confirmation = () => {
  const location = useLocation();
  const turno = location.state?.turno;

  if (!turno) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="conf-empty">
          <p>No hay información del turno.</p>
          <Link to="/">Volver al inicio</Link>
        </div>
      </>
    );
  }

  const fecha = new Date(turno.fecha_hora).toLocaleString('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const serviciosNombres = turno.servicios?.map(s => s.servicio?.nombre).filter(Boolean).join(', ');

  const rows = [
    { label: 'Cliente',      value: turno.cliente?.nombre },
    { label: 'Fecha y hora', value: fecha },
    { label: 'Servicio',     value: serviciosNombres },
    { label: 'Estado',       value: turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1) },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="conf-wrap">

        <div className="conf-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="conf-heading">
          <h1 className="conf-title">¡Turno confirmado!</h1>
          <p className="conf-subtitle">
            Te esperamos. Podés cancelar o reagendar cuando necesites.
          </p>
        </div>

        <div className="conf-card">
          <div className="conf-card-header">
            <span className="conf-card-header-label">Detalles de la reserva</span>
          </div>
          {rows.map(({ label, value }) => (
            <div key={label} className="conf-row">
              <span className="conf-row-label">{label}</span>
              <span className="conf-row-value">{value || '—'}</span>
            </div>
          ))}
        </div>

        <Link to="/" className="conf-cta">
          Reservar otro turno
        </Link>

      </div>
    </>
  );
};

export default Confirmation;