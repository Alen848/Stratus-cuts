import { useState } from 'react';
import { useServicios }  from '../hooks/useServicios';
import { useCategorias } from '../hooks/useCategorias';
import { useEmpleados }  from '../hooks/useEmpleados';
import { useApp }        from '../context/AppContext';
import ServicioModal  from '../components/servicios/ServicioModal';
import CategoriaModal from '../components/servicios/CategoriaModal';
import Button    from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { formatDuration } from '../utils/formatters';

const CATEGORY_ICONS = ['✂', '◈', '✦', '◆', '◉', '❋'];

const GRID = '36px 2fr 3fr 1fr 1fr auto';

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fechaCorta = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

export default function ServiciosPage() {
  const { servicios, loading, refetch: refetchServicios, addServicio, editServicio, removeServicio } = useServicios();
  const {
    categorias, loading: loadingCategorias,
    addCategoria, editCategoria, removeCategoria,
  } = useCategorias();
  const { empleados, refetch: refetchEmpleados } = useEmpleados();
  const { notify } = useApp();

  const [modalOpen, setModalOpen]                 = useState(false);
  const [editingServicio, setEditingServicio]     = useState(null);
  const [categoriaDestino, setCategoriaDestino]   = useState(null);
  const [catModalOpen, setCatModalOpen]           = useState(false);
  const [editingCategoria, setEditingCategoria]   = useState(null);
  // El modal es el mismo, pero en "modo evento" pide fechas y oculta la categoría
  const [modoEvento, setModoEvento]               = useState(false);

  const openCreate = (categoriaId = null) => {
    setEditingServicio(null);
    setCategoriaDestino(categoriaId);
    setModoEvento(false);
    setModalOpen(true);
  };
  const openCreateEvento = () => {
    setEditingServicio(null);
    setCategoriaDestino(null);
    setModoEvento(true);
    setModalOpen(true);
  };
  const openEdit = (s) => {
    setEditingServicio(s);
    setCategoriaDestino(null);
    setModoEvento(Boolean(s.es_evento_especial));
    setModalOpen(true);
  };

  const openCreateCategoria = () => { setEditingCategoria(null); setCatModalOpen(true); };
  const openEditCategoria   = (c) => { setEditingCategoria(c);   setCatModalOpen(true); };

  const handleSubmit = async (data) => {
    try {
      if (editingServicio) {
        await editServicio(editingServicio.id, data);
        notify('Servicio actualizado');
      } else {
        await addServicio(data);
        notify('Servicio creado');
      }
      // Asignar profesionales cambia sus servicio_ids: hay que releerlos para
      // que el aviso de "pasa a hacer solo lo asignado" siga siendo correcto.
      await refetchEmpleados();
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Error al guardar el servicio';
      notify(msg, 'error');
      throw e;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este servicio? No podrás eliminarlo si ya fue usado en turnos.')) return;
    try {
      await removeServicio(id);
      notify('Servicio eliminado');
    } catch (e) {
      const msg = e?.response?.data?.detail || 'No se pudo eliminar el servicio';
      notify(msg, 'error');
    }
  };

  const handleSubmitCategoria = async (data) => {
    try {
      if (editingCategoria) {
        await editCategoria(editingCategoria.id, data);
        notify('Categoría actualizada');
      } else {
        await addCategoria(data);
        notify('Categoría creada');
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Error al guardar la categoría';
      notify(msg, 'error');
      throw e;
    }
  };

  const handleDeleteCategoria = async (cat, cantidad) => {
    const aviso = cantidad > 0
      ? `¿Eliminar la categoría "${cat.nombre}"? Sus ${cantidad} servicio(s) no se borran: quedan sin categoría.`
      : `¿Eliminar la categoría "${cat.nombre}"?`;
    if (!window.confirm(aviso)) return;
    try {
      await removeCategoria(cat.id);
      // Los servicios que colgaban de ella quedaron sueltos: hay que releerlos
      await refetchServicios();
      notify('Categoría eliminada');
    } catch (e) {
      const msg = e?.response?.data?.detail || 'No se pudo eliminar la categoría';
      notify(msg, 'error');
    }
  };

  // Los eventos especiales no viven en ninguna categoría: tienen su propio bloque
  // acá arriba y su propia sección en la página de reservas.
  const eventos   = servicios.filter(s => s.es_evento_especial);
  const normales  = servicios.filter(s => !s.es_evento_especial);

  // Agrupamos: cada categoría con sus servicios + un grupo final "Sin categoría"
  const grupos = [
    ...categorias.map(cat => ({
      key: `cat-${cat.id}`,
      categoria: cat,
      servicios: normales.filter(s => s.categoria_id === cat.id),
    })),
    {
      key: 'sin-categoria',
      categoria: null,
      servicios: normales.filter(s => !s.categoria_id),
    },
  ].filter(g => g.categoria || g.servicios.length > 0);

  const cargando = loading || loadingCategorias;

  const renderFilaServicio = (s, i, total) => (
    <div
      key={s.id}
      className="animate-fade"
      style={{
        display: 'grid', gridTemplateColumns: GRID,
        padding: '16px 20px',
        borderBottom: i < total - 1 ? '1px solid var(--border)' : 'none',
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
      <div style={{
        fontSize: '12px', color: 'var(--text-secondary)', paddingRight: '16px',
        whiteSpace: 'pre-line', lineHeight: 1.5,   // respeta los saltos de línea del dueño
      }}>
        {s.descripcion || '—'}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {formatDuration(s.duracion_minutos)}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 500 }}>
        ${s.precio?.toLocaleString('es-AR')}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>✎</Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>✕</Button>
      </div>
    </div>
  );

  // Fila de un evento: en vez de la descripción, lo que importa son sus fechas
  const renderFilaEvento = (s, i, total) => {
    const fechas    = s.fechas_especiales || [];
    const futuras   = fechas.filter(f => f >= hoyISO());
    const vencido   = futuras.length === 0;
    return (
      <div
        key={s.id}
        className="animate-fade"
        style={{
          display: 'grid', gridTemplateColumns: GRID,
          padding: '16px 20px',
          borderBottom: i < total - 1 ? '1px solid var(--border)' : 'none',
          alignItems: 'center',
          animationDelay: `${i * 0.04}s`,
        }}
      >
        <span style={{ color: 'var(--gold)', fontSize: '16px' }}>◈</span>
        <div style={{ fontWeight: 500, fontSize: '13px' }}>{s.nombre}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingRight: '16px' }}>
          {vencido ? (
            <span style={{ fontSize: '11px', color: 'var(--warning, #d99a3a)' }}>
              ⚠ Sin fechas próximas — no se le muestra al cliente
            </span>
          ) : (
            futuras.map(f => (
              <span
                key={f}
                style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                  border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
                  color: 'var(--gold)', whiteSpace: 'nowrap',
                }}
              >
                {fechaCorta(f)}
              </span>
            ))
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {formatDuration(s.duracion_minutos)}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 500 }}>
          ${s.precio?.toLocaleString('es-AR')}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>✎</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>✕</Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Agrupá tus servicios en categorías (ej: “Cosmetología”). En la página de reservas
          el cliente ve la categoría y, al tocarla, elige el servicio con su precio.
        </span>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <Button variant="ghost" onClick={openCreateCategoria}>+ Nueva categoría</Button>
          <Button variant="ghost" onClick={openCreateEvento}>◈ Nuevo evento</Button>
          <Button variant="primary" onClick={() => openCreate(null)}>+ Nuevo servicio</Button>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : servicios.length === 0 && categorias.length === 0 ? (
        <EmptyState
          icon="◆"
          title="Sin servicios"
          description="Cargá los servicios que ofrece tu salón. Podés agruparlos en categorías."
          action={<Button variant="primary" onClick={() => openCreate(null)}>Crear servicio</Button>}
        />
      ) : (
        <>
        {/* Eventos especiales: bloque propio, fuera de las categorías */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '12px', padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--gold-dim)',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>
                ◈ Eventos especiales
                <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Servicios que se hacen solo ciertos días. El cliente los ve en una sección
                aparte y solo puede reservarlos en esas fechas.
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Button variant="ghost" size="sm" onClick={openCreateEvento}>+ evento</Button>
            </div>
          </div>

          {eventos.length === 0 ? (
            <div style={{ padding: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Todavía no hay eventos. Creá uno para un servicio que se hace una vez al mes,
              por ejemplo una jornada de depilación láser.
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: GRID,
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                fontSize: '11px', color: 'var(--text-muted)',
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                <span></span>
                <span>Evento</span>
                <span>Próximas fechas</span>
                <span>Duración</span>
                <span>Precio</span>
                <span></span>
              </div>
              {eventos.map((s, i) => renderFilaEvento(s, i, eventos.length))}
            </>
          )}
        </div>

        {grupos.map(({ key, categoria, servicios: items }) => (
          <div
            key={key}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Cabecera del grupo */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '12px', padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-hover)',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {categoria ? categoria.nombre : 'Sin categoría'}
                  <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {items.length} {items.length === 1 ? 'servicio' : 'servicios'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {categoria
                    ? (categoria.descripcion || 'Sin precio propio: el precio vive en cada servicio.')
                    : 'Estos servicios se muestran sueltos en la reserva.'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {categoria && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => openCreate(categoria.id)}>+ servicio</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditCategoria(categoria)}>✎</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCategoria(categoria, items.length)}>✕</Button>
                  </>
                )}
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Todavía no hay servicios en esta categoría.
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid', gridTemplateColumns: GRID,
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
                  <span></span>
                </div>
                {items.map((s, i) => renderFilaServicio(s, i, items.length))}
              </>
            )}
          </div>
        ))}
        </>
      )}

      <ServicioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        servicio={editingServicio}
        categorias={categorias}
        categoriaIdPorDefecto={categoriaDestino}
        empleados={empleados}
        modoEvento={modoEvento}
      />

      <CategoriaModal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSubmit={handleSubmitCategoria}
        categoria={editingCategoria}
      />
    </div>
  );
}
