import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getServicios = () => api.get('/servicios/');
export const createCliente = (clienteData) => api.post('/clientes/', clienteData);
export const createTurno = (turnoData) => api.post('/turns/', turnoData);

export default api;