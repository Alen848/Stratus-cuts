import { formatCurrency } from '../../utils/formatters';

function Card({ label, value, color = 'var(--text-primary)', sub }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <span style={{
        fontSize: '11px', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '26px', fontFamily: 'var(--font-display)',
        color, fontWeight: 500,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</span>
      )}
    </div>
  );
}

export default function ResumenCards({ totalIngresos, totalGastos, gananciaNeta, cantidadPagos }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
    }}>
      <Card
        label="Ingresos"
        value={formatCurrency(totalIngresos)}
        color="var(--color-success, #4caf7d)"
        sub={`${cantidadPagos} pago${cantidadPagos !== 1 ? 's' : ''}`}
      />
      <Card
        label="Gastos"
        value={formatCurrency(totalGastos)}
        color="var(--color-danger, #e53e3e)"
      />
      <Card
        label="Ganancia neta"
        value={formatCurrency(gananciaNeta)}
        color={gananciaNeta >= 0 ? 'var(--gold)' : 'var(--color-danger, #e53e3e)'}
      />
      <Card
        label="Margen"
        value={totalIngresos > 0 ? `${Math.round((gananciaNeta / totalIngresos) * 100)}%` : '—'}
        sub="sobre ingresos brutos"
      />
    </div>
  );
}