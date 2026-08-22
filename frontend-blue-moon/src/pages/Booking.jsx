import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCliente, createTurno, getEmpleados, getServicios, getCategorias, getDisponibilidadSemanal, getPagoConfig } from '../services/api';
import { money } from '../utils/format';
import { trackEvent } from '../utils/pixel';
import '../styles/booking.css';


export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const preSelected = location.state?.selectedServices
    || (location.state?.selectedService ? [location.state.selectedService] : []);

  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [selectedServices, setSelectedServices] = useState(preSelected);
  // Categoría desplegada en el acordeón (null = ninguna)
  const [openCategoria, setOpenCategoria] = useState(null);

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

  // Seña / Mercado Pago
  const [pagoConfig, setPagoConfig] = useState({ habilitado: false, sena_porcentaje: 0, sena_obligatoria: false });
  const [metodoPago, setMetodoPago] = useState('sena');        // 'sena' | 'local' (solo si la seña es opcional)
  const [metodoSena, setMetodoSena] = useState('tarjeta');     // 'tarjeta' | 'transferencia'

  useEffect(() => {
    getPagoConfig()
      .then(r => {
        const cfg = r.data || { habilitado: false };
        setPagoConfig(cfg);
        // Método de seña por defecto: tarjeta si hay MP, si no transferencia.
        if (cfg.mp_habilitado) setMetodoSena('tarjeta');
        else if (cfg.transferencia_habilitada) setMetodoSena('transferencia');
      })
      .catch(() => setPagoConfig({ habilitado: false, sena_porcentaje: 0, sena_obligatoria: false }));
  }, []);

  useEffect(() => {
    Promise.all([
      getServicios().then(r => r.data || []).catch(() => []),
      getCategorias().then(r => r.data || []).catch(() => []),
    ])
      .then(([servs, cats]) => { setServicios(servs); setCategorias(cats); })
      .finally(() => setLoadingServicios(false));
  }, []);

  useEffect(() => {
    getEmpleados()
      .then(r => setEmpleados((r.data || []).filter(e => e.activo !== false)))
      .catch(() => setEmpleados([]))
      .finally(() => setLoadingEmpleados(false));
  }, []);

  const totalPrecio   = selectedServices.reduce((sum, s) => sum + Number(s.precio), 0);
  const totalDuracion = selectedServices.reduce((sum, s) => sum + s.duracion_minutos, 0);

  const hoyISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // ── Eventos especiales ─────────────────────────────────────────────────────
  // Un evento es una categoría marcada como tal: se hace solo ciertos días y sus
  // servicios son las variantes que se pueden reservar esa jornada. Las fechas y
  // el intervalo entre turnos son de la categoría, no de cada variante.
  const catsEvento = categorias.filter(
    c => c.es_evento && (c.fechas_especiales || []).some(f => f >= hoyISO)
  );

  const gruposEvento = catsEvento
    .map(cat => ({ categoria: cat, items: servicios.filter(s => s.categoria_id === cat.id) }))
    .filter(g => g.items.length > 0);

  const idsCategoriaEvento = new Set(categorias.filter(c => c.es_evento).map(c => c.id));
  const esServicioDeEvento = (s) => idsCategoriaEvento.has(s.categoria_id);

  // Categorías de evento a las que pertenece lo que el cliente ya eligió
  const catsEventoElegidas = catsEvento.filter(
    c => selectedServices.some(s => s.categoria_id === c.id)
  );

  // Con dos eventos distintos elegidos, solo sirven los días que comparten
  const fechasEvento = catsEventoElegidas.length === 0
    ? null
    : catsEventoElegidas
        .map(c => c.fechas_especiales)
        .reduce((comunes, fechas) => comunes.filter(f => fechas.includes(f)))
        .filter(f => f >= hoyISO)
        .sort();

  const hayEventoElegido    = fechasEvento !== null;
  const sinFechasCompatibles = hayEventoElegido && fechasEvento.length === 0;

  useEffect(() => {
    if (!selectedEmpleado || !selectedDate) {
      setAvailableSlots([]);
      setSelectedTime('');
      return;
    }
    setLoadingSlots(true);
    setSelectedTime('');
    // La disponibilidad depende de la duración total de los servicios elegidos:
    // un horario solo está libre si entra el servicio completo sin pisar otro turno.
    // Además mandamos un servicio para que el backend sepa el intervalo de la
    // grilla: en un evento los turnos pueden salir cada 20 min y no cada hora.
    getDisponibilidadSemanal(
      selectedEmpleado.id, selectedDate, totalDuracion, selectedServices[0]?.id
    )
      .then(r => setAvailableSlots(r.data?.[selectedDate] || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpleado, selectedDate, totalDuracion, selectedServices]);

  const toggleServicio = (service) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  // El resto se muestra agrupado: primero la categoría (sin precio) y,
  // al desplegarla, los servicios concretos con su precio y duración.
  const serviciosNormales = servicios.filter(s => !esServicioDeEvento(s));

  const gruposServicios = categorias
    .filter(cat => !cat.es_evento)
    .map(cat => ({ categoria: cat, items: serviciosNormales.filter(s => s.categoria_id === cat.id) }))
    .filter(g => g.items.length > 0);

  const categoriaIdsConItems = new Set(gruposServicios.map(g => g.categoria.id));
  // Servicios sin categoría (o con una categoría que ya no existe): se muestran sueltos
  const serviciosSueltos = serviciosNormales.filter(
    s => !s.categoria_id || !categoriaIdsConItems.has(s.categoria_id)
  );

  // Si llegamos con un servicio preseleccionado, abrimos su categoría
  useEffect(() => {
    if (openCategoria !== null || preSelected.length === 0) return;
    const conCategoria = preSelected.find(s => s.categoria_id);
    if (conCategoria) setOpenCategoria(conCategoria.categoria_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorias]);

  // Solo mostramos los profesionales que realizan TODOS los servicios elegidos.
  // Un empleado sin servicios asignados (servicio_ids vacío) hace todos.
  const selectedServiceIds = selectedServices.map(s => s.id);
  const puedeRealizar = (emp) => {
    const ids = emp.servicio_ids || [];
    if (ids.length === 0) return true;
    return selectedServiceIds.every(id => ids.includes(id));
  };
  const empleadosDisponibles = empleados.filter(puedeRealizar);

  // Si el profesional elegido deja de poder hacer los servicios seleccionados,
  // lo deseleccionamos para no dejar una combinación inválida.
  useEffect(() => {
    if (selectedEmpleado && !puedeRealizar(selectedEmpleado)) {
      setSelectedEmpleado(null);
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices]);

  // Si al cambiar los servicios la fecha elegida deja de ser válida (pasó a haber
  // un evento con otras fechas), la limpiamos para no dejar una combinación rota.
  useEffect(() => {
    if (!selectedDate) return;
    if (hayEventoElegido && !fechasEvento.includes(selectedDate)) {
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices]);

  // Seña
  const senaPorcentaje = pagoConfig.sena_porcentaje || 0;
  const montoSena = Math.round(totalPrecio * senaPorcentaje / 100);
  const saldoLocal = totalPrecio - montoSena;
  // ¿Esta reserva paga seña online?
  const pagaSena = pagoConfig.habilitado && (pagoConfig.sena_obligatoria || metodoPago === 'sena');

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
    if (selectedServices.length === 0) {
      setError('Por favor seleccioná al menos un servicio.');
      return;
    }
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

      const fechaHoraISO = `${selectedDate}T${selectedTime}:00`;

      const turnoData = {
        fecha_hora: fechaHoraISO,
        duracion: totalDuracion,
        estado: 'pendiente',
        observaciones: '',
        cliente_id: clienteId,
        empleado_id: selectedEmpleado.id,
        servicios_ids: selectedServices.map(s => s.id),
        pagar_sena: pagaSena,
        metodo_sena: metodoSena,
        return_url: `${window.location.origin}/confirmation`,
      };

      const turnoResponse = await createTurno(turnoData);
      const data = turnoResponse.data;

      // Conversión para Meta Ads: el turno ya quedó creado en la BD, así que lo
      // reportamos acá y no en /confirmation. De esta forma cubrimos también el
      // caso de seña con tarjeta, donde el usuario se va a Mercado Pago y podría
      // no volver nunca al sitio.
      trackEvent('Schedule', {
        value: totalPrecio,
        currency: 'ARS',
        content_name: selectedServices.map(s => s.nombre).join(', '),
      });

      // Seña por transferencia: mostramos datos bancarios y pedimos el comprobante
      if (data?.requiere_pago && data?.metodo === 'transferencia') {
        navigate('/confirmation', {
          state: {
            transferencia: {
              ...data.transferencia,
              monto_sena: data.monto_sena,
              saldo_pendiente: data.saldo_pendiente,
              monto_total: data.monto_total,
              turno_id: data.turno_id,
              // Datos del turno para mostrarlos en la confirmación
              cliente: formData.nombre,
              fecha: formattedSelectedDate,
              hora: selectedTime,
              profesional: selectedEmpleado?.nombre,
              servicios: selectedServices.map(s => s.nombre).join(', '),
            },
          },
        });
        return;
      }

      // Seña por tarjeta: el backend devuelve el link de Mercado Pago
      if (data?.requiere_pago && data?.init_point) {
        window.location.href = data.init_point;
        return;
      }

      // Reserva sin seña: confirmación directa (comportamiento de siempre)
      navigate('/confirmation', { state: { turno: data } });
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

  const renderServicioItem = (s, dentroDeCategoria) => {
    const checked = !!selectedServices.find(ss => ss.id === s.id);
    return (
      <button
        key={s.id}
        type="button"
        className={`servicio-item${checked ? ' si-selected' : ''}${dentroDeCategoria ? ' si-sub' : ''}`}
        onClick={() => toggleServicio(s)}
      >
        <div className={`si-check${checked ? ' si-checked' : ''}`}>
          <svg viewBox="0 0 12 12" className="si-check-icon">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        </div>
        <div className="si-info">
          <span className="si-name">{s.nombre}</span>
          {s.descripcion && <span className="si-desc">{s.descripcion}</span>}
        </div>
        <div className="si-right">
          <span className="si-price">{money(s.precio)}</span>
          <span className="si-dur">{s.duracion_minutos} min</span>
        </div>
      </button>
    );
  };

  const slotHintStart = availableSlots[0]?.hora;
  const slotHintEnd = availableSlots[availableSlots.length - 1]?.hora;

  return (
    <div className="booking-page">
      <div className="booking-wrap">
        <span className="booking-tag">Reserva de turno</span>
        <h1 className="booking-title">Reservá<br />tu turno</h1>

        {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form className="form" onSubmit={handleSubmit}>

          {/* -- Servicios -- */}
          <div className="field">
            <label className="field-label">Servicios <span className="field-req">*</span></label>
            {loadingServicios ? (
              <span className="slots-placeholder" style={{ padding: '1rem 0', textAlign: 'left' }}>
                Cargando servicios...
              </span>
            ) : servicios.length === 0 ? (
              <span className="slots-placeholder" style={{ padding: '1rem 0', textAlign: 'left' }}>
                No hay servicios disponibles
              </span>
            ) : (
              <div className="servicio-list">
                {/* Eventos especiales: mismo acordeón que las categorías, arriba
                    de todo y con acento dorado. La fecha va en la cabecera para
                    que se lea sin tener que desplegar. */}
                {gruposEvento.map(({ categoria, items }) => {
                  const abierta = openCategoria === categoria.id;
                  const elegidos = items.filter(
                    i => selectedServices.some(s => s.id === i.id)
                  ).length;
                  const proximas = (categoria.fechas_especiales || [])
                    .filter(f => f >= hoyISO);
                  const fmt = (iso) => new Date(`${iso}T12:00:00`)
                    .toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
                  return (
                    <div
                      key={`ev-${categoria.id}`}
                      className={`servicio-cat servicio-cat-evento${abierta ? ' sc-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="servicio-cat-head"
                        aria-expanded={abierta}
                        onClick={() => setOpenCategoria(abierta ? null : categoria.id)}
                      >
                        <div className="si-info">
                          <span className="si-name">
                            <span className="ev-chip">◈ Evento</span>
                            {categoria.nombre}
                          </span>
                          <span className="eb-fecha">
                            {proximas.length === 1
                              ? `Solo el ${fmt(proximas[0])}`
                              : `Solo el ${proximas.slice(0, 3).map(fmt).join(' · ')}`}
                          </span>
                          <span className="si-desc">
                            {categoria.descripcion
                              || `${items.length} ${items.length === 1 ? 'opción' : 'opciones'}`}
                          </span>
                        </div>
                        <div className="sc-right">
                          {elegidos > 0 && (
                            <span className="sc-badge">
                              {elegidos} {elegidos === 1 ? 'elegido' : 'elegidos'}
                            </span>
                          )}
                          <svg viewBox="0 0 12 12" className="sc-chevron">
                            <polyline points="3 4.5 6 8 9 4.5" />
                          </svg>
                        </div>
                      </button>

                      {abierta && (
                        <div className="servicio-sublist">
                          {items.map(s => renderServicioItem(s, true))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {gruposServicios.map(({ categoria, items }) => {
                  const abierta = openCategoria === categoria.id;
                  const elegidos = items.filter(
                    i => selectedServices.some(s => s.id === i.id)
                  ).length;
                  return (
                    <div key={`cat-${categoria.id}`} className={`servicio-cat${abierta ? ' sc-open' : ''}`}>
                      <button
                        type="button"
                        className="servicio-cat-head"
                        aria-expanded={abierta}
                        onClick={() => setOpenCategoria(abierta ? null : categoria.id)}
                      >
                        <div className="si-info">
                          <span className="si-name">{categoria.nombre}</span>
                          <span className="si-desc">
                            {categoria.descripcion
                              || `${items.length} ${items.length === 1 ? 'opción' : 'opciones'}`}
                          </span>
                        </div>
                        <div className="sc-right">
                          {elegidos > 0 && (
                            <span className="sc-badge">
                              {elegidos} {elegidos === 1 ? 'elegido' : 'elegidos'}
                            </span>
                          )}
                          <svg viewBox="0 0 12 12" className="sc-chevron">
                            <polyline points="3 4.5 6 8 9 4.5" />
                          </svg>
                        </div>
                      </button>

                      {abierta && (
                        <div className="servicio-sublist">
                          {items.map(s => renderServicioItem(s, true))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {serviciosSueltos.map(s => renderServicioItem(s, false))}
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="servicio-summary">
                <span className="ss-label">
                  {selectedServices.length} {selectedServices.length === 1 ? 'servicio' : 'servicios'}
                  {' · '}{totalDuracion} min
                </span>
                <span className="ss-total">{money(totalPrecio)}</span>
              </div>
            )}
          </div>

          {/* -- Nombre -- */}
          <div className="field">
            <label className="field-label">Nombre completo <span className="field-req">*</span></label>
            <input className="field-input" type="text" name="nombre" value={formData.nombre}
              onChange={handleChange} placeholder="Tu nombre y apellido" required />
          </div>

          {/* -- Teléfono -- */}
          <div className="field">
            <label className="field-label">Teléfono <span className="field-req">*</span></label>
            <input className="field-input" type="tel" name="telefono" value={formData.telefono}
              onChange={handleChange} placeholder="2235000000" required />
          </div>

          {/* -- Email -- */}
          <div className="field">
            <label className="field-label">Email <span className="field-req">*</span></label>
            <input className="field-input" type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="tucorreo@email.com" required />
            <span className="field-hint">Te enviamos la confirmación del turno a este correo.</span>
          </div>

          {/* -- Profesional -- */}
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
            ) : empleadosDisponibles.length === 0 ? (
              <span className="slots-placeholder" style={{ padding: '1rem 0', textAlign: 'left' }}>
                Ningún profesional realiza todos los servicios seleccionados. Probá quitando alguno.
              </span>
            ) : (
              <div className="empleado-grid">
                {empleadosDisponibles.map(emp => (
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

          {/* -- Fecha -- */}
          <div className="field">
            <label className="field-label">Fecha <span className="field-req">*</span></label>

            {hayEventoElegido && !sinFechasCompatibles && (
              <div className="evento-aviso">
                <span className="ev-tag">◈ Fecha especial</span>
                <span className="ev-text">
                  {catsEventoElegidas.map(c => c.nombre).join(' y ')}
                  {catsEventoElegidas.length === 1 ? ' se realiza' : ' se realizan'} solo
                  {fechasEvento.length === 1 ? ' este día' : ' estos días'}.
                  Elegí la fecha y después tu horario.
                </span>
              </div>
            )}

            {!selectedEmpleado ? (
              <span className="field-hint" style={{ padding: '0.6rem 0' }}>
                Elegí un profesional primero
              </span>
            ) : sinFechasCompatibles ? (
              <span className="field-hint" style={{ padding: '0.6rem 0' }}>
                Los servicios que elegiste pertenecen a eventos que se hacen en fechas
                distintas y no coinciden. Reservalos por separado.
              </span>
            ) : (
              <div className="day-strip">
                {(hayEventoElegido
                  ? fechasEvento
                  : Array.from({ length: 30 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    })
                ).map(iso => {
                  const d = new Date(`${iso}T12:00:00`);
                  const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
                  const dayNum  = d.getDate();
                  const monthStr = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
                  const isSelected = selectedDate === iso;
                  const isToday = iso === hoyISO;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`day-pill${isSelected ? ' dp-selected' : ''}${isToday ? ' dp-today' : ''}${hayEventoElegido ? ' dp-evento' : ''}`}
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

          {/* -- Horarios -- */}
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
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formattedSelectedDate} a las {selectedTime} hs · {selectedEmpleado?.nombre}
              </div>
            )}
          </div>

          {/* -- Seña / Mercado Pago -- */}
          {pagoConfig.habilitado && selectedServices.length > 0 && (
            <div className="field">
              <label className="field-label">Pago</label>

              {pagoConfig.sena_obligatoria ? (
                <div className="sena-box">
                  Para confirmar tu turno se abona una <strong>seña de {money(montoSena)}</strong>
                  {' '}({senaPorcentaje}%). El resto ({money(saldoLocal)}) lo pagás en el local.
                </div>
              ) : (
                <div className="sena-choices">
                  <button
                    type="button"
                    className={`sena-choice${metodoPago === 'sena' ? ' sc-selected' : ''}`}
                    onClick={() => setMetodoPago('sena')}
                  >
                    <span className="sc-title">Pagar seña ahora</span>
                    <span className="sc-sub">{money(montoSena)} ({senaPorcentaje}%) · resto en el local</span>
                  </button>
                  <button
                    type="button"
                    className={`sena-choice${metodoPago === 'local' ? ' sc-selected' : ''}`}
                    onClick={() => setMetodoPago('local')}
                  >
                    <span className="sc-title">Pagar todo en el local</span>
                    <span className="sc-sub">Reservás sin pagar ahora</span>
                  </button>
                </div>
              )}

              {/* Método de la seña: tarjeta vs transferencia */}
              {pagaSena && pagoConfig.transferencia_habilitada && (
                pagoConfig.mp_habilitado ? (
                  <div className="sena-choices" style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className={`sena-choice${metodoSena === 'tarjeta' ? ' sc-selected' : ''}`}
                      onClick={() => setMetodoSena('tarjeta')}
                    >
                      <span className="sc-title">💳 Tarjeta / Mercado Pago</span>
                      <span className="sc-sub">Pagás la seña online al instante</span>
                    </button>
                    <button
                      type="button"
                      className={`sena-choice${metodoSena === 'transferencia' ? ' sc-selected' : ''}`}
                      onClick={() => setMetodoSena('transferencia')}
                    >
                      <span className="sc-title">🏦 Transferencia</span>
                      <span className="sc-sub">Te mostramos CBU y alias, y subís el comprobante acá mismo</span>
                    </button>
                  </div>
                ) : (
                  <div className="sena-box" style={{ marginTop: '0.75rem' }}>
                    La seña se abona por <strong>transferencia</strong>. En el siguiente paso te mostramos
                    el <strong>CBU y el alias</strong>, y adjuntás el comprobante en la misma página.
                  </div>
                )
              )}
            </div>
          )}

          <button
            className="submit-btn"
            type="submit"
            disabled={loading || selectedServices.length === 0 || !selectedEmpleado || !selectedDate || !selectedTime}
          >
            {loading
              ? 'Procesando...'
              : pagaSena
                ? (metodoSena === 'transferencia'
                    ? `Reservar y transferir seña ${money(montoSena)}`
                    : `Pagar seña ${money(montoSena)}`)
                : 'Confirmar turno'}
          </button>
        </form>
      </div>
    </div>
  );
}
