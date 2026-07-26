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

export const getDisponibilidadSemanal = (empleadoId, fechaInicio, duracion) =>
  api.get(pub(`/disponibilidad/${empleadoId}`), {
    params: { fecha_inicio: fechaInicio, ...(duracion ? { duracion } : {}) },
  });

// Comprobante de transferencia (subida del cliente)
export const subirComprobante = (turnoId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  // Content-Type undefined => el navegador setea multipart/form-data con boundary
  return api.post(pub(`/turnos/${turnoId}/comprobante`), fd, {
    headers: { 'Content-Type': undefined },
  });
};

// Mercado Pago / seña
export const getPagoConfig = () => api.get(pub('/pago-config'));
export const getTurnoEstado = (turnoId) => api.get(pub(`/turnos/${turnoId}/estado`));

export default api;
