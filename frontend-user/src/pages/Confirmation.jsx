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
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(198,191,182,0.08);
    border: 1px solid rgba(198,191,182,0.22);
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
    font-size: 2.3rem;
    font-weight: 400;
    color: #f0ece3;
    margin-bottom: 0.5rem;
    letter-spacing: 0.01em;
  }

  .conf-subtitle {
    color: rgba(240,236,227,0.55);
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.7;
  }

  .conf-card {
    width: 100%;
    background: rgba(26,22,16,0.7);
    border: 1px solid rgba(201,171,132,0.1);
    border-radius: 8px;
    overflow: hidden;
    animation: fadeIn 0.5s ease 0.3s both;
  }

  .conf-card-header {
    padding: 0.9rem 1.6rem;
    background: rgba(201,171,132,0.06);
    border-bottom: 1px solid rgba(201,171,132,0.08);
  }

  .conf-card-header-label {
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(201,171,132,0.75);
    font-weight: 400;
  }

  .conf-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.95rem 1.6rem;
    border-bottom: 1px solid rgba(201,171,132,0.06);
    gap: 1rem;
  }
  .conf-row:last-child { border-bottom: none; }

  .conf-row-label {
    font-size: 0.72rem;
    color: rgba(240,236,227,0.42);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
    padding-top: 2px;
    font-weight: 300;
  }

  .conf-row-value {
    font-size: 0.95rem;
    color: #f0ece3;
    text-align: right;
    line-height: 1.45;
    font-weight: 300;
  }

  .conf-cta {
    display: inline-block;
    padding: 0.8rem 2rem;
    border: 1px solid rgba(201,171,132,0.15);
    border-radius: 4px;
    color: rgba(240,236,227,0.42);
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: border-color 0.2s, color 0.2s;
    animation: fadeIn 0.5s ease 0.45s both;
    font-weight: 400;
  }
  .conf-cta:hover {
    border-color: rgba(201,171,132,0.45);
    color: #f0ece3;
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
    color: rgba(240,236,227,0.32);
    font-size: 0.88rem;
    font-weight: 300;
  }
  .conf-empty a {
    color: #c9ab84;
    text-decoration: none;
    font-size: 0.75rem;
    letter-spacing: 0.14em;
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

  // El backend devuelve datetimes naive (sin zona horaria). Forzamos parseo como
  // hora local reemplazando la T por espacio para evitar que el navegador lo trate como UTC.
  const fechaStr = turno.fecha_hora?.replace('T', ' ').split('.')[0] || '';
  const fecha = new Date(fechaStr).toLocaleString('es-AR', {
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
            stroke="#c6bfb6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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