import styles from '../../styles/ui/Badge.module.css';

const variantMap = {
  success: { bg: 'var(--success)', label: 'Completado' },
  warning: { bg: 'var(--warning)', label: 'Pendiente'  },
  danger:  { bg: 'var(--danger)',  label: 'Cancelado'  },
  info:    { bg: 'var(--info)',    label: 'Confirmado' },
  default: { bg: 'var(--text-muted)', label: ''        },
};

export default function Badge({ variant = 'default', children }) {
  const color = variantMap[variant]?.bg ?? variantMap.default.bg;

  return (
    <span
      className={styles.badge}
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      <span className={styles.dot} style={{ background: color }} />
      {children}
    </span>
  );
}
