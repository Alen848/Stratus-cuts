import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const S = `
  .sa-login {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f1117;
  }

  .sa-login-box {
    width: 100%;
    max-width: 380px;
    padding: 2.5rem 2rem;
    background: #161b27;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
  }

  .sa-login-logo {
    font-size: 1.1rem;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.04em;
    margin-bottom: 0.4rem;
  }

  .sa-login-sub {
    font-size: 0.78rem;
    color: rgba(226,232,240,0.38);
    margin-bottom: 2rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .sa-field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 1rem;
  }

  .sa-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(226,232,240,0.55);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .sa-input {
    padding: 0.65rem 0.9rem;
    background: #0f1117;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .sa-input:focus { border-color: rgba(99,102,241,0.6); }

  .sa-btn {
    width: 100%;
    padding: 0.72rem;
    margin-top: 0.5rem;
    background: #6366f1;
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  .sa-btn:hover { background: #4f52d4; transform: translateY(-1px); }
  .sa-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .sa-error {
    margin-top: 0.9rem;
    padding: 0.6rem 0.8rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 6px;
    color: #fca5a5;
    font-size: 0.82rem;
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión activa, ir directo al dashboard
  if (localStorage.getItem('sa_token')) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      const data = res.data;

      if (data.rol !== 'superadmin') {
        setError('Acceso restringido a superadmin.');
        return;
      }

      localStorage.setItem('sa_token', data.access_token);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg).join('. ') || 'Error de validación.');
      } else {
        setError(detail || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{S}</style>
      <div className="sa-login">
        <div className="sa-login-box">
          <div className="sa-login-logo">Stratus</div>
          <div className="sa-login-sub">Panel de administración</div>

          <form onSubmit={handleSubmit}>
            <div className="sa-field">
              <label className="sa-label">Usuario</label>
              <input
                className="sa-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="sa-field">
              <label className="sa-label">Contraseña</label>
              <input
                className="sa-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="sa-btn" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            {error && <div className="sa-error">{error}</div>}
          </form>
        </div>
      </div>
    </>
  );
}
