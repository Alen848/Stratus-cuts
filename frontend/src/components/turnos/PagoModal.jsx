import { useState, useEffect } from 'react';
import { pagos } from '../../api/api';
import { formatCurrency } from '../../utils/formatters';

const METODOS = ['efectivo', 'débito', 'transferencia', 'Mercado Pago'];

const inputStyle = {
  width: '100%', padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: '13px', fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px', color: 'var(--text-secondary)',
  display: 'block', marginBottom: '6px',
};

// Total del turno: snapshot monto_total (reservas con seña) o suma de servicios
function calcularTotal(turno) {
  if (turno?.total_turno != null) return turno.total_turno;
  if (turno?.monto_total != null) return turno.monto_total;
  return (turno?.servicios || []).reduce((acc, ts) => {
    const precio = ts.precio_unitario ?? ts.servicio?.precio ?? 0;
    return acc + precio * (ts.cantidad ?? 1);
  }, 0);
}

const metodoBtn = (activo) => ({
  flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
  fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.15s',
  fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  border:     activo ? '1px solid var(--gold-border)' : '1px solid var(--border)',
  background: activo ? 'var(--gold-dim)'              : 'transparent',
  color:      activo ? 'var(--gold)'                  : 'var(--text-secondary)',
  fontWeight: activo ? 500                            : 400,
});

export default function PagoModal({ isOpen, onClose, onPagoRegistrado, turno }) {
  const [metodo, setMetodo] = useState('efectivo');       // efectivo|débito|transferencia|Mercado Pago|varios
  const [monto, setMonto]   = useState('');
  const [lineas, setLineas] = useState([{ metodo_pago: 'efectivo', monto: '' }]); // split
  const [obs, setObs]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const total  = turno ? calcularTotal(turno) : 0;
  const pagado = turno?.total_pagado ?? 0;
  const saldo  = turno?.saldo != null ? turno.saldo : Math.max(total - pagado, 0);

  useEffect(() => {
    if (isOpen && turno) {
      setMetodo('efectivo');
      setMonto(saldo > 0 ? String(saldo) : '');
      setLineas([{ metodo_pago: 'efectivo', monto: String(saldo > 0 ? saldo : '') }]);
      setObs('');
      setError('');
    }
  }, [isOpen, turno]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !turno) return null;

  const cliente = turno.cliente || {};
  const serviciosNombres = (turno.servicios || [])
    .map(ts => ts.servicio?.nombre || ts.nombre).filter(Boolean);

  const esVarios = metodo === 'varios';
  const totalAsignado = esVarios
    ? lineas.reduce((a, l) => a + (parseFloat(l.monto) || 0), 0)
    : (parseFloat(monto) || 0);

  const setLinea = (i, k, v) => setLineas(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l));
  const addLinea = () => setLineas(ls => [...ls, { metodo_pago: 'efectivo', monto: '' }]);
  const delLinea = (i) => setLineas(ls => ls.filter((_, j) => j !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cobroLineas = esVarios
      ? lineas.map(l => ({ metodo_pago: l.metodo_pago, monto: parseFloat(l.monto) || 0 })).filter(l => l.monto > 0)
      : [{ metodo_pago: metodo, monto: parseFloat(monto) || 0 }];

    if (cobroLineas.length === 0 || cobroLineas.some(l => l.monto <= 0)) {
      setError('Ingresá un monto mayor a 0.');
      return;
    }
    const suma = cobroLineas.reduce((a, l) => a + l.monto, 0);
    if (suma - saldo > 0.01) {
      setError(`El cobro (${formatCurrency(suma)}) supera el saldo (${formatCurrency(saldo)}).`);
      return;
    }
    try {
      setLoading(true);
      await pagos.cobrar({ turno_id: turno.id, lineas: cobroLineas, observaciones: obs || null });
      onPagoRegistrado();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al registrar el cobro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '28px', width: '460px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-primary)' }}>Registrar cobro</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            El turno se marcará como completado al cubrir el total.
          </div>
        </div>

        {/* Resumen */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Row label="Cliente" value={`${cliente.nombre || 'Sin turno'} ${cliente.apellido || ''}`} />
          {serviciosNombres.length > 0 && <Row label="Servicios" value={serviciosNombres.join(', ')} />}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <Row label="Total" value={formatCurrency(total)} />
          {pagado > 0 && <Row label="Ya pagado (seña/cobros)" value={formatCurrency(pagado)} muted />}
          <Row label="Resta a cobrar" value={formatCurrency(saldo)} strong />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Método */}
          <div>
            <label style={labelStyle}>Método de pago</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {METODOS.map(m => (
                <button key={m} type="button" onClick={() => setMetodo(m)} style={metodoBtn(metodo === m)}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
              <button type="button" onClick={() => setMetodo('varios')} style={metodoBtn(esVarios)}>
                Varios métodos
              </button>
            </div>
          </div>

          {/* Monto único o split */}
          {!esVarios ? (
            <div>
              <label style={labelStyle}>Monto ($)</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={monto}
                onChange={e => setMonto(e.target.value)} placeholder="0.00" required />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Detalle por método</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lineas.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px' }}>
                    <select style={{ ...inputStyle, flex: 1.2, cursor: 'pointer' }} value={l.metodo_pago}
                      onChange={e => setLinea(i, 'metodo_pago', e.target.value)}>
                      {METODOS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                    </select>
                    <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" step="0.01" value={l.monto}
                      onChange={e => setLinea(i, 'monto', e.target.value)} placeholder="0.00" />
                    {lineas.length > 1 && (
                      <button type="button" onClick={() => delLinea(i)}
                        style={{ ...inputStyle, width: 'auto', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addLinea}
                style={{ marginTop: '8px', background: 'none', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                + Agregar método
              </button>
            </div>
          )}

          {/* Asignado vs saldo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px',
            color: Math.abs(totalAsignado - saldo) < 0.01 ? 'var(--color-success, #4caf7d)' : 'var(--text-muted)' }}>
            <span>Asignado: {formatCurrency(totalAsignado)}</span>
            <span>Saldo: {formatCurrency(saldo)}</span>
          </div>

          <div>
            <label style={labelStyle}>Observaciones (opcional)</label>
            <input style={inputStyle} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ej: pagó con vuelto" />
          </div>

          {error && <span style={{ fontSize: '12px', color: 'var(--color-danger, #e53e3e)' }}>{error}</span>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-border)', background: 'var(--gold-dim)', color: 'var(--gold)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              {loading ? '...' : 'Confirmar cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value, strong, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
        fontWeight: strong ? 600 : 500, textAlign: 'right', maxWidth: '240px',
      }}>{value}</span>
    </div>
  );
}
