import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = { nombre: '', descripcion: '', orden: '' };

export default function CategoriaModal({ isOpen, onClose, onSubmit, categoria = null }) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(categoria);

  useEffect(() => {
    if (categoria) {
      setForm({
        nombre:      categoria.nombre      || '',
        descripcion: categoria.descripcion || '',
        orden:       String(categoria.orden ?? ''),
      });
    } else {
      setForm(defaultForm);
    }
  }, [categoria, isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit({
        nombre:      form.nombre,
        descripcion: form.descripcion,
        orden:       Number(form.orden) || 0,
      });
      onClose();
    } catch {
      // el error ya fue manejado por el caller con notify
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar categoría' : 'Nueva categoría'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="Nombre de la categoría"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          required
          placeholder="Ej: Cosmetología"
        />
        <Input
          label="Descripción"
          as="textarea"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Se muestra debajo del nombre en la reserva (opcional)..."
        />
        <Input
          label="Orden"
          type="number"
          min="0"
          step="1"
          value={form.orden}
          onChange={e => set('orden', e.target.value)}
          placeholder="0"
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px' }}>
          Menor número = aparece primero en la página de reservas.
        </span>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
