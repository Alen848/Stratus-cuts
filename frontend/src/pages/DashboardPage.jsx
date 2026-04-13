import { useMemo, useState, useEffect } from 'react';
import { useTurnos }    from '../hooks/useTurnos';
import { useClientes }  from '../hooks/useClientes';
import { useEmpleados } from '../hooks/useEmpleados';
import StatCard from '../components/ui/StatCard';
import Avatar   from '../components/ui/Avatar';
import { formatTime } from '../utils/formatters';
import styles from '../styles/pages/DashboardPage.module.css';

// ─── Configuración de la grilla ───────────────────────────────────────────────
const H_START   = 9;       // hora de inicio fija
const H_END     = 21;      // hora de fin fija
const HOUR_PX   = 90;      // px por hora
const SLOT_MIN  = 20;      // grilla cada 20 minutos
const SLOT_PX   = HOUR_PX / (60 / SLOT_MIN); // 30 px por slot
const TOTAL_PX  = (H_END - H_START) * HOUR_PX;
const TIME_COL  = 60;      // ancho de la columna de horas (px)
const EMP_COL_DEFAULT = 170; // ancho mínimo por columna de empleado (px)
const HEAD_H    = 52;      // alto del header de empleados (px)

// Todos los marks de la grilla (h, m)
const MARKS = [];
for (let h = H_START; h <= H_END; h++) {
  for (let m = 0; m < 60; m += SLOT_MIN) {
    if (h === H_END && m > 0) break;
    MARKS.push({ h, m, isHour: m === 0 });
  }
}

