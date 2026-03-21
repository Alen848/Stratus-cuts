import { useState } from 'react';

/* ─────────────────────────────────────────────
   SVG esquemático — cabeza frontal con contorno
   resaltado según forma de cara (estilo imagen)
───────────────────────────────────────────── */
const SchematicHead = ({ shape, size = 120, accent = '#5fa8c8' }) => {
  const W = 100, H = 130;

  // Rasgos internos comunes: ojos, nariz, boca, orejas, cuello
  const features = (
    <g stroke="#8a8a8a" strokeWidth="0.9" fill="none" opacity="0.55">
      {/* cuello */}
      <line x1="42" y1="118" x2="40" y2="128" />
      <line x1="58" y1="118" x2="60" y2="128" />
      <path d="M40 128 Q50 132 60 128" />
      {/* orejas */}
      <path d="M18 62 Q14 65 14 72 Q14 79 18 82" strokeWidth="1" />
      <path d="M82 62 Q86 65 86 72 Q86 79 82 82" strokeWidth="1" />
      {/* cejas */}
      <path d="M32 58 Q38 55 44 57" strokeWidth="1.1" />
      <path d="M56 57 Q62 55 68 58" strokeWidth="1.1" />
      {/* ojos */}
      <ellipse cx="38" cy="64" rx="6" ry="3.5" />
      <ellipse cx="62" cy="64" rx="6" ry="3.5" />
      <circle cx="38" cy="64" r="1.5" fill="#8a8a8a" stroke="none" />
      <circle cx="62" cy="64" r="1.5" fill="#8a8a8a" stroke="none" />
      {/* nariz */}
      <path d="M50 68 L46 82 Q50 85 54 82 L50 68" strokeWidth="0.8" />
      {/* boca */}
      <path d="M41 92 Q50 97 59 92" strokeWidth="1" />
      {/* línea mandíbula interna */}
      <path d="M28 90 Q28 105 38 112 Q50 118 62 112 Q72 105 72 90" strokeWidth="0.6" opacity="0.4" />
    </g>
  );

  // Contorno de cara según forma — trazo principal coloreado
  const outlines = {
    oval: <ellipse cx="50" cy="72" rx="32" ry="46" stroke={accent} strokeWidth="2.5" fill="none" />,
    round: <circle cx="50" cy="72" r="34" stroke={accent} strokeWidth="2.5" fill="none" />,
    square: (
      <rect x="17" y="30" width="66" height="84" rx="10"
        stroke={accent} strokeWidth="2.5" fill="none" />
    ),
    heart: (
      <path d={`M50 118 Q28 100 20 80 Q15 60 18 45 Q22 30 35 28 Q44 27 50 36 Q56 27 65 28 Q78 30 82 45 Q85 60 80 80 Q72 100 50 118Z`}
        stroke={accent} strokeWidth="2.5" fill="none" />
    ),
    diamond: (
      <path d={`M50 26 Q64 30 78 55 Q84 70 78 90 Q68 112 50 120 Q32 112 22 90 Q16 70 22 55 Q36 30 50 26Z`}
        stroke={accent} strokeWidth="2.5" fill="none" />
    ),
    oblong: <ellipse cx="50" cy="72" rx="26" ry="48" stroke={accent} strokeWidth="2.5" fill="none" />,
  };

  // Sombra/relleno de cara (muy sutil)
  const fills = {
    oval: <ellipse cx="50" cy="72" rx="32" ry="46" fill="rgba(200,185,165,0.06)" />,
    round: <circle cx="50" cy="72" r="34" fill="rgba(200,185,165,0.06)" />,
    square: <rect x="17" y="30" width="66" height="84" rx="10" fill="rgba(200,185,165,0.06)" />,
    heart: <path d={`M50 118 Q28 100 20 80 Q15 60 18 45 Q22 30 35 28 Q44 27 50 36 Q56 27 65 28 Q78 30 82 45 Q85 60 80 80 Q72 100 50 118Z`} fill="rgba(200,185,165,0.06)" />,
    diamond: <path d={`M50 26 Q64 30 78 55 Q84 70 78 90 Q68 112 50 120 Q32 112 22 90 Q16 70 22 55 Q36 30 50 26Z`} fill="rgba(200,185,165,0.06)" />,
    oblong: <ellipse cx="50" cy="72" rx="26" ry="48" fill="rgba(200,185,165,0.06)" />,
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size * (H / W) }}>
      {fills[shape]}
      {features}
      {outlines[shape]}
    </svg>
  );
};

