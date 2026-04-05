import { useState, useEffect, useCallback } from 'react';
import { caja, gastos as gastosApi } from '../../api/api';
import ResumenCards  from './ResumenCards';
import GastoModal    from './GastoModal';
import TablaGastos   from './TablaGastos';
import TablaIngresos from './TablaIngresos';
import CierreModal   from './CierreModal';
import { formatCurrency } from '../../utils/formatters';

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const SectionTitle = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 400, color: 'var(--text-primary)' }}>
      {children}
    </h3>
    {action}
  </div>
);

export default function CajaDiaria() {
  const [fecha, setFecha]     = useState(hoy());
  const [data, setData]       = useState(null);
  const [cierre, setCierre]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [modalOpen, setModalOpen]             = useState(false);
  const [cierreModalOpen, setCierreModalOpen] = useState(false);
  const [gastoEditando, setGastoEditando]     = useState(null);

  const fetchCaja = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const resCaja = await caja.diaria(fecha);
      setData(resCaja.data);

      const resCierre = await caja.getCierre(fecha);
      // El backend devuelve null (200) si no hay cierre para esa fecha
      setCierre(resCierre.data ?? null);
    } catch (err) {
      console.error('Error al cargar caja:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => { fetchCaja(); }, [fetchCaja]);

  const handleGuardarGasto = async (form) => {
    if (gastoEditando) {
      await gastosApi.update(gastoEditando.id, form);
    } else {
      await gastosApi.create({ ...form, fecha });
    }
    fetchCaja();
  };

  const handleEliminarGasto = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    await gastosApi.delete(id);
    fetchCaja();
  };

  const handleCerrarCaja = async (form) => {
    try {
      await caja.cerrar(form);
      fetchCaja();
      setCierreModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cerrar la caja');
    }
  };

  const estaCerrado = Boolean(cierre);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Cabecera y Selector de fecha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fecha:</label>
          <input
            type="date" value={fecha}
            onChange={e => setFecha(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px',
            }}
          />
          <button onClick={fetchCaja} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
            color: 'var(--gold)', cursor: 'pointer', fontSize: '13px',
          }}>
            Actualizar
          </button>
        </div>

        {estaCerrado ? (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(72, 187, 120, 0.1)', border: '1px solid #48bb78',
            color: '#48bb78', fontSize: '13px', fontWeight: 600
          }}>
            <span style={{ fontSize: '18px' }}>✓</span>
            <span>CAJA CERRADA</span>
            {cierre && (
              <div style={{ 
                display: 'flex', flexDirection: 'column', gap: '2px',
                fontSize: '11px', opacity: 0.9, marginLeft: '12px', 
                borderLeft: '1px solid #48bb78', paddingLeft: '12px' 
              }}>
                <div>Efectivo: {formatCurrency(cierre.efectivo_real)}</div>
                <div>Transf: {formatCurrency(cierre.transferencia_real)}</div>
                <div>Tarjetas: {formatCurrency(cierre.tarjeta_real)}</div>
                <div style={{ fontWeight: 700, marginTop: '2px', borderTop: '1px solid rgba(72,187,120,0.3)', paddingTop: '2px' }}>
                  Dif. Total: {formatCurrency(cierre.diferencia)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setCierreModalOpen(true)}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'var(--gold)',
              color: '#000', cursor: 'pointer', fontSize: '14px',
              fontWeight: 700, transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            Finalizar y Cerrar Caja
          </button>
        )}
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</div>}
      {error   && (
        <div style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '13px', padding: '12px', background: 'rgba(229, 62, 62, 0.1)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          <ResumenCards
            totalIngresos={data.total_ingresos}
            totalGastos={data.total_gastos}
            gananciaNeta={data.ganancia_neta}
            cantidadTurnos={data.cantidad_turnos}
          />

          {/* Ingresos */}
          <div>
            <SectionTitle>
              Ingresos del día
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Turnos completados
              </span>
            </SectionTitle>
            <TablaIngresos ingresos={data.detalle_ingresos} />
          </div>

          {/* Gastos — incluye comisiones registradas desde Empleados */}
          <div>
            <SectionTitle
              action={
                !estaCerrado && (
                  <button
                    onClick={() => { setGastoEditando(null); setModalOpen(true); }}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--gold-border)', background: 'var(--gold-dim)',
                      color: 'var(--gold)', cursor: 'pointer', fontSize: '12px',
                    }}
                  >
                    + Agregar gasto
                  </button>
                )
              }
            >
              Gastos del día
            </SectionTitle>
            <TablaGastos
              gastos={data.detalle_gastos}
              onEdit={estaCerrado ? null : (g => { setGastoEditando(g); setModalOpen(true); })}
              onDelete={estaCerrado ? null : handleEliminarGasto}
            />
          </div>
        </>
      )}

      <GastoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleGuardarGasto}
        gasto={gastoEditando}
      />

      <CierreModal
        isOpen={cierreModalOpen}
        onClose={() => setCierreModalOpen(false)}
        onSubmit={handleCerrarCaja}
        resumen={data}
        fecha={fecha}
      />
    </div>
  );
}