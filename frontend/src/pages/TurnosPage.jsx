import { useState, useMemo } from 'react';
import { useTurnos }    from '../hooks/useTurnos';
import { useClientes }  from '../hooks/useClientes';
import { useEmpleados } from '../hooks/useEmpleados';
import { useServicios } from '../hooks/useServicios';
import { useApp }       from '../context/AppContext';
import TurnoCard   from '../components/turnos/TurnoCard';
import TurnoModal  from '../components/turnos/TurnoModal';
import Button      from '../components/ui/Button';
import EmptyState  from '../components/ui/EmptyState';

const FILTROS = ['todos', 'pendiente', 'confirmado', 'completado', 'cancelado'];

function formatDayLabel(date) {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// FIX: interpreta la fecha del turno como hora local (no UTC)
function turnoLocalDate(fechaHora) {
  if (!fechaHora) return '';
  const str = fechaHora.includes('T') ? fechaHora : fechaHora.replace(' ', 'T');
  // Si no tiene offset, tratarlo como hora local Argentina (naive)
  const hasOffset = str.includes('+') || /[-+]\d{2}:\d{2}$/.test(str) || str.endsWith('Z');
  const d = hasOffset ? new Date(str) : new Date(str.replace('T', ' '));
  return toLocalDateStr(d);
}

export default function TurnosPage() {
  const { turnos, loading, addTurno, editTurno, removeTurno, refetch } = useTurnos();
  const { clientes }  = useClientes();
  const { empleados } = useEmpleados();
  const { servicios } = useServicios();
  const { notify }    = useApp();

  const [modalOpen, setModalOpen]       = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [search, setSearch]             = useState('');
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));

  const moveDay = (delta) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toLocalDateStr(d));
  };

  const isToday = selectedDate === toLocalDateStr(new Date());

  const filtrados = useMemo(() => {
    let list = [...turnos]
      .filter(t => turnoLocalDate(t.fecha_hora) === selectedDate)
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

    if (filtroEstado !== 'todos') list = list.filter(t => t.estado === filtroEstado);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => {
        const c = t.cliente  || {};
        const e = t.empleado || {};
        return (
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
          `${e.nombre} ${e.apellido}`.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [turnos, filtroEstado, search, selectedDate]);

  const conteosDia = useMemo(() => {
    const del_dia = turnos.filter(t => turnoLocalDate(t.fecha_hora) === selectedDate);
    return {
      total:      del_dia.length,
      pendiente:  del_dia.filter(t => t.estado === 'pendiente').length,
      confirmado: del_dia.filter(t => t.estado === 'confirmado').length,
      completado: del_dia.filter(t => t.estado === 'completado').length,
      cancelado:  del_dia.filter(t => t.estado === 'cancelado').length,
    };
  }, [turnos, selectedDate]);

  const openCreate = () => { setEditingTurno(null); setModalOpen(true); };
  const openEdit   = (t)  => { setEditingTurno(t);  setModalOpen(true); };

  // FIX: retorna el turno para que TurnoModal pueda pasarlo al PagoModal
  const handleSubmit = async (data) => {
    try {
      let resultado;
      if (editingTurno) {
        resultado = await editTurno(editingTurno.id, data);
        notify('Turno actualizado correctamente');
      } else {
        resultado = await addTurno(data);
        notify('Turno creado correctamente');
      }
      return resultado; // ← necesario para que TurnoModal obtenga el id
    } catch (e) {
      console.error("Error en submit:", e);
      let msg = 'Ocurrió un error';
      if (e.response?.status === 422) {
        // Los errores 422 de FastAPI vienen en un array 'detail'
        const detail = e.response.data?.detail;
        msg = Array.isArray(detail) 
          ? detail.map(err => `${err.loc[1]}: ${err.msg}`).join(', ')
          : (typeof detail === 'string' ? detail : 'Datos inválidos');
      } else {
        msg = e.response?.data?.detail || e.message || msg;
      }
      notify(msg, 'error');
      throw e;
    }
  };

  // Se llama cuando el pago se registra exitosamente desde el PagoModal
  const handlePagoRegistrado = () => {
    notify('Cobro registrado correctamente ✓');
    // Refrescar lista de turnos para reflejar el estado "completado"
    if (refetch) refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este turno?')) return;
    await removeTurno(id);
    notify('Turno eliminado');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Selector de día ── */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => moveDay(-1)}
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >‹</button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '200px' }}>
            <span style={{
              fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', textTransform: 'capitalize',
            }}>
              {formatDayLabel(new Date(selectedDate + 'T00:00:00'))}
              {isToday && (
                <span style={{
                  marginLeft: '8px', fontSize: '10px', fontFamily: 'var(--font-body)',
                  fontWeight: 400, color: 'var(--gold)', background: 'var(--gold-dim)',
                  border: '1px solid var(--gold-border)', padding: '1px 7px',
                  borderRadius: '99px', verticalAlign: 'middle',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>Hoy</span>
              )}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {conteosDia.total} turno{conteosDia.total !== 1 ? 's' : ''} en este día
            </span>
          </div>

          <button
            onClick={() => moveDay(1)}
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >›</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(toLocalDateStr(new Date()))}
              style={{
                padding: '6px 14px', borderRadius: '6px',
                border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
                color: 'var(--gold)', cursor: 'pointer', fontSize: '12px',
                fontFamily: 'var(--font-body)', fontWeight: 500,
              }}
            >
              Ir a hoy
            </button>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              background: 'var(--bg-base)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)', padding: '6px 10px',
              color: 'var(--text-primary)', fontSize: '13px',
              fontFamily: 'var(--font-body)', colorScheme: 'dark', cursor: 'pointer',
            }}
          />
        </div>

        {conteosDia.total > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Pendientes',  val: conteosDia.pendiente,  color: '#f59e0b' },
              { label: 'Confirmados', val: conteosDia.confirmado, color: '#3b82f6' },
              { label: 'Completados', val: conteosDia.completado, color: '#10b981' },
              { label: 'Cancelados',  val: conteosDia.cancelado,  color: '#6b7280' },
            ].filter(x => x.val > 0).map(({ label, val, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '99px',
                border: `1px solid ${color}30`, background: `${color}12`,
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '11px', color, fontWeight: 500 }}>{val}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 300 }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              style={{
                padding: '6px 14px', borderRadius: '99px', fontSize: '12px',
                fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s',
                background: filtroEstado === f ? 'var(--gold-dim)' : 'transparent',
                color:      filtroEstado === f ? 'var(--gold)'     : 'var(--text-muted)',
                border:     filtroEstado === f ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                fontWeight: filtroEstado === f ? 500 : 400,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente o profesional..."
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)', padding: '8px 14px',
              color: 'var(--text-primary)', fontSize: '13px',
              fontFamily: 'var(--font-body)', width: '240px',
            }}
          />
          <Button variant="primary" onClick={openCreate}>+ Nuevo turno</Button>
        </div>
      </div>

      {/* ── Lista de turnos ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon="◷"
          title={`Sin turnos el ${formatDayLabel(new Date(selectedDate + 'T00:00:00'))}`}
          description="No hay turnos que coincidan con los filtros seleccionados para este día."
          action={<Button variant="primary" onClick={openCreate}>Crear turno</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtrados.map(t => (
            <TurnoCard key={t.id} turno={t} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <TurnoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onPagoRegistrado={handlePagoRegistrado}
        turno={editingTurno}
        clientes={clientes}
        empleados={empleados}
        servicios={servicios}
        turnos={turnos}
      />
    </div>
  );
}