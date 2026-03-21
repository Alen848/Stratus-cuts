import { useMemo } from 'react';
import { useTurnos }    from '../hooks/useTurnos';
import { useClientes }  from '../hooks/useClientes';
import { useEmpleados } from '../hooks/useEmpleados';
import { useServicios } from '../hooks/useServicios';
import StatCard from '../components/ui/StatCard';
import Badge    from '../components/ui/Badge';
import Avatar   from '../components/ui/Avatar';
import { formatDate, formatTime, formatDuration, estadoColor } from '../utils/formatters';

// FIX: usar fecha local, no UTC, para comparar con "hoy"
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function turnoLocalDate(fechaHora) {
  if (!fechaHora) return '';
  const str = fechaHora.includes('T') ? fechaHora : fechaHora.replace(' ', 'T');
  const hasOffset = str.includes('+') || /[-+]\d{2}:\d{2}$/.test(str) || str.endsWith('Z');
  const d = hasOffset ? new Date(str) : new Date(str.replace('T', ' '));
  return toLocalDateStr(d);
}

const todayStr = toLocalDateStr(new Date());

export default function DashboardPage() {
  const { turnos,    loading: lT } = useTurnos();
  const { clientes,  loading: lC } = useClientes();
  const { empleados, loading: lE } = useEmpleados();
  const { servicios, loading: lS } = useServicios();

  // FIX: filtra por fecha local en lugar de .toDateString() que usa UTC
  const turnosHoy = useMemo(() =>
    turnos.filter(t => turnoLocalDate(t.fecha_hora) === todayStr)
  , [turnos]);

  const proximos = useMemo(() =>
    turnosHoy
      .filter(t => t.estado !== 'cancelado' && t.estado !== 'completado')
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
      .slice(0, 5)
  , [turnosHoy]);

  const completadosHoy = turnosHoy.filter(t => t.estado === 'completado').length;
  const pendientesHoy  = turnosHoy.filter(t => t.estado === 'pendiente' || t.estado === 'confirmado').length;

  if (lT || lC || lE || lS) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--gold)', marginBottom: '8px' }}>✦</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Turnos hoy"       value={turnosHoy.length}  icon="◷" accent />
        <StatCard label="Completados"      value={completadosHoy}    icon="✓" />
        <StatCard label="Pendientes"       value={pendientesHoy}     icon="◉" />
        <StatCard label="Clientes totales" value={clientes.length}   icon="◎" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* Próximos turnos del día */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400 }}>
              Próximos turnos
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              HOY · {turnosHoy.length} TOTAL
            </span>
          </div>

          {proximos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay turnos próximos para hoy
            </div>
          ) : (
            <div>
              {proximos.map((t, i) => {
                const cliente  = t.cliente  || {};
                const empleado = t.empleado || {};
                const svcs = t.servicios?.map(ts => ts.servicio?.nombre).filter(Boolean) || [];
                return (
                  <div
                    key={t.id}
                    className="animate-fade"
                    style={{
                      display: 'grid', gridTemplateColumns: '56px 1fr auto',
                      alignItems: 'center', gap: '16px',
                      padding: '14px 24px',
                      borderBottom: i < proximos.length - 1 ? '1px solid var(--border)' : 'none',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--gold)', lineHeight: 1 }}>
                        {formatTime(t.fecha_hora)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatDuration(t.duracion)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar nombre={cliente.nombre} apellido={cliente.apellido} size={34} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {cliente.nombre} {cliente.apellido}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {empleado.nombre} {empleado.apellido}
                          {svcs.length > 0 && ` · ${svcs[0]}`}
                        </div>
                      </div>
                    </div>

                    <Badge variant={estadoColor(t.estado)}>
                      {t.estado?.charAt(0).toUpperCase() + t.estado?.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Empleados */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 400 }}>Equipo</h3>
            </div>
            <div style={{ padding: '12px' }}>
              {empleados.slice(0, 5).map((e, i) => (
                <div
                  key={e.id}
                  className="animate-fade"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px', borderRadius: 'var(--radius-sm)',
                    animationDelay: `${i * 0.05}s`,
                  }}
                  onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                >
                  <Avatar nombre={e.nombre} apellido={e.apellido} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{e.nombre} {e.apellido}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {e.especialidad || 'Profesional'}
                    </div>
                  </div>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--success)', boxShadow: '0 0 6px var(--success)',
                  }} />
                </div>
              ))}
              {empleados.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px', textAlign: 'center' }}>
                  Sin empleados registrados
                </p>
              )}
            </div>
          </div>

          {/* Servicios */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 400 }}>Servicios</h3>
            </div>
            <div style={{ padding: '8px 12px 12px' }}>
              {servicios.slice(0, 5).map((s, i) => (
                <div
                  key={s.id}
                  className="animate-fade"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 8px',
                    borderBottom: i < Math.min(servicios.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.nombre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.duracion_minutos} min</div>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 500 }}>
                    ${s.precio?.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
              {servicios.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px', textAlign: 'center' }}>
                  Sin servicios registrados
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}