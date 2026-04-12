import { formatCurrency } from '../../utils/formatters';

const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function formatFechaLarga(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()]} ${d.getFullYear()}`;
}

function FilaComparacion({ label, real, teorico }) {
  const dif = real - teorico;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 90px',
      gap: '8px',
      alignItems: 'center',
      padding: '10px 16px',
      borderBottom: '1px solid var(--border)',
      fontSize: '13px',
    }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
        {formatCurrency(real)}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>
        {formatCurrency(teorico)}
      </span>
      <span style={{
        textAlign: 'right',
        fontWeight: 600,
        color: dif === 0
          ? 'var(--text-muted)'
          : dif > 0
            ? 'var(--color-success, #4caf7d)'
            : 'var(--color-danger, #e53e3e)',
      }}>
        {dif === 0 ? '—' : `${dif > 0 ? '+' : ''}${formatCurrency(dif)}`}
      </span>
    </div>
  );
}

export default function ResumenCierre({ cierre, ingresos, gastos }) {
  if (!cierre) return null;

  const totalReal   = cierre.efectivo_real + cierre.transferencia_real + cierre.tarjeta_real;
  const totalTeorico = cierre.total_efectivo_teorico + cierre.total_transferencia + cierre.total_debito;
  const resultadoNeto = totalReal - (cierre.total_gastos ?? 0);
  const difTotal = cierre.diferencia ?? (totalReal - totalTeorico);

  return (
    <div style={{
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--bg-surface)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'rgba(72,187,120,0.06)',
        borderBottom: '1px solid rgba(72,187,120,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#48bb78" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#48bb78', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Caja cerrada
          </span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {formatFechaLarga(cierre.fecha)}
        </span>
      </div>

      {/* Tabla comparación real vs teórico */}
      <div>
        {/* Encabezados columnas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 90px',
          gap: '8px',
          padding: '8px 16px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Método', 'Real contado', 'Teórico sistema', 'Diferencia'].map(h => (
            <span key={h} style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              textAlign: h === 'Diferencia' ? 'right' : 'left',
            }}>
              {h}
            </span>
          ))}
        </div>

        <FilaComparacion
          label="Efectivo"
          real={cierre.efectivo_real}
          teorico={cierre.total_efectivo_teorico}
        />
        <FilaComparacion
          label="Tarjeta / Posnet"
          real={cierre.tarjeta_real}
          teorico={cierre.total_debito}
        />
        <FilaComparacion
          label="Transferencia"
          real={cierre.transferencia_real}
          teorico={cierre.total_transferencia}
        />
      </div>

      {/* Totales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: 'var(--border)',
        borderTop: '1px solid var(--border-strong)',
      }}>
        {[
          { label: 'Total ingresado', value: totalReal, color: 'var(--color-success, #4caf7d)' },
          { label: 'Gastos del día',  value: cierre.total_gastos ?? 0, color: 'var(--color-danger, #e53e3e)', prefix: '-' },
          {
            label: 'Resultado neto',
            value: resultadoNeto,
            color: resultadoNeto >= 0 ? 'var(--gold)' : 'var(--color-danger, #e53e3e)',
          },
        ].map(({ label, value, color, prefix }) => (
          <div key={label} style={{
            background: 'var(--bg-surface)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 500 }}>
              {label}
            </span>
            <span style={{ fontSize: '18px', fontFamily: 'var(--font-display)', color, fontWeight: 500 }}>
              {prefix}{formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>

      {/* Diferencia total y observaciones */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Diferencia total:</span>
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: difTotal === 0
              ? 'var(--text-muted)'
              : difTotal > 0
                ? 'var(--color-success, #4caf7d)'
                : 'var(--color-danger, #e53e3e)',
          }}>
            {difTotal === 0
              ? 'Sin diferencia ✓'
              : `${difTotal > 0 ? '+' : ''}${formatCurrency(difTotal)}`}
          </span>
        </div>

        {cierre.observaciones && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '360px' }}>
            "{cierre.observaciones}"
          </span>
        )}
      </div>
    </div>
  );
}
