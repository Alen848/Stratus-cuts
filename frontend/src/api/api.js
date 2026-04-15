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

  // Retorna disponibilidad semanal: { '2024-12-01': [{hora, disponible, ...}], ... }
  getDisponibilidadSemanal: (empleadoId, fechaInicio) =>
    api.get(`/turns/disponibilidad-semanal/${empleadoId}`, { params: { fecha_inicio: fechaInicio } }),
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
  diaria:    (fecha)     => api.get('/caja/diaria',    { params: { fecha } }),
  mensual:   (anio, mes) => api.get('/caja/mensual',   { params: { anio, mes } }),
  getCierre: (fecha)     => api.get('/caja/cierre',    { params: { fecha } }),
  historial: (anio, mes) => api.get('/caja/historial', { params: { anio, mes } }),
  cerrar:    (data)      => api.post('/caja/cerrar', data),
};

// ─── Horario del salón  →  /horarios-salon ───────────────────────────────────
export const horariosSalon = {
  getAll: ()       => api.get('/horarios-salon/'),
  update: (data)   => api.put('/horarios-salon/', data),
};

// ─── Configuración del salón  →  /config-salon ───────────────────────────────
export const configSalon = {
  get:    ()       => api.get('/config-salon/'),
  update: (data)   => api.put('/config-salon/', data),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  cambiarPassword: (nueva_password) => api.put('/auth/cambiar-password', { nueva_password }),
};

// ─── Comisiones (helper local, no requiere endpoint dedicado) ─────────────────
// Calcula la comisión de un empleado a partir de los datos de caja.
// porcentaje: número entre 0 y 100 (ej: 30 para 30%)
export const calcularComision = (totalFacurado, porcentaje) => {
  if (!totalFacurado || !porcentaje) return 0;
  return parseFloat(((totalFacurado * porcentaje) / 100).toFixed(2));
};