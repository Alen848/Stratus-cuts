import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalonSlug } from '../utils/slug';
import heroMoodboard from '../assets/hero-moodboard.jpg';
import heroSalon from '../assets/hero-salon.jpg';
import logoDark from '../assets/logo-dark.svg';
import aboutFilosofia from '../assets/about-filosofia.jpg';

const API_URL = import.meta.env.VITE_API_URL || '';

const IMG = {
  hero:    heroMoodboard,
  salon:   heroSalon,
  about:   aboutFilosofia,
  cta:     heroSalon,
  nails:   'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
  cosmeto: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
  lash:    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  masajes: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
  laser:   'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
  cejas:   'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?auto=format&fit=crop&w=900&q=80',
  clinica: 'https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=900&q=80',
};

const SERVICIOS = [
  {
    id: 'nails',
    nombre: 'Nails',
    sub: 'Manicura & Nail Art',
    desc: 'Esmaltado semipermanente, kapping y diseños personalizados. Manos impecables que lucen durante semanas.',
    img: IMG.nails,
  },
  {
    id: 'cosmetologia',
    nombre: 'Cosmetología',
    sub: 'Tratamientos Faciales',
    desc: 'Limpiezas profundas, hidratación y protocolos antiage adaptados a las necesidades reales de tu piel.',
    img: IMG.cosmeto,
  },
  {
    id: 'lash',
    nombre: 'Lash Lifting',
    sub: 'Realce de Pestañas',
    desc: 'Curvado y nutrición de tus pestañas naturales para una mirada abierta y luminosa, sin extensiones.',
    img: IMG.lash,
  },
  {
    id: 'masajes',
    nombre: 'Masajes',
    sub: 'Relax & Bienestar',
    desc: 'Descontracturantes, drenaje linfático y masajes relajantes para reconectar cuerpo y mente.',
    img: IMG.masajes,
  },
  {
    id: 'laser',
    nombre: 'Depilación Láser',
    sub: 'Tecnología de última generación',
    desc: 'Sesiones seguras y efectivas para una piel suave, pareja y libre de vello de forma duradera.',
    img: IMG.laser,
  },
  {
    id: 'cejas',
    nombre: 'Laminado de Cejas',
    sub: 'Diseño & Perfilado',
    desc: 'Cejas peinadas, definidas y con efecto lifting que dura semanas. Un marco natural para tu mirada.',
    img: IMG.cejas,
  },
  {
    id: 'clinica',
    nombre: 'Estética Clínica',
    sub: 'Tratamientos Avanzados',
    desc: 'Protocolos médico-estéticos con aparatología de precisión y supervisión profesional, para resultados visibles y seguros.',
    img: IMG.clinica,
  },
];

const VALORES = [
  { titulo: 'Profesionales certificadas', desc: 'Un equipo formado y en constante capacitación en cada especialidad.' },
  { titulo: 'Productos premium', desc: 'Trabajamos con marcas de primera línea y protocolos de bioseguridad.' },
  { titulo: 'Ambiente cuidado', desc: 'Un espacio íntimo y sereno pensado para que desconectes por completo.' },
  { titulo: 'Reserva 100% online', desc: 'Elegí servicio, profesional y horario en minutos. Sin llamadas ni esperas.' },
];

