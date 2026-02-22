import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Servicio } from '../types/servicio';
import type { Empleado } from '../types/empleado';
import type { Cliente } from '../types/cliente';

/**
 * Funciones de comunicación con la API
 */
const fetchServicios = async (): Promise<Servicio[]> => {
  const { data } = await api.get('/servicios/');
  return data;
};

const fetchEmpleados = async (): Promise<Empleado[]> => {
  const { data } = await api.get('/empleados/');
  return data;
};

const fetchClientes = async (): Promise<Cliente[]> => {
  const { data } = await api.get('/clientes/');
  return data;
};

const createTurno = async (payload: any) => {
  const { data } = await api.post('/turns/', payload);
  return data;
};

export function ReservaForm() {
  const queryClient = useQueryClient();
  
  /**
   * Estado inicial del formulario
   */
  const [formData, setFormData] = useState({
    cliente_id: '',
    empleado_id: '',
    servicio_id: '',
    fecha_hora: '',
    notas: ''
  });

  /**
   * Consultas de datos (Queries)
   */
  const { data: servicios, isLoading: loadingServicios, isError: errorServicios } = useQuery({
    queryKey: ['servicios'],
    queryFn: fetchServicios,
  });

  const { data: empleados, isLoading: loadingEmpleados, isError: errorEmpleados } = useQuery({
    queryKey: ['empleados'],
    queryFn: fetchEmpleados,
  });

  const { data: clientes, isLoading: loadingClientes, isError: errorClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
  });

  /**
   * Lógica de persistencia (Mutations)
   */
  const mutation = useMutation({
    mutationFn: createTurno,
    onSuccess: () => {
      alert("Reserva confirmada exitosamente.");
      setFormData({
        cliente_id: '',
        empleado_id: '',
        servicio_id: '',
        fecha_hora: '',
        notas: ''
      });
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || "Error en el servidor al procesar la reserva.";
      alert(`Error: ${detail}`);
    }
  });

  /**
   * Manejadores de eventos del formulario
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cliente_id || !formData.servicio_id || !formData.empleado_id || !formData.fecha_hora) {
      alert("Todos los campos obligatorios deben estar completos.");
      return;
    }

    mutation.mutate(formData);
  };

  /**
   * Renderizado de estados de carga y error
   */
  if (loadingServicios || loadingClientes || loadingEmpleados) {
    return <div className="p-6 text-indigo-600 font-medium animate-pulse">Sincronizando datos...</div>;
  }

  if (errorServicios || errorEmpleados || errorClientes) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-xl">
        Error de conexión con el servicio de datos.
      </div>
    );
  }

  /**
   * Interfaz de usuario del componente
   */
  return (
    <div className="p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
      <header className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h2>
        <p className="text-sm text-gray-500 mt-1">Complete el formulario para agendar un nuevo turno</p>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente</label>
          <select
            name="cliente_id"
            value={formData.cliente_id}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">Seleccionar cliente...</option>
            {Array.isArray(clientes) && clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Servicio</label>
          <select
            name="servicio_id"
            value={formData.servicio_id}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">Seleccionar servicio...</option>
            {Array.isArray(servicios) && servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Profesional Responsable</label>
          <select
            name="empleado_id"
            value={formData.empleado_id}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">Seleccionar profesional...</option>
            {Array.isArray(empleados) && empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
          
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora</label>
          <input
            type="datetime-local"
            name="fecha_hora"
            value={formData.fecha_hora}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Adicionales (Opcional)</label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleInputChange}
            rows={2}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            placeholder="Observaciones de la reserva..."
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
            mutation.isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {mutation.isPending ? 'Procesando...' : 'Confirmar Reserva'}
        </button>  
      </form>
    </div>
  );
}
