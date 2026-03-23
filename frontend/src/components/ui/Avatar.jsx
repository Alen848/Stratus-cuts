import styles from '../../styles/ui/Avatar.module.css';

const COLORS = ['#c9a84c', '#5b8fd9', '#4caf7d', '#d95f5f', '#9b6dd9', '#e09b3d'];

function colorFromName(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function safeInitials(nombre, apellido) {
  const n = (nombre   != null ? String(nombre)   : '').charAt(0);
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
        className={styles.img}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
        color,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
