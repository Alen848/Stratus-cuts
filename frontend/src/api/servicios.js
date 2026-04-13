import api from './axios';

export const getServicios   = (skip = 0, limit = 100) => api.get(`/servicios/?skip=${skip}&limit=${limit}`);
export const createServicio = (data)                   => api.post('/servicios/', data);
export const updateServicio = (id, data)               => api.put(`/servicios/${id}`, data);
export const deleteServicio = (id)                     => api.delete(`/servicios/${id}`);
