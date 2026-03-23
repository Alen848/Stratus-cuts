import { useState, useEffect, useMemo } from 'react';
import Modal  from '../ui/Modal';
import Input  from '../ui/Input';
import Button from '../ui/Button';
import { pagos as pagosApi } from '../../api/api';

const ESTADOS = ['pendiente', 'confirmado', 'completado', 'cancelado'];
const METODOS = ['efectivo', 'débito', 'transferencia'];

const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 10; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

const TODAY = new Date().toISOString().split('T')[0];

function toLocalDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function turnoLocalDate(fechaHora) {
  if (!fechaHora) return '';
  const str = fechaHora.includes('T') ? fechaHora : fechaHora.replace(' ', 'T');
  const hasOffset = str.includes('+') || /[-+]\d{2}:\d{2}$/.test(str) || str.endsWith('Z');
  const d = hasOffset ? new Date(str) : new Date(str.replace('T', ' '));
  return toLocalDateStr(d);
}

// ── Toggle modo ───────────────────────────────────────────────────────────────
function ModoToggle({ modo, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: '3px', gap: '2px',
    }}>
      {[['cliente', 'Con cliente'], ['walkin', 'Sin reserva (walk-in)']].map(([val, label]) => (
        <button key={val} type="button" onClick={() => onChange(val)} style={{
          flex: 1, padding: '7px 0', fontSize: '12px', fontFamily: 'var(--font-body)',
          fontWeight: modo === val ? 600 : 400, cursor: 'pointer',
          borderRadius: 'var(--radius-sm)', border: 'none', transition: 'all 0.15s',
          background: modo === val ? 'var(--bg-surface)' : 'transparent',
          color:      modo === val ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow:  modo === val ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
        }}>{label}</button>
      ))}
    </div>
  );
}

