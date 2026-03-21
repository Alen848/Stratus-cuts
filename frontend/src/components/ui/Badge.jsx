const variantMap = {
  success: { bg: 'var(--success)', label: 'Completado' },
  warning: { bg: 'var(--warning)', label: 'Pendiente' },
  danger:  { bg: 'var(--danger)',  label: 'Cancelado' },
  info:    { bg: 'var(--info)',    label: 'Confirmado' },
  default: { bg: 'var(--text-muted)', label: '' },
};

export default function Badge({ variant = 'default', children }) {
  const color = variantMap[variant]?.bg || variantMap.default.bg;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 10px',
        borderRadius: '99px',
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {children}
    </span>
  );
}