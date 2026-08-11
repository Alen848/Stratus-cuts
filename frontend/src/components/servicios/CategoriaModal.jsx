import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = {
  nombre: '', descripcion: '', orden: '',
  fechas_especiales: [], intervalo_minutos: '30',
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fechaLegible = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });

export default function CategoriaModal({
  isOpen, onClose, onSubmit, categoria = null, modoEvento = false,
}) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const isEdit = Boolean(categoria);
  // Al editar, manda lo que ya es la categoría; al crear, lo que eligió el dueño
  const esEvento = isEdit ? Boolean(categoria.es_evento) : modoEvento;

  useEffect(() => {
    if (categoria) {
      setForm({
        nombre:      categoria.nombre      || '',
        descripcion: categoria.descripcion || '',
        orden:       String(categoria.orden ?? ''),
        fechas_especiales: categoria.fechas_especiales || [],
        intervalo_minutos: String(categoria.intervalo_minutos ?? 30),
      });
    } else {
      setForm(defaultForm);
    }
    setNuevaFecha('');
  }, [categoria, isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const agregarFecha = () => {
    if (!nuevaFecha || form.fechas_especiales.includes(nuevaFecha)) return;
    setForm(f => ({ ...f, fechas_especiales: [...f.fechas_especiales, nuevaFecha].sort() }));
    setNuevaFecha('');
  };

  const quitarFecha = (fecha) => setForm(f => ({
    ...f,
    fechas_especiales: f.fechas_especiales.filter(x => x !== fecha),
  }));

  const esPasada = (iso) => iso < hoyISO();

  // Un evento sin fechas sería una categoría común: lo exigimos.
  const faltanFechas = esEvento && form.fechas_especiales.length === 0;
  const sinFechasFuturas =
    form.fechas_especiales.length > 0 && form.fechas_especiales.every(esPasada);

  const intervalo = Number(form.intervalo_minutos) || 60;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit({
        nombre:      form.nombre,
        descripcion: form.descripcion,
        orden:       Number(form.orden) || 0,
        es_evento:   esEvento,
        ...(esEvento ? {
          fechas_especiales: form.fechas_especiales,
          intervalo_minutos: intervalo,
        } : {}),
      });
      onClose();
    } catch {
      // el error ya fue manejado por el caller con notify
    } finally {
      setLoading(false);
    }
  };

  const titulo = esEvento
    ? (isEdit ? 'Editar evento especial' : 'Nuevo evento especial')
    : (isEdit ? 'Editar categoría' : 'Nueva categoría');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {esEvento && (
          <p style={{
            fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
            padding: '10px 12px', borderRadius: '6px',
          }}>
            ◈ Un <strong>evento especial</strong> es una jornada que se hace solo ciertos días.
            Funciona como una categoría: acá definís las fechas y cada cuánto salen los turnos,
            y después le agregás adentro los servicios que se pueden reservar ese día
            (ej: “completa”, “solo piernas”).
          </p>
        )}

        <Input
          label={esEvento ? 'Nombre del evento' : 'Nombre de la categoría'}
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          required
          placeholder={esEvento ? 'Ej: Depilación láser' : 'Ej: Cosmetología'}
        />
        <Input
          label="Descripción"
          as="textarea"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Se muestra debajo del nombre en la reserva (opcional)..."
        />

        {esEvento && (
          <>
            {/* Fechas de la jornada */}
            <div>
              <label style={{
                display: 'block', fontSize: '12px', marginBottom: '4px',
                color: 'var(--text-secondary)', letterSpacing: '0.02em',
              }}>
                Fechas en las que se realiza <span style={{ color: 'var(--gold)' }}>*</span>
              </label>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
                Cargá una o varias. Valen para todos los servicios de adentro.
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
                          border: '1px solid var(--border)', background: 'var(--bg-hover)',
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

              {faltanFechas && (
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

            {/* Intervalo entre turnos */}
            <div>
              <Input
                label="Un turno cada (minutos)"
                type="number"
                min="5"
                max="240"
                step="5"
                value={form.intervalo_minutos}
                onChange={e => set('intervalo_minutos', e.target.value)}
                required
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px', lineHeight: 1.5 }}>
                Cada cuánto arranca un turno nuevo ese día. Los servicios comunes usan 60 minutos.
                Bajándolo entran más personas en la jornada.
                {intervalo >= 5 && intervalo <= 240 && (
                  <>
                    {' '}<strong style={{ color: 'var(--gold)' }}>
                      Con {intervalo} min, en una jornada de 8 horas entran {Math.floor(480 / intervalo)} turnos
                    </strong> (con 60 min entrarían 8).
                  </>
                )}
              </p>
            </div>
          </>
        )}

        <Input
          label="Orden"
          type="number"
          min="0"
          step="1"
          value={form.orden}
          onChange={e => set('orden', e.target.value)}
          placeholder="0"
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px' }}>
          Menor número = aparece primero en la página de reservas.
        </span>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading || faltanFechas}>
            {loading
              ? '...'
              : isEdit
                ? 'Guardar cambios'
                : esEvento ? 'Crear evento' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