/* ─────────────────────────────────────────────
   Data: formas y cortes
───────────────────────────────────────────── */
const FACE_SHAPES = [
  {
    id: 'oval', nombre: 'Ovalada',
    descripcion: 'Frente ligeramente más ancha que el mentón, pómulos prominentes. La forma más versátil — casi cualquier corte funciona.',
    cortes: [
      { nombre: 'Undercut clásico', desc: 'Laterales cortos, volumen arriba. Resalta la estructura natural del rostro.' },
      { nombre: 'Pompadour', desc: 'Cabello peinado hacia atrás con volumen en la cima. Elegante y atemporal.' },
      { nombre: 'Crop texturizado', desc: 'Flequillo hacia adelante con textura. Versátil y moderno.' },
      { nombre: 'French crop', desc: 'Línea de flequillo limpia con laterales degradados. Corte europeo refinado.' },
    ],
    nota: 'Con esta forma tenés mucha libertad — prácticamente cualquier corte te va a quedar bien.',
  },
  {
    id: 'round', nombre: 'Redonda',
    descripcion: 'Ancho y largo similares, línea de mandíbula suave. El objetivo es añadir altura y ángulos al rostro.',
    cortes: [
      { nombre: 'Quiff alto', desc: 'Volumen en la parte superior alarga visualmente el rostro.' },
      { nombre: 'Undercut con textura', desc: 'Laterales muy cortos y parte superior con movimiento hacia arriba.' },
      { nombre: 'Fade con flequillo lateral', desc: 'El flequillo en diagonal crea la ilusión de ángulos marcados.' },
      { nombre: 'Mohawk suave', desc: 'Estiliza el rostro añadiendo altura central pronunciada.' },
    ],
    nota: 'Evitá volumen lateral o flequillo recto pesado — acentúan el ancho del rostro.',
  },
  {
    id: 'square', nombre: 'Cuadrada',
    descripcion: 'Frente, pómulos y mandíbula de ancho similar con ángulos muy marcados. El objetivo es suavizar esa angularidad.',
    cortes: [
      { nombre: 'Corte texturizado', desc: 'Capas y textura suavizan los ángulos de la mandíbula.' },
      { nombre: 'Side part', desc: 'Raya lateral que rompe la simetría perfecta del rostro cuadrado.' },
      { nombre: 'Slick back', desc: 'Peinado hacia atrás, alarga el rostro y le da elegancia clásica.' },
      { nombre: 'Crop con fringe', desc: 'Las curvas del flequillo contrastan con los ángulos marcados.' },
    ],
    nota: 'Evitá cortes muy geométricos con líneas rectas que refuercen la angularidad de la mandíbula.',
  },
  {
    id: 'heart', nombre: 'Corazón',
    descripcion: 'Frente ancha, pómulos marcados y mentón angosto en punta. El objetivo es equilibrar proporciones.',
    cortes: [
      { nombre: 'Flequillo lateral suave', desc: 'Reduce visualmente el ancho de la frente con movimiento diagonal.' },
      { nombre: 'Crop con volumen medio', desc: 'Volumen a la altura de las orejas equilibra frente y mentón.' },
      { nombre: 'Fade suave', desc: 'Transición gradual que no exagera el ancho de la parte superior.' },
      { nombre: 'Textura en puntas', desc: 'Agrega anchura visual en la parte inferior del rostro.' },
    ],
    nota: 'Evitá mucho volumen solo en la parte superior — acentúa la frente ancha.',
  },
  {
    id: 'diamond', nombre: 'Diamante',
    descripcion: 'Frente y mentón angostos, pómulos muy prominentes y anchos. La forma más singular.',
    cortes: [
      { nombre: 'Flequillo completo', desc: 'Agrega anchura a la frente y equilibra los pómulos prominentes.' },
      { nombre: 'Quiff con volumen lateral', desc: 'Rellena visualmente las zonas laterales superiores.' },
      { nombre: 'Cabello texturizado', desc: 'El movimiento hacia los lados equilibra la estructura del rostro.' },
      { nombre: 'Undercut con cima texturizada', desc: 'Moderno y bien adaptado a esta forma singular.' },
    ],
    nota: 'Evitá laterales muy apretados — hacen resaltar aún más los pómulos prominentes.',
  },
  {
    id: 'oblong', nombre: 'Oblonga',
    descripcion: 'Rostro alargado, todas las zonas de ancho similar. El objetivo es añadir anchura horizontal.',
    cortes: [
      { nombre: 'Flequillo recto', desc: 'Acorta visualmente el rostro y agrega anchura horizontal.' },
      { nombre: 'Corte con volumen lateral', desc: 'El volumen en los lados equilibra el largo del rostro.' },
      { nombre: 'Crop texturizado', desc: 'Movimiento horizontal que contrarresta el largo del rostro.' },
      { nombre: 'Undercut con cima ancha', desc: 'Clásico y efectivo para acortar visualmente el rostro.' },
    ],
    nota: 'Evitá mucho volumen en la parte superior — alarga aún más el rostro.',
  },
];

