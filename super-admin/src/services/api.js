import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_URL });

// Inyecta el token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el backend devuelve 401, limpia sesión
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sa_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  return api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// Salones
export const getSalones = () => api.get('/superadmin/salones');
export const crearSalon = (data) => api.post('/superadmin/salones', data);
export const actualizarSalon = (id, data) => api.patch(`/superadmin/salones/${id}`, data);

// Usuarios de salones
export const getUsuariosSalon = (salonId) => api.get(`/superadmin/salones/${salonId}/usuarios`);
export const crearUsuario = (salonId, data) => api.post(`/superadmin/salones/${salonId}/usuarios`, data);
export const resetPassword = (usuarioId, nueva_password) =>
  api.patch(`/superadmin/usuarios/${usuarioId}/reset-password`, { nueva_password });
export const toggleActivo = (usuarioId) =>
  api.patch(`/superadmin/usuarios/${usuarioId}/toggle-activo`);
export const actualizarRol = (usuarioId, rol) =>
  api.patch(`/superadmin/usuarios/${usuarioId}/rol`, { rol });

// Pagos
export const getPagosMes = (anio, mes) => api.get(`/superadmin/pagos/?anio=${anio}&mes=${mes}`);
export const upsertPago = (data) => api.post('/superadmin/pagos/', data);
export const actualizarPago = (pagoId, data) => api.patch(`/superadmin/pagos/${pagoId}`, data);
