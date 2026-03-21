import { useState, useMemo } from 'react';
import { useEmpleados } from '../hooks/useEmpleados';
import { useTurnos }    from '../hooks/useTurnos';
import { useApp }       from '../context/AppContext';
import { gastos as gastosApi } from '../api/api';
import EmpleadoModal from '../components/empleados/EmpleadoModal';
import Avatar     from '../components/ui/Avatar';
import Button     from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

/* ── Helpers de fecha ── */
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function primerDiaMes() {
  const d = new Date();
  return toLocalDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
}
function hoy() { return toLocalDateStr(new Date()); }

/* ── Calcula el precio de un turno sumando sus servicios ── */
function precioTurno(turno) {
  if (!turno.servicios?.length) return 0;
  return turno.servicios.reduce((sum, ts) => {
    const precio = ts.precio_unitario ?? ts.servicio?.precio ?? 0;
    return sum + Number(precio);
  }, 0);
}

/* ── Comisiones guardadas en localStorage ── */
const STORAGE_KEY = 'turnera_comisiones';
function loadComisiones() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveComision(empleadoId, porcentaje) {
  const data = loadComisiones();
  data[empleadoId] = porcentaje;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ════════════════════════════════════════════
   Vista: Equipo
════════════════════════════════════════════ */
function VistaEquipo({ empleados, loading, turnos, onAdd }) {
  const turnosPorEmpleado = (id) =>
    turnos.filter(t => t.empleado_id === id && t.estado !== 'cancelado').length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>
  );

  if (empleados.length === 0) return (
    <EmptyState
      icon="◉"
      title="Sin profesionales"
      description="Agregá los miembros de tu equipo."
      action={<Button variant="primary" onClick={onAdd}>Agregar profesional</Button>}
    />
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    }}>
      {empleados.map((e, i) => (
        <div
          key={e.id}
          className="animate-fade"
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            transition: 'border-color 0.2s, transform 0.2s',
            animationDelay: `${i * 0.07}s`,
          }}
          onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'var(--gold-border)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'var(--border)'; ev.currentTarget.style.transform = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Avatar nombre={e.nombre} apellido={e.apellido} size={48} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400 }}>
                {e.nombre} {e.apellido}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '2px' }}>
                {e.especialidad || 'Profesional'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {e.email && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>✉</span> {e.email}
              </div>
            )}
            {e.telefono && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>✆</span> {e.telefono}
              </div>
            )}
          </div>

          <div style={{
            borderTop: '1px solid var(--border)', paddingTop: '14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--gold)' }}>
                {turnosPorEmpleado(e.id)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>turnos activos</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--success)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Activo
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   Vista: Comisiones
════════════════════════════════════════════ */
function VistaComisiones({ empleados, turnos, loading }) {
  const { notify } = useApp();
  const [desde, setDesde]           = useState(primerDiaMes());
  const [hasta, setHasta]           = useState(hoy());
  const [comisiones, setComisiones] = useState(loadComisiones());
  const [editandoId, setEditandoId] = useState(null);
  const [editVal, setEditVal]       = useState('');
  const [registrados, setRegistrados] = useState({});  // emp_id → true si ya registró en este período
  const [loadingReg, setLoadingReg]   = useState({});

  const handleEditComision = (id, actual) => {
    setEditandoId(id);
    setEditVal(String(actual ?? 0));
  };

  const handleSaveComision = (id) => {
    const val = Math.min(100, Math.max(0, Number(editVal) || 0));
    saveComision(id, val);
    setComisiones(prev => ({ ...prev, [id]: val }));
    setEditandoId(null);
    // Resetear estado "registrado" si cambia el porcentaje
    setRegistrados(r => ({ ...r, [id]: false }));
  };

  // Turnos confirmados y completados en el rango (consistente con la caja)
  const turnosFiltrados = useMemo(() => {
    return turnos.filter(t => {
      if (!['confirmado', 'completado'].includes(t.estado)) return false;
      const fecha = t.fecha_hora.slice(0, 10);
      return fecha >= desde && fecha <= hasta;
    });
  }, [turnos, desde, hasta]);

  // Resumen por empleado
  const resumen = useMemo(() => {
    return empleados.map(e => {
      const misTurnos = turnosFiltrados.filter(t => t.empleado_id === e.id);
      const facturado = misTurnos.reduce((sum, t) => sum + precioTurno(t), 0);
      const pct       = comisiones[e.id] ?? 0;
      const comision  = (facturado * pct) / 100;
      return { empleado: e, turnos: misTurnos.length, facturado, pct, comision };
    });
  }, [empleados, turnosFiltrados, comisiones]);

  const totales = useMemo(() => ({
    turnos:    resumen.reduce((s, r) => s + r.turnos, 0),
    facturado: resumen.reduce((s, r) => s + r.facturado, 0),
    comision:  resumen.reduce((s, r) => s + r.comision, 0),
  }), [resumen]);

  // Registrar la comisión de un empleado como gasto en la caja
  const registrarComoGasto = async ({ empleado: e, comision, pct, facturado }) => {
    if (comision <= 0) return;
    try {
      setLoadingReg(l => ({ ...l, [e.id]: true }));
      await gastosApi.create({
        descripcion:   `Comisión ${e.nombre}${e.apellido ? ' ' + e.apellido : ''} (${pct}%)`,
        monto:          Math.round(comision),
        categoria:     'sueldos',
        fecha:          hasta,   // se registra en la fecha final del período
        observaciones: `Período ${desde} → ${hasta} · Facturado: $${facturado.toLocaleString('es-AR')}`,
      });
      setRegistrados(r => ({ ...r, [e.id]: true }));
      notify(`Comisión de ${e.nombre} registrada en caja ✓`);
    } catch {
      notify('Error al registrar la comisión', 'error');
    } finally {
      setLoadingReg(l => ({ ...l, [e.id]: false }));
    }
  };

  const inputStyle = {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-sm)', padding: '6px 10px',
    color: 'var(--text-primary)', fontSize: '13px',
    fontFamily: 'var(--font-body)', outline: 'none', colorScheme: 'dark',
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Filtro de rango */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Período
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="date" value={desde} onChange={e => { setDesde(e.target.value); setRegistrados({}); }} style={inputStyle} />
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>hasta</span>
          <input type="date" value={hasta} onChange={e => { setHasta(e.target.value); setRegistrados({}); }} style={inputStyle} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {[
            { label: 'Este mes', fn: () => { setDesde(primerDiaMes()); setHasta(hoy()); setRegistrados({}); } },
            { label: 'Hoy',      fn: () => { setDesde(hoy()); setHasta(hoy()); setRegistrados({}); } },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn} style={{
              padding: '5px 12px', borderRadius: '99px', fontSize: '11px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 80px 120px 140px 120px 180px',
          padding: '10px 20px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)', gap: '12px',
        }}>
          {['Profesional', 'Turnos', 'Facturado', 'Comisión %', 'A cobrar', ''].map(h => (
            <span key={h} style={{
              fontSize: '11px', fontWeight: 500,
              color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{h}</span>
          ))}
        </div>

        {/* Filas */}
        {resumen.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Sin turnos en este período
          </div>
        ) : resumen.map((row) => {
          const { empleado: e, turnos: t, facturado, pct, comision } = row;
          const yaRegistrado = registrados[e.id];
          const cargando     = loadingReg[e.id];

          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 80px 120px 140px 120px 180px',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center', gap: '12px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
            >
              {/* Empleado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar nombre={e.nombre} apellido={e.apellido} size={32} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {e.nombre} {e.apellido}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gold)' }}>
                    {e.especialidad || 'Profesional'}
                  </div>
                </div>
              </div>

              {/* Turnos */}
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {t}
              </span>

              {/* Facturado */}
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                ${facturado.toLocaleString('es-AR')}
              </span>

              {/* Comisión % editable */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {editandoId === e.id ? (
                  <>
                    <input
                      type="number" min="0" max="100" value={editVal}
                      onChange={ev => setEditVal(ev.target.value)}
                      onKeyDown={ev => { if (ev.key === 'Enter') handleSaveComision(e.id); if (ev.key === 'Escape') setEditandoId(null); }}
                      autoFocus
                      style={{ ...inputStyle, width: '60px', padding: '4px 8px', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
                    <button
                      onClick={() => handleSaveComision(e.id)}
                      style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                        color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >✓</button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditComision(e.id, pct)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '99px',
                      border: '1px solid var(--border)',
                      background: pct > 0 ? 'var(--gold-dim)' : 'transparent',
                      color: pct > 0 ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-display)',
                      transition: 'all 0.15s',
                    }}
                    title="Click para editar"
                  >
                    {pct}% <span style={{ fontSize: '10px', opacity: 0.5 }}>✎</span>
                  </button>
                )}
              </div>

              {/* A cobrar */}
              <span style={{
                fontSize: '15px', fontFamily: 'var(--font-display)',
                color: comision > 0 ? 'var(--success)' : 'var(--text-muted)',
                fontWeight: comision > 0 ? 500 : 400,
              }}>
                ${comision.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>

              {/* Botón registrar → caja */}
              <div>
                {comision > 0 && (
                  <button
                    onClick={() => registrarComoGasto(row)}
                    disabled={cargando || yaRegistrado}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                      fontSize: '12px', cursor: yaRegistrado ? 'default' : 'pointer',
                      transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                      border:     yaRegistrado ? '1px solid #4caf7d44' : '1px solid var(--border)',
                      background: yaRegistrado ? '#4caf7d15'           : 'transparent',
                      color:      yaRegistrado ? '#4caf7d'             : 'var(--text-secondary)',
                      opacity:    cargando ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cargando ? '...' : yaRegistrado ? '✓ Enviado a caja' : '→ Registrar en caja'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Totales */}
        {resumen.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 120px 140px 120px 180px',
            padding: '14px 20px',
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-strong)',
            gap: '12px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Total período
            </span>
            <span style={{ fontSize: '14px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {totales.turnos}
            </span>
            <span style={{ fontSize: '14px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              ${totales.facturado.toLocaleString('es-AR')}
            </span>
            <span />
            <span style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--success)', fontWeight: 500 }}>
              ${totales.comision.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span />
          </div>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        * Se calculan turnos <strong style={{ color: 'var(--text-secondary)' }}>confirmados y completados</strong>. 
        Los porcentajes se guardan localmente. Hacé click en el % para editarlo.
        Al presionar <strong style={{ color: 'var(--text-secondary)' }}>→ Registrar en caja</strong> el monto aparece como gasto en la pestaña Caja.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════
   Página principal
════════════════════════════════════════════ */
export default function EmpleadosPage() {
  const { empleados, loading, addEmpleado } = useEmpleados();
  const { turnos }  = useTurnos();
  const { notify }  = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [vista, setVista]         = useState('equipo');

  const handleSubmit = async (data) => {
    await addEmpleado(data);
    notify('Profesional agregado');
  };

  const tabStyle = (active) => ({
    padding: '7px 18px', borderRadius: '6px',
    fontSize: '13px', fontFamily: 'var(--font-body)',
    fontWeight: active ? 500 : 400, cursor: 'pointer',
    border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '4px',
        }}>
          <button style={tabStyle(vista === 'equipo')}      onClick={() => setVista('equipo')}>Equipo</button>
          <button style={tabStyle(vista === 'comisiones')}  onClick={() => setVista('comisiones')}>Comisiones</button>
        </div>

        {vista === 'equipo' && (
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Nuevo profesional</Button>
        )}
      </div>

      {vista === 'equipo' ? (
        <VistaEquipo
          empleados={empleados} loading={loading}
          turnos={turnos} onAdd={() => setModalOpen(true)}
        />
      ) : (
        <VistaComisiones
          empleados={empleados} turnos={turnos} loading={loading}
        />
      )}

      <EmpleadoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}