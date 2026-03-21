import api from './axios';

export const getEmpleados    = (skip = 0, limit = 100) => api.get(`/empleados/?skip=${skip}&limit=${limit}`);
export const createEmpleado  = (data)                   => api.post('/empleados/', data);
export const updateEmpleado  = (id, data)               => api.put(`/empleados/${id}`, data);
export const deleteEmpleado  = (id)                     => api.delete(`/empleados/${id}`);
