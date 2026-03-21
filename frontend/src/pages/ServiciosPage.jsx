import { useState } from 'react';
import { useServicios } from '../hooks/useServicios';
import { useApp }       from '../context/AppContext';
import ServicioModal from '../components/servicios/ServicioModal';
import Button    from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { formatDuration } from '../utils/formatters';

const CATEGORY_ICONS = ['✂', '◈', '✦', '◆', '◉', '❋'];

export default function ServiciosPage() {
  const { servicios, loading, addServicio } = useServicios();
  const { notify }    = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (data) => {
    await addServicio(data);
    notify('Servicio creado');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Nuevo servicio</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : servicios.length === 0 ? (
        <EmptyState
          icon="◆"
          title="Sin servicios"
          description="Cargá los servicios que ofrece tu peluquería."
          action={<Button variant="primary" onClick={() => setModalOpen(true)}>Crear servicio</Button>}
        />
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 2fr 3fr 1fr 1fr',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            fontSize: '11px', color: 'var(--text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase',
          }}>
            <span></span>
            <span>Servicio</span>
            <span>Descripción</span>
            <span>Duración</span>
            <span>Precio</span>
          </div>
          {servicios.map((s, i) => (
            <div
              key={s.id}
              className="animate-fade"
              style={{
                display: 'grid', gridTemplateColumns: '36px 2fr 3fr 1fr 1fr',
                padding: '16px 20px',
                borderBottom: i < servicios.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
                animationDelay: `${i * 0.04}s`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--gold)', fontSize: '16px' }}>
                {CATEGORY_ICONS[i % CATEGORY_ICONS.length]}
              </span>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>{s.nombre}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingRight: '16px' }}>
                {s.descripcion || '—'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {formatDuration(s.duracion_minutos)}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 500 }}>
                ${s.precio?.toLocaleString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      )}

      <ServicioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}