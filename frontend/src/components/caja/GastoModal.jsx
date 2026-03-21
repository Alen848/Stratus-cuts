import { useState, useEffect } from 'react';

export const CATEGORIAS = ['alquiler', 'productos', 'sueldos', 'servicios', 'otros'];

const defaultForm = { descripcion: '', monto: '', categoria: 'otros', observaciones: '' };

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

export default function GastoModal({ isOpen, onClose, onSubmit, gasto = null }) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const isEdit = Boolean(gasto);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm(gasto
        ? {
            descripcion:   gasto.descripcion,
            monto:         String(gasto.monto),
            categoria:     gasto.categoria,
            observaciones: gasto.observaciones || '',
          }
        : defaultForm
      );
    }
  }, [gasto, isOpen]);

  if (!isOpen) return null;

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const monto = parseFloat(form.monto);
    if (!form.descripcion.trim()) return setError('La descripción es obligatoria.');
    if (!monto || monto <= 0)     return setError('El monto debe ser mayor a 0.');
    try {
      setLoading(true);
      await onSubmit({ ...form, monto });
      onClose();
    } catch {
      setError('Ocurrió un error al guardar el gasto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '28px', width: '420px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-primary)' }}>
          {isEdit ? 'Editar gasto' : 'Nuevo gasto'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Descripción</label>
            <input
              style={inputStyle}
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Compra de productos"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Monto ($)</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={e => set('monto', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select
                style={inputStyle}
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
              >
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observaciones (opcional)</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>

          {error && (
            <span style={{ fontSize: '12px', color: 'var(--color-danger, #e53e3e)' }}>{error}</span>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
                color: 'var(--gold)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              }}
            >
              {loading ? '...' : isEdit ? 'Guardar cambios' : 'Agregar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}