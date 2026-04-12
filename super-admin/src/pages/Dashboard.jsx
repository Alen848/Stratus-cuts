import { useState, useEffect, useCallback } from 'react';
import { getSalones, crearSalon, actualizarSalon } from '../services/api';
import Layout from '../components/Layout';
import SalonDetalle from './SalonDetalle';

const S = `
  .db-main { max-width: 1000px; margin: 0 auto; padding: 2.5rem 2rem; }

  .db-page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.8rem;
  }
  .db-page-title { font-size: 1.35rem; font-weight: 600; color: #e2e8f0; }
  .db-page-sub { font-size: 0.82rem; color: rgba(226,232,240,0.35); margin-top: 0.2rem; }

  .db-new-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    background: #6366f1;
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .db-new-btn:hover { background: #4f52d4; transform: translateY(-1px); }

  /* ── Stats ── */
  .db-stats { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .db-stat {
    flex: 1; min-width: 140px;
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 1rem 1.25rem;
  }
  .db-stat-val { font-size: 1.8rem; font-weight: 700; color: #e2e8f0; line-height: 1; }
  .db-stat-label { font-size: 0.72rem; color: rgba(226,232,240,0.35); margin-top: 0.3rem; letter-spacing: 0.06em; text-transform: uppercase; }

  /* ── Table ── */
  .db-table-wrap {
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    overflow: hidden;
  }
  .db-table { width: 100%; border-collapse: collapse; }
  .db-table th {
    text-align: left;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(226,232,240,0.3);
    padding: 0.85rem 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .db-table td {
    padding: 0.95rem 1.2rem;
    font-size: 0.88rem;
    color: rgba(226,232,240,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }
  .db-table tr:last-child td { border-bottom: none; }
  .db-table tr:hover td { background: rgba(255,255,255,0.02); }

  .db-salon-name { font-weight: 500; color: #e2e8f0; }
  .db-salon-slug { font-size: 0.75rem; color: rgba(226,232,240,0.3); font-family: monospace; margin-top: 2px; }

  .db-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.04em;
  }
  .db-badge.activo { background: rgba(34,197,94,0.12); color: #4ade80; }
  .db-badge.inactivo { background: rgba(239,68,68,0.1); color: #f87171; }
  .db-badge.plan { background: rgba(99,102,241,0.12); color: #a5b4fc; }

  .db-row-actions { display: flex; gap: 0.5rem; }
  .db-icon-btn {
    background: none;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: rgba(226,232,240,0.45);
    font-size: 0.75rem;
    padding: 0.3rem 0.65rem;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .db-icon-btn:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
  .db-icon-btn.danger:hover { color: #f87171; border-color: rgba(239,68,68,0.3); }

  /* ── Modal ── */
  .db-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }
  .db-modal {
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 2rem;
    width: 100%; max-width: 460px;
    max-height: 90vh; overflow-y: auto;
  }
  .db-modal-title { font-size: 1.1rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.3rem; }
  .db-modal-sub { font-size: 0.78rem; color: rgba(226,232,240,0.35); margin-bottom: 1.5rem; }

  .db-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 1.25rem 0; }
  .db-section-label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(226,232,240,0.3); margin-bottom: 0.85rem; }

  .db-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.9rem; }
  .db-label { font-size: 0.75rem; font-weight: 500; color: rgba(226,232,240,0.5); }
  .db-input {
    padding: 0.6rem 0.85rem;
    background: #0f1117;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 6px; color: #e2e8f0; font-size: 0.9rem;
    outline: none; transition: border-color 0.2s;
  }
  .db-input:focus { border-color: rgba(99,102,241,0.5); }
  .db-select {
    padding: 0.6rem 0.85rem;
    background: #0f1117;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 6px; color: #e2e8f0; font-size: 0.9rem;
    outline: none; cursor: pointer;
  }
  .db-modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: flex-end; }
  .db-cancel-btn {
    padding: 0.6rem 1.2rem; background: none;
    border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
    color: rgba(226,232,240,0.5); font-size: 0.85rem; cursor: pointer;
  }
  .db-submit-btn {
    padding: 0.6rem 1.4rem; background: #6366f1;
    border: none; border-radius: 6px;
    color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  }
  .db-submit-btn:hover { background: #4f52d4; }
  .db-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .db-modal-error {
    margin-top: 0.75rem; padding: 0.55rem 0.8rem;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 6px; color: #fca5a5; font-size: 0.8rem;
  }
  .db-empty { padding: 3rem; text-align: center; color: rgba(226,232,240,0.2); font-size: 0.9rem; }
`;

