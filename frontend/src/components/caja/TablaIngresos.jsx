import { formatCurrency, formatTime } from '../../utils/formatters';

const METODO_COLORS = {
  efectivo:      { bg: '#4caf7d20', color: '#4caf7d' },
  débito:        { bg: '#5b8fd920', color: '#5b8fd9' },
  transferencia: { bg: '#c9a84c20', color: '#c9a84c' },
  'no especificado': { bg: '#88888820', color: '#888888' },
};

function MetodoBadge({ metodo }) {
  const key = metodo?.toLowerCase() || 'no especificado';
  const { bg, color } = METODO_COLORS[key] || METODO_COLORS['no especificado'];
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 500, background: bg, color,
    }}>
      {metodo || 'No especificado'}
    </span>
  );
}

function EstadoBadge({ estado }) {
  const color = estado === 'completado' ? '#10b981' : '#3b82f6';
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 500,
      background: `${color}20`, color,
    }}>
      {estado?.charAt(0).toUpperCase() + estado?.slice(1)}
    </span>
  );
}

export default function TablaIngresos({ ingresos = [] }) {
  if (ingresos.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '32px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px',
      }}>
        No hay turnos confirmados o completados para este período.
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Hora', 'Cliente', 'Profesional', 'Servicios', 'Método', 'Estado', 'Monto'].map(h => (
              <th key={h} style={{
                padding: '12px 16px', textAlign: 'left',
                fontSize: '11px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingresos.map((item, i) => (
            <tr key={item.turno_id}
              style={{
                borderBottom: i < ingresos.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 16px', color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                {formatTime(item.fecha_hora)}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {item.cliente}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                {item.empleado}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                {item.servicios?.join(', ') || '—'}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <MetodoBadge metodo={item.metodo_pago} />
              </td>
              <td style={{ padding: '12px 16px' }}>
                <EstadoBadge estado={item.estado} />
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--color-success, #4caf7d)', fontWeight: 500 }}>
                +{formatCurrency(item.monto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}