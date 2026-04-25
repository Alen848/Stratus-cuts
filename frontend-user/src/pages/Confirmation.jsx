import { useLocation, Link } from 'react-router-dom';

const STYLES = `
  .conf-wrap {
    max-width: 520px;
    margin: 0 auto;
    padding: 5.5rem 2rem 5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.25rem;
    font-family: var(--font-body);
  }

  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    65%  { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .conf-icon {
    width: 76px; height: 76px;
    border-radius: 50%;
    background: rgba(90,154,118,0.08);
    border: 1px solid rgba(90,154,118,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: checkPop 0.55s var(--ease) both;
    flex-shrink: 0;
  }

  .conf-heading {
    text-align: center;
    animation: fadeIn 0.5s ease 0.15s both;
  }

  .conf-title {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 0.6rem;
    letter-spacing: 0.01em;
    line-height: 1.08;
  }

  .conf-subtitle {
    font-family: var(--font-body);
    color: var(--text-3);
    font-size: 0.9rem;
    font-weight: 300;
    line-height: 1.8;
  }

  .conf-card {
    width: 100%;
    background: var(--bg-elevated);
    border: 1px solid rgba(var(--accent-rgb),0.12);
    border-radius: 8px;
    overflow: hidden;
    animation: fadeIn 0.5s ease 0.3s both;
  }

  .conf-card-header {
    padding: 0.95rem 1.6rem;
    background: rgba(var(--accent-rgb),0.05);
    border-bottom: 1px solid rgba(var(--accent-rgb),0.08);
  }

  .conf-card-header-label {
    font-family: var(--font-body);
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 500;
  }

  .conf-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 1.6rem;
    border-bottom: 1px solid var(--border);
    gap: 1rem;
  }
  .conf-row:last-child { border-bottom: none; }

  .conf-row-label {
    font-family: var(--font-body);
    font-size: 0.68rem;
    color: var(--text-4);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    padding-top: 2px;
    font-weight: 400;
  }

  .conf-row-value {
    font-family: var(--font-body);
    font-size: 0.94rem;
    color: var(--text);
    text-align: right;
    line-height: 1.5;
    font-weight: 300;
  }

  .conf-cta {
    display: inline-block;
    padding: 0.82rem 2.2rem;
    border: 1px solid var(--border-md);
    border-radius: 4px;
    color: var(--text-3);
    text-decoration: none;
    font-family: var(--font-body);
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    animation: fadeIn 0.5s ease 0.45s both;
    font-weight: 400;
  }
  .conf-cta:hover {
    border-color: var(--text);
    color: var(--text);
    background: var(--hover);
  }

  .conf-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1.5rem;
    font-family: var(--font-body);
  }
  .conf-empty p {
    color: var(--text-4);
    font-size: 0.88rem;
    font-weight: 300;
  }
  .conf-empty a {
    color: var(--accent);
    text-decoration: none;
    font-size: 0.72rem;
    letter-spacing: 0.16em;
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
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
