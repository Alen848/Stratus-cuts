import { useMemo } from 'react';
import { useTurnos } from '../hooks/useTurnos';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Franjas horarias de 7:00 a 22:00 cada 2 horas
const FRANJAS = [
  '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00',
];

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

    </div>
  );
}
