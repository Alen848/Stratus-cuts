import { useState, useMemo } from 'react';
import { useClientes } from '../hooks/useClientes';
import { useApp }      from '../context/AppContext';
import ClienteModal from '../components/clientes/ClienteModal';
import Avatar    from '../components/ui/Avatar';
import Button    from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function ClientesPage() {
  const { clientes, loading, addCliente, editCliente, removeCliente } = useClientes();
  const { notify } = useApp();

  const [modalOpen, setModalOpen]       = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [search, setSearch]             = useState('');

  const filtrados = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(c =>
      `${c.nombre} ${c.apellido} ${c.email} ${c.telefono}`.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const openCreate = () => { setEditingCliente(null); setModalOpen(true); };
  const openEdit   = (c) => { setEditingCliente(c);  setModalOpen(true); };

  const handleSubmit = async (data) => {
    if (editingCliente) {
      await editCliente(editingCliente.id, data);
      notify('Cliente actualizado');
    } else {
      await addCliente(data);
      notify('Cliente creado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    await removeCliente(id);
    notify('Cliente eliminado');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            width: '300px',
          }}
        />
        <Button variant="primary" onClick={openCreate}>+ Nuevo cliente</Button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon="◎"
          title="Sin clientes"
          description="Agregá tu primer cliente para empezar."
          action={<Button variant="primary" onClick={openCreate}>Agregar cliente</Button>}
        />
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            fontSize: '11px', color: 'var(--text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase',
          }}>
            <span>Cliente</span>
            <span>Contacto</span>
            <span>Dirección</span>
            <span></span>
          </div>
          {filtrados.map((c, i) => (
            <div
              key={c.id}
              className="animate-fade"
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto',
                padding: '14px 20px',
                borderBottom: i < filtrados.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
                animationDelay: `${i * 0.03}s`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar nombre={c.nombre} apellido={c.apellido} size={34} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{c.nombre} {c.apellido}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID #{c.id}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px' }}>{c.email || '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.telefono || '—'}</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.direccion || '—'}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>✎</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>✕</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClienteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        cliente={editingCliente}
      />
    </div>
  );
}