import { useState, useEffect } from 'react';
import { pagos } from '../../api/api';
import { formatCurrency } from '../../utils/formatters';

const METODOS = ['efectivo', 'débito', 'transferencia'];

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
  display: 'block', marginBottom: '4px',
};

// Calcula el monto total sumando los servicios del turno
function calcularMontoTurno(turno) {
  if (!turno?.servicios?.length) return 0;
  return turno.servicios.reduce((acc, ts) => {
    const precio = ts.precio_unitario ?? ts.servicio?.precio ?? 0;
    const cantidad = ts.cantidad ?? 1;
    return acc + precio * cantidad;
  }, 0);
}

export default function PagoModal({ isOpen, onClose, onPagoRegistrado, turno }) {
  const [metodo, setMetodo]   = useState('efectivo');
  const [monto, setMonto]     = useState('');
  const [obs, setObs]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (isOpen && turno) {
      const montoCalculado = calcularMontoTurno(turno);
      setMonto(montoCalculado > 0 ? String(montoCalculado) : '');
      setMetodo('efectivo');
      setObs('');
      setError('');
    }
  }, [isOpen, turno]);

  if (!isOpen || !turno) return null;

  const cliente  = turno.cliente  || {};
  const serviciosNombres = turno.servicios
    ?.map(ts => ts.servicio?.nombre || ts.nombre)
    .filter(Boolean) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await pagos.create({
        turno_id:    turno.id,
        monto:       montoNum,
        metodo_pago: metodo,
        observaciones: obs || null,
      });
      onPagoRegistrado();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al registrar el pago.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '28px', width: '440px',
          display: 'flex', flexDirection: 'column', gap: '18px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-primary)' }}>
            Registrar cobro
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            El turno se marcará como completado al confirmar.
          </div>
        </div>

        {/* Resumen del turno */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {cliente.nombre} {cliente.apellido}
            </span>
          </div>
          {serviciosNombres.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Servicios</span>
              <span style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '220px' }}>
                {serviciosNombres.join(', ')}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Método de pago */}
          <div>
            <label style={labelStyle}>Método de pago</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {METODOS.map(m => (
                <button
                  key={m} type="button"
                  onClick={() => setMetodo(m)}
                  style={{
                    flex: 1, padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                    border:      metodo === m ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                    background:  metodo === m ? 'var(--gold-dim)'              : 'transparent',
                    color:       metodo === m ? 'var(--gold)'                  : 'var(--text-secondary)',
                    fontWeight:  metodo === m ? 500                            : 400,
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div>
            <label style={labelStyle}>Monto ($)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Observaciones */}
          <div>
            <label style={labelStyle}>Observaciones (opcional)</label>
            <input
              style={inputStyle}
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Ej: Pagó con vuelto"
            />
          </div>

          {error && (
            <span style={{ fontSize: '12px', color: 'var(--color-danger, #e53e3e)' }}>
              {error}
            </span>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              style={{
                padding: '8px 20px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
                color: 'var(--gold)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              }}
            >
              {loading ? '...' : 'Confirmar cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}