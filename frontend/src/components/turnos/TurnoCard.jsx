import Badge  from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { formatTime, formatDate, formatDuration, estadoColor } from '../../utils/formatters';

export default function TurnoCard({ turno, onEdit, onDelete }) {
  const cliente  = turno.cliente  || null;
  const empleado = turno.empleado || {};
  const servicios = turno.servicios?.map(ts => ts.servicio?.nombre || ts.nombre).filter(Boolean) || [];

  // Detectar si es walk-in (sin cliente asociado)
  const isWalkin = !cliente;

  // Intentar extraer teléfono de observaciones si es walk-in
  // Formato guardado: "... | Tel: 2231234567 | Monto: $5000"
  const walkinTelefono = (() => {
    if (!isWalkin || !turno.observaciones) return null;
    const match = turno.observaciones.match(/Tel:\s*([\d]+)/);
    return match ? match[1] : null;
  })();

  const walkinMonto = (() => {
    if (!isWalkin || !turno.observaciones) return null;
    const match = turno.observaciones.match(/Monto:\s*\$([\d.,]+)/);
    return match ? match[1] : null;
  })();

  return (
    <div
      className="animate-fade"
      style={{
        background:    'var(--bg-surface)',
        border:        `1px solid ${isWalkin ? 'rgba(180,140,60,0.2)' : 'var(--border)'}`,
        borderRadius:  'var(--radius-md)',
        padding:       '16px 20px',
        display:       'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        alignItems:    'center',
        gap:           '16px',
        transition:    'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isWalkin ? 'rgba(180,140,60,0.45)' : 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isWalkin ? 'rgba(180,140,60,0.2)'  : 'var(--border)'}
    >
      {/* Cliente / Walk-in */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isWalkin ? (
          /* Ícono genérico para walk-in */
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>
            🚶
          </div>
        ) : (
          <Avatar nombre={cliente.nombre} apellido={cliente.apellido} size={36} />
        )}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: isWalkin ? 'var(--gold)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isWalkin ? 'Walk-in' : `${cliente.nombre} ${cliente.apellido || ''}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {isWalkin
              ? (walkinTelefono ? `📱 ${walkinTelefono}` : 'Sin datos')
              : (cliente.telefono || cliente.email || '—')}
          </div>
        </div>
      </div>

      {/* Fecha y profesional */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
          {formatDate(turno.fecha_hora)} · {formatTime(turno.fecha_hora)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {empleado.nombre} {empleado.apellido} · {formatDuration(turno.duracion)}
        </div>
      </div>

      {/* Servicios, estado y monto walk-in */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Badge variant={estadoColor(turno.estado)}>
            {turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}
          </Badge>
          {isWalkin && (
            <Badge variant="warning">Walk-in</Badge>
          )}
        </div>
        {servicios.length > 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {servicios.slice(0, 2).join(', ')}{servicios.length > 2 ? ` +${servicios.length - 2}` : ''}
          </div>
        )}
        {isWalkin && walkinMonto && (
          <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 500 }}>
            ${walkinMonto}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <Button variant="ghost"  size="sm" onClick={() => onEdit(turno)}>✎</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(turno.id)}>✕</Button>
      </div>
    </div>
  );
}