import { useState, useEffect } from 'react';
import Modal  from '../ui/Modal';
import Input  from '../ui/Input';
import Button from '../ui/Button';

const ESTADOS  = ['pendiente', 'confirmado', 'completado', 'cancelado'];
const METODOS  = ['efectivo', 'débito', 'transferencia'];

const defaultForm = {
  fecha_hora:    '',
  empleado_id:   '',
  cliente_id:    '',
  servicios_ids: [],
  estado:        'pendiente',
  metodo_pago:   'efectivo',
  observaciones: '',
};

export default function TurnoModal({
  isOpen, onClose, onSubmit,
  clientes = [], empleados = [], servicios = [], turno = null,
}) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(turno);

  useEffect(() => {
    if (isOpen) {
      if (turno) {
        const fh = turno.fecha_hora
          ? new Date(turno.fecha_hora + (turno.fecha_hora.endsWith('Z') ? '' : 'Z'))
              .toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
              .slice(0, 16).replace(' ', 'T')
          : '';
        setForm({
          fecha_hora:    fh,
          empleado_id:   turno.empleado_id   || '',
          cliente_id:    turno.cliente_id    || '',
          servicios_ids: turno.servicios?.map(s => s.servicio_id || s.servicio?.id).filter(Boolean) || [],
          estado:        turno.estado        || 'pendiente',
          metodo_pago:   turno.metodo_pago   || 'efectivo',
          observaciones: turno.observaciones || '',
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [turno, isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleServicio = (id) =>
    setForm(f => ({
      ...f,
      servicios_ids: f.servicios_ids.includes(id)
        ? f.servicios_ids.filter(s => s !== id)
        : [...f.servicios_ids, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fecha_hora || !form.empleado_id || !form.cliente_id) return;
    try {
      setLoading(true);
      await onSubmit({
        ...form,
        fecha_hora:    form.fecha_hora + ':00-03:00',
        empleado_id:   Number(form.empleado_id),
        cliente_id:    Number(form.cliente_id),
        servicios_ids: form.servicios_ids.map(Number),
        duracion:      0,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Turno' : 'Nuevo Turno'} width={560}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Cliente y Profesional */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Cliente" as="select" value={form.cliente_id}
            onChange={e => set('cliente_id', e.target.value)} required>
            <option value="">Seleccionar...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>
            ))}
          </Input>
          <Input label="Profesional" as="select" value={form.empleado_id}
            onChange={e => set('empleado_id', e.target.value)} required>
            <option value="">Seleccionar...</option>
            {empleados.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </Input>
        </div>

        {/* Fecha y Estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Fecha y hora" type="datetime-local" value={form.fecha_hora}
            onChange={e => set('fecha_hora', e.target.value)} required />
          <Input label="Estado" as="select" value={form.estado}
            onChange={e => set('estado', e.target.value)}>
            {ESTADOS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Input>
        </div>

        {/* Método de pago — siempre visible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            Método de pago
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {METODOS.map(m => (
              <button
                key={m} type="button"
                onClick={() => set('metodo_pago', m)}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  border:     form.metodo_pago === m ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                  background: form.metodo_pago === m ? 'var(--gold-dim)'              : 'transparent',
                  color:      form.metodo_pago === m ? 'var(--gold)'                  : 'var(--text-secondary)',
                  fontWeight: form.metodo_pago === m ? 500                            : 400,
                }}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Servicios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            Servicios
          </label>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)', padding: '10px', minHeight: '48px',
          }}>
            {servicios.length === 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin servicios disponibles</span>
            )}
            {servicios.map(s => {
              const active = form.servicios_ids.includes(s.id);
              return (
                <button key={s.id} type="button" onClick={() => toggleServicio(s.id)} style={{
                  padding: '4px 12px', borderRadius: '99px', fontSize: '12px',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  background: active ? 'var(--gold-dim)'             : 'transparent',
                  color:      active ? 'var(--gold)'                  : 'var(--text-muted)',
                  border:     active ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                }}>
                  {s.nombre}
                </button>
              );
            })}
          </div>
        </div>

        <Input label="Observaciones" as="textarea" value={form.observaciones}
          onChange={e => set('observaciones', e.target.value)} placeholder="Notas adicionales..." />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : isEdit ? 'Guardar cambios' : 'Crear turno'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}