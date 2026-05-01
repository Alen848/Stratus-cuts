import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getUsuariosSalon, crearUsuario, resetPassword, toggleActivo, actualizarRol, actualizarSalon } from '../services/api';

const S = `
  .sd-layout { min-height: 100vh; background: #0f1117; padding-bottom: 4rem; }

  .sd-topbar {
    height: 56px;
    background: #161b27;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    padding: 0 2rem;
    gap: 1rem;
  }
  .sd-back-btn {
    background: none;
    border: none;
    color: rgba(226,232,240,0.45);
    font-size: 0.82rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0;
    transition: color 0.2s;
  }
  .sd-back-btn:hover { color: #e2e8f0; }
  .sd-topbar-sep { color: rgba(226,232,240,0.15); }
  .sd-topbar-title { font-size: 0.9rem; font-weight: 500; color: rgba(226,232,240,0.7); }

  .sd-main { max-width: 900px; margin: 0 auto; padding: 2.5rem 2rem; }

  .sd-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .sd-salon-name { font-size: 1.5rem; font-weight: 700; color: #e2e8f0; }
  .sd-salon-meta { display: flex; gap: 0.6rem; margin-top: 0.4rem; align-items: center; flex-wrap: wrap; }

  .sd-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.65rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
  }
  .sd-badge.activo { background: rgba(34,197,94,0.12); color: #4ade80; }
  .sd-badge.inactivo { background: rgba(239,68,68,0.1); color: #f87171; }
  .sd-badge.plan { background: rgba(99,102,241,0.12); color: #a5b4fc; }
  .sd-slug { font-size: 0.78rem; color: rgba(226,232,240,0.25); font-family: monospace; }

  /* ── Section ── */
  .sd-section {
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .sd-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.4rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .sd-section-title { font-size: 0.82rem; font-weight: 600; color: rgba(226,232,240,0.65); letter-spacing: 0.06em; text-transform: uppercase; }

  /* ── Users table ── */
  .sd-table { width: 100%; border-collapse: collapse; }
  .sd-table th {
    text-align: left;
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(226,232,240,0.25);
    padding: 0.75rem 1.4rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .sd-table td {
    padding: 0.9rem 1.4rem;
    font-size: 0.86rem;
    color: rgba(226,232,240,0.75);
    border-bottom: 1px solid rgba(255,255,255,0.03);
    vertical-align: middle;
  }
  .sd-table tr:last-child td { border-bottom: none; }
  .sd-table tr:hover td { background: rgba(255,255,255,0.015); }

  .sd-actions { display: flex; gap: 0.5rem; }
  .sd-btn {
    background: none;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: rgba(226,232,240,0.45);
    font-size: 0.73rem;
    padding: 0.28rem 0.65rem;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .sd-btn:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
  .sd-btn.danger:hover { color: #f87171; border-color: rgba(239,68,68,0.3); }
  .sd-btn.primary {
    border-color: rgba(99,102,241,0.4);
    color: #a5b4fc;
  }
  .sd-btn.primary:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.6); color: #c7d2fe; }

  .sd-warn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    color: #fbbf24;
    background: rgba(251,191,36,0.08);
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
  }

  .sd-empty { padding: 2.5rem; text-align: center; color: rgba(226,232,240,0.2); font-size: 0.88rem; }

  /* ── Reset modal ── */
  .sd-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .sd-modal {
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 380px;
  }
  .sd-modal-title { font-size: 1rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.3rem; }
  .sd-modal-sub { font-size: 0.78rem; color: rgba(226,232,240,0.35); margin-bottom: 1.4rem; }
  .sd-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
  .sd-label { font-size: 0.73rem; font-weight: 500; color: rgba(226,232,240,0.45); }
  .sd-input {
    padding: 0.6rem 0.85rem;
    background: #0f1117;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .sd-input:focus { border-color: rgba(99,102,241,0.5); }
  .sd-modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.2rem; }
  .sd-cancel { padding: 0.55rem 1.1rem; background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: rgba(226,232,240,0.5); font-size: 0.83rem; cursor: pointer; }
  .sd-confirm { padding: 0.55rem 1.2rem; background: #6366f1; border: none; border-radius: 6px; color: #fff; font-size: 0.83rem; font-weight: 600; cursor: pointer; }
  .sd-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
  .sd-modal-error { margin-top: 0.6rem; padding: 0.5rem 0.7rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 5px; color: #fca5a5; font-size: 0.78rem; }
  .sd-success { color: #4ade80; font-size: 0.78rem; margin-top: 0.5rem; }
`;

