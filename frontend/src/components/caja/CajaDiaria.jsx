import { useState, useEffect, useCallback } from 'react';
import { caja, gastos as gastosApi } from '../../api/api';
import ResumenCards  from './ResumenCards';
import GastoModal    from './GastoModal';
import TablaGastos   from './TablaGastos';
import TablaIngresos from './TablaIngresos';

const hoy = () => new Date().toISOString().slice(0, 10);

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
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [modalOpen, setModalOpen]         = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);

  const fetchCaja = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await caja.diaria(fecha);
      setData(res.data);
    } catch {
      setError('No se pudo cargar la caja del día.');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Selector de fecha */}
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

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</div>}
      {error   && <div style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '13px' }}>{error}</div>}

      {data && !loading && (
        <>
          <ResumenCards
            totalIngresos={data.total_ingresos}
            totalGastos={data.total_gastos}
            gananciaNeta={data.ganancia_neta}
            cantidadPagos={data.cantidad_turnos}
          />

          {/* Ingresos */}
          <div>
            <SectionTitle>
              Ingresos del día
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Turnos confirmados y completados
              </span>
            </SectionTitle>
            <TablaIngresos ingresos={data.detalle_ingresos} />
          </div>

          {/* Gastos — incluye comisiones registradas desde Empleados */}
          <div>
            <SectionTitle
              action={
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
              }
            >
              Gastos del día
            </SectionTitle>
            <TablaGastos
              gastos={data.detalle_gastos}
              onEdit={g => { setGastoEditando(g); setModalOpen(true); }}
              onDelete={handleEliminarGasto}
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
    </div>
  );
}