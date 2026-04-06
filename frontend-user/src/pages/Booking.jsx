import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCliente, createTurno, getEmpleados, getDisponibilidadSemanal } from '../services/api';
import '../styles/booking.css';


export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedServices = location.state?.selectedServices
    || (location.state?.selectedService ? [location.state.selectedService] : null);

  const [formData, setFormData] = useState({ nombre: '', telefono: '', email: '' });
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedServices || selectedServices.length === 0) navigate('/');
  }, [selectedServices, navigate]);

  useEffect(() => {
    getEmpleados()
      .then(r => setEmpleados((r.data || []).filter(e => e.activo !== false)))
      .catch(() => setEmpleados([]))
      .finally(() => setLoadingEmpleados(false));
  }, []);

  useEffect(() => {
    if (!selectedEmpleado || !selectedDate) {
      setAvailableSlots([]);
      setSelectedTime('');
      return;
    }
    setLoadingSlots(true);
    setSelectedTime('');
    getDisponibilidadSemanal(selectedEmpleado.id, selectedDate)
      .then(r => setAvailableSlots(r.data?.[selectedDate] || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedEmpleado, selectedDate]);

  if (!selectedServices || selectedServices.length === 0) return null;

  const totalPrecio = selectedServices.reduce((sum, s) => sum + Number(s.precio), 0);
  const totalDuracion = selectedServices.reduce((sum, s) => sum + s.duracion_minutos, 0);

  const isSlotPast = (fechaHoraISO) => new Date(fechaHoraISO) <= new Date();

  const handleEmpleadoSelect = (emp) => {
    setSelectedEmpleado(emp);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setAvailableSlots([]);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpleado) {
      setError('Por favor elegí un profesional.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError('Por favor seleccioná una fecha y horario.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const clienteResponse = await createCliente({
        nombre: formData.nombre,
        telefono: formData.telefono || null,
        email: formData.email || null,
      });
      const clienteId = clienteResponse.data.id;

      // Enviar como string naive (hora Argentina) sin convertir a UTC.
      // El backend recibe un datetime sin timezone y lo guarda tal cual.
      const fechaHoraISO = `${selectedDate}T${selectedTime}:00`;

      const turnoData = {
        fecha_hora: fechaHoraISO,
        duracion: totalDuracion,
        estado: 'pendiente',
        observaciones: '',
        cliente_id: clienteId,
        empleado_id: selectedEmpleado.id,
        servicios_ids: selectedServices.map(s => s.id),
      };

      const turnoResponse = await createTurno(turnoData);
      navigate('/confirmation', { state: { turno: turnoResponse.data } });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        err.message;
      setError(`Error al reservar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const formattedSelectedDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;

  const slotHintStart = availableSlots[0]?.hora;
  const slotHintEnd = availableSlots[availableSlots.length - 1]?.hora;

  return (
    <div className="booking-page">
      <div className="booking-wrap">
        <span className="booking-tag">Reserva de turno</span>
        <h1 className="booking-title">Completá<br />tus datos</h1>

        <div className="services-summary">
          {selectedServices.map(s => (
            <div key={s.id} className="summary-row">
              <span className="summary-name">
                {s.nombre}
                <span className="summary-duration">{s.duracion_minutos} min</span>
              </span>
              <span className="summary-price">${s.precio}</span>
            </div>
          ))}
          {selectedServices.length > 1 && (
            <div className="summary-row total">
              <span className="summary-total-label">Total · {totalDuracion} min</span>
              <span className="summary-total-amount">${totalPrecio}</span>
            </div>
          )}
        </div>

        {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form className="form" onSubmit={handleSubmit}>

          <div className="field">
            <label className="field-label">Nombre completo <span className="field-req">*</span></label>
            <input className="field-input" type="text" name="nombre" value={formData.nombre}
              onChange={handleChange} placeholder="Tu nombre y apellido" required />
          </div>

          <div className="form-row">
            <div className="field">
              <label className="field-label">Teléfono</label>
              <input className="field-input" type="tel" name="telefono" value={formData.telefono}
                onChange={handleChange} placeholder="2235000000" />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="tu@email.com" />
            </div>
          </div>

          {/* ── Selector de profesional ── */}
          <div className="field">
            <label className="field-label">Profesional <span className="field-req">*</span></label>
            {loadingEmpleados ? (
              <span className="slots-placeholder" style={{ padding: '1rem 0', textAlign: 'left' }}>
                Cargando profesionales...
              </span>
            ) : empleados.length === 0 ? (
              <span className="slots-placeholder" style={{ padding: '1rem 0', textAlign: 'left' }}>
                No hay profesionales disponibles
              </span>
            ) : (
              <div className="empleado-grid">
                {empleados.map(emp => (
                  <button
                    key={emp.id}
                    type="button"
                    className={`empleado-card${selectedEmpleado?.id === emp.id ? ' ec-selected' : ''}`}
                    onClick={() => handleEmpleadoSelect(emp)}
                  >
                    <span className="ec-nombre">{emp.nombre}</span>
                    {emp.especialidad && (
                      <span className="ec-especialidad">{emp.especialidad}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Fecha ── */}
          <div className="field">
            <label className="field-label">Fecha <span className="field-req">*</span></label>
            {!selectedEmpleado ? (
              <span className="field-hint" style={{ padding: '0.6rem 0' }}>
                Elegí un profesional primero
              </span>
            ) : (
              <div className="day-strip">
                {Array.from({ length: 30 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  // Usar fecha LOCAL, no UTC (toISOString daría fecha UTC que puede diferir)
                  const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
                  const dayNum  = d.getDate();
                  const monthStr = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
                  const isSelected = selectedDate === iso;
                  const isToday = i === 0;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`day-pill${isSelected ? ' dp-selected' : ''}${isToday ? ' dp-today' : ''}`}
                      onClick={() => handleDateChange(iso)}
                    >
                      <span className="dp-weekday">{dayName}</span>
                      <span className="dp-num">{dayNum}</span>
                      <span className="dp-month">{monthStr}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Horarios ── */}
          <div className="time-section">
            <div className="time-section-header">
              <label className="field-label">
                Horario <span className="field-req">*</span>
              </label>
              {selectedDate && !loadingSlots && slotHintStart && (
                <span className="time-slot-hint">{slotHintStart} — {slotHintEnd}</span>
              )}
            </div>

            <div className={`time-grid ${selectedDate && !loadingSlots ? 'loaded' : ''}`}>
              {(!selectedEmpleado || !selectedDate) && (
                <span className="slots-placeholder">
                  {!selectedEmpleado ? 'Elegí un profesional primero' : 'Seleccioná una fecha primero'}
                </span>
              )}
              {selectedEmpleado && selectedDate && loadingSlots && (
                <span className="slots-loading">Consultando disponibilidad...</span>
              )}
              {selectedEmpleado && selectedDate && !loadingSlots && availableSlots.length === 0 && (
                <span className="slots-placeholder">Sin horarios disponibles para este día</span>
              )}
              {selectedEmpleado && selectedDate && !loadingSlots && availableSlots.map(slot => {
                const occupied = !slot.disponible;
                const past = isSlotPast(slot.fecha_hora);
                const isSelected = selectedTime === slot.hora;
                const disabled = occupied || past;

                let className = 'time-slot';
                if (isSelected) className += ' ts-selected';
                else if (occupied) className += ' ts-occupied';
                else if (past) className += ' ts-past';

                return (
                  <button
                    key={slot.hora}
                    type="button"
                    className={className}
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedTime(slot.hora)}
                    title={occupied ? 'Horario ocupado' : past ? 'Horario pasado' : `Reservar a las ${slot.hora}`}
                  >
                    <span className="time-slot-label">{slot.hora}</span>
                    {occupied && <span className="time-slot-sublabel">Ocupado</span>}
                  </button>
                );
              })}
            </div>

            {selectedDate && !loadingSlots && availableSlots.length > 0 && (
              <div className="time-legend">
                <span className="legend-item">
                  <span className="legend-dot ld-available" />
                  Disponible
                </span>
                <span className="legend-item">
                  <span className="legend-dot ld-selected" />
                  Seleccionado
                </span>
                <span className="legend-item">
                  <span className="legend-dot ld-occupied" />
                  Ocupado
                </span>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="selected-time-display">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#c6bfb6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formattedSelectedDate} a las {selectedTime} hs · {selectedEmpleado?.nombre}
              </div>
            )}
          </div>

          <button
            className="submit-btn"
            type="submit"
            disabled={loading || !selectedEmpleado || !selectedDate || !selectedTime}
          >
            {loading ? 'Procesando...' : 'Confirmar turno'}
          </button>
        </form>
      </div>
    </div>
  );
}
