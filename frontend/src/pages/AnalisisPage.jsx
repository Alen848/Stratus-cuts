import { useMemo, useEffect, useState } from 'react';
import { useTurnos } from '../hooks/useTurnos';
import { horariosSalon as horariosSalonApi } from '../api/api';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Fallback si no hay config de salón
const FRANJAS_DEFAULT = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

function turnoLocalDate(fechaHora) {
  // Backend sends naive datetimes — parse as local
  return new Date(fechaHora.replace('T', ' ').split('.')[0]);
}

function BarChart({ data, labelWidth = 100, color = 'var(--gold)', unit = '' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
          <span style={{ width: labelWidth, color: 'var(--text-secondary)', flexShrink: 0 }}>
            {label}
          </span>
          <div style={{
            flex: 1, height: '10px', borderRadius: '5px',
            background: 'var(--bg-elevated)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '5px',
              width: `${Math.round((value / max) * 100)}%`,
              background: color,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ width: '60px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0 }}>
            {value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart SVG ──────────────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerSub }) {
  const r    = 52;
  const cx   = 72;
  const cy   = 72;
  const sw   = 20;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);

  let cumulative = 0;
  return (
    <svg width={144} height={144} viewBox="0 0 144 144">
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--border)" strokeWidth={sw} />
      ) : (
        segments.map((seg, i) => {
          if (seg.value === 0) { cumulative += seg.value; return null; }
          const dash     = (seg.value / total) * circ;
          const gap      = circ - dash;
          const rotation = -90 + (cumulative / total) * 360;
          cumulative += seg.value;
          return (
            <circle key={i}
              cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          );
        })
      )}
      <text x={cx} y={cy - 7} textAnchor="middle"
        fill="var(--text-primary)" fontSize="20" fontWeight="500"
        fontFamily="var(--font-display)">{centerLabel}</text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        fill="var(--text-muted)" fontSize="9">{centerSub}</text>
    </svg>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 400, color: 'var(--text-primary)' }}>
        {children}
      </h3>
      {sub && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{sub}</p>
      )}
    </div>
  );
}

