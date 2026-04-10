import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const login = useCallback(async (username, password) => {
    // Obtener el slug del subdominio (ej: salon1.tudominio.com -> salon1)
    const host = window.location.hostname;
    let slug = '';
    
    if (host === 'localhost' || host === '127.0.0.1') {
      // Para desarrollo local, puedes usar un parámetro en la URL ?salon=slug
      // o hardcodear uno temporalmente
      slug = new URLSearchParams(window.location.search).get('salon') || 'salon1';
    } else {
      // En producción, tomamos la primera parte del dominio
      slug = host.split('.')[0];
    }

    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    // Enviamos el slug como parámetro de consulta
    const res = await api.post(`/auth/login?slug=${slug}`, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);

    // Traer datos del usuario
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    localStorage.setItem('user', JSON.stringify(meRes.data));
    setUser(meRes.data);

    return meRes.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
