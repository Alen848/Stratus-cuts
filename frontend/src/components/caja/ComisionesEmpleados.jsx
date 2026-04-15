import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { calcularComision, gastos as gastosApi, empleados as empleadosApi } from '../../api/api';

export default function ComisionesEmpleados({ empleados = [], fecha, onComisionRegistrada }) {
  const [porcentajes, setPorcentajes]   = useState({});
  const [registrados, setRegistrados]   = useState({});  // emp_id → true si ya se registró
  const [loading, setLoading]           = useState({});
  const [errorMsg, setErrorMsg]         = useState('');

  // Inicializar desde la BD cada vez que cambian los empleados
  useEffect(() => {
    if (!empleados.length) return;
    setPorcentajes(prev => {
      const next = { ...prev };
      empleados.forEach(emp => {
        // Solo sobreescribir si aún no hay valor local (evita pisar edición en curso)
        if (!(emp.empleado_id in next)) {
          next[emp.empleado_id] = emp.comision_porcentaje ?? 0;
        }
      });
      return next;
    });
  }, [empleados]);

  if (empleados.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '32px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px',
      }}>
        No hay datos de empleados para este período.
      </div>
    );
  }

  const setPorcentaje = (id, value) => {
    const num = Math.min(100, Math.max(0, Number(value) || 0));
    setPorcentajes(p => ({ ...p, [id]: num }));
    setRegistrados(r => ({ ...r, [id]: false }));
  };

  // Guarda el porcentaje en la BD cuando el usuario sale del input
  const handlePorcentajeBlur = async (empId) => {
    const pct = porcentajes[empId] ?? 0;
    try {
      await empleadosApi.update(empId, { comision_porcentaje: pct });
    } catch {
      // Fallo silencioso — el dato queda en memoria para la sesión actual
    }
  };

  const registrarComoGasto = async (emp) => {
    const pct      = porcentajes[emp.empleado_id] ?? 0;
    const comision = calcularComision(emp.total_ingresos, pct);
    if (comision <= 0) return;

    try {
      setLoading(l => ({ ...l, [emp.empleado_id]: true }));
      await gastosApi.create({
        descripcion: `Comisión ${emp.empleado_nombre} (${pct}%)`,
        monto:       comision,
        categoria:   'sueldos',
        fecha,
        observaciones: `Comisión calculada sobre $${emp.total_ingresos} facturado`,
      });
      setRegistrados(r => ({ ...r, [emp.empleado_id]: true }));
      if (onComisionRegistrada) onComisionRegistrada();
    } catch {
      setErrorMsg('Error al registrar la comisión como gasto.');
    } finally {
      setLoading(l => ({ ...l, [emp.empleado_id]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {errorMsg && (
      <div style={{
        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)',
        color: '#e53e3e', fontSize: '12px',
      }}>
        {errorMsg}
      </div>
    )}
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Empleado', 'Turnos', 'Facturado', 'Comisión %', 'Comisión $', ''].map(h => (
              <th key={h} style={{
                padding: '12px 16px', textAlign: 'left',
                fontSize: '11px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empleados.map((emp, i) => {
            const pct        = porcentajes[emp.empleado_id] ?? 0;
            const comision   = calcularComision(emp.total_ingresos, pct);
            const yaRegistrado = registrados[emp.empleado_id];
            const cargando   = loading[emp.empleado_id];

            return (
              <tr key={emp.empleado_id}
                style={{
                  borderBottom: i < empleados.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {emp.empleado_nombre}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                  {emp.cantidad_turnos}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--color-success, #4caf7d)', fontWeight: 500 }}>
                  {formatCurrency(emp.total_ingresos)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number" min="0" max="100" value={pct}
                      onChange={e => setPorcentaje(emp.empleado_id, e.target.value)}
                      onBlur={() => handlePorcentajeBlur(emp.empleado_id)}
                      style={{
                        width: '60px', padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '13px', textAlign: 'center',
                      }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: 500 }}>
                  {pct > 0 ? formatCurrency(comision) : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {pct > 0 && comision > 0 && (
                    <button
                      onClick={() => registrarComoGasto(emp)}
                      disabled={cargando || yaRegistrado}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: '12px', cursor: yaRegistrado ? 'default' : 'pointer',
                        transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                        border:     yaRegistrado ? '1px solid #4caf7d44' : '1px solid var(--border)',
                        background: yaRegistrado ? '#4caf7d15'           : 'transparent',
                        color:      yaRegistrado ? '#4caf7d'             : 'var(--text-secondary)',
                        opacity:    cargando ? 0.6 : 1,
                      }}
                    >
                      {cargando ? '...' : yaRegistrado ? '✓ Registrado' : 'Registrar como gasto'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}