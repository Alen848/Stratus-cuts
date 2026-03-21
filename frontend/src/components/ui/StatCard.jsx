export default function StatCard({ label, value, icon, accent = false, trend }) {
  return (
    <div
      className="animate-fade"
      style={{
        background: accent ? 'linear-gradient(135deg, var(--gold-dim), rgba(201,168,76,0.05))' : 'var(--bg-surface)',
        border: `1px solid ${accent ? 'var(--gold-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '36px',
          fontWeight: 400,
          lineHeight: 1,
          color: accent ? 'var(--gold)' : 'var(--text-primary)',
        }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: '11px', fontWeight: 500,
            color: trend > 0 ? 'var(--success)' : 'var(--danger)',
            marginBottom: '4px',
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}