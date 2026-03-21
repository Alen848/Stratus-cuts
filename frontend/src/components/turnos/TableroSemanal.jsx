import React, { useState, useEffect } from 'react';
import { turnos as turnosApi } from '../../api/api';

const DIAS_NOMBRE = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function TableroSemanal({ empleadoId, fechaInicio, onSelectSlot, selectedSlot, duracion = 30 }) {
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [horas, setHoras] = useState([]);
  
  // Slots que se necesitan según la duración (ej: 60 min = 2 slots)
  const slotsNecesarios = Math.ceil(duracion / 30);

  useEffect(() => {
    if (!empleadoId || !fechaInicio) return;
    
    const fetchGrid = async () => {
      try {
        setLoading(true);
        const res = await turnosApi.getDisponibilidadSemanal(empleadoId, fechaInicio);
        setGrid(res.data);
        
        const allHoras = new Set();
        Object.values(res.data).forEach(daySlots => {
          daySlots.forEach(s => { if (s.hora) allHoras.add(s.hora); });
        });

        if (allHoras.size === 0) {
          for(let h=10; h<20; h++) {
            allHoras.add(`${h.toString().padStart(2,'0')}:00`);
            allHoras.add(`${h.toString().padStart(2,'0')}:30`);
          }
        }
        
        setHoras(Array.from(allHoras).sort());
      } catch (err) {
        console.error("Error al cargar disponibilidad:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrid();
  }, [empleadoId, fechaInicio]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando disponibilidad...</div>;
  if (!grid) return null;

  const dias = Object.keys(grid).sort();

  // Función para verificar si un rango de slots está disponible
  const verificarRango = (fecha, horaInicioIdx) => {
    const daySlots = grid[fecha];
    for (let i = 0; i < slotsNecesarios; i++) {
      const horaActual = horas[horaInicioIdx + i];
      if (!horaActual) return { posible: false }; // Se sale del horario laboral
      
      const slot = daySlots.find(s => s.hora === horaActual);
      if (!slot || !slot.disponible) return { posible: false };
    }
    return { posible: true };
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', gap: '10px', 
      background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', overflowX: 'auto',
      maxHeight: '380px', overflowY: 'auto'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `60px repeat(${dias.length}, 1fr)`,
        gap: '2px',
        minWidth: '500px'
      }}>
        <div />
        {dias.map((fecha) => {
          const d = new Date(fecha + 'T00:00:00');
          return (
            <div key={fecha} style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--border-strong)' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{DIAS_NOMBRE[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{d.getDate()}</div>
            </div>
          );
        })}

        {horas.map((hora, hIdx) => (
          <React.Fragment key={hora}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
              {hora}
            </div>

            {dias.map(fecha => {
              const slot = grid[fecha]?.find(s => s.hora === hora);
              if (!slot) return <div key={fecha + hora} style={{ background: 'var(--bg-base)', opacity: 0.05 }} />;

              // Lógica de Selección / Marcado
              const cleanSelected = selectedSlot?.slice(0, 16);
              const cleanSlot     = slot.fecha_hora?.slice(0, 16);
              
              // ¿Esta celda es la celda de inicio de la selección?
              const esInicioSeleccion = cleanSelected && cleanSlot && cleanSelected === cleanSlot;
              
              // ¿Esta celda forma parte del rango seleccionado?
              let parteDeSeleccion = false;
              if (cleanSelected && cleanSlot) {
                const selDate = cleanSelected.split('T')[0];
                const selTime = cleanSelected.split('T')[1];
                if (selDate === fecha) {
                  const selIdx = horas.indexOf(selTime);
                  if (hIdx >= selIdx && hIdx < selIdx + slotsNecesarios) {
                    parteDeSeleccion = true;
                  }
                }
              }

              const isOcupado = !slot.disponible;
              const { posible } = isOcupado ? { posible: false } : verificarRango(fecha, hIdx);

              return (
                <button
                  key={fecha + hora}
                  type="button"
                  disabled={isOcupado || (!posible && !parteDeSeleccion)}
                  onClick={() => onSelectSlot(slot.fecha_hora)}
                  style={{
                    height: '36px',
                    borderRadius: '2px',
                    border: '1px solid ' + (esInicioSeleccion ? 'var(--gold)' : 'transparent'),
                    background: isOcupado 
                      ? 'rgba(229, 62, 62, 0.15)' 
                      : (parteDeSeleccion ? 'var(--gold-dim)' : (posible ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)')),
                    cursor: (isOcupado || !posible) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    opacity: (!posible && !isOcupado && !parteDeSeleccion) ? 0.4 : 1,
                    transition: 'all 0.1s'
                  }}
                  title={isOcupado ? `${slot.cliente}: ${slot.servicio}` : (posible ? 'Disponible' : 'Sin espacio suficiente')}
                >
                  {isOcupado ? (
                    <div style={{ fontSize: '7px', color: 'var(--color-danger, #e53e3e)', overflow: 'hidden' }}>
                      <strong style={{ display: 'block' }}>{slot.cliente.split(' ')[0]}</strong>
                    </div>
                  ) : esInicioSeleccion ? (
                    <span style={{ color: 'var(--gold)', fontSize: '12px' }}>✓</span>
                  ) : null}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}