/* ─────────────────────────────────────────────
   Estilos
───────────────────────────────────────────── */
const STYLES = `
  .fsg {
    max-width: 860px;
    margin: 0 auto;
    padding: 5rem 2rem 6rem;
    font-family: var(--font-sans, 'DM Sans', sans-serif);
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .fsg-header { margin-bottom: 3rem; }

  .fsg-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #5fa8c8;
    margin-bottom: 1.1rem;
  }

  .fsg-eyebrow::before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 1px;
    background: #5fa8c8;
    opacity: 0.5;
  }

  .fsg-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(1.7rem, 3.5vw, 2.5rem);
    font-weight: 400;
    color: #f5f1ea;
    line-height: 1.15;
    margin-bottom: 0.75rem;
  }

  .fsg-title em { font-style: italic; color: #5fa8c8; }

  .fsg-subtitle {
    font-size: 0.95rem;
    font-weight: 300;
    color: rgba(255,255,255,0.6);
    line-height: 1.7;
    max-width: 480px;
  }

  /* ── Shape grid ── */
  .fsg-shapes {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.6rem;
    margin-bottom: 3.5rem;
  }

  .fsg-shape-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    padding: 1.4rem 0.5rem 1rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.25s, background 0.25s, transform 0.2s, box-shadow 0.2s;
  }

  .fsg-shape-btn:hover {
    border-color: rgba(95,168,200,0.25);
    background: rgba(95,168,200,0.03);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(95,168,200,0.15);
  }

  .fsg-shape-btn.active {
    border-color: rgba(95,168,200,0.6);
    background: rgba(95,168,200,0.06);
  }

  .fsg-shape-label {
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    transition: color 0.2s;
    text-align: center;
  }

  .fsg-shape-btn:hover .fsg-shape-label { color: rgba(255,255,255,0.85); }
  .fsg-shape-btn.active .fsg-shape-label { color: #5fa8c8; }

  /* ── Result ── */
  .fsg-result {
    animation: fsgIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Intro row */
  .fsg-intro {
    display: flex;
    align-items: flex-start;
    gap: 2.5rem;
    padding: 2rem 2rem 2rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 4px;
    margin-bottom: 2.5rem;
  }

  .fsg-intro-img {
    flex-shrink: 0;
    opacity: 0.9;
  }

  .fsg-intro-body { flex: 1; }

  .fsg-shape-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.4rem;
    font-weight: 400;
    color: #f5f1ea;
    margin-bottom: 0.5rem;
  }

  .fsg-shape-desc {
    font-size: 0.9rem;
    font-weight: 300;
    color: rgba(255,255,255,0.65);
    line-height: 1.7;
    max-width: 440px;
  }

  /* Cuts */
  .fsg-cuts-title {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    margin-bottom: 1rem;
    display: block;
  }

  .fsg-cuts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .fsg-cut {
    padding: 1.25rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 4px;
    transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
  }

  .fsg-cut:hover {
    border-color: rgba(95,168,200,0.18);
    background: rgba(95,168,200,0.025);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.3);
  }

  .fsg-cut-n {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: #5fa8c8;
    margin-bottom: 0.5rem;
    display: block;
  }

  .fsg-cut-name {
    font-size: 0.95rem;
    font-weight: 400;
    color: #eeeae3;
    margin-bottom: 0.4rem;
  }

  .fsg-cut-desc {
    font-size: 0.8rem;
    font-weight: 300;
    color: rgba(255,255,255,0.6);
    line-height: 1.6;
  }

  /* Nota */
  .fsg-nota {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.9rem 1.1rem;
    border: 1px solid rgba(212,201,176,0.1);
    border-radius: 4px;
    background: rgba(212,201,176,0.03);
  }

  .fsg-nota-bar {
    width: 2px;
    min-height: 100%;
    background: rgba(212,201,176,0.25);
    border-radius: 2px;
    flex-shrink: 0;
    align-self: stretch;
  }

  .fsg-nota-text {
    font-size: 0.85rem;
    font-weight: 300;
    color: rgba(212,201,176,0.8);
    line-height: 1.65;
  }

  /* Empty */
  .fsg-empty {
    text-align: center;
    padding: 2rem 0 1rem;
    font-size: 0.82rem;
    font-weight: 300;
    color: rgba(255,255,255,0.15);
    letter-spacing: 0.04em;
    font-style: italic;
  }

  @keyframes fsgIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 700px) {
    .fsg-shapes { grid-template-columns: repeat(3, 1fr); }
    .fsg-cuts   { grid-template-columns: 1fr 1fr; }
    .fsg-intro  { flex-direction: column; align-items: center; text-align: center; }
  }

  @media (max-width: 420px) {
    .fsg-cuts { grid-template-columns: 1fr; }
  }
`;

