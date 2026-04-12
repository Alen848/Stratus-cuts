import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServicios } from '../services/api';
import FaceShapeGuide from '../components/FaceShapeGuide';

const STYLES = `
  .home {
    min-height: 100vh;
    background: transparent;
    padding-top: 70px;
    font-family: 'Jost', sans-serif;
  }

  /* ══════════════════════════════════════
     HERO
  ══════════════════════════════════════ */
  .hero {
    padding: 7rem 2rem 6rem;
    max-width: 1040px;
    margin: 0 auto;
    border-bottom: 1px solid rgba(255,255,255,0.045);
    position: relative;
    overflow: hidden;
  }

  /* Glow ambiental sutil */
  .hero::before {
    content: '';
    position: absolute;
    top: -80px; right: -160px;
    width: 700px; height: 600px;
    background: radial-gradient(ellipse at center, rgba(201,169,110,0.035) 0%, transparent 65%);
    pointer-events: none;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #c9a96e;
    margin-bottom: 2rem;
    opacity: 0;
    animation: heroFade 0.5s ease 0.05s forwards;
  }
  .hero-eyebrow::before {
    content: '';
    display: inline-block;
    width: 28px; height: 1px;
    background: #c9a96e;
    opacity: 0.45;
  }

  .hero-title {
    font-family: 'Bodoni Moda', serif;
    font-size: clamp(3.8rem, 8vw, 6.5rem);
    font-weight: 400;
    color: #f2ede6;
    line-height: 1.02;
    letter-spacing: -0.02em;
    opacity: 0;
    animation: heroFade 0.6s ease 0.15s forwards;
  }
  .hero-title em {
    font-style: italic;
    color: #c9a96e;
  }

  .hero-sub {
    font-family: 'Jost', sans-serif;
    font-size: 1.05rem;
    font-weight: 300;
    color: rgba(242,237,230,0.4);
    line-height: 1.9;
    max-width: 400px;
    margin-top: 1.75rem;
    opacity: 0;
    animation: heroFade 0.6s ease 0.28s forwards;
  }

  /* ── Features horizontales ── */
  .hero-features {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem 2.5rem;
    margin-top: 3rem;
    opacity: 0;
    animation: heroFade 0.6s ease 0.42s forwards;
  }

  .hero-feature {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.78rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(242,237,230,0.72);
  }

  .hf-icon {
    width: 20px; height: 20px; min-width: 20px;
    background: rgba(201,169,110,0.08);
    border: 1px solid rgba(201,169,110,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hf-icon svg {
    width: 9px; height: 9px;
    stroke: #c9a96e;
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @keyframes heroFade {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ══════════════════════════════════════
     SERVICIOS
  ══════════════════════════════════════ */
  .main-layout {
    max-width: 1040px;
    margin: 0 auto;
    padding: 0 2rem 10rem;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3rem 0 0;
    margin-bottom: 0.2rem;
  }

  .section-label {
    font-family: 'Jost', sans-serif;
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(201,169,110,0.55);
  }

  .section-count {
    font-family: 'Jost', sans-serif;
    font-size: 0.68rem;
    font-weight: 300;
    color: rgba(242,237,230,0.48);
    letter-spacing: 0.06em;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(201,169,110,0.25) 0%, rgba(201,169,110,0.07) 55%, transparent 100%);
    margin-bottom: 0;
  }

  /* ── Lista de servicios ── */
  .service-list { list-style: none; }

  .service-item {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    border-left: 2px solid transparent;
    cursor: pointer;
    transition: background 0.22s ease, border-left-color 0.22s ease;
  }

  .service-item:hover {
    background: rgba(201,169,110,0.04);
    border-left-color: rgba(201,169,110,0.3);
  }
  .service-item:hover .service-item-name { color: #f2ede6; }
  .service-item:hover .check-box:not(.checked) {
    border-color: rgba(201,169,110,0.4);
  }
  .service-item.selected-item {
    background: rgba(201,169,110,0.05);
    border-left-color: #c9a96e;
  }

  /* Checkbox */
  .check-box {
    width: 20px; height: 20px; min-width: 20px;
    border: 1px solid rgba(201,169,110,0.18);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.18s ease, background 0.18s ease;
    flex-shrink: 0;
  }
  .check-box.checked {
    background: #c9a96e;
    border-color: #c9a96e;
  }

  .check-icon {
    width: 10px; height: 10px;
    stroke: #080808;
    stroke-width: 2.5;
    fill: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .check-box.checked .check-icon { opacity: 1; }

  .service-item-info { flex: 1; min-width: 0; }

  .service-item-name {
    font-family: 'Jost', sans-serif;
    font-size: 1.15rem;
    font-weight: 400;
    color: #f2ede6;
    transition: color 0.18s ease;
    letter-spacing: 0.01em;
  }

  .service-item-desc {
    font-family: 'Jost', sans-serif;
    font-size: 0.84rem;
    font-weight: 300;
    color: rgba(242,237,230,0.55);
    margin-top: 0.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .service-item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
    flex-shrink: 0;
  }

  .service-item-price {
    font-family: 'Bodoni Moda', serif;
    font-size: 1.35rem;
    color: #c9a96e;
    line-height: 1;
  }

  .service-item-duration {
    font-family: 'Jost', sans-serif;
    font-size: 0.68rem;
    font-weight: 300;
    color: rgba(242,237,230,0.52);
    letter-spacing: 0.06em;
  }

  .state-msg {
    padding: 4rem 0;
    text-align: center;
    font-family: 'Jost', sans-serif;
    font-size: 0.88rem;
    font-weight: 300;
    color: rgba(242,237,230,0.5);
    letter-spacing: 0.04em;
  }

  /* ══════════════════════════════════════
     BUDGET BAR
  ══════════════════════════════════════ */
  .budget-bar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: rgba(8,8,8,0.97);
    border-top: 1px solid rgba(201,169,110,0.18);
    backdrop-filter: blur(32px) saturate(1.5);
    -webkit-backdrop-filter: blur(32px) saturate(1.5);
    padding: 1.15rem 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    z-index: 200;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  }

  .budget-left { display: flex; flex-direction: column; gap: 0.12rem; }

  .budget-label {
    font-family: 'Jost', sans-serif;
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #c9a96e;
  }

  .budget-detail {
    font-family: 'Jost', sans-serif;
    font-size: 0.82rem;
    font-weight: 300;
    color: rgba(242,237,230,0.78);
    max-width: 380px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .budget-right {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    flex-shrink: 0;
  }

  .budget-total { text-align: right; }

  .budget-total-label {
    font-family: 'Jost', sans-serif;
    font-size: 0.58rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(242,237,230,0.62);
    font-weight: 400;
  }

  .budget-total-amount {
    font-family: 'Bodoni Moda', serif;
    font-size: 1.95rem;
    color: #f2ede6;
    line-height: 1;
    margin-top: 0.05rem;
  }

  .budget-btn {
    padding: 0.82rem 2.1rem;
    background: #c9a96e;
    border: none;
    border-radius: 3px;
    color: #080808;
    font-family: 'Jost', sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.18s ease;
    white-space: nowrap;
  }
  .budget-btn:hover {
    background: #dbbf8a;
    transform: translateY(-1px);
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .hero { padding: 5rem 1.5rem 4rem; }
    .main-layout { padding: 0 1.5rem 7rem; }
    .budget-bar { padding: 1rem 1.25rem; gap: 1rem; }
    .budget-detail { display: none; }
    .budget-total-amount { font-size: 1.6rem; }
    .budget-btn { padding: 0.72rem 1.4rem; }
  }

  @media (max-width: 480px) {
    .hero-title { font-size: 3.2rem; }
    .hero-features { gap: 1rem 1.5rem; }
    .hero-feature { font-size: 0.72rem; }
    .budget-left { display: none; }
    .budget-bar { justify-content: space-between; }
    .budget-right { width: 100%; justify-content: space-between; gap: 1rem; }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    getServicios()
      .then(r => setServicios(r.data))
      .catch(() => setError('Error al cargar los servicios'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (service) => {
    setSelected(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const totalPrecio   = selected.reduce((sum, s) => sum + Number(s.precio), 0);
  const totalDuracion = selected.reduce((sum, s) => sum + s.duracion_minutos, 0);

  const handleReservar = () => {
    if (selected.length === 0) return;
    navigate('/booking', { state: { selectedServices: selected } });
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="home">
        <div className="hero">
          <span className="hero-eyebrow">Reserva de turno</span>
          <h1 className="hero-title">
            Elegí tu servicio.<br />
            <em>Confirmá en minutos.</em>
          </h1>
          <p className="hero-sub">
            Seleccioná lo que necesitás, elegí el profesional y el horario.
            Sin llamadas, sin esperas.
          </p>
          <div className="hero-features">
            {['Reserva 100% online', 'Confirmación inmediata', 'Sin necesidad de registro'].map(f => (
              <div key={f} className="hero-feature">
                <span className="hf-icon">
                  <svg viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5"/></svg>
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div id="servicios" className="main-layout" style={{ scrollMarginTop: '70px' }}>
          <div className="section-head">
            <span className="section-label">Servicios disponibles</span>
            {!loading && !error && (
              <span className="section-count">{servicios.length} opciones</span>
            )}
          </div>
          <div className="section-divider" />

          {loading && <p className="state-msg">Cargando...</p>}
          {error   && <p className="state-msg" style={{ color: 'rgba(220,100,100,0.6)' }}>{error}</p>}

          {!loading && !error && (
            <ul className="service-list">
              {servicios.map(service => {
                const isChecked = !!selected.find(s => s.id === service.id);
                return (
                  <li
                    key={service.id}
                    className={`service-item${isChecked ? ' selected-item' : ''}`}
                    onClick={() => toggle(service)}
                  >
                    <div className={`check-box${isChecked ? ' checked' : ''}`}>
                      <svg viewBox="0 0 12 12" className="check-icon">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </div>
                    <div className="service-item-info">
                      <div className="service-item-name">{service.nombre}</div>
                      {service.descripcion && (
                        <div className="service-item-desc">{service.descripcion}</div>
                      )}
                    </div>
                    <div className="service-item-right">
                      <span className="service-item-price">${service.precio}</span>
                      <span className="service-item-duration">{service.duracion_minutos} min</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div id="guia" style={{ scrollMarginTop: '70px' }}>
          <FaceShapeGuide />
        </div>
      </div>

      <div
        className="budget-bar"
        style={selected.length > 0
          ? { transform: 'translateY(0)', opacity: 1, pointerEvents: 'auto' }
          : { transform: 'translateY(110%)', opacity: 0, pointerEvents: 'none' }
        }
      >
        <div className="budget-left">
          <span className="budget-label">
            {selected.length} {selected.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
          </span>
          <span className="budget-detail">{selected.map(s => s.nombre).join(' · ')}</span>
        </div>
        <div className="budget-right">
          <div className="budget-total">
            <div className="budget-total-label">Total · {totalDuracion} min</div>
            <div className="budget-total-amount">${totalPrecio}</div>
          </div>
          <button className="budget-btn" onClick={handleReservar}>Reservar</button>
        </div>
      </div>
    </>
  );
}
