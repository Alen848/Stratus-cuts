import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = { nombre: '', apellido: '', telefono: '', direccion: '' };

export default function ClienteModal({ isOpen, onClose, onSubmit, cliente = null }) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const isEdit = Boolean(cliente);

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre:    cliente.nombre    || '',
        apellido:  cliente.apellido  || '',
        telefono:  cliente.telefono  || '',
        direccion: cliente.direccion || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [cliente, isOpen]);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  // Validar teléfono: solo números, entre 8 y 15 dígitos
  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (form.telefono && !/^\d{8,15}$/.test(form.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'Ingresá solo números (8 a 15 dígitos)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      // Limpiar campos vacíos antes de enviar
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '')
      );
      await onSubmit(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Nombre y Apellido */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              required
            />
            {errors.nombre && (
              <span style={{ fontSize: '11px', color: 'var(--color-danger, #e53e3e)', marginTop: '4px', display: 'block' }}>
                {errors.nombre}
              </span>
            )}
          </div>
          <Input
            label="Apellido"
            value={form.apellido}
            onChange={e => set('apellido', e.target.value)}
          />
        </div>

        {/* Teléfono */}
        <div>
          <Input
            label="Teléfono"
            type="tel"
            value={form.telefono}
            onChange={e => set('telefono', e.target.value)}
            placeholder="Ej: 2231234567"
          />
          {errors.telefono && (
            <span style={{ fontSize: '11px', color: 'var(--color-danger, #e53e3e)', marginTop: '4px', display: 'block' }}>
              {errors.telefono}
            </span>
          )}
        </div>

        {/* Dirección */}
        <Input
          label="Dirección (opcional)"
          value={form.direccion}
          onChange={e => set('direccion', e.target.value)}
          placeholder="Ej: Av. Colón 1234"
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}