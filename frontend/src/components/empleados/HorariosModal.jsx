import { useState, useEffect } from 'react';
import Modal  from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../api/axios';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_INICIO = '09:00';
const DEFAULT_FIN    = '20:00';

function buildDraft(horarios) {
  return DIAS.map((_, idx) => {
    const h = horarios.find(h => h.dia_semana === idx);
    return {
      diaIdx:      idx,
      activo:      !!h,
      hora_inicio: h?.hora_inicio?.slice(0, 5) || DEFAULT_INICIO,
      hora_fin:    h?.hora_fin?.slice(0, 5)    || DEFAULT_FIN,
      dbId:        h?.id || null,
    };
  });
}

export default function HorariosModal({ isOpen, onClose, empleado }) {
  const [horarios, setHorarios] = useState([]);   // datos del servidor
  const [draft,    setDraft]    = useState([]);   // estado editable local
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (isOpen && empleado) fetchHorarios();
  }, [isOpen, empleado]);

  const fetchHorarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/horarios-empleado/${empleado.id}`);
      setHorarios(res.data);
      setDraft(buildDraft(res.data));
    } catch {
      setError('Error al cargar horarios.');
    } finally {
      setLoading(false);
    }
  };

  const setDia = (idx, field, value) =>
    setDraft(prev => prev.map(d => d.diaIdx === idx ? { ...d, [field]: value } : d));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await Promise.all(draft.map(async (dia) => {
        if (dia.activo) {
          // Crear o actualizar
          await api.post('/horarios-empleado/', {
            empleado_id: empleado.id,
            dia_semana:  dia.diaIdx,
            hora_inicio: dia.hora_inicio,
            hora_fin:    dia.hora_fin,
          });
        } else if (dia.dbId) {
          // Eliminar si existía
          await api.delete(`/horarios-empleado/${dia.dbId}`);
        }
      }));
      await fetchHorarios();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('Error al guardar: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Horarios · ${empleado?.nombre}`} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Activá los días en que este profesional trabaja y ajustá los horarios. Guardá al finalizar.
        </p>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Cargando...
          </div>
        ) : (
          draft.map((dia) => (
            <div key={dia.diaIdx} style={{
              display: 'grid',
              gridTemplateColumns: '28px 110px 1fr 1fr',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid ' + (dia.activo ? 'var(--gold-border)' : 'var(--border)'),
              background: dia.activo ? 'var(--gold-dim)' : 'var(--bg-elevated)',
              transition: 'background 0.15s, border-color 0.15s',
            }}>
              {/* Toggle */}
              <div
                onClick={() => setDia(dia.diaIdx, 'activo', !dia.activo)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer',
                  border: '2px solid ' + (dia.activo ? 'var(--gold)' : 'var(--border-strong)'),
                  background: dia.activo ? 'var(--gold)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {dia.activo && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Día */}
              <span style={{
                fontSize: '13px',
                fontWeight: dia.activo ? 500 : 400,
                color: dia.activo ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {DIAS[dia.diaIdx]}
              </span>

              {/* Hora inicio */}
              <input
                type="time"
                value={dia.hora_inicio}
                onChange={e => setDia(dia.diaIdx, 'hora_inicio', e.target.value)}
                disabled={!dia.activo}
                style={{
                  padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  background: dia.activo ? 'var(--bg-surface)' : 'var(--bg-base)',
                  color: dia.activo ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12px', fontFamily: 'var(--font-body)',
                  opacity: dia.activo ? 1 : 0.5, width: '100%',
                  colorScheme: 'dark',
                }}
              />

              {/* Hora fin */}
              <input
                type="time"
                value={dia.hora_fin}
                onChange={e => setDia(dia.diaIdx, 'hora_fin', e.target.value)}
                disabled={!dia.activo}
                style={{
                  padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  background: dia.activo ? 'var(--bg-surface)' : 'var(--bg-base)',
                  color: dia.activo ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12px', fontFamily: 'var(--font-body)',
                  opacity: dia.activo ? 1 : 0.5, width: '100%',
                  colorScheme: 'dark',
                }}
              />
            </div>
          ))
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)',
          color: '#e53e3e', fontSize: '12px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px',
      }}>
        {saved && (
          <span style={{ fontSize: '12px', color: 'var(--success)' }}>
            ✓ Cambios guardados
          </span>
        )}
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </Modal>
  );
}
