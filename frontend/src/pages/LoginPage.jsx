import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

const API_URL    = import.meta.env.VITE_API_URL    || '';
const SALON_SLUG = import.meta.env.VITE_SALON_SLUG || '';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    if (!SALON_SLUG || !API_URL) return;
    fetch(`${API_URL}/public/${SALON_SLUG}/info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.nombre) setSalonNombre(d.nombre); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>✂</div>
          <div>
            <div className={styles.brandName}>{salonNombre || 'Panel Admin'}</div>
            <div className={styles.brandSub}>Panel de administración</div>
          </div>
        </div>

        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresá tus credenciales para continuar</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Usuario</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="tu_usuario"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.poweredBy}>
          Powered by <strong>Stratus Industries</strong>
        </p>
      </div>
    </div>
  );
}
