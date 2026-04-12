import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getPagosMes, upsertPago } from '../services/api';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const METODOS = ['transferencia', 'efectivo', 'otro'];

const S = `
  .pg-main { max-width: 900px; margin: 0 auto; padding: 2.5rem 2rem; }

  /* ── Header ── */
  .pg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .pg-title { font-size: 1.35rem; font-weight: 600; color: #e2e8f0; }
  .pg-sub { font-size: 0.82rem; color: rgba(226,232,240,0.35); margin-top: 0.2rem; }

  /* ── Month navigator ── */
  .pg-nav {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
  }
  .pg-nav-btn {
    background: none;
    border: none;
    color: rgba(226,232,240,0.4);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    transition: color 0.2s, background 0.2s;
    line-height: 1;
  }
  .pg-nav-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
  .pg-nav-label { font-size: 0.85rem; font-weight: 500; color: #e2e8f0; min-width: 140px; text-align: center; }

  /* ── Summary bar ── */
  .pg-summary {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .pg-sum-card {
    flex: 1; min-width: 120px;
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 0.85rem 1.1rem;
  }
  .pg-sum-val { font-size: 1.5rem; font-weight: 700; color: #e2e8f0; line-height: 1; }
  .pg-sum-label { font-size: 0.68rem; color: rgba(226,232,240,0.3); margin-top: 0.25rem; letter-spacing: 0.07em; text-transform: uppercase; }

  /* ── Notion-style list ── */
  .pg-list {
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    overflow: hidden;
  }

  .pg-list-head {
    display: grid;
    grid-template-columns: 36px 1fr 90px 120px 130px 100px;
    gap: 0;
    padding: 0.6rem 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pg-col-label {
    font-size: 0.64rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(226,232,240,0.22);
  }

  .pg-row {
    display: grid;
    grid-template-columns: 36px 1fr 90px 120px 130px 100px;
    gap: 0;
    align-items: center;
    padding: 0 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    min-height: 52px;
    transition: background 0.15s;
  }
  .pg-row:last-child { border-bottom: none; }
  .pg-row:hover { background: rgba(255,255,255,0.018); }
  .pg-row.pagado-row { background: rgba(34,197,94,0.03); }
  .pg-row.inactivo-row { opacity: 0.45; }

  /* Checkbox al estilo Notion */
  .pg-check-wrap { display: flex; align-items: center; }
  .pg-checkbox {
    width: 18px; height: 18px;
    border: 1.5px solid rgba(226,232,240,0.2);
    border-radius: 4px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .pg-checkbox:hover { border-color: rgba(99,102,241,0.6); }
  .pg-checkbox.checked {
    background: #6366f1;
    border-color: #6366f1;
  }
  .pg-checkbox svg { display: none; }
  .pg-checkbox.checked svg { display: block; }

  /* Nombre del salón */
  .pg-salon-info { padding: 0.5rem 0.75rem 0.5rem 0; min-width: 0; }
  .pg-salon-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: #e2e8f0;
    transition: color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pg-row.pagado-row .pg-salon-name {
    text-decoration: line-through;
    color: rgba(226,232,240,0.4);
  }
  .pg-salon-plan {
    font-size: 0.68rem;
    color: rgba(226,232,240,0.28);
    margin-top: 2px;
    letter-spacing: 0.04em;
  }

  /* Campos editables inline */
  .pg-cell { padding-right: 0.75rem; }
  .pg-inline-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: rgba(226,232,240,0.65);
    font-size: 0.84rem;
    width: 100%;
    padding: 0.2rem 0;
    outline: none;
    transition: border-color 0.15s, color 0.15s;
  }
  .pg-inline-input:hover { border-bottom-color: rgba(255,255,255,0.1); }
  .pg-inline-input:focus { border-bottom-color: rgba(99,102,241,0.5); color: #e2e8f0; }
  .pg-inline-input::placeholder { color: rgba(226,232,240,0.18); }

  .pg-inline-select {
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: rgba(226,232,240,0.65);
    font-size: 0.84rem;
    width: 100%;
    padding: 0.2rem 0;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .pg-inline-select:hover { border-bottom-color: rgba(255,255,255,0.1); }
  .pg-inline-select:focus { border-bottom-color: rgba(99,102,241,0.5); }

  .pg-saved-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #4ade80;
    opacity: 0;
    transition: opacity 0.3s;
    margin-left: 4px;
    display: inline-block;
  }
  .pg-saved-dot.visible { opacity: 1; }

  .pg-empty { padding: 3rem; text-align: center; color: rgba(226,232,240,0.2); font-size: 0.9rem; }

  @media (max-width: 700px) {
    .pg-list-head { display: none; }
    .pg-row { grid-template-columns: 36px 1fr; grid-template-rows: auto auto; row-gap: 0.25rem; padding: 0.75rem 1rem; }
    .pg-cell { display: none; }
  }
`;

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 5 9 10 3" />
    </svg>
  );
}

