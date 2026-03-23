import { useState, useEffect, useCallback } from 'react';
import { caja } from '../../api/api';
import { formatCurrency } from '../../utils/formatters';
import ResumenCards        from './ResumenCards';
import ComisionesEmpleados from './ComisionesEmpleados';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const SectionTitle = ({ children }) => (
  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '12px' }}>
    {children}
  </h3>
);

// Barra de progreso simple para el gráfico de días
function BarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin datos.</div>;
  }

  const max = Math.max(...Object.values(data));

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {Object.entries(data).map(([dia, monto]) => (
        <div key={dia} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
          <span style={{ width: '80px', color: 'var(--text-muted)', flexShrink: 0 }}>
            {new Date(dia + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
          </span>
          <div style={{
            flex: 1, height: '8px', borderRadius: '4px',
            background: 'var(--bg-elevated)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${Math.round((monto / max) * 100)}%`,
              background: 'var(--gold)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ width: '90px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0 }}>
            {formatCurrency(monto)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Desglose de gastos por categoría
function GraficoGastos({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin gastos registrados.</div>;
  }

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      {Object.entries(data).map(([cat, monto]) => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
          <span style={{ width: '100px', color: 'var(--text-secondary)', flexShrink: 0, textTransform: 'capitalize' }}>
            {cat}
          </span>
          <div style={{
            flex: 1, height: '8px', borderRadius: '4px',
            background: 'var(--bg-elevated)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${Math.round((monto / total) * 100)}%`,
              background: 'var(--color-danger, #e53e3e)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ width: '90px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0 }}>
            {formatCurrency(monto)}
          </span>
          <span style={{ width: '36px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>
            {Math.round((monto / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CajaMensual() {
  const now = new Date();
  const [anio, setAnio]   = useState(now.getFullYear());
  const [mes, setMes]     = useState(now.getMonth() + 1);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCaja = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await caja.mensual(anio, mes);
      setData(res.data);
    } catch {
      setError('No se pudo cargar la caja del mes.');
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => { fetchCaja(); }, [fetchCaja]);

  const anios = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Selector de mes/año */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Período:</label>
        <select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          style={{
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px',
          }}
        >
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          style={{
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px',
          }}
        >
          {anios.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button
          onClick={fetchCaja}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
            color: 'var(--gold)', cursor: 'pointer', fontSize: '13px',
          }}
        >
          Actualizar
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</div>}
      {error   && <div style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '13px' }}>{error}</div>}

      {data && !loading && (
        <>
          <ResumenCards
            totalIngresos={data.total_ingresos}
            totalGastos={data.total_gastos}
            gananciaNeta={data.ganancia_neta}
            cantidadTurnos={data.cantidad_turnos}
          />

          <div>
            <SectionTitle>Ingresos por día</SectionTitle>
            <BarChart data={data.ingresos_por_dia} />
          </div>

          <div>
            <SectionTitle>Gastos por categoría</SectionTitle>
            <GraficoGastos data={data.gastos_por_categoria} />
          </div>

          <div>
            <SectionTitle>Comisiones por empleado</SectionTitle>
            <ComisionesEmpleados
              empleados={data.ingresos_por_empleado}
              fecha={`${anio}-${String(mes).padStart(2, '0')}-${new Date(anio, mes, 0).getDate()}`}
            />
          </div>
        </>
      )}
    </div>
  );
}