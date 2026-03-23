import { useApp } from '../../context/AppContext';
import styles from '../../styles/ui/Toast.module.css';

const COLORS = {
  success: 'var(--success)',
  error:   'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--info)',
};
const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'i' };

export default function Toast() {
  const { notification } = useApp();
  if (!notification) return null;

  const color = COLORS[notification.type] ?? COLORS.info;

  return (
    <div
      className={styles.toast}
      style={{
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span
        className={styles.iconWrap}
        style={{ background: `${color}22`, color }}
      >
        {ICONS[notification.type]}
      </span>
      <span className={styles.message}>{notification.message}</span>
    </div>
  );
}
