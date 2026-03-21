const COLORS = ['#c9a84c', '#5b8fd9', '#4caf7d', '#d95f5f', '#9b6dd9', '#e09b3d'];

function colorFromName(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

// Inline para no depender del formatters.js en caso de error
function safeInitials(nombre, apellido) {
  const n = (nombre  != null ? String(nombre)  : '').charAt(0);
  const a = (apellido != null ? String(apellido) : '').charAt(0);
  return (n + a).toUpperCase() || '?';
}

export default function Avatar({ nombre = '', apellido = '', size = 36, src }) {
  const initials = safeInitials(nombre, apellido);
  const color    = colorFromName(String(nombre ?? '') + String(apellido ?? ''));

  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: '2px solid var(--border)',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}22`,
      border: `1.5px solid ${color}55`,
      color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: size * 0.38,
      fontWeight: 500,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}