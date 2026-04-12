import { useState, useEffect, useCallback } from 'react';
import { caja } from '../../api/api';
import { formatCurrency } from '../../utils/formatters';
import ResumenCierre from './ResumenCierre';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatFechaCorta(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  return `${DIAS_CORTO[d.getDay()]} ${d.getDate()}`;
}

function FilaCierre({ cierre, abierto, onToggle }) {
  const totalReal = cierre.efectivo_real + cierre.transferencia_real + cierre.tarjeta_real;
  const neto      = totalReal - (cierre.total_gastos ?? 0);
  const dif       = cierre.diferencia ?? 0;
  const hayDif    = Math.abs(dif) > 0.01;

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      transition: 'border-color 0.18s',
      borderColor: abierto ? 'var(--border-strong)' : 'var(--border)',
    }}>
      {/* Fila resumen — clickeable */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr 80px 28px',
          gap: '12px',
          alignItems: 'center',
          padding: '13px 16px',
          background: abierto ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        {/* Fecha */}
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {formatFechaCorta(cierre.fecha)}
        </span>

        {/* Resultado neto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Resultado neto</span>
          <span style={{
            fontSize: '14px',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            color: neto >= 0 ? 'var(--gold)' : 'var(--color-danger, #e53e3e)',
          }}>
            {formatCurrency(neto)}
          </span>
        </div>

        {/* Desglose rápido */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Ef', value: cierre.efectivo_real },
            { label: 'Tj', value: cierre.tarjeta_real },
            { label: 'Tr', value: cierre.transferencia_real },
          ].map(({ label, value }) => value > 0 && (
            <span key={label} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label} </span>
              {formatCurrency(value)}
            </span>
          ))}
        </div>

        {/* Indicador diferencia */}
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '20px',
          background: hayDif ? 'rgba(229,62,62,0.1)' : 'rgba(72,187,120,0.1)',
          color: hayDif ? 'var(--color-danger, #e53e3e)' : '#48bb78',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}>
          {hayDif ? `${dif > 0 ? '+' : ''}${formatCurrency(dif)}` : '✓ OK'}
        </span>

        {/* Chevron */}
        <span style={{
          color: 'var(--text-muted)',
          fontSize: '12px',
          transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          display: 'flex',
          alignItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {/* Detalle expandido */}
      {abierto && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <ResumenCierre cierre={cierre} />
        </div>
      )}
    </div>
  );
}

export default function HistorialCierres() {
  const now = new Date();
  const [anio, setAnio]       = useState(now.getFullYear());
  const [mes, setMes]         = useState(now.getMonth() + 1);
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [expandido, setExpandido] = useState(null);

  const fetchHistorial = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setExpandido(null);
      const res = await caja.historial(anio, mes);
      setCierres(res.data);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => { fetchHistorial(); }, [fetchHistorial]);

  const irMes = (delta) => {
    let m = mes + delta;
    let a = anio;
    if (m > 12) { m = 1; a++; }
    if (m < 1)  { m = 12; a--; }
    setMes(m);
    setAnio(a);
  };

  // Totales del mes
  const totalNeto    = cierres.reduce((s, c) => s + (c.efectivo_real + c.tarjeta_real + c.transferencia_real) - (c.total_gastos ?? 0), 0);
  const totalIngresos = cierres.reduce((s, c) => s + c.efectivo_real + c.tarjeta_real + c.transferencia_real, 0);
  const diasConDif   = cierres.filter(c => Math.abs(c.diferencia ?? 0) > 0.01).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Navegador de mes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => irMes(-1)}
            style={{
              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.15s',
            }}
          >
            ‹
          </button>
          <span style={{
            padding: '7px 20px',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            minWidth: '160px',
            textAlign: 'center',
            textTransform: 'capitalize',
          }}>
            {MESES[mes - 1]} {anio}
          </span>
          <button
            onClick={() => irMes(+1)}
            style={{
              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.15s',
            }}
          >
            ›
          </button>
        </div>

        {/* Mini resumen del mes */}
        {cierres.length > 0 && !loading && (
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cierres.length}</span> {cierres.length === 1 ? 'cierre' : 'cierres'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Neto: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatCurrency(totalNeto)}</span>
            </span>
            {diasConDif > 0 && (
              <span style={{ color: 'var(--color-danger, #e53e3e)' }}>
                ⚠ {diasConDif} día{diasConDif > 1 ? 's' : ''} con diferencia
              </span>
            )}
          </div>
        )}
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</div>}
      {error   && (
        <div style={{
          color: 'var(--color-danger, #e53e3e)', fontSize: '13px',
          padding: '12px', background: 'rgba(229,62,62,0.08)',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(229,62,62,0.2)',
        }}>
          {error}
        </div>
      )}

      {/* Lista de cierres */}
      {!loading && cierres.length === 0 && !error && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: '13px',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}>
          No hay cierres registrados en {MESES[mes - 1]} {anio}.
        </div>
      )}

      {!loading && cierres.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cierres.map(c => (
            <FilaCierre
              key={c.id}
              cierre={c}
              abierto={expandido === c.id}
              onToggle={() => setExpandido(prev => prev === c.id ? null : c.id)}
            />
          ))}
        </div>
      )}

      {/* Totales del mes al pie */}
      {!loading && cierres.length > 1 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
        }}>
          {[
            { label: `Total ingresos ${MESES[mes - 1]}`, value: totalIngresos, color: 'var(--color-success, #4caf7d)' },
            { label: 'Total gastos', value: cierres.reduce((s, c) => s + (c.total_gastos ?? 0), 0), color: 'var(--color-danger, #e53e3e)' },
            { label: 'Resultado neto del mes', value: totalNeto, color: 'var(--gold)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 500 }}>
                {label}
              </span>
              <span style={{ fontSize: '20px', fontFamily: 'var(--font-display)', color, fontWeight: 500 }}>
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
