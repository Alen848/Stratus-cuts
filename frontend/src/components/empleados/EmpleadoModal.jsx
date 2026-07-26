import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = {
  nombre: '', apellido: '', email: '', telefono: '', especialidad: '',
  servicio_ids: [],
};

export default function EmpleadoModal({ isOpen, onClose, onSubmit, empleado = null, servicios = [] }) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(empleado);

  useEffect(() => {
    if (empleado) {
      setForm({
        nombre:       empleado.nombre       || '',
        apellido:     empleado.apellido     || '',
        email:        empleado.email        || '',
        telefono:     empleado.telefono     || '',
        especialidad: empleado.especialidad || '',
        servicio_ids: empleado.servicio_ids || [],
      });
    } else {
      setForm(defaultForm);
    }
  }, [empleado, isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleServicio = (id) => setForm(f => ({
    ...f,
    servicio_ids: f.servicio_ids.includes(id)
      ? f.servicio_ids.filter(x => x !== id)
      : [...f.servicio_ids, id],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Los opcionales vacíos van como null (el backend valida EmailStr, y "" no es válido).
      await onSubmit({
        ...form,
        email:        form.email        || null,
        telefono:     form.telefono     || null,
        especialidad: form.especialidad || null,
        apellido:     form.apellido     || null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar profesional' : 'Nuevo Profesional'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
          <Input label="Apellido" value={form.apellido} onChange={e => set('apellido', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Teléfono" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
        </div>
        <Input label="Especialidad" value={form.especialidad} placeholder="Ej: Colorista, Estilista..." onChange={e => set('especialidad', e.target.value)} />

        {/* Servicios que realiza */}
        <div>
          <label style={{
            display: 'block', fontSize: '12px', marginBottom: '8px',
            color: 'var(--text-secondary)', letterSpacing: '0.02em',
          }}>
            Servicios que realiza
          </label>
          {servicios.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              No hay servicios cargados todavía.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {servicios.map(s => {
                  const active = form.servicio_ids.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServicio(s.id)}
                      style={{
                        padding: '6px 12px', borderRadius: '99px', fontSize: '12px',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        border: active ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                        background: active ? 'var(--gold-dim)' : 'transparent',
                        color: active ? 'var(--gold)' : 'var(--text-muted)',
                      }}
                    >
                      {active ? '✓ ' : ''}{s.nombre}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Si no seleccionás ninguno, se asume que realiza <strong style={{ color: 'var(--text-secondary)' }}>todos</strong> los servicios.
                En la reserva online, el cliente solo verá a este profesional para los servicios marcados.
              </p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : isEdit ? 'Guardar cambios' : 'Agregar profesional'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
