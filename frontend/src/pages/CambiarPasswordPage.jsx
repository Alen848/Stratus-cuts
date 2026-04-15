import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CambiarPasswordPage() {
  const { refreshUser, logout } = useAuth();
  const [nueva, setNueva]       = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/cambiar-password', { nueva_password: nueva });
      await refreshUser(); // actualiza user.debe_cambiar_password → false → redirige al app
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, var(--gold-dim) 0%, transparent 60%)',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '40px 36px',
        width: '100%', maxWidth: '400px',
      }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', color: 'var(--gold)', marginBottom: '16px',
          }}>
            ◈
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600,
            color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px',
          }}>
            Cambiar contraseña
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Tu cuenta requiere que establezcas una nueva contraseña antes de continuar.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#fca5a5', borderRadius: 'var(--radius-sm)',
            padding: '10px 14px', marginBottom: '20px', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.04em' }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoFocus
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: '14px',
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.04em' }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: '14px',
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px', padding: '11px',
              background: 'var(--gold)', color: '#ffffff',
              fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
              border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.18s, opacity 0.18s',
            }}
          >
            {loading ? 'Guardando...' : 'Establecer contraseña'}
          </button>
        </form>

        <button
          onClick={logout}
          style={{
            marginTop: '16px', width: '100%', background: 'transparent',
            border: 'none', color: 'var(--text-muted)', fontSize: '12px',
            cursor: 'pointer', textDecoration: 'underline', padding: '4px',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
