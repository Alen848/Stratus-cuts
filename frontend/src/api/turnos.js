import api from './axios';  // axios.js es el cliente correcto en este proyecto

export const getTurnos   = (skip = 0, limit = 100) => api.get(`/turns/?skip=${skip}&limit=${limit}`);
export const getTurno    = (id)                     => api.get(`/turns/${id}`);
export const createTurno = (data)                   => api.post('/turns/', data);
export const updateTurno = (id, data)               => api.put(`/turns/${id}`, data);
export const deleteTurno = (id)                     => api.delete(`/turns/${id}`);