// ── Grilla de slots ───────────────────────────────────────────────────────────
function SlotGrid({ selectedDate, selectedTime, onSelect, turnosDelDia, duracionTotal, turnoEditandoId }) {
  if (!selectedDate) {
    return (
      <div style={{
        padding: '20px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-sm)', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: '12px',
      }}>
        Seleccioná una fecha primero
      </div>
    );
  }

  const isOccupied = (slotTime) => {
    const slotStart = new Date(`${selectedDate}T${slotTime}:00`);
    const slotEnd   = new Date(slotStart.getTime() + duracionTotal * 60 * 1000);
    return turnosDelDia.some(t => {
      if (t.estado === 'cancelado') return false;
      if (turnoEditandoId && t.id === turnoEditandoId) return false;
      const str = t.fecha_hora.includes('T') ? t.fecha_hora : t.fecha_hora.replace(' ', 'T');
      const tStart = new Date(str);
      const tEnd   = new Date(tStart.getTime() + (t.duracion || 30) * 60 * 1000);
      return slotStart < tEnd && slotEnd > tStart;
    });
  };

  const isPast = (slotTime) => {
    if (selectedDate > TODAY) return false;
    if (selectedDate < TODAY) return true;
    return new Date(`${selectedDate}T${slotTime}:00`) <= new Date();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
        {TIME_SLOTS.map(slot => {
          const occupied = isOccupied(slot);
          const past     = isPast(slot);
          const selected = selectedTime === slot;
          const disabled = occupied || past;

          return (
            <button key={slot} type="button" disabled={disabled}
              onClick={() => !disabled && onSelect(slot)}
              style={{
                padding: '6px 2px', fontSize: '11px', fontFamily: 'var(--font-body)',
                fontWeight: selected ? 600 : 400, textAlign: 'center',
                borderRadius: 'var(--radius-sm)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s',
                border: selected
                  ? '1px solid var(--gold)'
                  : occupied
                    ? '1px solid transparent'
                    : '1px solid var(--border-strong)',
                background: selected
                  ? 'var(--gold-dim)'
                  : occupied
                    ? 'rgba(229,62,62,0.1)'
                    : 'var(--bg-elevated)',
                color: selected
                  ? 'var(--gold)'
                  : occupied
                    ? '#e53e3e'
                    : past
                      ? 'var(--text-muted)'
                      : 'var(--text-secondary)',
                opacity: past && !selected ? 0.3 : 1,
              }}
              title={occupied ? 'Ocupado' : past ? 'Hora pasada' : `Reservar a las ${slot}`}
            >
              {slot}
            </button>
          );
        })}
      </div>
      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          ['var(--text-secondary)', 'Libre'],
          ['var(--gold)',           'Selec.'],
          ['#e53e3e',               'Ocupado'],
        ].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: 1, background: color, display: 'inline-block', opacity: 0.8 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function TurnoModal({
  isOpen, onClose, onSubmit, onPagoRegistrado,
  clientes = [], empleados = [], servicios = [],
  turnos = [],
  turno = null,
}) {
  const [modo, setModo] = useState('cliente');
  const [form, setForm] = useState({
    selectedDate: '', selectedTime: '',
    empleado_id: '', cliente_id: '',
    servicios_ids: [],
    estado: 'confirmado', metodo_pago: 'efectivo',
    observaciones: '',
    walkin_telefono: '', walkin_monto: '',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(turno);

  const duracionTotal = useMemo(() =>
    servicios.filter(s => form.servicios_ids.includes(s.id))
      .reduce((acc, s) => acc + (s.duracion_minutos || 30), 0) || 30,
    [form.servicios_ids, servicios]
  );

  const turnosDelDia = useMemo(() => {
    if (!form.selectedDate) return [];
    const delDia = turnos.filter(t => turnoLocalDate(t.fecha_hora) === form.selectedDate);
    // Filtrar por empleado si ya está seleccionado, para que el slot grid refleje
    // solo los turnos del profesional elegido y no los de otros
    return form.empleado_id
      ? delDia.filter(t => t.empleado_id === Number(form.empleado_id))
      : delDia;
  }, [turnos, form.selectedDate, form.empleado_id]);

  useEffect(() => {
    if (!isOpen) return;
    if (turno) {
      const raw = turno.fecha_hora?.split('+')[0] || '';
      const [datePart, timePart] = raw.split('T');
      setModo(Boolean(turno.cliente_id || turno.cliente) ? 'cliente' : 'walkin');
      setForm({
        selectedDate: datePart || '',
        selectedTime: timePart ? timePart.slice(0, 5) : '',
        empleado_id:  turno.empleado_id || '',
        cliente_id:   turno.cliente_id  || '',
        servicios_ids: turno.servicios?.map(s => s.servicio_id || s.servicio?.id).filter(Boolean) || [],
        estado:       turno.estado       || 'confirmado',
        metodo_pago:  turno.metodo_pago  || 'efectivo',
        observaciones: turno.observaciones || '',
        walkin_telefono: turno.cliente?.telefono || '',
        walkin_monto: '',
      });
    } else {
      setModo('cliente');
      setForm({
        selectedDate: '', selectedTime: '',
        empleado_id: '', cliente_id: '',
        servicios_ids: [],
        estado: 'confirmado', metodo_pago: 'efectivo',
        observaciones: '',
        walkin_telefono: '', walkin_monto: '',
      });
    }
  }, [turno, isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleServicio = (id) =>
    set('servicios_ids', form.servicios_ids.includes(id)
      ? form.servicios_ids.filter(x => x !== id)
      : [...form.servicios_ids, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.selectedDate || !form.selectedTime) return alert('Seleccioná fecha y horario');
    if (!form.empleado_id)                         return alert('Seleccioná un profesional');
    if (form.servicios_ids.length === 0)           return alert('Seleccioná al menos un servicio');
    if (modo === 'cliente' && !form.cliente_id)    return alert('Seleccioná un cliente o usá modo walk-in');

    try {
      setLoading(true);

      let observaciones = form.observaciones || null;
      if (modo === 'walkin') {
        const extras = [];
        if (form.walkin_telefono) extras.push(`Tel: ${form.walkin_telefono}`);
        if (form.walkin_monto)    extras.push(`Monto: $${form.walkin_monto}`);
        if (extras.length) observaciones = [form.observaciones, ...extras].filter(Boolean).join(' | ');
      }

      const payload = {
        fecha_hora:    `${form.selectedDate}T${form.selectedTime}:00`,
        empleado_id:   Number(form.empleado_id),
        servicios_ids: form.servicios_ids.map(Number),
        duracion:      duracionTotal,
        estado:        form.estado,
        metodo_pago:   form.metodo_pago || null,
        observaciones,
        cliente_id:    modo === 'cliente' ? Number(form.cliente_id) : null,
      };

      const turnoResultado = await onSubmit(payload);

      // Walk-in con monto → registrar pago en caja
      if (modo === 'walkin' && form.walkin_monto && parseFloat(form.walkin_monto) > 0 && turnoResultado?.id) {
        try {
          await pagosApi.create({
            turno_id:      turnoResultado.id,
            monto:         parseFloat(form.walkin_monto),
            metodo_pago:   form.metodo_pago || 'efectivo',
            observaciones: 'Cobro automático walk-in',
          });
          if (onPagoRegistrado) onPagoRegistrado();
        } catch (err) {
          console.error('Error al registrar pago walk-in:', err);
          // El turno ya se creó, no se bloquea el flujo
        }
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Turno' : 'Nuevo Turno'} width={680}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {!isEdit && <ModoToggle modo={modo} onChange={(m) => {
          setModo(m);
          set('cliente_id', '');
          set('walkin_monto', '');
          set('walkin_telefono', '');
        }} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* ── Izquierda ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <Input label="Profesional" as="select" value={form.empleado_id}
              onChange={e => set('empleado_id', e.target.value)} required>
              <option value="">Seleccionar...</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Input>

            {modo === 'cliente' && (
              <Input label="Cliente" as="select" value={form.cliente_id}
                onChange={e => set('cliente_id', e.target.value)} required>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}
              </Input>
            )}

            {modo === 'walkin' && (
              <div style={{
                padding: '12px', background: 'var(--bg-elevated)',
                border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-sm)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Walk-in
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelSt}>
                      Teléfono <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>(para recordatorios)</span>
                    </label>
                    <input type="tel" value={form.walkin_telefono}
                      onChange={e => set('walkin_telefono', e.target.value)}
                      placeholder="2231234567" style={inputSt} />
                  </div>
                  <div>
                    <label style={labelSt}>
                      Monto ($) <span style={{ color: 'var(--gold)', fontSize: '10px' }}>→ registra en caja</span>
                    </label>
                    <input type="number" min="0" step="0.01" value={form.walkin_monto}
                      onChange={e => set('walkin_monto', e.target.value)}
                      placeholder="0.00" style={inputSt} />
                  </div>
                </div>
              </div>
            )}

            {/* Servicios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Servicios · {duracionTotal} min
              </label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '4px', maxHeight: '100px', overflowY: 'auto',
              }}>
                {servicios.map(s => {
                  const sel = form.servicios_ids.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleServicio(s.id)} style={{
                      padding: '3px 9px', borderRadius: '99px', fontSize: '11px', cursor: 'pointer',
                      border:     `1px solid ${sel ? 'var(--gold)' : 'var(--border)'}`,
                      background: sel ? 'var(--gold-dim)' : 'transparent',
                      color:      sel ? 'var(--gold)'     : 'var(--text-muted)',
                    }}>
                      {s.nombre} ({s.duracion_minutos || 30}')
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Estado" as="select" value={form.estado} onChange={e => set('estado', e.target.value)}>
                {ESTADOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </Input>
              <Input label="Método de pago" as="select" value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
                {METODOS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </Input>
            </div>

            <Input label="Observaciones" as="textarea" value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)} rows={2} />
          </div>

          {/* ── Derecha: fecha + slots ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ ...labelSt, display: 'block', marginBottom: '6px' }}>Fecha</label>
              <input type="date" value={form.selectedDate} min={TODAY}
                onChange={e => { set('selectedDate', e.target.value); set('selectedTime', ''); }}
                style={{ ...inputSt, width: '100%' }} required />
            </div>

            <div>
              <label style={{ ...labelSt, display: 'block', marginBottom: '6px' }}>
                Horario
                {form.selectedTime && (
                  <span style={{ marginLeft: '8px', color: 'var(--gold)', fontWeight: 600 }}>
                    · {form.selectedTime} hs
                  </span>
                )}
              </label>
              <SlotGrid
                selectedDate={form.selectedDate}
                selectedTime={form.selectedTime}
                onSelect={(t) => set('selectedTime', t)}
                turnosDelDia={turnosDelDia}
                duracionTotal={duracionTotal}
                turnoEditandoId={turno?.id}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Reservar Turno'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const inputSt = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)',
  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
  fontSize: '13px', fontFamily: 'var(--font-body)', colorScheme: 'dark',
};
const labelSt = { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 };