const ESTADO_STYLE = {
  pendiente:  { bg: 'rgba(212,175,55,0.13)',  border: 'rgba(212,175,55,0.5)',  accent: '#d4af37' },
  confirmado: { bg: 'rgba(95,168,200,0.13)',  border: 'rgba(95,168,200,0.5)',  accent: '#5fa8c8' },
  completado: { bg: 'rgba(72,187,120,0.12)',  border: 'rgba(72,187,120,0.45)', accent: '#48bb78' },
  cancelado:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', accent: '#555'    },
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseDate(fh) {
  return fh ? new Date(fh.replace('T', ' ').split('.')[0]) : null;
}

function turnoTop(fh) {
  const d = parseDate(fh);
  if (!d) return 0;
  const mins = (d.getHours() - H_START) * 60 + d.getMinutes();
  return Math.max(0, (mins / SLOT_MIN) * SLOT_PX);
}

function turnoHeight(dur) {
  return Math.max(SLOT_PX, ((dur || 30) / SLOT_MIN) * SLOT_PX);
}

function calcNowPx() {
  const n = new Date();
  const mins = (n.getHours() - H_START) * 60 + n.getMinutes();
  if (mins < 0 || mins > (H_END - H_START) * 60) return null;
  return (mins / SLOT_MIN) * SLOT_PX;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { turnos,   loading: lT } = useTurnos();
  const { clientes, loading: lC } = useClientes();
  const { empleados,loading: lE } = useEmpleados();

  const todayStr = toLocalDateStr(new Date());

  const [nowPx, setNowPx] = useState(calcNowPx);
  useEffect(() => {
    const id = setInterval(() => setNowPx(calcNowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  const turnosHoy = useMemo(() =>
    turnos.filter(t => {
      const d = parseDate(t.fecha_hora);
      return d && toLocalDateStr(d) === todayStr;
    }),
  [turnos]);

  const pendientes = useMemo(() =>
    turnosHoy
      .filter(t => t.estado === 'pendiente')
      .sort((a, b) => parseDate(a.fecha_hora) - parseDate(b.fecha_hora)),
  [turnosHoy]);

  const completadosHoy = turnosHoy.filter(t => t.estado === 'completado').length;
  const activosHoy     = turnosHoy.filter(t => t.estado !== 'cancelado').length;

  const columnas = useMemo(() =>
    empleados.map(emp => ({
      emp,
      turnos: turnosHoy.filter(t => t.empleado_id === emp.id),
    })),
  [empleados, turnosHoy]);

  if (lT || lC || lE) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'40vh' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:'var(--gold)' }}>✦</div>
          <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'8px' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  const gridWidth = TIME_COL + Math.max(columnas.length, 1) * EMP_COL_DEFAULT;

  return (
    <div className={styles.container}>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Turnos hoy"       value={activosHoy}        icon="◷" accent />
        <StatCard label="Completados"      value={completadosHoy}    icon="✓" />
        <StatCard label="Sin confirmar"    value={pendientes.length} icon="◉" />
        <StatCard label="Clientes totales" value={clientes.length}   icon="◎" />
      </div>

      <div className={styles.mainGrid}>

        {/* ── Grilla ── */}
        <div className={styles.agendaCard}>

          {/* Título */}
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Agenda de hoy</h2>
            <span className={styles.cardSubtitle}>
              {new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}
            </span>
          </div>

          <div className={styles.scrollContainer}>
            <div className={styles.gridWrapper} style={{ width: gridWidth }}>

              {/* ── Header sticky de empleados ── */}
              <div className={styles.empHeader} style={{ height: HEAD_H }}>
                <div style={{ width: TIME_COL, flexShrink: 0 }} />

                {columnas.map(({ emp, turnos: et }) => {
                  const activos = et.filter(t => t.estado !== 'cancelado').length;
                  return (
                    <div key={emp.id} className={styles.empCol} style={{ minWidth: EMP_COL_DEFAULT }}>
                      <Avatar nombre={emp.nombre} apellido={emp.apellido} size={28} />
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.empName}>
                          {emp.nombre} {emp.apellido}
                        </div>
                        <div className={styles.empSub}>
                          {activos} turno{activos !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnas.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Sin empleados registrados
                  </div>
                )}
              </div>

              {/* ── Cuerpo de la grilla ── */}
              <div className={styles.gridBody} style={{ height: TOTAL_PX }}>

                {/* Columna de horas */}
                <div className={styles.timeCol} style={{ width: TIME_COL }}>
                  {MARKS.map(({ h, m, isHour }) => {
                    const top = ((h - H_START) * 60 + m) / SLOT_MIN * SLOT_PX;
                    return (
                      <div key={`${h}:${m}`} className={styles.timeMark} style={{
                        top,
                        fontSize: isHour ? '11px' : '9px',
                        color: isHour ? 'var(--text-secondary)' : 'rgba(255,255,255,0.2)',
                        fontWeight: isHour ? 500 : 400,
                        paddingTop: top === 0 ? 6 : 0,
                        transform: top === 0 ? 'none' : 'translateY(-50%)',
                      }}>
                        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>

                {/* Columnas de empleados */}
                {columnas.map(({ emp, turnos: et }) => (
                  <div key={emp.id} style={{
                    flex: 1, minWidth: EMP_COL_DEFAULT,
                    borderLeft: '1px solid var(--border)',
                    position: 'relative',
                    height: '100%',
                  }}>

                    {/* Líneas de grilla */}
                    {MARKS.map(({ h, m, isHour }) => {
                      const top = ((h - H_START) * 60 + m) / SLOT_MIN * SLOT_PX;
                      return (
                        <div key={`${h}:${m}`} style={{
                          position: 'absolute',
                          top, left: 0, right: 0, height: 0,
                          borderTop: isHour
                            ? '1px solid rgba(255,255,255,0.08)'
                            : '1px dashed rgba(255,255,255,0.03)',
                          pointerEvents: 'none',
                        }} />
                      );
                    })}

                    {/* Indicador de hora actual */}
                    {nowPx !== null && (
                      <div style={{
                        position: 'absolute',
                        top: nowPx, left: 0, right: 0,
                        height: 2, background: 'var(--gold)',
                        opacity: 0.85, zIndex: 3,
                        pointerEvents: 'none',
                      }}>
                        <div style={{
                          position: 'absolute', left: -5, top: -4,
                          width: 10, height: 10, borderRadius: '50%',
                          background: 'var(--gold)',
                        }} />
                      </div>
                    )}

                    {/* Bloques de turno */}
                    {et.map(t => {
                      const s      = ESTADO_STYLE[t.estado] ?? ESTADO_STYLE.pendiente;
                      const top    = turnoTop(t.fecha_hora);
                      const height = turnoHeight(t.duracion);
                      const c      = t.cliente || {};
                      const svcs   = t.servicios?.map(ts => ts.servicio?.nombre).filter(Boolean) ?? [];
                      const nombre = c.nombre
                        ? `${c.nombre}${c.apellido ? ' '+c.apellido : ''}`.trim()
                        : 'Sin turno';

                      return (
                        <div
                          key={t.id}
                          title={`${nombre} · ${svcs.join(', ') || 'Sin servicio'} · ${t.estado}`}
                          style={{
                            position: 'absolute',
                            top: top + 2, left: 5, right: 5,
                            height: height - 4,
                            background: s.bg,
                            border: `1px solid ${s.border}`,
                            borderLeft: `3px solid ${s.accent}`,
                            borderRadius: 6,
                            padding: '4px 8px',
                            overflow: 'hidden',
                            zIndex: 2,
                          }}
                        >
                          <div style={{ fontSize: '10px', fontWeight: 700, color: s.accent, lineHeight: 1.2 }}>
                            {formatTime(t.fecha_hora)}
                            {t.duracion ? (
                              <span style={{ fontWeight: 400, opacity: 0.75, marginLeft: 4 }}>
                                {t.duracion}min
                              </span>
                            ) : null}
                          </div>
                          <div style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)',
                            marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {nombre}
                          </div>
                          {height >= 56 && svcs.length > 0 && (
                            <div style={{
                              fontSize: '10px', color: 'var(--text-muted)',
                              marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {svcs[0]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className={styles.legend}>
            {Object.entries(ESTADO_STYLE).map(([estado, s]) => (
              <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: s.bg, borderLeft: `3px solid ${s.accent}`,
                }} />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className={styles.rightPanel}>

          {/* Sin confirmar */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h3 className={styles.sideCardTitle}>Sin confirmar</h3>
              {pendientes.length > 0 && (
                <span className={styles.badge}>{pendientes.length}</span>
              )}
            </div>
            <div>
              {pendientes.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '14px 18px', textAlign: 'center' }}>
                  Todos confirmados ✓
                </p>
              ) : (
                pendientes.map((t, i) => {
                  const c    = t.cliente || {};
                  const svcs = t.servicios?.map(ts => ts.servicio?.nombre).filter(Boolean) ?? [];
                  return (
                    <div key={t.id} style={{
                      padding: '10px 18px',
                      borderBottom: i < pendientes.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.nombre} {c.apellido}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>
                          {formatTime(t.fecha_hora)}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {svcs[0] || 'Sin servicio'}
                        {t.empleado ? ` · ${t.empleado.nombre}` : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Equipo */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h3 className={styles.sideCardTitle}>Equipo hoy</h3>
            </div>
            <div>
              {empleados.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: 14, textAlign: 'center' }}>
                  Sin empleados
                </p>
              ) : (
                empleados.map(e => {
                  const activos = turnosHoy.filter(t => t.empleado_id === e.id && t.estado !== 'cancelado').length;
                  const comp    = turnosHoy.filter(t => t.empleado_id === e.id && t.estado === 'completado').length;
                  return (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 18px', borderBottom: '1px solid var(--border)',
                    }}>
                      <Avatar nombre={e.nombre} apellido={e.apellido} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {e.nombre} {e.apellido}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 1 }}>
                          {comp}/{activos} completado{activos !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: activos > 0 ? '#48bb78' : 'var(--text-muted)',
                        boxShadow: activos > 0 ? '0 0 7px rgba(72,187,120,0.55)' : 'none',
                      }} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