const STYLES = `
  .bm-home { font-family: var(--font-body); }

  .bm-arrow {
    display: inline-flex; vertical-align: middle;
    width: 13px; height: 13px;
    transition: transform 0.25s var(--ease);
  }

  /* ══════════ HERO ══════════ */
  .bm-hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    padding: 7rem 1.5rem 5rem;
    overflow: hidden;
  }
  .bm-hero-bg {
    position: absolute; inset: 0;
    background-image: url('${IMG.hero}');
    background-size: cover;
    background-position: center;
    transform: scale(1.05);
    animation: bmZoom 9s var(--ease) forwards;
  }
  .bm-hero-bg::after {
    content: '';
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(28,32,24,0.72) 0%, rgba(28,32,24,0.55) 35%, rgba(28,32,24,0.82) 100%),
      radial-gradient(ellipse at 70% 20%, rgba(76,84,66,0.40), transparent 60%);
  }
  @keyframes bmZoom { to { transform: scale(1); } }

  .bm-hero-inner {
    position: relative;
    max-width: 1120px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 3.5rem;
    align-items: center;
  }
  .bm-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 0.8rem;
    font-size: 0.7rem; font-weight: 500;
    letter-spacing: 0.34em; text-transform: uppercase;
    color: #CCA766;
    margin-bottom: 1.75rem;
    opacity: 0; animation: bmFade 0.7s ease 0.1s forwards;
  }
  .bm-hero-eyebrow::before {
    content: ''; width: 34px; height: 1px;
    background: #CCA766; opacity: 0.7;
  }
  .bm-hero-title {
    margin-bottom: 1.5rem;
    opacity: 0; animation: bmFade 0.8s ease 0.2s forwards;
  }
  .bm-hero-logo {
    display: block;
    width: min(100%, 460px);
    height: auto;
  }
  .bm-hero-tagline {
    display: block;
    margin-top: 1.4rem;
    font-family: var(--font-body);
    font-size: clamp(0.72rem, 1.6vw, 0.88rem); font-weight: 500;
    letter-spacing: 0.32em; text-transform: uppercase;
    color: rgba(255,255,255,0.85);
  }
  .bm-hero-sub {
    font-size: 1.1rem; font-weight: 400;
    color: rgba(255,255,255,0.82);
    line-height: 1.7; max-width: 440px;
    margin-bottom: 2.5rem;
    opacity: 0; animation: bmFade 0.8s ease 0.35s forwards;
  }
  .bm-hero-actions {
    display: flex; flex-wrap: wrap; gap: 0.9rem;
    opacity: 0; animation: bmFade 0.8s ease 0.5s forwards;
  }
  .bm-hero-media {
    position: relative;
    opacity: 0; animation: bmFade 0.9s ease 0.45s forwards;
  }
  .bm-hero-salon {
    display: block; width: 100%;
    aspect-ratio: 4/5; object-fit: cover;
    border-radius: 160px 160px 6px 6px;
    border: 1px solid rgba(255,255,255,0.28);
    box-shadow: 0 30px 60px rgba(0,0,0,0.35);
  }
  .bm-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.65rem;
    padding: 1.05rem 2.4rem; min-height: 54px;
    background: #F2EEE2; color: #35392E;
    border: none; border-radius: 2px;
    font-family: var(--font-body); font-size: 0.76rem; font-weight: 600;
    letter-spacing: 0.2em; text-transform: uppercase;
    cursor: pointer; text-decoration: none;
    transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
  }
  .bm-btn-primary:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.25); }
  .bm-btn-primary:hover .bm-arrow { transform: translate(3px,-3px); }

  .bm-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem;
    padding: 1.05rem 2.2rem; min-height: 54px;
    background: transparent; color: #fff;
    border: 1px solid rgba(255,255,255,0.4); border-radius: 2px;
    font-family: var(--font-body); font-size: 0.76rem; font-weight: 500;
    letter-spacing: 0.2em; text-transform: uppercase;
    cursor: pointer; text-decoration: none;
    transition: background 0.25s ease, border-color 0.25s ease;
  }
  .bm-btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: #fff; }

  .bm-scroll-cue {
    position: absolute; left: 50%; bottom: 1.8rem; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    color: rgba(255,255,255,0.6);
    font-size: 0.58rem; letter-spacing: 0.28em; text-transform: uppercase;
    opacity: 0; animation: bmFade 1s ease 0.9s forwards;
  }
  .bm-scroll-line {
    width: 1px; height: 38px;
    background: linear-gradient(rgba(255,255,255,0.6), transparent);
    animation: bmScroll 2.2s ease-in-out infinite;
  }
  @keyframes bmScroll { 0%,100% { opacity: 0.3; transform: scaleY(0.6); } 50% { opacity: 1; transform: scaleY(1); } }

  /* ══════════ SECTION SHELL ══════════ */
  .bm-section { max-width: 1120px; margin: 0 auto; padding: 6rem 1.5rem; }
  .bm-eyebrow {
    display: inline-flex; align-items: center; gap: 0.7rem;
    font-size: 0.66rem; font-weight: 600;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 1.2rem;
  }
  .bm-eyebrow::before { content: ''; width: 26px; height: 1px; background: var(--gold); opacity: 0.6; }
  .bm-h2 {
    font-family: var(--font-display); font-weight: 500;
    font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1.08;
    letter-spacing: -0.01em; color: var(--text);
  }
  .bm-h2 em { font-style: italic; font-weight: 400; color: var(--accent); }
  .bm-lead {
    font-size: 1.02rem; font-weight: 300; color: var(--text-3);
    line-height: 1.75; max-width: 480px; margin-top: 1.1rem;
  }

  /* ══════════ FILOSOFÍA / ABOUT ══════════ */
  .bm-about {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 4rem; align-items: center;
  }
  .bm-about-media { position: relative; }
  .bm-about-img {
    width: 100%; aspect-ratio: 4/5; object-fit: cover;
    border-radius: 4px; display: block;
  }
  .bm-about-badge {
    position: absolute; bottom: -1px; left: -1px;
    background: var(--bg); padding: 1.4rem 1.8rem 1.2rem;
    border-top-right-radius: 8px;
  }
  .bm-about-badge-num {
    font-family: var(--font-display); font-size: 2.6rem; font-weight: 500;
    color: var(--accent); line-height: 1;
  }
  .bm-about-badge-txt {
    font-size: 0.64rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--text-3); margin-top: 0.3rem;
  }
  .bm-about-body p {
    font-size: 1.04rem; font-weight: 300; color: var(--text-2);
    line-height: 1.85; margin-top: 1.4rem;
  }
  .bm-about-sign {
    font-family: var(--font-display); font-style: italic;
    font-size: 1.5rem; color: var(--accent); margin-top: 1.75rem;
  }

  /* ══════════ SERVICIOS ══════════ */
  .bm-serv-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 2rem; margin-bottom: 3rem; flex-wrap: wrap;
  }
  .bm-serv-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
  }
  .bm-serv-card {
    position: relative; overflow: hidden; border-radius: 4px;
    background: var(--bg-elevated); border: 1px solid var(--border);
    text-align: left; cursor: pointer; padding: 0;
    display: flex; flex-direction: column;
    transition: transform 0.35s var(--ease), box-shadow 0.35s var(--ease), border-color 0.35s var(--ease);
    font-family: var(--font-body);
  }
  .bm-serv-card:hover {
    transform: translateY(-6px);
    border-color: var(--border-accent);
    box-shadow: 0 24px 48px rgba(var(--text-rgb),0.10);
  }
  .bm-serv-imgwrap { position: relative; aspect-ratio: 5/4; overflow: hidden; }
  .bm-serv-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.6s var(--ease);
  }
  .bm-serv-card:hover .bm-serv-img { transform: scale(1.06); }
  .bm-serv-imgwrap::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 55%, rgba(28,32,24,0.35));
  }
  .bm-serv-body { padding: 1.5rem 1.6rem 1.7rem; display: flex; flex-direction: column; flex: 1; }
  .bm-serv-sub {
    font-size: 0.6rem; font-weight: 600; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 0.55rem;
  }
  .bm-serv-name {
    font-family: var(--font-display); font-weight: 500;
    font-size: 1.7rem; line-height: 1.05; color: var(--text); margin-bottom: 0.7rem;
  }
  .bm-serv-desc {
    font-size: 0.88rem; font-weight: 300; color: var(--text-3);
    line-height: 1.65; flex: 1;
  }
  .bm-serv-link {
    display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.3rem;
    font-size: 0.66rem; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--accent);
  }
  .bm-serv-card:hover .bm-serv-link .bm-arrow { transform: translate(3px,-3px); }

  /* ══════════ EXPERIENCIA / VALORES ══════════ */
  .bm-exp { background: var(--bg-sunken); }
  .bm-exp-inner { max-width: 1120px; margin: 0 auto; padding: 5.5rem 1.5rem; }
  .bm-exp-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5rem; margin-top: 3rem;
  }
  .bm-exp-item { border-top: 1px solid var(--border-md); padding-top: 1.3rem; }
  .bm-exp-num {
    font-family: var(--font-display); font-size: 1.1rem; color: var(--gold);
    letter-spacing: 0.1em; margin-bottom: 0.9rem; display: block;
  }
  .bm-exp-title { font-size: 1rem; font-weight: 600; color: var(--text); margin-bottom: 0.5rem; }
  .bm-exp-desc { font-size: 0.86rem; font-weight: 300; color: var(--text-3); line-height: 1.65; }

  /* ══════════ CÓMO FUNCIONA ══════════ */
  .bm-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; margin-top: 3rem; }
  .bm-how-num {
    font-family: var(--font-display); font-size: 2.4rem; font-weight: 500;
    color: rgba(var(--accent-rgb),0.25); line-height: 1; margin-bottom: 0.85rem;
  }
  .bm-how-title { font-size: 1.05rem; font-weight: 600; color: var(--text); margin-bottom: 0.45rem; }
  .bm-how-desc { font-size: 0.9rem; font-weight: 300; color: var(--text-3); line-height: 1.65; }

  /* ══════════ CTA FINAL ══════════ */
  .bm-cta { position: relative; overflow: hidden; }
  .bm-cta-bg {
    position: absolute; inset: 0;
    background-image: url('${IMG.cta}');
    background-size: cover; background-position: center;
  }
  .bm-cta-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(28,32,24,0.80), rgba(28,32,24,0.90));
  }
  .bm-cta-inner {
    position: relative; max-width: 720px; margin: 0 auto;
    padding: 6.5rem 1.5rem; text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .bm-cta-title {
    font-family: var(--font-display); font-weight: 500;
    font-size: clamp(2.4rem, 6vw, 4rem); line-height: 1.05; color: #fff;
    margin-bottom: 1.2rem;
  }
  .bm-cta-title em { font-style: italic; font-weight: 400; color: #D5DCC8; }
  .bm-cta-sub {
    font-size: 1.02rem; font-weight: 300; color: rgba(255,255,255,0.8);
    line-height: 1.7; max-width: 440px; margin-bottom: 2.5rem;
  }

  @keyframes bmFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  /* ══════════ RESPONSIVE ══════════ */
  @media (max-width: 900px) {
    .bm-hero-inner { grid-template-columns: 1fr; gap: 2.5rem; }
    .bm-hero-media { display: none; }
    .bm-serv-grid { grid-template-columns: repeat(2, 1fr); }
    .bm-exp-grid  { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
    .bm-about { grid-template-columns: 1fr; gap: 2.5rem; }
    .bm-about-media { max-width: 420px; }
  }
  @media (max-width: 600px) {
    .bm-section { padding: 4rem 1.25rem; }
    .bm-serv-grid { grid-template-columns: 1fr; }
    .bm-exp-grid  { grid-template-columns: 1fr; gap: 1.75rem; }
    .bm-how-grid  { grid-template-columns: 1fr; gap: 2.25rem; }
    .bm-hero-actions { flex-direction: column; }
    .bm-hero-actions a, .bm-hero-actions button { width: 100%; }
  }
`;

