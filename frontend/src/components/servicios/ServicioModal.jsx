import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = {
  nombre: '', descripcion: '', precio: '', duracion_minutos: '', categoria_id: '',
  empleado_ids: [], fechas_especiales: [],
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fechaLegible = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });

export default function ServicioModal({
  isOpen, onClose, onSubmit, servicio = null, categorias = [],
  categoriaIdPorDefecto = null, empleados = [], modoEvento = false,
}) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
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
        fechas_especiales: servicio.fechas_especiales || [],
      });
    } else {
      setForm({
        ...defaultForm,
        categoria_id: categoriaIdPorDefecto ? String(categoriaIdPorDefecto) : '',
      });
    }
    setNuevaFecha('');
  }, [servicio, isOpen, categoriaIdPorDefecto]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const agregarFecha = () => {
    if (!nuevaFecha || form.fechas_especiales.includes(nuevaFecha)) return;
    setForm(f => ({
      ...f,
      fechas_especiales: [...f.fechas_especiales, nuevaFecha].sort(),
    }));
    setNuevaFecha('');
  };

  const quitarFecha = (fecha) => setForm(f => ({
    ...f,
    fechas_especiales: f.fechas_especiales.filter(x => x !== fecha),
  }));

  // Fechas ya pasadas: se siguen mostrando (son historial) pero atenuadas,
  // porque un cliente ya no puede reservar en ellas.
  const esPasada = (iso) => iso < hoyISO();

  // Un evento sin fechas sería indistinguible de un servicio normal: lo exigimos.
  const faltanFechas = modoEvento && form.fechas_especiales.length === 0;
  const sinFechasFuturas =
    form.fechas_especiales.length > 0 && form.fechas_especiales.every(esPasada);

  const toggleEmpleado = (id) => setForm(f => ({
    ...f,
    empleado_ids: f.empleado_ids.includes(id)
      ? f.empleado_ids.filter(x => x !== id)
      : [...f.empleado_ids, id],
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
        // Un evento no vive dentro de una categoría: tiene su propia sección,
        // tanto en este panel como en la página de reservas.
        categoria_id:     modoEvento ? null : (form.categoria_id ? Number(form.categoria_id) : null),
        empleado_ids:     form.empleado_ids,
        fechas_especiales: form.fechas_especiales,
      });
      onClose();
    } catch {
      // el error ya fue manejado por el caller con notify
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        modoEvento
          ? (isEdit ? 'Editar evento especial' : 'Nuevo evento especial')
          : (isEdit ? 'Editar servicio' : 'Nuevo servicio')
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {modoEvento && (
          <p style={{
            fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
            padding: '10px 12px', borderRadius: '6px',
          }}>
            ◈ Un <strong>evento especial</strong> es un servicio que se hace solo ciertos días
            (ej: una jornada de láser al mes). El cliente lo va a ver en una sección propia
            y solo va a poder reservarlo en las fechas que cargues acá abajo.
          </p>
        )}

        <Input
          label={modoEvento ? 'Nombre del evento' : 'Nombre del servicio'}
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          required
          placeholder={modoEvento ? 'Ej: Jornada de depilación láser' : 'Ej: Corte de cabello'}
        />
        {!modoEvento && (
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
        )}
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

        {/* Fechas del evento: solo en modo evento, el servicio normal no las tiene */}
        {modoEvento && (
        <div>
          <label style={{
            display: 'block', fontSize: '12px', marginBottom: '4px',
            color: 'var(--text-secondary)', letterSpacing: '0.02em',
          }}>
            Fechas en las que se realiza <span style={{ color: 'var(--gold)' }}>*</span>
          </label>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
            Cargá una o varias. Podés dejar programadas las próximas jornadas de una vez.
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Input
                type="date"
                min={hoyISO()}
                value={nuevaFecha}
                onChange={e => setNuevaFecha(e.target.value)}
              />
            </div>
            <Button variant="ghost" type="button" onClick={agregarFecha} disabled={!nuevaFecha}>
              + Agregar
            </Button>
          </div>

          {form.fechas_especiales.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {form.fechas_especiales.map(f => {
                const pasada = esPasada(f);
                return (
                  <div
                    key={f}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '10px', padding: '7px 10px', borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-hover)',
                      opacity: pasada ? 0.55 : 1,
                    }}
                  >
                    <span style={{ fontSize: '12px', color: pasada ? 'var(--text-muted)' : 'var(--gold)' }}>
                      {fechaLegible(f)}{pasada ? ' · ya pasó' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarFecha(f)}
                      title="Quitar esta fecha"
                      style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1, padding: '2px 4px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {form.fechas_especiales.length === 0 && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              Un evento necesita al menos una fecha para poder guardarse.
            </p>
          )}

          {sinFechasFuturas && (
            <p style={{
              fontSize: '11px', color: 'var(--warning, #d99a3a)', marginTop: '8px',
              lineHeight: 1.5, background: 'var(--bg-hover)', padding: '8px 10px', borderRadius: '6px',
            }}>
              ⚠ Todas las fechas cargadas ya pasaron. Mientras no agregues una futura,
              el evento no se le muestra al cliente.
            </p>
          )}
        </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading || faltanFechas}>
            {loading
              ? '...'
              : isEdit
                ? 'Guardar cambios'
                : modoEvento ? 'Crear evento' : 'Crear servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
