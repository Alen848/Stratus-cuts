import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const SALON_SLUG = import.meta.env.VITE_SALON_SLUG;

if (!SALON_SLUG) {
  console.warn('[api] VITE_SALON_SLUG no está definido en .env');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pub = (path) => `/public/${SALON_SLUG}${path}`;

export const getServicios = () => api.get(pub('/servicios'));
export const getEmpleados = () => api.get(pub('/empleados'));
export const createCliente = (clienteData) => api.post(pub('/clientes'), clienteData);
export const createTurno = (turnoData) => api.post(pub('/turnos'), turnoData);

export const getDisponibilidadSemanal = (empleadoId, fechaInicio) =>
  api.get(pub(`/disponibilidad/${empleadoId}`), { params: { fecha_inicio: fechaInicio } });

export default api;
