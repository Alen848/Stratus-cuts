import api from './axios';

export const getServicios   = (skip = 0, limit = 100) => api.get(`/servicios/?skip=${skip}&limit=${limit}`);
export const createServicio = (data)                   => api.post('/servicios/', data);