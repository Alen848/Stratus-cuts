import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = { nombre: '', apellido: '', email: '', telefono: '', especialidad: '' };

export default function EmpleadoModal({ isOpen, onClose, onSubmit }) {
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
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Profesional">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
          <Input label="Apellido" value={form.apellido} onChange={e => set('apellido', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Teléfono" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
        </div>
        <Input label="Especialidad" value={form.especialidad} placeholder="Ej: Colorista, Estilista..." onChange={e => set('especialidad', e.target.value)} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : 'Agregar profesional'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}