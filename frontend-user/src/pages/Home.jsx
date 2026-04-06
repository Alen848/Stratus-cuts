import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServicios } from '../services/api';
import FaceShapeGuide from '../components/FaceShapeGuide';

const STYLES = `
  .home {
    min-height: 100vh;
    background: transparent;
    padding-top: 72px;
    font-family: 'Inter', sans-serif;
  }

  /* ── Hero ── */
  .hero {
    padding: 5.5rem 2rem 4.5rem;
    max-width: 920px;
    margin: 0 auto;
    border-bottom: 1px solid rgba(255,255,255,0.055);
    position: relative;
    overflow: hidden;
  }

  /* Glow de fondo en el hero */
  .hero::after {
    content: '';
    position: absolute;
    top: -120px; right: -200px;
    width: 600px; height: 500px;
    background: radial-gradient(ellipse at center, rgba(198,191,182,0.04) 0%, transparent 65%);
    pointer-events: none;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #c6bfb6;
    margin-bottom: 1.75rem;
    opacity: 0;
    animation: heroFade 0.6s ease 0.05s forwards;
  }
  .hero-eyebrow::before {
    content: '';
    display: inline-block;
    width: 24px; height: 1px;
    background: #c6bfb6;
    opacity: 0.5;
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(3.2rem, 7vw, 5.5rem);
    font-weight: 400;
    color: #ece8e2;
    line-height: 1.04;
    letter-spacing: -0.025em;
    opacity: 0;
    animation: heroFade 0.6s ease 0.15s forwards;
  }
  .hero-title em {
    font-style: italic;
    color: #c6bfb6;
  }

  .hero-sub {
    font-size: 1.05rem;
    font-weight: 300;
    color: rgba(236,232,226,0.44);
    line-height: 1.85;
    max-width: 420px;
    margin-top: 1.5rem;
    opacity: 0;
    animation: heroFade 0.6s ease 0.28s forwards;
  }

  /* ── Feature list ── */
  .hero-features {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-top: 2.5rem;
    opacity: 0;
    animation: heroFade 0.6s ease 0.42s forwards;
  }

  .hero-feature {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    font-size: 1rem;
    font-weight: 400;
    color: rgba(236,232,226,0.65);
  }

  .hf-icon {
    width: 22px; height: 22px; min-width: 22px;
    background: rgba(198,191,182,0.1);
    border: 1px solid rgba(198,191,182,0.22);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hf-icon svg {
    width: 10px; height: 10px;
    stroke: #c6bfb6;
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @keyframes heroFade {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Servicios ── */
  .main-layout {
    max-width: 920px;
    margin: 0 auto;
    padding: 0 2rem 8rem;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2.5rem 0 0;
    margin-bottom: 0.25rem;
  }

  .section-label {
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(198,191,182,0.55);
  }

  .section-count {
    font-size: 0.72rem;
    font-weight: 400;
    color: rgba(236,232,226,0.22);
  }

  /* Línea separadora bajo el header de sección */
  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(198,191,182,0.2) 0%, rgba(198,191,182,0.06) 60%, transparent 100%);
    margin-bottom: 0;
  }

  .service-list { list-style: none; }

  .service-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.35rem 0.75rem;
    border-bottom: 1px solid rgba(255,255,255,0.045);
    border-left: 3px solid transparent;
    cursor: pointer;
    margin-left: -0.75rem;
    transition: background 0.2s, border-left-color 0.2s;
    border-radius: 0 4px 4px 0;
  }

  .service-item:hover {
    background: rgba(198,191,182,0.04);
    border-left-color: rgba(198,191,182,0.35);
  }
  .service-item:hover .service-item-name { color: #ece8e2; }
  .service-item:hover .check-box:not(.checked) {
    border-color: rgba(198,191,182,0.45);
  }
  .service-item.selected-item {
    background: rgba(198,191,182,0.06);
    border-left-color: #c6bfb6;
  }

  .check-box {
    width: 22px; height: 22px; min-width: 22px;
    border: 1px solid rgba(198,191,182,0.2);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.18s, background 0.18s;
  }
  .check-box.checked {
    background: rgba(198,191,182,0.9);
    border-color: rgba(198,191,182,0.9);
  }

  .check-icon {
    width: 11px; height: 11px;
    stroke: #0c0c0b;
    stroke-width: 2.5;
    fill: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .check-box.checked .check-icon { opacity: 1; }

  .service-item-info { flex: 1; min-width: 0; }

  .service-item-name {
    font-size: 1rem;
    font-weight: 400;
    color: rgba(236,232,226,0.7);
    transition: color 0.18s;
  }

  .service-item-desc {
    font-size: 0.82rem;
    font-weight: 300;
    color: rgba(236,232,226,0.28);
    margin-top: 0.22rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .service-item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.22rem;
    flex-shrink: 0;
  }

  .service-item-price {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    color: #c6bfb6;
  }

  .service-item-duration {
    font-size: 0.72rem;
    font-weight: 400;
    color: rgba(236,232,226,0.25);
    letter-spacing: 0.02em;
  }

  .state-msg {
    padding: 3.5rem 0;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 300;
    color: rgba(236,232,226,0.22);
  }

  /* ── Budget bar ── */
  .budget-bar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: rgba(12,12,11,0.97);
    border-top: 1px solid rgba(198,191,182,0.22);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    padding: 1.1rem 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    z-index: 200;
    transform: translateY(calc(100% + 1px));
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .budget-bar.visible { transform: translateY(0); }

  .budget-left { display: flex; flex-direction: column; gap: 0.15rem; }

  .budget-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(198,191,182,0.6);
  }

  .budget-detail {
    font-size: 0.82rem;
    font-weight: 300;
    color: rgba(236,232,226,0.45);
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
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(236,232,226,0.28);
    font-weight: 400;
  }

  .budget-total-amount {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    color: #ece8e2;
    line-height: 1;
    margin-top: 0.05rem;
  }

  .budget-btn {
    padding: 0.8rem 2rem;
    background: var(--accent, #c6bfb6);
    border: none;
    border-radius: 3px;
    color: #0c0c0b;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, transform 0.18s;
    white-space: nowrap;
  }
  .budget-btn:hover {
    background: #dbd4cb;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .hero { padding: 4rem 1.5rem 3rem; }
    .main-layout { padding: 0 1.5rem 6rem; }
    .budget-bar { padding: 1rem 1.25rem; gap: 1rem; }
    .budget-detail { display: none; }
    .budget-total-amount { font-size: 1.5rem; }
    .budget-btn { padding: 0.72rem 1.35rem; }
  }

  @media (max-width: 480px) {
    .hero-title { font-size: 2.5rem; }
    .hero-features { gap: 0.6rem; }
    .hero-feature { font-size: 0.88rem; }
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

  const totalPrecio = selected.reduce((sum, s) => sum + Number(s.precio), 0);
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

        <div id="servicios" className="main-layout" style={{scrollMarginTop: "72px"}}>
          <div className="section-head">
            <span className="section-label">Servicios disponibles</span>
            {!loading && !error && (
              <span className="section-count">{servicios.length} opciones</span>
            )}
          </div>
          <div className="section-divider" />

          {loading && <p className="state-msg">Cargando...</p>}
          {error && <p className="state-msg" style={{color:'rgba(220,100,100,0.6)'}}>{error}</p>}

          {!loading && !error && (
            <ul className="service-list">
              {servicios.map(service => {
                const isChecked = !!selected.find(s => s.id === service.id);
                return (
                  <li key={service.id} className={`service-item${isChecked ? ' selected-item' : ''}`} onClick={() => toggle(service)}>
                    <div className={`check-box ${isChecked ? 'checked' : ''}`}>
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

        <div id="guia" style={{scrollMarginTop: "68px"}}><FaceShapeGuide /></div>
      </div>

      {/* Budget bar fuera del .home para que position:fixed funcione correctamente */}
      <div className={`budget-bar ${selected.length > 0 ? 'visible' : ''}`}>
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