function PagoRow({ item, anio, mes, onUpdated }) {
  const [monto, setMonto] = useState(item.monto ?? 0);
  const [metodo, setMetodo] = useState(item.metodo ?? '');
  const [notas, setNotas] = useState(item.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincroniza si cambia el mes
  useEffect(() => {
    setMonto(item.monto ?? 0);
    setMetodo(item.metodo ?? '');
    setNotas(item.notas ?? '');
  }, [item.salon_id, anio, mes]);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const togglePagado = async () => {
    setSaving(true);
    try {
      const nuevoPagado = !item.pagado;
      const payload = {
        salon_id: item.salon_id,
        anio,
        mes,
        monto: Number(monto),
        pagado: nuevoPagado,
        metodo: metodo || null,
        notas: notas || null,
        fecha_pago: nuevoPagado ? new Date().toISOString().split('T')[0] : null,
      };
      await upsertPago(payload);
      onUpdated();
    } catch {}
    finally { setSaving(false); }
  };

  const saveField = async (field, value) => {
    try {
      const payload = {
        salon_id: item.salon_id,
        anio,
        mes,
        monto: Number(monto),
        pagado: item.pagado,
        metodo: metodo || null,
        notas: notas || null,
        [field]: value || null,
      };
      await upsertPago(payload);
      flashSaved();
      onUpdated();
    } catch {}
  };

  const rowClass = `pg-row${item.pagado ? ' pagado-row' : ''}${!item.salon_activo ? ' inactivo-row' : ''}`;

  return (
    <div className={rowClass}>
      {/* Checkbox */}
      <div className="pg-check-wrap">
        <div
          className={`pg-checkbox${item.pagado ? ' checked' : ''}`}
          onClick={togglePagado}
          style={saving ? { opacity: 0.5, pointerEvents: 'none' } : {}}
        >
          <CheckIcon />
        </div>
      </div>

      {/* Nombre salón */}
      <div className="pg-salon-info">
        <div className="pg-salon-name">{item.salon_nombre}</div>
        <div className="pg-salon-plan">{item.plan}</div>
      </div>

      {/* Monto */}
      <div className="pg-cell">
        <input
          className="pg-inline-input"
          type="number"
          value={monto}
          onChange={e => setMonto(e.target.value)}
          onBlur={e => saveField('monto', Number(e.target.value))}
          placeholder="$0"
        />
      </div>

      {/* Método */}
      <div className="pg-cell">
        <select
          className="pg-inline-select"
          value={metodo}
          onChange={e => { setMetodo(e.target.value); saveField('metodo', e.target.value); }}
        >
          <option value="">— método —</option>
          {METODOS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
        </select>
      </div>

      {/* Notas */}
      <div className="pg-cell">
        <input
          className="pg-inline-input"
          type="text"
          value={notas}
          onChange={e => setNotas(e.target.value)}
          onBlur={e => saveField('notas', e.target.value)}
          placeholder="Notas..."
        />
      </div>

      {/* Indicador guardado */}
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(226,232,240,0.3)' }}>
        {item.pagado && item.fecha_pago
          ? new Date(item.fecha_pago + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
          : '—'}
        <span className={`pg-saved-dot${saved ? ' visible' : ''}`} />
      </div>
    </div>
  );
}

export default function Pagos() {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPagosMes(anio, mes);
      setPagos(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [anio, mes]);

  useEffect(() => { cargar(); }, [cargar]);

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };
  const nextMes = () => {
    if (mes === 12) { setMes(1); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const pagados = pagos.filter(p => p.pagado);
  const pendientes = pagos.filter(p => !p.pagado && p.salon_activo);
  const totalCobrado = pagados.reduce((s, p) => s + (p.monto || 0), 0);

  return (
    <Layout>
      <style>{S}</style>
      <div className="pg-main">
        <div className="pg-header">
          <div>
            <div className="pg-title">Control de pagos</div>
            <div className="pg-sub">Seguimiento mensual de cobros por salón</div>
          </div>
          <div className="pg-nav">
            <button className="pg-nav-btn" onClick={prevMes}>‹</button>
            <span className="pg-nav-label">{MESES[mes - 1]} {anio}</span>
            <button className="pg-nav-btn" onClick={nextMes}>›</button>
          </div>
        </div>

        <div className="pg-summary">
          <div className="pg-sum-card">
            <div className="pg-sum-val" style={{ color: '#4ade80' }}>{pagados.length}</div>
            <div className="pg-sum-label">Pagaron</div>
          </div>
          <div className="pg-sum-card">
            <div className="pg-sum-val" style={{ color: '#f87171' }}>{pendientes.length}</div>
            <div className="pg-sum-label">Pendientes</div>
          </div>
          <div className="pg-sum-card">
            <div className="pg-sum-val">${totalCobrado.toLocaleString('es-AR')}</div>
            <div className="pg-sum-label">Total cobrado</div>
          </div>
        </div>

        <div className="pg-list">
          {!loading && pagos.length > 0 && (
            <div className="pg-list-head">
              <div />
              <div className="pg-col-label">Salón</div>
              <div className="pg-col-label">Monto</div>
              <div className="pg-col-label">Método</div>
              <div className="pg-col-label">Notas</div>
              <div className="pg-col-label">Fecha pago</div>
            </div>
          )}

          {loading ? (
            <div className="pg-empty">Cargando...</div>
          ) : pagos.length === 0 ? (
            <div className="pg-empty">No hay salones registrados.</div>
          ) : (
            pagos.map(item => (
              <PagoRow
                key={item.salon_id}
                item={item}
                anio={anio}
                mes={mes}
                onUpdated={cargar}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