export default function AnalisisPage() {
  const { turnos, loading, error } = useTurnos();
  const [horariosSalon, setHorariosSalon] = useState([]);

  useEffect(() => {
    horariosSalonApi.getAll()
      .then(res => setHorariosSalon(res.data || []))
      .catch(() => {});
  }, []);

  // Calcula las franjas de 2h basadas en los horarios reales del salón
  const FRANJAS = useMemo(() => {
    const activos = horariosSalon.filter(h => h.activo);
    if (activos.length === 0) return FRANJAS_DEFAULT;
    const minHora = Math.min(...activos.map(h => parseInt(h.hora_apertura)));
    const maxHora = Math.max(...activos.map(h => parseInt(h.hora_cierre)));
    const franjas = [];
    for (let h = minHora; h < maxHora; h += 2) {
      franjas.push(`${String(h).padStart(2, '0')}:00`);
    }
    return franjas.length > 0 ? franjas : FRANJAS_DEFAULT;
  }, [horariosSalon]);

  const turnosActivos = useMemo(
    () => turnos.filter(t => t.estado !== 'cancelado'),
    [turnos]
  );

  const porDia = useMemo(() => {
    const counts = Array(7).fill(0);
    for (const t of turnosActivos) {
      const d = turnoLocalDate(t.fecha_hora);
      counts[d.getDay()]++;
    }
    return DIAS.map((label, i) => ({ label, value: counts[i] }));
  }, [turnosActivos]);

  const porFranja = useMemo(() => {
    const counts = Object.fromEntries(FRANJAS.map(f => [f, 0]));
    for (const t of turnosActivos) {
      const d = turnoLocalDate(t.fecha_hora);
      const hora = d.getHours();
      // Find the franja bucket: the latest franja start <= hora
      let bucket = FRANJAS[0];
      for (const f of FRANJAS) {
        if (hora >= parseInt(f)) bucket = f;
      }
      counts[bucket]++;
    }
    return FRANJAS.map(f => ({ label: `${f} – ${String(parseInt(f) + 2).padStart(2, '0')}:00`, value: counts[f] }));
  }, [turnosActivos, FRANJAS]);

  const retencion = useMemo(() => {
    const walkins     = turnosActivos.filter(t => !t.cliente_id);
    const conCliente  = turnosActivos.filter(t => t.cliente_id);

    // Contar visitas por cliente
    const visitas = {};
    for (const t of conCliente) {
      visitas[t.cliente_id] = (visitas[t.cliente_id] || 0) + 1;
    }

    // Clasificar turnos según frecuencia del cliente
    let unicaVisita = 0, recurrentesTurnos = 0;
    for (const t of conCliente) {
      if (visitas[t.cliente_id] >= 2) recurrentesTurnos++;
      else unicaVisita++;
    }

    const clientesUnicos      = Object.keys(visitas).length;
    const clientesRecurrentes = Object.values(visitas).filter(v => v >= 2).length;
    const tasaRetorno = clientesUnicos > 0
      ? Math.round((clientesRecurrentes / clientesUnicos) * 100)
      : 0;

    return { walkins: walkins.length, unicaVisita, recurrentesTurnos, clientesUnicos, clientesRecurrentes, tasaRetorno };
  }, [turnosActivos]);

  const porServicio = useMemo(() => {
    const counts = {};
    for (const t of turnosActivos) {
      for (const ts of (t.servicios || [])) {
        const nombre = ts.servicio?.nombre || `Servicio ${ts.servicio_id}`;
        counts[nombre] = (counts[nombre] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [turnosActivos]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando datos...</div>;
  }
  if (error) {
    return <div style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '13px' }}>Error al cargar los turnos.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '20px 24px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total de turnos analizados
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--gold)', marginTop: '6px' }}>
            {turnosActivos.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Excluye cancelados
          </div>
        </div>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '20px 24px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Día más ocupado
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--text-primary)', marginTop: '6px' }}>
            {porDia.reduce((a, b) => b.value > a.value ? b : a, porDia[0])?.label ?? '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {Math.max(...porDia.map(d => d.value))} turnos
          </div>
        </div>
      </div>

      <div>
        <SectionTitle sub="Cantidad de turnos por día de la semana, excluyendo cancelados">
          Turnos por día de la semana
        </SectionTitle>
        <BarChart data={porDia} labelWidth={90} color="var(--gold)" unit=" turnos" />
      </div>

      <div>
        <SectionTitle sub="Distribución de turnos según el horario de inicio, en franjas de 2 horas">
          Turnos por franja horaria
        </SectionTitle>
        <BarChart data={porFranja} labelWidth={130} color="var(--color-success, #4caf7d)" unit=" turnos" />
      </div>

      {porServicio.length > 0 && (
        <div>
          <SectionTitle sub="Servicios ordenados por cantidad de veces solicitados">
            Servicios más solicitados
          </SectionTitle>
          <BarChart data={porServicio} labelWidth={150} color="var(--color-info, #63b3ed)" unit=" veces" />
        </div>
      )}

      <div>
        <SectionTitle sub="De los turnos registrados, cuántos pertenecen a clientes que volvieron">
          Retención de clientes
        </SectionTitle>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '24px',
          display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Donut */}
          <DonutChart
            centerLabel={`${retencion.tasaRetorno}%`}
            centerSub="retención"
            segments={[
              { value: retencion.recurrentesTurnos, color: 'var(--color-success, #4caf7d)' },
              { value: retencion.unicaVisita,        color: 'var(--color-info, #63b3ed)'  },
              { value: retencion.walkins,            color: 'var(--gold)'                 },
            ]}
          />

          {/* Leyenda + stats */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
            {[
              {
                color: 'var(--color-success, #4caf7d)',
                label: 'Clientes recurrentes',
                desc:  '2 o más visitas en el período',
                value: retencion.recurrentesTurnos,
                unit:  'turnos',
              },
              {
                color: 'var(--color-info, #63b3ed)',
                label: 'Primera o única visita',
                desc:  'Vinieron 1 sola vez',
                value: retencion.unicaVisita,
                unit:  'turnos',
              },
              {
                color: 'var(--gold)',
                label: 'Sin turno (walk-in)',
                desc:  'Sin cliente registrado',
                value: retencion.walkins,
                unit:  'turnos',
              },
            ].map(({ color, label, desc, value, unit }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, color, fontFamily: 'var(--font-display)' }}>{value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{unit}</div>
                </div>
              </div>
            ))}

            {/* Separador + stat global */}
            <div style={{
              borderTop: '1px solid var(--border)', paddingTop: '12px',
              display: 'flex', gap: '24px',
            }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {retencion.clientesUnicos}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>clientes únicos</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'var(--font-display)', color: 'var(--color-success, #4caf7d)' }}>
                  {retencion.clientesRecurrentes}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>volvieron</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
                  {retencion.tasaRetorno}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>tasa retorno</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
