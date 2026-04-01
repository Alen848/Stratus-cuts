import { useState, useEffect } from 'react';
import Modal  from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../api/axios';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function HorarioRow({ dia, diaIdx, initialHorario, onSave, loading }) {
  const [inicio, setInicio] = useState(initialHorario?.hora_inicio?.slice(0,5) || '10:00');
  const [fin, setFin]       = useState(initialHorario?.hora_fin?.slice(0,5)    || '20:00');
  const activo = !!initialHorario;

  // Actualizar estados locales si initialHorario cambia (desde el padre)
  useEffect(() => {
    if (initialHorario) {
      setInicio(initialHorario.hora_inicio?.slice(0,5));
      setFin(initialHorario.hora_fin?.slice(0,5));
    }
  }, [initialHorario]);

  return (
    <div style={{ 
      display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px', 
      alignItems: 'center', gap: '10px', padding: '8px',
      borderBottom: '1px solid var(--border)',
      background: activo ? 'var(--gold-dim)' : 'transparent',
      borderRadius: '4px'
    }}>
      <span style={{ fontSize: '13px', fontWeight: activo ? 600 : 400 }}>{dia}</span>
      <input 
        type="time" 
        value={inicio} 
        onChange={e => setInicio(e.target.value)} 
        disabled={loading} 
        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} 
      />
      <input 
        type="time" 
        value={fin}    
        onChange={e => setFin(e.target.value)}    
        disabled={loading} 
        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} 
      />
      <Button 
        size="sm" 
        variant={activo ? 'danger' : 'primary'} 
        onClick={() => onSave(diaIdx, inicio, fin, !activo)}
        disabled={loading}
      >
        {activo ? 'Quitar' : 'Abrir'}
      </Button>
    </div>
  );
}

export default function HorariosModal({ isOpen, onClose, empleado }) {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (isOpen && empleado) {
      fetchHorarios();
    }
  }, [isOpen, empleado]);

  const fetchHorarios = async () => {
    try {
      const res = await api.get(`/horarios-empleado/${empleado.id}`);
      setHorarios(res.data);
    } catch (err) {
      console.error("Error al cargar horarios:", err);
    }
  };

  const handleSave = async (diaIdx, inicio, fin, activo) => {
    try {
      setLoading(true);
      if (activo) {
        await api.post(`/horarios-empleado/`, {
          empleado_id: empleado.id,
          dia_semana:  diaIdx,
          hora_inicio: inicio,
          hora_fin:    fin
        });
      } else {
        const h = horarios.find(h => h.dia_semana === diaIdx);
        if (h) await api.delete(`/horarios-empleado/${h.id}`);
      }
      fetchHorarios();
    } catch (err) {
      setError("Error al guardar horario: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Horarios de ${empleado?.nombre}`} width={550}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Configura los días y rangos horarios en los que este profesional recibe turnos.
        </p>
        {DIAS.map((dia, idx) => (
          <HorarioRow 
            key={dia} 
            dia={dia} 
            diaIdx={idx} 
            initialHorario={horarios.find(h => h.dia_semana === idx)}
            onSave={handleSave}
            loading={loading}
          />
        ))}
      </div>
      {error && (
        <div style={{
          marginTop: '12px', padding: '8px 12px', borderRadius: '4px',
          background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)',
          color: '#e53e3e', fontSize: '12px',
        }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}