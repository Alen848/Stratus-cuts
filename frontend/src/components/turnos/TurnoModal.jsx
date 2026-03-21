import { useState, useEffect, useMemo } from 'react';
import Modal  from '../ui/Modal';
import Input  from '../ui/Input';
import Button from '../ui/Button';
import TableroSemanal from './TableroSemanal';

const ESTADOS  = ['pendiente', 'confirmado', 'completado', 'cancelado'];
const METODOS  = ['efectivo', 'débito', 'transferencia'];

export default function TurnoModal({
  isOpen, onClose, onSubmit,
  clientes = [], empleados = [], servicios = [], turno = null,
}) {
  const [form, setForm] = useState({
    fecha_hora:    '',
    empleado_id:   '',
    cliente_id:    '',
    servicios_ids: [],
    estado:        'pendiente',
    metodo_pago:   'efectivo',
    observaciones: '',
  });
  
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(turno);

  // Fecha inicio para el tablero (lunes de la semana actual)
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().slice(0, 10);
  };

  const [fechaInicioTablero, setFechaInicioTablero] = useState(getMonday(new Date()));

  // Calcular duración total según servicios seleccionados
  const duracionTotal = useMemo(() => {
    return servicios
      .filter(s => form.servicios_ids.includes(s.id))
      .reduce((acc, s) => acc + (s.duracion_minutos || 30), 0) || 30;
  }, [form.servicios_ids, servicios]);

  useEffect(() => {
    if (isOpen) {
      if (turno) {
        const fh = turno.fecha_hora?.split('+')[0];
        setForm({
          fecha_hora:    fh,
          empleado_id:   turno.empleado_id   || '',
          cliente_id:    turno.cliente_id    || '',
          servicios_ids: turno.servicios?.map(s => s.servicio_id || s.servicio?.id).filter(Boolean) || [],
          estado:        turno.estado        || 'pendiente',
          metodo_pago:   turno.metodo_pago   || 'efectivo',
          observaciones: turno.observaciones || '',
        });
        if (fh) setFechaInicioTablero(getMonday(new Date(fh)));
      } else {
        setForm({
          fecha_hora:    '',
          empleado_id:   '',
          cliente_id:    '',
          servicios_ids: [],
          estado:        'pendiente',
          metodo_pago:   'efectivo',
          observaciones: '',
        });
      }
    }
  }, [turno, isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fecha_hora || !form.empleado_id || !form.cliente_id || form.servicios_ids.length === 0) {
      alert("Por favor selecciona cliente, profesional, servicios y un horario válido");
      return;
    }
    try {
      setLoading(true);
      
      if (!form.fecha_hora) {
        alert("Por favor selecciona un horario en el tablero");
        setLoading(false);
        return;
      }
      
      // El tablero ya devuelve un formato ISO string como "2026-03-21T10:00:00"
      // Simplemente nos aseguramos de que sea un string y el backend se encargará del resto
      let finalFecha = form.fecha_hora;

      await onSubmit({
        ...form,
        fecha_hora:    finalFecha,
        empleado_id:   Number(form.empleado_id),
        cliente_id:    Number(form.cliente_id),
        servicios_ids: form.servicios_ids.map(Number),
        duracion:      duracionTotal,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Turno' : 'Nuevo Turno'} width={750}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
          {/* Lado Izquierdo: Datos básicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Servicios (Duración total: {duracionTotal} min)
              </label>
              <div style={{ 
                display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', 
                background: 'var(--bg-elevated)', borderRadius: '4px', border: '1px solid var(--border)',
                maxHeight: '120px', overflowY: 'auto'
              }}>
                {servicios.map(s => (
                  <button key={s.id} type="button" 
                    onClick={() => set('servicios_ids', form.servicios_ids.includes(s.id) ? form.servicios_ids.filter(id => id !== s.id) : [...form.servicios_ids, s.id])}
                    style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: '11px', cursor: 'pointer',
                      border: '1px solid ' + (form.servicios_ids.includes(s.id) ? 'var(--gold)' : 'var(--border)'),
                      background: form.servicios_ids.includes(s.id) ? 'var(--gold-dim)' : 'transparent',
                      color: form.servicios_ids.includes(s.id) ? 'var(--gold)' : 'var(--text-muted)'
                    }}>{s.nombre} ({s.duracion_minutos || 30}')</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Estado" as="select" value={form.estado}
                onChange={e => set('estado', e.target.value)}>
                {ESTADOS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </Input>
              <Input label="Método de pago" as="select" value={form.metodo_pago}
                onChange={e => set('metodo_pago', e.target.value)}>
                {METODOS.map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </Input>
            </div>
            
            <Input label="Observaciones" as="textarea" value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)} rows={2} />
          </div>

          {/* Lado Derecho: Tablero Semanal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Disponibilidad (Semana del {fechaInicioTablero})
            </label>
            {form.empleado_id ? (
              <>
                <TableroSemanal 
                  empleadoId={form.empleado_id} 
                  fechaInicio={fechaInicioTablero}
                  selectedSlot={form.fecha_hora}
                  duracion={duracionTotal}
                  onSelectSlot={(fh) => set('fecha_hora', fh)}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
                  <Button size="sm" variant="ghost" type="button" onClick={() => {
                    const d = new Date(fechaInicioTablero + 'T00:00:00');
                    d.setDate(d.getDate() - 7);
                    setFechaInicioTablero(d.toISOString().slice(0, 10));
                  }}>«</Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => {
                    const d = new Date(fechaInicioTablero + 'T00:00:00');
                    d.setDate(d.getDate() + 7);
                    setFechaInicioTablero(d.toISOString().slice(0, 10));
                  }}>»</Button>
                </div>
              </>
            ) : (
              <div style={{ 
                height: '350px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px'
              }}>
                Seleccioná un profesional para ver disponibilidad
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Reservar Turno'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
