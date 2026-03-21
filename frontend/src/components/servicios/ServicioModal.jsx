import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = { nombre: '', descripcion: '', precio: '', duracion_minutos: '' };

export default function ServicioModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) setForm(defaultForm);
  }, [isOpen]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit({
        ...form,
        precio:            Number(form.precio),
        duracion_minutos:  Number(form.duracion_minutos),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Servicio">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Nombre del servicio" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Corte de cabello" />
        <Input label="Descripción" as="textarea" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional..." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Precio ($)" type="number" min="0" step="0.01" value={form.precio} onChange={e => set('precio', e.target.value)} required />
          <Input label="Duración (minutos)" type="number" min="5" step="5" value={form.duracion_minutos} onChange={e => set('duracion_minutos', e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : 'Crear servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}