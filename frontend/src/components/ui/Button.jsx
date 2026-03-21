export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
    borderRadius: 'var(--radius-sm)',
  };

  const sizes = {
    sm: { padding: '5px 12px', fontSize: '12px' },
    md: { padding: '9px 18px', fontSize: '13px' },
    lg: { padding: '12px 24px', fontSize: '14px' },
  };

  const variants = {
    primary: {
      background: 'var(--gold)',
      color: '#0b0a0a',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'rgba(217, 95, 95, 0.12)',
      color: 'var(--danger)',
      border: '1px solid rgba(217, 95, 95, 0.3)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}