const Arrow = () => (
  <svg className="bm-arrow" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    const slug = getSalonSlug();
    if (slug && API_URL) {
      fetch(`${API_URL}/public/${slug}/info`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (d?.nombre) setSalonNombre(d.nombre); })
        .catch(() => {});
    }
  }, []);

  const nombre = salonNombre || 'Blue Moon';

  const goBooking = () => navigate('/booking');

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-home">

        {/* ───── HERO ───── */}
        <section className="bm-hero">
          <div className="bm-hero-bg" />
          <div className="bm-hero-inner">
            <div>
              <span className="bm-hero-eyebrow">Centro de Estética</span>
              <h1 className="bm-hero-title">
                <img className="bm-hero-logo" src={logoDark} alt={nombre} />
                <span className="bm-hero-tagline">Estética integral y bienestar</span>
              </h1>
              <p className="bm-hero-sub">
                Un espacio para cuidar tu belleza natural.
                Reservá tu turno y dejate cuidar por profesionales.
              </p>
              <div className="bm-hero-actions">
                <button className="bm-btn-primary" onClick={() => goBooking()}>
                  Reservar turno <Arrow />
                </button>
                <a className="bm-btn-ghost" href="#servicios">Ver servicios</a>
              </div>
            </div>
            <div className="bm-hero-media">
              <img className="bm-hero-salon" src={IMG.salon}
                alt={`Interior del salón de ${nombre}`} />
            </div>
          </div>
          <a className="bm-scroll-cue" href="#filosofia" aria-label="Descubrí más">
            <span>Descubrí</span>
            <span className="bm-scroll-line" />
          </a>
        </section>

        {/* ───── FILOSOFÍA ───── */}
        <section className="bm-section bm-about" id="filosofia">
          <div className="bm-about-media">
            <img className="bm-about-img" src={IMG.about}
              alt="Productos y ritual de cuidado de la piel en Blue Moon" loading="lazy" />
            <div className="bm-about-badge">
              <div className="bm-about-badge-num">7</div>
              <div className="bm-about-badge-txt">Especialidades<br />en un solo lugar</div>
            </div>
          </div>
          <div className="bm-about-body">
            <span className="bm-eyebrow">Nuestra filosofía</span>
            <h2 className="bm-h2">Belleza que se<br /><em>siente y se nota</em></h2>
            <p>
              En {nombre} creemos que cuidarte es un ritual, no un trámite.
              Cada tratamiento está pensado para que salgas renovada, con resultados
              reales y una experiencia que invita a volver.
            </p>
            <p>
              Combinamos técnica, productos de primera línea y un trato cercano
              en un ambiente diseñado para que desconectes del afuera.
            </p>
            <div className="bm-about-sign">— El equipo de {nombre}</div>
          </div>
        </section>

        {/* ───── SERVICIOS ───── */}
        <section className="bm-section" id="servicios">
          <div className="bm-serv-head">
            <div>
              <span className="bm-eyebrow">Nuestros servicios</span>
              <h2 className="bm-h2">Todo para <em>vos</em></h2>
            </div>
            <p className="bm-lead">
              Tratamientos faciales, corporales y de belleza realizados por
              especialistas en cada área.
            </p>
          </div>

          <div className="bm-serv-grid">
            {SERVICIOS.map((s) => (
              <button key={s.id} className="bm-serv-card" onClick={goBooking}>
                <div className="bm-serv-imgwrap">
                  <img className="bm-serv-img" src={s.img}
                    alt={`${s.nombre} — ${s.sub} en Blue Moon`} loading="lazy" />
                </div>
                <div className="bm-serv-body">
                  <span className="bm-serv-sub">{s.sub}</span>
                  <h3 className="bm-serv-name">{s.nombre}</h3>
                  <p className="bm-serv-desc">{s.desc}</p>
                  <span className="bm-serv-link">Reservar <Arrow /></span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ───── EXPERIENCIA ───── */}
        <section className="bm-exp">
          <div className="bm-exp-inner">
            <span className="bm-eyebrow">La experiencia Blue Moon</span>
            <h2 className="bm-h2">Por qué <em>elegirnos</em></h2>
            <div className="bm-exp-grid">
              {VALORES.map((v, i) => (
                <div className="bm-exp-item" key={v.titulo}>
                  <span className="bm-exp-num">0{i + 1}</span>
                  <div className="bm-exp-title">{v.titulo}</div>
                  <p className="bm-exp-desc">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── CÓMO FUNCIONA ───── */}
        <section className="bm-section">
          <span className="bm-eyebrow">Reservar es simple</span>
          <h2 className="bm-h2">Cómo <em>funciona</em></h2>
          <div className="bm-how-grid">
            <div>
              <div className="bm-how-num">01</div>
              <div className="bm-how-title">Elegí tu servicio</div>
              <p className="bm-how-desc">Seleccioná uno o varios tratamientos de nuestro catálogo.</p>
            </div>
            <div>
              <div className="bm-how-num">02</div>
              <div className="bm-how-title">Profesional y horario</div>
              <p className="bm-how-desc">Reservá con la especialista que prefieras en el día y hora que más te convenga.</p>
            </div>
            <div>
              <div className="bm-how-num">03</div>
              <div className="bm-how-title">Confirmación al instante</div>
              <p className="bm-how-desc">Recibís la confirmación de tu turno al momento. Te esperamos.</p>
            </div>
          </div>
        </section>

        {/* ───── CTA FINAL ───── */}
        <section className="bm-cta">
          <div className="bm-cta-bg" />
          <div className="bm-cta-inner">
            <span className="bm-hero-eyebrow" style={{ animation: 'none', opacity: 1 }}>
              Reservá tu turno
            </span>
            <h2 className="bm-cta-title">Tu momento<br /><em>te espera</em></h2>
            <p className="bm-cta-sub">
              Date el cuidado que merecés. Reservá online en minutos
              y dejá el resto en nuestras manos.
            </p>
            <button className="bm-btn-primary" onClick={() => goBooking()}>
              Reservar ahora <Arrow />
            </button>
          </div>
        </section>

      </div>
    </>
  );
}
