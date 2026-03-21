import api from './axios';  // axios.js es el cliente correcto en este proyecto

export const getClientes   = (skip = 0, limit = 100) => api.get(`/clientes/?skip=${skip}&limit=${limit}`);
export const getCliente    = (id)                     => api.get(`/clientes/${id}`);
export const createCliente = (data)                   => api.post('/clientes/', data);
export const updateCliente = (id, data)               => api.put(`/clientes/${id}`, data);
export const deleteCliente = (id)                     => api.delete(`/clientes/${id}`);