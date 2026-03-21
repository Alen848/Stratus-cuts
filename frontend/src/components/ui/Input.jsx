export default function Input({ label, error, ...props }) {
  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--border-strong)'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {label}
        </label>
      )}
      {props.as === 'select' ? (
        <select style={{ ...inputStyle, cursor: 'pointer' }} {...{ ...props, as: undefined }}>
          {props.children}
        </select>
      ) : props.as === 'textarea' ? (
        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} {...{ ...props, as: undefined }} />
      ) : (
        <input style={inputStyle} {...props} />
      )}
      {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}