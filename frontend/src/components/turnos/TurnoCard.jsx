import Badge  from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { formatTime, formatDate, formatDuration, estadoColor } from '../../utils/formatters';
import styles from '../../styles/components/turnos/TurnoCard.module.css';

export default function TurnoCard({ turno, onEdit, onDelete }) {
  const cliente  = turno.cliente  || null;
  const empleado = turno.empleado || {};
  const servicios = turno.servicios?.map(ts => ts.servicio?.nombre || ts.nombre).filter(Boolean) || [];

  const isWalkin = !cliente;

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
    <div className={`${styles.card} ${isWalkin ? styles.walkin : ''}`}>
      {/* Cliente / Walk-in */}
      <div className={styles.clientBlock}>
        {isWalkin ? (
          <div className={styles.walkinIcon}>🚶</div>
        ) : (
          <Avatar nombre={cliente.nombre} apellido={cliente.apellido} size={36} />
        )}
        <div>
          <div className={`${styles.clientName} ${isWalkin ? styles.walkinName : ''}`}>
            {isWalkin ? 'Walk-in' : `${cliente.nombre} ${cliente.apellido || ''}`}
          </div>
          <div className={styles.clientInfo}>
            {isWalkin
              ? (walkinTelefono ? `📱 ${walkinTelefono}` : 'Sin datos')
              : (cliente.telefono || cliente.email || '—')}
          </div>
        </div>
      </div>

      {/* Fecha y profesional */}
      <div className={styles.timeBlock}>
        <div className={styles.timeText}>
          {formatDate(turno.fecha_hora)} · {formatTime(turno.fecha_hora)}
        </div>
        <div className={styles.durationText}>
          {empleado.nombre} {empleado.apellido} · {formatDuration(turno.duracion)}
        </div>
      </div>

      {/* Servicios, estado y monto walk-in */}
      <div className={styles.serviceBlock}>
        <div className={styles.badges}>
          <Badge variant={estadoColor(turno.estado)}>
            {turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}
          </Badge>
          {isWalkin && <Badge variant="warning">Walk-in</Badge>}
        </div>
        {servicios.length > 0 && (
          <div className={styles.serviceList}>
            {servicios.slice(0, 2).join(', ')}{servicios.length > 2 ? ` +${servicios.length - 2}` : ''}
          </div>
        )}
        {isWalkin && walkinMonto && (
          <div className={styles.walkinMonto}>${walkinMonto}</div>
        )}
      </div>

      {/* Acciones */}
      <div className={styles.actions}>
        <Button variant="ghost"  size="sm" onClick={() => onEdit(turno)}>✎</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(turno.id)}>✕</Button>
      </div>
    </div>
  );
}