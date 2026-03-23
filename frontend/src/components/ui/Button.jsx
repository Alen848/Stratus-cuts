import styles from '../../styles/ui/Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  type = 'button',
  style = {},
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[size]} ${styles[variant]}`}
      style={style}
    >
      {children}
    </button>
  );
}
