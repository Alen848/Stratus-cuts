import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = {
  nombre: '', descripcion: '', precio: '', duracion_minutos: '', categoria_id: '',
  empleado_ids: [],
  horas_limite: {},   // { empleado_id: 'HH:MM' } — hasta qué hora toma este servicio
};

export default function ServicioModal({
  isOpen, onClose, onSubmit, servicio = null, categorias = [],
  categoriaIdPorDefecto = null, empleados = [],
}) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(servicio);

  useEffect(() => {
    if (servicio) {
      setForm({
        nombre:           servicio.nombre           || '',
        descripcion:      servicio.descripcion      || '',
        precio:           String(servicio.precio    ?? ''),
        duracion_minutos: String(servicio.duracion_minutos ?? ''),
        categoria_id:     servicio.categoria_id ? String(servicio.categoria_id) : '',
        empleado_ids:     servicio.empleado_ids || [],
        // El backend devuelve 'HH:MM:SS'; el input type=time trabaja con 'HH:MM'
        horas_limite: Object.fromEntries(
          Object.entries(servicio.horas_limite || {}).map(([id, h]) => [id, String(h).slice(0, 5)])
        ),
      });
    } else {
      setForm({
        ...defaultForm,
        categoria_id: categoriaIdPorDefecto ? String(categoriaIdPorDefecto) : '',
      });
    }
  }, [servicio, isOpen, categoriaIdPorDefecto]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleEmpleado = (id) => setForm(f => ({
    ...f,
    empleado_ids: f.empleado_ids.includes(id)
      ? f.empleado_ids.filter(x => x !== id)
      : [...f.empleado_ids, id],
  }));

  const setHoraLimite = (id, hora) => setForm(f => ({
    ...f, horas_limite: { ...f.horas_limite, [id]: hora },
  }));

  const activos = empleados.filter(e => e.activo !== false);

  // Aviso importante: un profesional sin servicios asignados hoy "hace todos".
  // Si lo marcamos acá, pasa a hacer SOLO los que tenga asignados, así que
  // desaparece del resto de los servicios. Hay que decirlo antes de guardar.
  const pasanASerRestringidos = activos.filter(
    e => form.empleado_ids.includes(e.id) && (e.servicio_ids || []).length === 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit({
        ...form,
        precio:           Number(form.precio),
        duracion_minutos: Number(form.duracion_minutos),
        categoria_id:     form.categoria_id ? Number(form.categoria_id) : null,
        empleado_ids:     form.empleado_ids,
        // Solo de los profesionales marcados y con hora cargada
        horas_limite: Object.fromEntries(
          form.empleado_ids
            .filter(id => form.horas_limite[id])
            .map(id => [id, form.horas_limite[id]])
        ),
      });
      onClose();
    } catch {
      // el error ya fue manejado por el caller con notify
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="Nombre del servicio"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          required
          placeholder="Ej: Corte de cabello"
        />
        <Input
          label="Categoría"
          as="select"
          value={form.categoria_id}
          onChange={e => set('categoria_id', e.target.value)}
        >
          <option value="">Sin categoría (se muestra suelto)</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </Input>
        <Input
          label="Descripción"
          as="textarea"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Descripción opcional..."
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Precio ($)"
            type="number"
            min="0"
            step="0.01"
            value={form.precio}
            onChange={e => set('precio', e.target.value)}
            required
          />
          <Input
            label="Duración (minutos)"
            type="number"
            min="5"
            step="5"
            value={form.duracion_minutos}
            onChange={e => set('duracion_minutos', e.target.value)}
            required
          />
        </div>
        {/* Profesionales que realizan este servicio */}
        <div>
          <label style={{
            display: 'block', fontSize: '12px', marginBottom: '8px',
            color: 'var(--text-secondary)', letterSpacing: '0.02em',
          }}>
            Profesionales que lo realizan
          </label>

          {activos.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              No hay profesionales cargados todavía.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activos.map(e => {
                  const active = form.empleado_ids.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleEmpleado(e.id)}
                      style={{
                        padding: '6px 12px', borderRadius: '99px', fontSize: '12px',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        border: active ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                        background: active ? 'var(--gold-dim)' : 'transparent',
                        color: active ? 'var(--gold)' : 'var(--text-muted)',
                      }}
                    >
                      {active ? '✓ ' : ''}{e.nombre}
                    </button>
                  );
                })}
              </div>

              {form.empleado_ids.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Hasta qué hora toma este servicio <span style={{ opacity: 0.8 }}>(opcional — vacío = su horario normal)</span>
                  </span>
                  {activos.filter(e => form.empleado_ids.includes(e.id)).map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '110px' }}>
                        {e.nombre}
                      </span>
                      <input
                        type="time"
                        value={form.horas_limite[e.id] || ''}
                        onChange={ev => setHoraLimite(e.id, ev.target.value)}
                        style={{
                          padding: '5px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
                          border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                        }}
                      />
                      {form.horas_limite[e.id] && (
                        <button type="button" onClick={() => setHoraLimite(e.id, '')}
                          title="Quitar tope"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '12px',
                          }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.empleado_ids.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                  Sin nadie marcado, este servicio lo pueden tomar los profesionales
                  que hacen todos los servicios.
                </p>
              ) : null}

              {pasanASerRestringidos.length > 0 && (
                <p style={{
                  fontSize: '11px', color: 'var(--warning, #d99a3a)', marginTop: '8px',
                  lineHeight: 1.5, background: 'var(--bg-hover)', padding: '8px 10px',
                  borderRadius: '6px',
                }}>
                  ⚠ {pasanASerRestringidos.map(e => e.nombre).join(', ')}
                  {pasanASerRestringidos.length === 1 ? ' hacía' : ' hacían'} todos los servicios.
                  Al marcarlo{pasanASerRestringidos.length === 1 ? '' : 's'} acá,
                  pasa{pasanASerRestringidos.length === 1 ? '' : 'n'} a realizar
                  <strong> solo los servicios que tenga{pasanASerRestringidos.length === 1 ? '' : 'n'} asignados</strong>,
                  así que dejará{pasanASerRestringidos.length === 1 ? '' : 'n'} de aparecer en el resto.
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
