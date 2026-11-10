import { useState, useEffect, useMemo } from 'react';
import Modal  from '../ui/Modal';
import Button from '../ui/Button';

// "15:30" / "15:30:00" → 930
const aMinutos = (hora) => {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
};

// "2026-11-19T15:30:00(+..)" → { fecha: '2026-11-19', min: 930 }
// Igual que TurnoModal: la hora del turno se toma tal cual viene (hora Argentina).
function partes(fechaHora) {
  const [fecha, hora = '00:00'] = (fechaHora || '').split('+')[0].split('T');
  return { fecha, min: aMinutos(hora) };
}

const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Pasa un turno ya sacado a otro profesional, mismo día y horario.
 * Muestra para cada uno si está libre, ocupado, si no tiene asignado el
 * servicio o si su hora tope para el servicio no alcanza.
 */
export default function ReasignarModal({ isOpen, onClose, onSubmit, turno, empleados = [], servicios = [], turnos = [] }) {
  const [elegido, setElegido] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setElegido(null); }, [turno, isOpen]);

  const opciones = useMemo(() => {
    if (!turno) return [];
    const { fecha, min: inicio } = partes(turno.fecha_hora);
    const fin = inicio + (turno.duracion || 30);
    const serviciosIds = (turno.servicios || [])
      .map(ts => ts.servicio_id || ts.servicio?.id).filter(Boolean);
    const serviciosTurno = servicios.filter(s => serviciosIds.includes(s.id));

    return empleados
      .filter(e => e.activo !== false)
      .map(e => {
        if (e.id === turno.empleado_id) return { empleado: e, estado: 'actual' };

        const ocupado = turnos.some(t => {
          if (t.id === turno.id || t.empleado_id !== e.id) return false;
          if (['cancelado', 'expirado'].includes(t.estado)) return false;
          const p = partes(t.fecha_hora);
          return p.fecha === fecha && inicio < p.min + (t.duracion || 30) && fin > p.min;
        });
        if (ocupado) return { empleado: e, estado: 'ocupado' };

        // Un profesional sin servicios asignados hace todos
        const asignados = e.servicio_ids || [];
        const noLoHace = asignados.length > 0 && serviciosIds.some(id => !asignados.includes(id));

        const topes = serviciosTurno
          .map(s => (s.horas_limite || {})[e.id])
          .filter(Boolean)
          .map(aMinutos);
        const tope = topes.length ? Math.min(...topes) : null;
        const pasaTope = tope !== null && fin > tope;

        return { empleado: e, estado: 'libre', noLoHace, tope: pasaTope ? tope : null };
      });
  }, [turno, empleados, servicios, turnos]);

  if (!turno) return null;

  const { min: inicio } = partes(turno.fecha_hora);
  const cliente = turno.cliente ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim() : 'Sin turno';

  const handleConfirmar = async () => {
    if (!elegido) return;
    try {
      setLoading(true);
      await onSubmit(turno, elegido);
      onClose();
    } catch {
      // el error ya lo notifica el caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reasignar turno" width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{cliente}</strong> · {hhmm(inicio)} hs
          · hoy con <strong style={{ color: 'var(--text-primary)' }}>{turno.empleado?.nombre}</strong>.
          <br />Se mantiene el mismo día y horario; solo cambia el profesional.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {opciones.map(({ empleado: e, estado, noLoHace, tope }) => {
            const deshabilitado = estado !== 'libre';
            const activo = elegido === e.id;
            const avisos = [];
            if (estado === 'actual')  avisos.push('Profesional actual');
            if (estado === 'ocupado') avisos.push('Ocupado/a en ese horario');
            if (noLoHace)             avisos.push('No tiene asignado este servicio');
            if (tope !== null) avisos.push(`Toma este servicio solo hasta las ${hhmm(tope)}`);
            const color = estado === 'libre' && !avisos.length ? '#4caf7d'
              : estado === 'libre' ? 'var(--warning, #d99a3a)' : 'var(--text-muted)';

            return (
              <button
                key={e.id}
                type="button"
                disabled={deshabilitado}
                onClick={() => setElegido(e.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                  fontFamily: 'var(--font-body)', fontSize: '13px',
                  cursor: deshabilitado ? 'not-allowed' : 'pointer',
                  opacity: deshabilitado ? 0.5 : 1,
                  border: activo ? '1px solid var(--gold)' : '1px solid var(--border)',
                  background: activo ? 'var(--gold-dim)' : 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                <span>{activo ? '✓ ' : ''}{e.nombre} {e.apellido || ''}</span>
                <span style={{ fontSize: '11px', color, textAlign: 'right' }}>
                  {avisos.length ? avisos.join(' · ') : 'Libre'}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="button" disabled={!elegido || loading} onClick={handleConfirmar}>
            {loading ? '...' : 'Reasignar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