const PLANES = ['basico', 'profesional', 'premium'];

function NuevoSalonModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nombre: '', slug: '', plan: 'basico',
    admin_username: '', admin_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNombre = (v) => {
    set('nombre', v);
    const slug = v.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    set('slug', slug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await crearSalon(form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el salón.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-title">Nuevo salón</div>
        <div className="db-modal-sub">Crea el salón y su usuario administrador</div>
        <form onSubmit={handleSubmit}>
          <div className="db-section-label">Datos del salón</div>
          <div className="db-field">
            <label className="db-label">Nombre del salón</label>
            <input className="db-input" value={form.nombre}
              onChange={e => handleNombre(e.target.value)} required placeholder="Ej: Peluquería Sol" />
          </div>
          <div className="db-field">
            <label className="db-label">Slug (URL única)</label>
            <input className="db-input" value={form.slug}
              onChange={e => set('slug', e.target.value)} required placeholder="peluqueria-sol" />
          </div>
          <div className="db-field">
            <label className="db-label">Plan</label>
            <select className="db-select" value={form.plan} onChange={e => set('plan', e.target.value)}>
              {PLANES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="db-divider" />
          <div className="db-section-label">Credenciales del administrador</div>
          <div className="db-field">
            <label className="db-label">Usuario admin</label>
            <input className="db-input" value={form.admin_username}
              onChange={e => set('admin_username', e.target.value)} required placeholder="admin" />
          </div>
          <div className="db-field">
            <label className="db-label">Contraseña temporal</label>
            <input className="db-input" type="password" value={form.admin_password}
              onChange={e => set('admin_password', e.target.value)} required />
          </div>
          {error && <div className="db-modal-error">{error}</div>}
          <div className="db-modal-actions">
            <button type="button" className="db-cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="db-submit-btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear salón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await getSalones();
      setSalones(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (salon) => {
    try {
      await actualizarSalon(salon.id, { activo: !salon.activo });
      cargar();
    } catch {}
  };

  const activos = salones.filter(s => s.activo).length;

  if (detalle) {
    return <SalonDetalle salon={detalle} onBack={() => { setDetalle(null); cargar(); }} />;
  }

  return (
    <Layout>
      <style>{S}</style>
      <div className="db-main">
        <div className="db-page-head">
          <div>
            <div className="db-page-title">Salones</div>
            <div className="db-page-sub">Gestión de todos los clientes de la plataforma</div>
          </div>
          <button className="db-new-btn" onClick={() => setShowModal(true)}>
            + Nuevo salón
          </button>
        </div>

        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-val">{salones.length}</div>
            <div className="db-stat-label">Total salones</div>
          </div>
          <div className="db-stat">
            <div className="db-stat-val" style={{ color: '#4ade80' }}>{activos}</div>
            <div className="db-stat-label">Activos</div>
          </div>
          <div className="db-stat">
            <div className="db-stat-val" style={{ color: '#f87171' }}>{salones.length - activos}</div>
            <div className="db-stat-label">Inactivos</div>
          </div>
        </div>

        <div className="db-table-wrap">
          {loading ? (
            <div className="db-empty">Cargando...</div>
          ) : salones.length === 0 ? (
            <div className="db-empty">No hay salones todavía. Creá el primero.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Salón</th>
                  <th>Admin</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Fecha alta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {salones.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="db-salon-name">{s.nombre}</div>
                      <div className="db-salon-slug">{s.slug}</div>
                    </td>
                    <td>{s.admin_username || '—'}</td>
                    <td><span className="db-badge plan">{s.plan}</span></td>
                    <td>
                      <span className={`db-badge ${s.activo ? 'activo' : 'inactivo'}`}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{s.fecha_alta ? new Date(s.fecha_alta).toLocaleDateString('es-AR') : '—'}</td>
                    <td>
                      <div className="db-row-actions">
                        <button className="db-icon-btn" onClick={() => setDetalle(s)}>Ver</button>
                        <button className={`db-icon-btn ${s.activo ? 'danger' : ''}`} onClick={() => handleToggle(s)}>
                          {s.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <NuevoSalonModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); cargar(); }}
        />
      )}
    </Layout>
  );
}
