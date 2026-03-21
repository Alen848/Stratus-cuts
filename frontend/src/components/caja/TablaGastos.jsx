import { formatCurrency, formatDateTime } from '../../utils/formatters';

const CATEGORIA_COLORS = {
  alquiler:   { bg: '#5b8fd920', color: '#5b8fd9' },
  productos:  { bg: '#c9a84c20', color: '#c9a84c' },
  sueldos:    { bg: '#9b6dd920', color: '#9b6dd9' },
  servicios:  { bg: '#4caf7d20', color: '#4caf7d' },
  otros:      { bg: '#88888820', color: '#888888' },
};

function CategoriaBadge({ categoria }) {
  const { bg, color } = CATEGORIA_COLORS[categoria] || CATEGORIA_COLORS.otros;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 500,
      background: bg, color,
    }}>
      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
    </span>
  );
}

export default function TablaGastos({ gastos = [], onEdit, onDelete }) {
  if (gastos.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '32px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px',
      }}>
        No hay gastos registrados para este período.
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
            {['Descripción', 'Categoría', 'Fecha', 'Monto', ''].map(h => (
              <th key={h} style={{
                padding: '12px 16px', textAlign: 'left',
                fontSize: '11px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gastos.map((g, i) => (
            <tr
              key={g.id}
              style={{
                borderBottom: i < gastos.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                {g.descripcion}
                {g.observaciones && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {g.observaciones}
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <CategoriaBadge categoria={g.categoria} />
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                {formatDateTime(g.fecha)}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--color-danger, #e53e3e)', fontWeight: 500 }}>
                -{formatCurrency(g.monto)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onEdit(g)}
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete(g.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid transparent', background: 'transparent',
                      color: 'var(--color-danger, #e53e3e)', cursor: 'pointer', fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}