/* ─────────────────────────────────────────────
   Componente
───────────────────────────────────────────── */
export default function FaceShapeGuide() {
  const [active, setActive] = useState(null);
  const shape = FACE_SHAPES.find(f => f.id === active);

  return (
    <>
      <style>{STYLES}</style>
      <section className="fsg">

        <div className="fsg-header">
          <span className="fsg-eyebrow">Guía de estilo</span>
          <h2 className="fsg-title">¿Qué corte <em>te favorece?</em></h2>
          <p className="fsg-subtitle">
            Seleccioná la forma de tu cara para ver los cortes que mejor se adaptan a tu fisionomía.
          </p>
        </div>

        {/* Selector de formas */}
        <div className="fsg-shapes">
          {FACE_SHAPES.map(f => (
            <button
              key={f.id}
              className={`fsg-shape-btn ${active === f.id ? 'active' : ''}`}
              onClick={() => setActive(active === f.id ? null : f.id)}
            >
              <SchematicHead shape={f.id} size={62} accent={active === f.id ? '#5fa8c8' : '#666e80'} />
              <span className="fsg-shape-label">{f.nombre}</span>
            </button>
          ))}
        </div>

        {!shape && <p className="fsg-empty">Seleccioná una forma para ver los cortes recomendados</p>}

        {shape && (
          <div className="fsg-result" key={shape.id}>

            {/* Intro */}
            <div className="fsg-intro">
              <div className="fsg-intro-img">
                <SchematicHead shape={shape.id} size={90} accent="#5fa8c8" />
              </div>
              <div className="fsg-intro-body">
                <h3 className="fsg-shape-name">Cara {shape.nombre}</h3>
                <p className="fsg-shape-desc">{shape.descripcion}</p>
              </div>
            </div>

            {/* Cortes */}
            <span className="fsg-cuts-title">Cortes recomendados</span>
            <div className="fsg-cuts">
              {shape.cortes.map((c, i) => (
                <div key={i} className="fsg-cut">
                  <span className="fsg-cut-n">0{i + 1}</span>
                  <div className="fsg-cut-name">{c.nombre}</div>
                  <p className="fsg-cut-desc">{c.desc}</p>
                </div>
              ))}
            </div>

            {/* Nota */}
            <div className="fsg-nota">
              <div className="fsg-nota-bar" />
              <p className="fsg-nota-text">{shape.nota}</p>
            </div>

          </div>
        )}
      </section>
    </>
  );
}