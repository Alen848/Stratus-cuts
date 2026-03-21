import api from './axios';

export const getEmpleados   = (skip = 0, limit = 100) => api.get(`/empleados/?skip=${skip}&limit=${limit}`);
export const createEmpleado = (data)                   => api.post('/empleados/', data);