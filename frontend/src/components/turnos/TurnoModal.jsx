import { useState, useEffect, useMemo, useRef } from 'react';
import Modal  from '../ui/Modal';
import Input  from '../ui/Input';
import Button from '../ui/Button';
import { pagos as pagosApi, horariosSalon as horariosSalonApi } from '../../api/api';

const ESTADOS = ['pendiente', 'confirmado', 'completado', 'cancelado'];
const METODOS = ['efectivo', 'débito', 'transferencia'];

// Fallback: slots de 09:00 a 20:00 cuando no hay config de salón
const FALLBACK_TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 9; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();


function buildSlotsFromHorario(horario) {
  if (!horario || !horario.activo) return [];
  const [hA, mA] = horario.hora_apertura.slice(0, 5).split(':').map(Number);
  const [hC, mC] = horario.hora_cierre.slice(0, 5).split(':').map(Number);
  const slots = [];
  let totalMin = hA * 60 + mA;
  const endMin  = hC * 60 + mC;
  while (totalMin < endMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMin += 30;
  }
  return slots;
}

// Usar fecha LOCAL, no UTC (evita que después de las 21hs ARG los slots de hoy se marquen como pasados)
const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;

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

// ── Combobox de clientes ──────────────────────────────────────────────────────
function ClienteCombobox({ clientes, value, onChange }) {
  const [query, setQuery]     = useState('');
  const [open,  setOpen]      = useState(false);
  const wrapperRef            = useRef(null);

  // Sincronizar input al valor seleccionado externo (ej: al editar turno)
  useEffect(() => {
    if (value) {
      const c = clientes.find(c => c.id === Number(value));
      if (c) setQuery(`${c.nombre} ${c.apellido || ''}`.trim());
    } else {
      setQuery('');
    }
  }, [value, clientes]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return clientes.slice(0, 50);
    const q = query.toLowerCase();
    return clientes
      .filter(c => `${c.nombre} ${c.apellido || ''}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, clientes]);

  const handleSelect = (c) => {
    setQuery(`${c.nombre} ${c.apellido || ''}`.trim());
    onChange(c.id);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange('');   // limpiar selección al escribir
    setOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={{ ...labelSt, display: 'block', marginBottom: '6px' }}>Cliente</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por nombre o apellido..."
          autoComplete="off"
          style={{ ...inputSt, paddingRight: '28px' }}
        />
        {query && (
          <button type="button" onClick={handleClear} style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1, padding: 0,
          }}>×</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          maxHeight: '180px', overflowY: 'auto',
        }}>
          {filtered.map(c => (
            <button key={c.id} type="button" onMouseDown={() => handleSelect(c)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 12px', background: 'none', border: 'none',
              color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              borderBottom: '1px solid var(--border)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {c.nombre} {c.apellido || ''}
              {c.telefono && (
                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {c.telefono}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          color: 'var(--text-muted)', fontSize: '12px',
        }}>
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}

// ── Toggle modo ───────────────────────────────────────────────────────────────
function ModoToggle({ modo, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: '3px', gap: '2px',
    }}>
      {[['cliente', 'Con cliente'], ['walkin', 'Cliente sin turno']].map(([val, label]) => (
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
// ignorarOcupados=true para walk-in: puede coincidir con turnos ya existentes
// y puede seleccionar horas pasadas (para registrar clientes que ya pasaron).
// En ambos modos se respetan los horarios del salón (diaCerrado y slotsProp).
function SlotGrid({ selectedDate, selectedTime, onSelect, turnosDelDia, duracionTotal, turnoEditandoId, ignorarOcupados = false, diaCerrado = false, slots: slotsProp }) {
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

  if (diaCerrado) {
    return (
      <div style={{
        padding: '20px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-sm)', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: '12px',
      }}>
        El salón está cerrado ese día
      </div>
    );
  }

  const slots = slotsProp || FALLBACK_TIME_SLOTS;

  const isOccupied = (slotTime) => {
    if (ignorarOcupados) return false;
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
    if (ignorarOcupados) return false; // walk-in puede registrar horas pasadas
    if (selectedDate > TODAY) return false;
    if (selectedDate < TODAY) return true;
    return new Date(`${selectedDate}T${slotTime}:00`) <= new Date();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
        {slots.map(slot => {
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
  const [loading, setLoading]         = useState(false);
  const [validError, setValidError]   = useState('');
  const [horariosSalon, setHorariosSalon] = useState([]);
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

  // Horario del salón para el día seleccionado (0=Lun … 6=Dom via weekday())
  const { slotsDelDia, diaCerrado } = useMemo(() => {
    if (!form.selectedDate) return { slotsDelDia: FALLBACK_TIME_SLOTS, diaCerrado: false };
    const d = new Date(form.selectedDate + 'T00:00:00');
    // JS getDay(): 0=Dom,1=Lun...6=Sab  →  weekday(): 0=Lun...6=Dom
    const weekday = (d.getDay() + 6) % 7;
    const horario = horariosSalon.find(h => h.dia_semana === weekday);
    if (!horario) return { slotsDelDia: FALLBACK_TIME_SLOTS, diaCerrado: false };
    if (!horario.activo) return { slotsDelDia: [], diaCerrado: true };
    return { slotsDelDia: buildSlotsFromHorario(horario), diaCerrado: false };
  }, [form.selectedDate, horariosSalon]);

  // Cargar horarios del salón una sola vez cuando se abre el modal
  useEffect(() => {
    if (!isOpen || horariosSalon.length > 0) return;
    horariosSalonApi.getAll()
      .then(res => setHorariosSalon(res.data || []))
      .catch(() => {});
  }, [isOpen]);

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
    setValidError('');
    if (!form.selectedDate || !form.selectedTime) { setValidError('Seleccioná fecha y horario'); return; }
    if (!form.empleado_id)                         { setValidError('Seleccioná un profesional'); return; }
    if (form.servicios_ids.length === 0)           { setValidError('Seleccioná al menos un servicio'); return; }
    if (modo === 'cliente' && !form.cliente_id)    { setValidError('Seleccioná un cliente o usá el modo "Cliente sin turno"'); return; }

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
              <ClienteCombobox
                clientes={clientes}
                value={form.cliente_id}
                onChange={(id) => set('cliente_id', id)}
              />
            )}

            {modo === 'walkin' && (
              <div style={{
                padding: '12px', background: 'var(--bg-elevated)',
                border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-sm)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Cliente sin turno
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
              <input type="date" value={form.selectedDate}
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
                ignorarOcupados={modo === 'walkin'}
                diaCerrado={diaCerrado}
                slots={slotsDelDia}
              />
            </div>
          </div>
        </div>

        {validError && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)',
            color: '#e53e3e', fontSize: '12px',
          }}>
            {validError}
          </div>
        )}
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