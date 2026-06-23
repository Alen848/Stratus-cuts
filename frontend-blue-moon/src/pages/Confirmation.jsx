import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTurnoEstado } from '../services/api';

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
    background: rgba(var(--success-rgb),0.10);
    border: 1px solid rgba(var(--success-rgb),0.28);
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
    font-size: 2.9rem;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 0.6rem;
    letter-spacing: 0.005em;
    line-height: 1.05;
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

const ICON_CHECK = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
    stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ICON_CLOCK = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
    stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(String(iso).replace('T', ' ').split('.')[0]);
  return isNaN(d) ? '—' : d.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
};
const money = (n) => (n == null ? null : `$${Number(n).toLocaleString('es-AR')}`);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function Card({ icon, title, subtitle, rows }) {
  const visibles = (rows || []).filter(Boolean);
  return (
    <>
      <style>{STYLES}</style>
      <div className="conf-wrap">
        <div className="conf-icon">{icon}</div>
        <div className="conf-heading">
          <h1 className="conf-title">{title}</h1>
          <p className="conf-subtitle">{subtitle}</p>
        </div>
        {visibles.length > 0 && (
          <div className="conf-card">
            <div className="conf-card-header">
              <span className="conf-card-header-label">Detalles de la reserva</span>
            </div>
            {visibles.map(({ label, value }) => (
              <div key={label} className="conf-row">
                <span className="conf-row-label">{label}</span>
                <span className="conf-row-value">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
        <Link to="/" className="conf-cta">Reservar otro turno</Link>
      </div>
    </>
  );
}

const Confirmation = () => {
  const location = useLocation();
  const stateTurno = location.state?.turno;

  const params = new URLSearchParams(location.search);
  const turnoIdUrl = params.get('external_reference') || params.get('turno');

  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(!stateTurno && !!turnoIdUrl);

  // Vuelta de Mercado Pago: consultar el estado real (el webhook puede demorar)
  useEffect(() => {
    if (stateTurno || !turnoIdUrl) return;
    let cancelled = false;
    let tries = 0;
    const poll = () => {
      getTurnoEstado(turnoIdUrl)
        .then(r => {
          if (cancelled) return;
          setEstado(r.data);
          if (r.data?.estado === 'pendiente_pago' && tries < 5) {
            tries += 1;
            setTimeout(poll, 2000);
          } else {
            setCargando(false);
          }
        })
        .catch(() => { if (!cancelled) setCargando(false); });
    };
    poll();
    return () => { cancelled = true; };
  }, [turnoIdUrl, stateTurno]);

  // ── Modo 1: reserva sin seña (navegación interna) ──
  if (stateTurno) {
    const t = stateTurno;
    const servicios = t.servicios?.map(s => s.servicio?.nombre).filter(Boolean).join(', ');
    return (
      <Card
        icon={ICON_CHECK}
        title="¡Turno confirmado!"
        subtitle="Te esperamos. Podés cancelar o reagendar cuando necesites."
        rows={[
          { label: 'Cliente',      value: t.cliente?.nombre },
          { label: 'Fecha y hora', value: fmtFecha(t.fecha_hora) },
          { label: 'Servicio',     value: servicios },
          { label: 'Estado',       value: cap(t.estado) },
        ]}
      />
    );
  }

  // ── Modo 2: vuelta de Mercado Pago ──
  if (turnoIdUrl) {
    if (cargando) {
      return <Card icon={ICON_CLOCK} title="Verificando tu pago…" subtitle="Esto puede tardar unos segundos." />;
    }
    const e = estado;
    if (!e) {
      return <Card icon={ICON_CLOCK} title="No pudimos verificar el turno"
        subtitle="Si realizaste el pago, vas a recibir la confirmación. Ante dudas, contactá al salón." />;
    }
    if (e.estado === 'confirmado') {
      return (
        <Card
          icon={ICON_CHECK}
          title="¡Turno confirmado!"
          subtitle="Tu seña fue acreditada. Te esperamos."
          rows={[
            { label: 'Cliente',      value: e.cliente_nombre },
            { label: 'Fecha y hora', value: fmtFecha(e.fecha_hora) },
            { label: 'Servicio',     value: (e.servicios || []).join(', ') },
            { label: 'Profesional',  value: e.empleado_nombre },
            e.monto_sena ? { label: 'Seña pagada', value: money(e.monto_sena) } : null,
            e.saldo_pendiente ? { label: 'Resta en el local', value: money(e.saldo_pendiente) } : null,
          ]}
        />
      );
    }
    if (e.estado === 'pendiente_pago') {
      return <Card icon={ICON_CLOCK} title="Pago en proceso"
        subtitle="Estamos esperando la confirmación de Mercado Pago. Actualizá esta página en unos minutos." />;
    }
    return <Card icon={ICON_CLOCK} title="El pago no se completó"
      subtitle="Tu turno no quedó confirmado. Podés intentar reservar nuevamente." />;
  }

  // ── Sin información ──
  return (
    <>
      <style>{STYLES}</style>
      <div className="conf-empty">
        <p>No hay información del turno.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    </>
  );
};

export default Confirmation;
