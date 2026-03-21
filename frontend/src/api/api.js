// ─── Servicios API — capa de acceso al backend ───────────────────────────────
// Importa el cliente axios configurado. Ajustá la ruta si es necesario.
import api from './axios';  // axios.js es el cliente configurado del proyecto

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const clientes = {
  getAll:  (skip = 0, limit = 100) => api.get(`/clientes/?skip=${skip}&limit=${limit}`),
  getById: (id)                     => api.get(`/clientes/${id}`),
  create:  (data)                   => api.post('/clientes/', data),
  update:  (id, data)               => api.put(`/clientes/${id}`, data),
  delete:  (id)                     => api.delete(`/clientes/${id}`),
};

// ─── Empleados ────────────────────────────────────────────────────────────────
export const empleados = {
  getAll:  (skip = 0, limit = 100) => api.get(`/empleados/?skip=${skip}&limit=${limit}`),
  getById: (id)                     => api.get(`/empleados/${id}`),
  create:  (data)                   => api.post('/empleados/', data),
  update:  (id, data)               => api.put(`/empleados/${id}`, data),
  delete:  (id)                     => api.delete(`/empleados/${id}`),
};

// ─── Servicios ────────────────────────────────────────────────────────────────
export const servicios = {
  getAll:  (skip = 0, limit = 100) => api.get(`/servicios/?skip=${skip}&limit=${limit}`),
  getById: (id)                     => api.get(`/servicios/${id}`),
  create:  (data)                   => api.post('/servicios/', data),
  update:  (id, data)               => api.put(`/servicios/${id}`, data),
  delete:  (id)                     => api.delete(`/servicios/${id}`),
};

// ─── Turnos ───────────────────────────────────────────────────────────────────
export const turnos = {
  getAll:   (skip = 0, limit = 100) => api.get(`/turns/?skip=${skip}&limit=${limit}`),
  getById:  (id)                     => api.get(`/turns/${id}`),
  create:   (data)                   => api.post('/turns/', data),
  update:   (id, data)               => api.put(`/turns/${id}`, data),
  delete:   (id)                     => api.delete(`/turns/${id}`),

  // Retorna slots disponibles: [{hora, disponible, fecha_hora}]
  // Ejemplo: turnos.getDisponibles(1, '2024-12-01', 30)
  getDisponibles: (empleadoId, fecha, duracion = 30) =>
    api.get(`/turns/disponibles/${empleadoId}`, { params: { fecha, duracion } }),
};

// ─── Pagos ────────────────────────────────────────────────────────────────────
export const pagos = {
  getAll:  (skip = 0, limit = 100) => api.get(`/pagos/?skip=${skip}&limit=${limit}`),
  getById: (id)                     => api.get(`/pagos/${id}`),

  // Al crear un pago el turno se marca automáticamente como "completado"
  create:  (data)                   => api.post('/pagos/', data),
  // data: { turno_id, monto, metodo_pago?, observaciones? }

  update:  (id, data)               => api.put(`/pagos/${id}`, data),

  // Al eliminar un pago el turno vuelve a "confirmado"
  delete:  (id)                     => api.delete(`/pagos/${id}`),
};

// ─── Gastos  →  /gastos ───────────────────────────────────────────────────────
export const gastos = {
  getAll:  (skip = 0, limit = 100) => api.get(`/gastos/?skip=${skip}&limit=${limit}`),
  getById: (id)                     => api.get(`/gastos/${id}`),
  create:  (data)                   => api.post('/gastos/', data),
  update:  (id, data)               => api.put(`/gastos/${id}`, data),
  delete:  (id)                     => api.delete(`/gastos/${id}`),
};

// ─── Caja  →  /caja ──────────────────────────────────────────────────────────
export const caja = {
  diaria:  (fecha)     => api.get('/caja/diaria',  { params: { fecha } }),
  mensual: (anio, mes) => api.get('/caja/mensual', { params: { anio, mes } }),
};

// ─── Comisiones (helper local, no requiere endpoint dedicado) ─────────────────
// Calcula la comisión de un empleado a partir de los datos de caja.
// porcentaje: número entre 0 y 100 (ej: 30 para 30%)
export const calcularComision = (totalFacurado, porcentaje) => {
  if (!totalFacurado || !porcentaje) return 0;
  return parseFloat(((totalFacurado * porcentaje) / 100).toFixed(2));
};