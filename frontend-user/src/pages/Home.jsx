import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaceShapeGuide from '../components/FaceShapeGuide';
import { getSalonSlug } from '../utils/slug';

const API_URL = import.meta.env.VITE_API_URL || '';

const STYLES = `
  .home {
    min-height: 100vh;
    padding-top: 70px;
    font-family: 'Jost', sans-serif;
  }

  /* ══════════════════════════════════════
     HERO
  ══════════════════════════════════════ */
  .hero {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 10vh 1.5rem 7vh;
    max-width: 720px;
    margin: 0 auto;
    position: relative;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -200px;
    width: 600px; height: 500px;
    background: radial-gradient(ellipse at center, rgba(107,82,49,0.04) 0%, transparent 65%);
    pointer-events: none;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #6B5231;
    margin-bottom: 1.5rem;
    opacity: 0;
    animation: heroFade 0.5s ease 0.05s forwards;
  }
  .hero-eyebrow::before {
    content: '';
    display: inline-block;
    width: 28px; height: 1.5px;
    background: #6B5231;
    opacity: 0.6;
  }

  .hero-salon-name {
    font-family: 'Bodoni Moda', serif;
    font-size: clamp(3.8rem, 16vw, 8rem);
    font-weight: 400;
    color: #2C2420;
    line-height: 0.96;
    letter-spacing: -0.02em;
    margin-bottom: 1.5rem;
    opacity: 0;
    animation: heroFade 0.65s ease 0.12s forwards;
  }

  .hero-sub {
    font-size: 1.15rem;
    font-weight: 300;
    color: #5C5147;
    line-height: 1.7;
    max-width: 380px;
    margin-bottom: 2.75rem;
    opacity: 0;
    animation: heroFade 0.6s ease 0.22s forwards;
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.7rem;
    width: 100%;
    max-width: 400px;
    padding: 1.15rem 2.5rem;
    background: #2C2420;
    border: none;
    border-radius: 4px;
    color: #FAF7F2;
    font-family: 'Jost', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
    min-height: 56px;
    transition: background 0.2s ease, transform 0.18s ease;
    opacity: 0;
    animation: heroFade 0.6s ease 0.35s forwards;
  }
  .hero-cta:hover  { background: #433832; transform: translateY(-2px); }
  .hero-cta:active { transform: translateY(0); }

  .hero-features {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem 2rem;
    margin-top: 2.75rem;
    opacity: 0;
    animation: heroFade 0.5s ease 0.5s forwards;
  }

  .hero-feat {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.82rem;
    font-weight: 400;
    color: #5C5147;
    letter-spacing: 0.03em;
  }

  .hero-feat-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #6B5231;
    flex-shrink: 0;
  }

  @keyframes heroFade {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ══════════════════════════════════════
     HOW IT WORKS
  ══════════════════════════════════════ */
  .how-section {
    max-width: 720px;
    margin: 0 auto;
    padding: 4rem 1.5rem 5rem;
    border-top: 1px solid rgba(44,36,32,0.06);
  }

  .how-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #6B5231;
    margin-bottom: 2.5rem;
    display: block;
  }

  .how-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .how-step {}

  .how-num {
    font-family: 'Bodoni Moda', serif;
    font-size: 2rem;
    color: rgba(44,36,32,0.1);
    line-height: 1;
    margin-bottom: 0.75rem;
  }

  .how-title {
    font-size: 1rem;
    font-weight: 500;
    color: #2C2420;
    margin-bottom: 0.4rem;
  }

  .how-desc {
    font-size: 0.88rem;
    font-weight: 300;
    color: #5C5147;
    line-height: 1.65;
  }

  @media (max-width: 600px) {
    .how-grid { grid-template-columns: 1fr; gap: 2.5rem; }
  }

  /* ══════════════════════════════════════
     DESKTOP
  ══════════════════════════════════════ */
  @media (min-width: 769px) {
    .hero {
      padding: 14vh 3rem 10vh;
    }
    .hero-cta {
      width: auto;
      min-width: 280px;
    }
    .how-section { padding: 5rem 3rem 6rem; }
  }

  @media (max-width: 380px) {
    .hero { padding: 7vh 1.25rem 5vh; }
    .hero-salon-name { font-size: 3rem; }
    .hero-features { gap: 0.8rem 1.5rem; }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    const slug = getSalonSlug();
    if (slug && API_URL) {
      fetch(`${API_URL}/public/${slug}/info`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.nombre) setSalonNombre(d.nombre); })
        .catch(() => {});
    }
  }, []);

  return (
    <>
      <style>{STYLES}</style>

      <div className="home">

        <div className="hero">
          <span className="hero-eyebrow">Reservas online</span>

          <h1 className="hero-salon-name">
            {salonNombre || 'Tu salón'}
          </h1>

          <p className="hero-sub">
            Reservá tu turno en minutos.<br />
            Sin llamadas, sin esperas.
          </p>

          <button className="hero-cta" onClick={() => navigate('/booking')}>
            Reservar turno
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"/>
              <polyline points="7 7 17 7 17 17"/>
            </svg>
          </button>

          <div className="hero-features">
            <span className="hero-feat">
              <span className="hero-feat-dot" />
              Confirmación inmediata
            </span>
            <span className="hero-feat">
              <span className="hero-feat-dot" />
              Sin registro
            </span>
            <span className="hero-feat">
              <span className="hero-feat-dot" />
              100% online
            </span>
          </div>
        </div>

        <div className="how-section">
          <span className="how-label">Cómo funciona</span>
          <div className="how-grid">
            <div className="how-step">
              <div className="how-num">01</div>
              <div className="how-title">Elegí tus servicios</div>
              <p className="how-desc">Seleccioná lo que necesitás de nuestro catálogo.</p>
            </div>
            <div className="how-step">
              <div className="how-num">02</div>
              <div className="how-title">Elegí fecha y horario</div>
              <p className="how-desc">Reservá con tu profesional preferido en el horario que quieras.</p>
            </div>
            <div className="how-step">
              <div className="how-num">03</div>
              <div className="how-title">¡Listo!</div>
              <p className="how-desc">Recibí la confirmación al instante y listo, te esperamos.</p>
            </div>
          </div>
        </div>

        <div id="guia" style={{ scrollMarginTop: '70px' }}>
          <FaceShapeGuide />
        </div>

      </div>
    </>
  );
}
