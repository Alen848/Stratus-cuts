import { useTheme } from '../../context/ThemeContext';
import styles from '../../styles/ui/ThemeToggle.module.css';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      className={styles.btn}
      onClick={toggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className={`${styles.thumb} ${isDark ? '' : styles.thumbLight}`}>
        <span className={styles.icon}>{isDark ? '🌙' : '☀️'}</span>
      </span>
    </button>
  );
}
