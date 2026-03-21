import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { notification } = useApp();
  if (!notification) return null;

  const colors = {
    success: 'var(--success)',
    error:   'var(--danger)',
    warning: 'var(--warning)',
    info:    'var(--info)',
  };

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'i' };
  const color = colors[notification.type] || colors.info;

  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '12px',
      background: 'var(--bg-elevated)',
      border: `1px solid ${color}55`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      boxShadow: 'var(--shadow-lg)',
      animation: 'fadeIn 0.3s ease',
      maxWidth: '360px',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: `${color}22`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, flexShrink: 0,
      }}>
        {icons[notification.type]}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {notification.message}
      </span>
    </div>
  );
}