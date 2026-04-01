import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServicios } from '../services/api';
import FaceShapeGuide from '../components/FaceShapeGuide';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .home {
    min-height: 100vh;
    background: #080c14;
    padding-top: 68px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero ── */
  .hero {
    padding: 5.5rem 2rem 4rem;
    max-width: 860px;
    margin: 0 auto;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: relative;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: -60px;
    left: -80px;
    width: 500px;
    height: 320px;
    background: radial-gradient(ellipse, rgba(95,168,200,0.07) 0%, transparent 65%);
    pointer-events: none;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #5fa8c8;
    margin-bottom: 1.5rem;
    opacity: 0;
    animation: heroFade 0.7s ease 0.1s forwards;
  }

  .hero-eyebrow::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 1px;
    background: #5fa8c8;
    opacity: 0.6;
  }

  .hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2.8rem, 6vw, 4.5rem);
    font-weight: 400;
    color: #f5f1ea;
    line-height: 1.08;
    letter-spacing: -0.015em;
    opacity: 0;
    animation: heroFade 0.7s ease 0.25s forwards;
  }

  .hero-title em { font-style: italic; color: #5fa8c8; }

  .hero-sub {
    font-size: 0.92rem;
    font-weight: 300;
    color: rgba(255,255,255,0.5);
    line-height: 1.8;
    max-width: 420px;
    margin-top: 1.25rem;
    opacity: 0;
    animation: heroFade 0.7s ease 0.4s forwards;
  }

  .hero-pills {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 2rem;
    opacity: 0;
    animation: heroFade 0.7s ease 0.55s forwards;
  }

  .hero-pill {
    display: inline-block;
    padding: 0.35rem 0.85rem;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 300;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.38);
  }

  @keyframes heroFade {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Servicios ── */
  .main-layout {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 2rem 8rem;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2.5rem 0 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .section-label {
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }

  .section-count {
    font-size: 0.68rem;
    font-weight: 300;
    color: rgba(255,255,255,0.2);
  }

  .service-list { list-style: none; }

  .service-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.2rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    cursor: pointer;
  }

  .service-item:hover .service-item-name { color: #eeeae3; }

  .check-box {
    width: 20px;
    height: 20px;
    min-width: 20px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s, background 0.2s;
  }

  .check-box.checked { background: #5fa8c8; border-color: #5fa8c8; }

  .check-icon {
    width: 11px;
    height: 11px;
    stroke: #080c14;
    stroke-width: 2.5;
    fill: none;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .check-box.checked .check-icon { opacity: 1; }

  .service-item-info { flex: 1; min-width: 0; }

  .service-item-name {
    font-size: 0.95rem;
    font-weight: 400;
    color: rgba(255,255,255,0.7);
    transition: color 0.2s;
  }

  .service-item-desc {
    font-size: 0.78rem;
    font-weight: 300;
    color: rgba(255,255,255,0.25);
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
    font-family: 'DM Serif Display', serif;
    font-size: 1.1rem;
    color: #d4c9b0;
  }

  .service-item-duration {
    font-size: 0.7rem;
    font-weight: 300;
    color: rgba(255,255,255,0.2);
  }

  .state-msg {
    padding: 3rem 0;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 300;
    color: rgba(255,255,255,0.2);
  }

  /* ── Budget bar — FIXED, fuera de cualquier contenedor con transform ── */
  .budget-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(8, 12, 20, 0.97);
    border-top: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    z-index: 200;
    /* Oculta debajo de la pantalla por defecto */
    transform: translateY(calc(100% + 1px));
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    /* Importante: no usar will-change ni filter aquí */
  }

  .budget-bar.visible { transform: translateY(0); }

  .budget-left { display: flex; flex-direction: column; gap: 0.15rem; }

  .budget-label {
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }

  .budget-detail {
    font-size: 0.78rem;
    font-weight: 300;
    color: rgba(255,255,255,0.4);
    max-width: 340px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .budget-right {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-shrink: 0;
  }

  .budget-total { text-align: right; }

  .budget-total-label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    font-weight: 300;
  }

  .budget-total-amount {
    font-family: 'DM Serif Display', serif;
    font-size: 1.6rem;
    color: #d4c9b0;
    line-height: 1;
    margin-top: 0.1rem;
  }

  .budget-btn {
    padding: 0.75rem 2rem;
    background: #5fa8c8;
    border: none;
    border-radius: 3px;
    color: #080c14;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.25s, transform 0.2s;
    white-space: nowrap;
  }

  .budget-btn:hover { background: #7dbdd8; transform: translateY(-1px); }

  @media (max-width: 768px) {
    .hero {
      padding: 4rem 1.5rem 3rem;
    }
    .main-layout {
      padding: 0 1.5rem 6rem;
    }
    .budget-bar {
      padding: 1rem 1.25rem;
      gap: 1rem;
    }
    .budget-detail {
      display: none;
    }
    .budget-total-amount {
      font-size: 1.3rem;
    }
    .budget-btn {
      padding: 0.7rem 1.25rem;
      font-size: 0.7rem;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 2.2rem;
    }
    .budget-left {
      display: none;
    }
    .budget-bar {
      justify-content: space-between;
    }
    .budget-right {
      width: 100%;
      justify-content: space-between;
      gap: 1rem;
    }
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
          <span className="hero-eyebrow">Turnera Villan</span>
          <h1 className="hero-title">
            Reservá tu turno.<br />
            <em>Simple y profesional.</em>
          </h1>
          <p className="hero-sub">
            Elegí los servicios que necesitás y confirmá tu turno en minutos.
            Sin llamadas, sin esperas.
          </p>
          <div className="hero-pills">
            <span className="hero-pill">Reserva online</span>
            <span className="hero-pill">Confirmación inmediata</span>
            <span className="hero-pill">Sin registro</span>
          </div>
        </div>

        <div id="servicios" className="main-layout" style={{scrollMarginTop: "68px"}}>
          <div className="section-head">
            <span className="section-label">Servicios</span>
            {!loading && !error && (
              <span className="section-count">{servicios.length} disponibles</span>
            )}
          </div>

          {loading && <p className="state-msg">Cargando...</p>}
          {error && <p className="state-msg" style={{color:'rgba(220,100,100,0.6)'}}>{error}</p>}

          {!loading && !error && (
            <ul className="service-list">
              {servicios.map(service => {
                const isChecked = !!selected.find(s => s.id === service.id);
                return (
                  <li key={service.id} className="service-item" onClick={() => toggle(service)}>
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