import styles from '../../styles/ui/StatCard.module.css';

export default function StatCard({ label, value, icon, accent = false, trend }) {
  return (
    <div className={`${styles.card} animate-fade ${accent ? styles.accent : ''}`}>
      <div className={styles.top}>
        <span className={styles.cardLabel}>{label}</span>
        <span className={styles.icon}>{icon}</span>
      </div>

      <div className={styles.bottom}>
        <span className={`${styles.value} ${accent ? styles.valueAccent : ''}`}>
          {value}
        </span>
        {trend && (
          <span className={`${styles.trend} ${trend > 0 ? styles.trendUp : styles.trendDown}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