function ResetModal({ usuario, onClose, onDone }) {
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(usuario.id, pass);
      setOk(true);
      setTimeout(() => { onDone(); onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al resetear.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sd-modal">
        <div className="sd-modal-title">Resetear contraseña</div>
        <div className="sd-modal-sub">Usuario: <strong>{usuario.username}</strong></div>
        <form onSubmit={handleSubmit}>
          <div className="sd-field">
            <label className="sd-label">Nueva contraseña temporal</label>
            <input className="sd-input" type="password" value={pass}
              onChange={e => setPass(e.target.value)} required autoFocus
              placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>
          {error && <div className="sd-modal-error">{error}</div>}
          {ok && <div className="sd-success">Contraseña reseteada correctamente.</div>}
          <div className="sd-modal-actions">
            <button type="button" className="sd-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="sd-confirm" disabled={loading || ok}>
              {loading ? 'Guardando...' : 'Resetear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NuevoUsuarioModal({ salonId, onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', password: '', rol: 'empleado' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await crearUsuario(salonId, form);
      onCreated();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : (detail || 'Error al crear el usuario.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sd-modal">
        <div className="sd-modal-title">Nuevo usuario</div>
        <div className="sd-modal-sub">Se creará con cambio de contraseña obligatorio al primer login.</div>
        <form onSubmit={handleSubmit}>
          <div className="sd-field">
            <label className="sd-label">Nombre de usuario</label>
            <input className="sd-input" value={form.username}
              onChange={e => set('username', e.target.value)} required autoFocus placeholder="ej: riverempleado" />
          </div>
          <div className="sd-field">
            <label className="sd-label">Contraseña temporal</label>
            <input className="sd-input" type="password" value={form.password}
              onChange={e => set('password', e.target.value)} required placeholder="Mínimo 8 caracteres" />
          </div>
          <div className="sd-field">
            <label className="sd-label">Rol</label>
            <select className="sd-input" value={form.rol} onChange={e => set('rol', e.target.value)}
              style={{ cursor: 'pointer' }}>
              <option value="empleado">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="sd-modal-error">{error}</div>}
          <div className="sd-modal-actions">
            <button type="button" className="sd-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="sd-confirm" disabled={loading}>
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalonDetalle({ salon, onBack }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState(null);
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [salonActivo, setSalonActivo] = useState(salon.activo);

  const cargar = useCallback(async () => {
    try {
      const res = await getUsuariosSalon(salon.id);
      setUsuarios(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [salon.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (u) => {
    try {
      await toggleActivo(u.id);
      await cargar();
    } catch {}
  };

  const handleRolChange = async (u, nuevoRol) => {
    try {
      await actualizarRol(u.id, nuevoRol);
      await cargar();
    } catch {}
  };

  const handleToggleSalon = async () => {
    try {
      await actualizarSalon(salon.id, { activo: !salonActivo });
      setSalonActivo(v => !v);
    } catch {}
  };


  return (
    <Layout>
      <style>{S}</style>
      <div className="sd-layout">
        <div className="sd-topbar">
          <button className="sd-back-btn" onClick={onBack}>
            ← Volver
          </button>
          <span className="sd-topbar-sep">/</span>
          <span className="sd-topbar-title">{salon.nombre}</span>
        </div>

        <div className="sd-main">
          <div className="sd-header">
            <div>
              <div className="sd-salon-name">{salon.nombre}</div>
              <div className="sd-salon-meta">
                <span className={`sd-badge ${salonActivo ? 'activo' : 'inactivo'}`}>
                  {salonActivo ? 'Activo' : 'Inactivo'}
                </span>
                <span className="sd-badge plan">{salon.plan}</span>
                <span className="sd-slug">{salon.slug}</span>
              </div>
            </div>
            <button
              className={`sd-btn ${salonActivo ? 'danger' : ''}`}
              onClick={handleToggleSalon}
            >
              {salonActivo ? 'Desactivar salón' : 'Activar salón'}
            </button>
          </div>

          <div className="sd-section">
            <div className="sd-section-head">
              <span className="sd-section-title">Usuarios del salón</span>
              <button className="sd-btn primary" onClick={() => setShowNuevoUsuario(true)}>
                + Nuevo usuario
              </button>
            </div>

            {loading ? (
              <div className="sd-empty">Cargando...</div>
            ) : usuarios.length === 0 ? (
              <div className="sd-empty">No hay usuarios para este salón.</div>
            ) : (
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Contraseña</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>
                        <select
                          value={u.rol}
                          onChange={e => handleRolChange(u, e.target.value)}
                          style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px', color: 'rgba(226,232,240,0.75)',
                            fontSize: '0.82rem', padding: '0.2rem 0.4rem', cursor: 'pointer',
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="empleado">Empleado</option>
                        </select>
                      </td>
                      <td>
                        <span className={`sd-badge ${u.activo ? 'activo' : 'inactivo'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {u.debe_cambiar_password && (
                          <span className="sd-warn">⚠ Pendiente de cambio</span>
                        )}
                      </td>
                      <td>
                        <div className="sd-actions">
                          <button className="sd-btn primary" onClick={() => setResetTarget(u)}>
                            Reset contraseña
                          </button>
                          <button
                            className={`sd-btn ${u.activo ? 'danger' : ''}`}
                            onClick={() => handleToggle(u)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
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
      </div>

      {resetTarget && (
        <ResetModal
          usuario={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={cargar}
        />
      )}

      {showNuevoUsuario && (
        <NuevoUsuarioModal
          salonId={salon.id}
          onClose={() => setShowNuevoUsuario(false)}
          onCreated={cargar}
        />
      )}
    </Layout>
  );
}
