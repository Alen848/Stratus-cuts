import Badge  from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { formatTime, formatDate, formatDuration, estadoColor, formatCurrency } from '../../utils/formatters';
import styles from '../../styles/components/turnos/TurnoCard.module.css';

const ESTADO_LABEL = {
  pendiente: 'Pendiente', confirmado: 'Confirmado', completado: 'Completado',
  cancelado: 'Cancelado', no_show: 'No vino', pendiente_pago: 'Esperando pago', expirado: 'Expirado',
};

const chip = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 8px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600,
  background: bg, color, whiteSpace: 'nowrap',
});

const ghostMini = {
  padding: '5px 9px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px',
  cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
};

export default function TurnoCard({ turno, onEdit, onDelete, onCobrar, onMarcar }) {
  const cliente  = turno.cliente  || null;
  const empleado = turno.empleado || {};
  const servicios = turno.servicios?.map(ts => ts.servicio?.nombre || ts.nombre).filter(Boolean) || [];

  const isWalkin = !cliente;

  const saldo      = turno.saldo != null ? turno.saldo : null;
  const completado = turno.estado === 'completado';
  const senaPagada = turno.sena_estado === 'pagada' && (turno.monto_sena || 0) > 0;
  // Cobrable = turno activo en el local con saldo pendiente
  const cobrable   = ['pendiente', 'confirmado'].includes(turno.estado) && (saldo == null || saldo > 0);

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
    <div className={`${styles.card} ${isWalkin ? styles.walkin : ''}`}
      style={completado ? { opacity: 0.62 } : undefined}>
      {/* Cliente / Walk-in */}
      <div className={styles.clientBlock}>
        {isWalkin ? (
          <div className={styles.walkinIcon}>🚶</div>
        ) : (
          <Avatar nombre={cliente.nombre} apellido={cliente.apellido} size={36} />
        )}
        <div>
          <div className={`${styles.clientName} ${isWalkin ? styles.walkinName : ''}`}>
            {isWalkin ? 'Sin turno' : `${cliente.nombre} ${cliente.apellido || ''}`}
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

      {/* Servicios, estado y pago */}
      <div className={styles.serviceBlock}>
        <div className={styles.badges} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge variant={estadoColor(turno.estado)}>
            {ESTADO_LABEL[turno.estado] || turno.estado}
          </Badge>
          {isWalkin && <Badge variant="warning">Sin turno</Badge>}
          {senaPagada && !completado && (
            <span style={chip('rgba(76,175,125,0.14)', '#4caf7d')}>Seña ✓ {formatCurrency(turno.monto_sena)}</span>
          )}
          {cobrable && saldo != null && saldo > 0 && (
            <span style={chip('rgba(224,163,58,0.16)', '#e0a33a')}>Restan {formatCurrency(saldo)}</span>
          )}
          {completado && (
            <span style={chip('rgba(76,175,125,0.14)', '#4caf7d')}>Pagado ✓</span>
          )}
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
      <div className={styles.actions} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
        {cobrable && (
          <button onClick={() => onCobrar?.(turno)} title="Cobrar y completar"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-border)', background: 'var(--gold-dim)', color: 'var(--gold)', fontSize: '12.5px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid currentColor', display: 'inline-block' }} />
            Cobrado
          </button>
        )}
        {cobrable && (
          <>
            <button onClick={() => onMarcar?.(turno, 'no_show')} title="El cliente no vino" style={ghostMini}>No vino</button>
            <button onClick={() => onMarcar?.(turno, 'cancelado')} title="Cancelar turno" style={ghostMini}>Cancelar</button>
          </>
        )}
        <Button variant="ghost"  size="sm" onClick={() => onEdit(turno)}>✎</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(turno.id)}>✕</Button>
      </div>
    </div>
  );
}
