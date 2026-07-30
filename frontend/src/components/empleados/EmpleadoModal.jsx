import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = {
  nombre: '', apellido: '', email: '', telefono: '', especialidad: '',
  servicio_ids: [],
};

export default function EmpleadoModal({
  isOpen, onClose, onSubmit, empleado = null, servicios = [], categorias = [],
}) {
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

  // Marca o desmarca de una todos los servicios de una categoría
  const toggleGrupo = (idsDelGrupo, todosMarcados) => setForm(f => ({
    ...f,
    servicio_ids: todosMarcados
      ? f.servicio_ids.filter(x => !idsDelGrupo.includes(x))
      : [...new Set([...f.servicio_ids, ...idsDelGrupo])],
  }));

  // Los servicios se muestran agrupados por categoría: el dueño puede marcar
  // una categoría entera o elegir servicio por servicio dentro de ella.
  const grupos = [
    ...categorias.map(cat => ({
      key: `cat-${cat.id}`,
      nombre: cat.nombre,
      items: servicios.filter(s => s.categoria_id === cat.id),
    })),
    {
      key: 'sin-categoria',
      nombre: 'Sin categoría',
      items: servicios.filter(s => !s.categoria_id),
    },
  ].filter(g => g.items.length > 0);

  const totalSeleccionados = form.servicio_ids.length;

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
              <div style={{
                maxHeight: '280px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 8px)',
                padding: '12px',
              }}>
                {grupos.map(({ key, nombre, items }) => {
                  const idsDelGrupo = items.map(s => s.id);
                  const marcados = idsDelGrupo.filter(id => form.servicio_ids.includes(id)).length;
                  const todos = marcados === idsDelGrupo.length;

                  return (
                    <div key={key}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '10px', marginBottom: '8px',
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          {nombre}
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {marcados} de {idsDelGrupo.length}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleGrupo(idsDelGrupo, todos)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '11px', color: 'var(--gold)', padding: '2px 4px',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {todos ? 'Quitar todos' : 'Marcar todos'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {items.map(s => {
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
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                {totalSeleccionados === 0 ? (
                  <>
                    Sin nada marcado, este profesional aparece en{' '}
                    <strong style={{ color: 'var(--text-secondary)' }}>todos</strong> los servicios.
                    Marcá solo los que realiza para que el cliente no lo vea en el resto.
                  </>
                ) : (
                  <>
                    Realiza <strong style={{ color: 'var(--text-secondary)' }}>{totalSeleccionados}</strong>
                    {' '}de {servicios.length} servicios. En la reserva online, el cliente solo lo va a
                    ver disponible para esos.
                  </>
                )}
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
