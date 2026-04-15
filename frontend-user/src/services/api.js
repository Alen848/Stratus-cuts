import axios from 'axios';
import { getSalonSlug } from '../utils/slug';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// El slug se evalúa en runtime para soportar múltiples salones desde un solo build
const pub = (path) => `/public/${getSalonSlug()}${path}`;

export const getServicios = () => api.get(pub('/servicios'));
export const getEmpleados = () => api.get(pub('/empleados'));
export const createCliente = (clienteData) => api.post(pub('/clientes'), clienteData);
export const createTurno = (turnoData) => api.post(pub('/turnos'), turnoData);

export const getDisponibilidadSemanal = (empleadoId, fechaInicio) =>
  api.get(pub(`/disponibilidad/${empleadoId}`), { params: { fecha_inicio: fechaInicio } });

export default api;
