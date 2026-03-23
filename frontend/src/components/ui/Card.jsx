import styles from '../../styles/ui/Card.module.css';

export default function Card({ children, style = {}, className = '' }) {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
