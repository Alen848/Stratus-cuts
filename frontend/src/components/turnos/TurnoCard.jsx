import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { formatTime, formatDate, formatDuration, estadoColor } from '../../utils/formatters';

export default function TurnoCard({ turno, onEdit, onDelete }) {
  const cliente  = turno.cliente  || {};
  const empleado = turno.empleado || {};
  const servicios = turno.servicios?.map(ts => ts.servicio?.nombre || ts.nombre).filter(Boolean) || [];

  return (
    <div
      className="animate-fade"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        alignItems: 'center',
        gap: '16px',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Cliente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Avatar nombre={cliente.nombre} apellido={cliente.apellido} size={36} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {cliente.nombre} {cliente.apellido}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {cliente.telefono || cliente.email || '—'}
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

      {/* Servicios y estado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Badge variant={estadoColor(turno.estado)}>
          {turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}
        </Badge>
        {servicios.length > 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {servicios.slice(0, 2).join(', ')}{servicios.length > 2 ? ` +${servicios.length - 2}` : ''}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <Button variant="ghost" size="sm" onClick={() => onEdit(turno)}>✎</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(turno.id)}>✕</Button>
      </div>
    </div>
  );
}