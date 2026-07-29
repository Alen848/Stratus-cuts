import api from './axios';

export const getCategorias   = ()         => api.get('/categorias-servicio/');
export const createCategoria = (data)     => api.post('/categorias-servicio/', data);
export const updateCategoria = (id, data) => api.put(`/categorias-servicio/${id}`, data);
export const deleteCategoria = (id)       => api.delete(`/categorias-servicio/${id}`);
