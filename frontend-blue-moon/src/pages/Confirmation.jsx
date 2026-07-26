import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTurnoEstado, subirComprobante } from '../services/api';

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

// Mismo número que la burbuja de WhatsApp del sitio (wa.me: 54 9 223 6919766)
const WHATSAPP_NUMERO = '5492236919766';

const Confirmation = () => {
  const location = useLocation();
  const stateTurno = location.state?.turno;
  const stateTransfer = location.state?.transferencia;

  const params = new URLSearchParams(location.search);
  const turnoIdUrl = params.get('external_reference') || params.get('turno');

  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(!stateTurno && !!turnoIdUrl);

  // Subida del comprobante de transferencia
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | done | error
  const [uploadErr, setUploadErr]     = useState('');

  const handleComprobante = async (e, turnoId) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-elegir el mismo archivo
    if (!file || !turnoId) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadState('error');
      setUploadErr('El archivo supera los 5 MB.');
      return;
    }
    setUploadErr('');
    setUploadState('uploading');
    try {
      await subirComprobante(turnoId, file);
      setUploadState('done');
    } catch (err) {
      setUploadState('error');
      setUploadErr(err?.response?.data?.detail || 'No se pudo subir el comprobante. Probá de nuevo.');
    }
  };

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

  // ── Modo 0: seña por transferencia (datos bancarios + WhatsApp) ──
  if (stateTransfer) {
    const tr = stateTransfer;
    const mensaje =
      `Hola! Quiero enviar el comprobante de la seña de mi turno 😊\n` +
      `• Nombre: ${tr.cliente || ''}\n` +
      `• Fecha: ${tr.fecha || ''}${tr.hora ? ` a las ${tr.hora} hs` : ''}\n` +
      `• Profesional: ${tr.profesional || ''}\n` +
      `• Servicio: ${tr.servicios || ''}\n` +
      `• Seña: ${money(tr.monto_sena) || ''}`;
    const waHref = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;

    const bankRow = (label, value) => value ? (
      <div className="conf-row">
        <span className="conf-row-label">{label}</span>
        <span className="conf-row-value" style={{ fontWeight: 500 }}>{value}</span>
      </div>
    ) : null;

    return (
      <>
        <style>{STYLES}</style>
        <div className="conf-wrap">
          <div className="conf-icon">{ICON_CLOCK}</div>
          <div className="conf-heading">
            <h1 className="conf-title">¡Turno reservado!</h1>
            <p className="conf-subtitle">
              Para confirmarlo, transferí la seña y adjuntá el comprobante acá abajo.
              El local confirma tu turno al recibirlo.
            </p>
          </div>

          <div className="conf-card">
            <div className="conf-card-header">
              <span className="conf-card-header-label">Datos para transferir</span>
            </div>
            {bankRow('Seña a transferir', money(tr.monto_sena))}
            {bankRow('CBU / CVU', tr.cbu)}
            {bankRow('Alias', tr.alias)}
            {bankRow('Titular', tr.titular)}
            {bankRow('Resto en el local', money(tr.saldo_pendiente))}
          </div>

          {uploadState === 'done' ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
              padding: '1rem 1.4rem', borderRadius: '8px', width: '100%',
              background: 'rgba(var(--success-rgb),0.10)', border: '1px solid rgba(var(--success-rgb),0.28)',
            }}>
              <strong style={{ color: 'var(--text)' }}>✅ ¡Comprobante enviado!</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', textAlign: 'center' }}>
                El local va a verificar tu transferencia y confirmar el turno. ¡Gracias!
              </span>
            </div>
          ) : (
            <>
              <label
                className="conf-cta"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  cursor: uploadState === 'uploading' ? 'default' : 'pointer',
                  opacity: uploadState === 'uploading' ? 0.65 : 1, width: '100%',
                }}
              >
                {uploadState === 'uploading' ? 'Subiendo comprobante…' : '📎 Adjuntar comprobante'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleComprobante(e, tr.turno_id)}
                  disabled={uploadState === 'uploading'}
                  style={{ display: 'none' }}
                />
              </label>
              {uploadState === 'error' && (
                <span style={{ fontSize: '0.82rem', color: 'var(--danger, #c0392b)', textAlign: 'center' }}>
                  {uploadErr}
                </span>
              )}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-4)', textAlign: 'center' }}>
                Subí una foto o PDF del comprobante (hasta 5 MB). ¿Preferís WhatsApp?{' '}
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                  Enviarlo por acá
                </a>.
              </span>
            </>
          )}

          <Link to="/" className="conf-cta" style={{ background: 'transparent' }}>Volver al inicio</Link>
        </div>
      </>
    );
  }

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
