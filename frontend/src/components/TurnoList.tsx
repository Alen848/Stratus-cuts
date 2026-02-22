import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Turno } from '../types/turno';

const fetchTurnos = async (): Promise<Turno[]> => {
  const { data } = await api.get('/turns/');
  return data;
};

export function TurnoList() {
  const { data: turnos, isLoading, error } = useQuery<Turno[]>({
    queryKey: ['turnos'],
    queryFn: fetchTurnos,
  });

  const formatFecha = (fechaStr: string) => {
    const date = new Date(fechaStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'completado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="p-4 text-indigo-600 animate-pulse">Cargando reservas...</div>;
  if (error) return <div className="p-4 text-red-600">Error al cargar el historial de reservas.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Historial de Reservas</h2>
      <div className="overflow-x-auto shadow-lg rounded-2xl border border-gray-100">
        <table className="min-w-full text-left text-sm font-light bg-white">
          <thead className="border-b bg-gray-50 font-bold text-gray-700 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Profesional</th>
              <th className="px-6 py-4">Servicios</th>
              <th className="px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {turnos?.map((turno) => (
              <tr key={turno.id} className="border-b hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4 font-medium text-indigo-900">{formatFecha(turno.fecha_hora)}</td>
                <td className="px-6 py-4 font-semibold text-gray-800">{turno.cliente?.nombre || 'Desconocido'}</td>
                <td className="px-6 py-4 text-gray-700">{turno.empleado?.nombre || 'No asignado'}</td>
                <td className="px-6 py-4 text-gray-600">
                  {turno.servicios?.map(s => (
                    <span key={s.id} className="block text-xs italic">
                      • {s.servicio?.nombre} (${s.precio_unitario})
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(turno.estado)}`}>
                    {turno.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!turnos || turnos.length === 0) && (
          <div className="text-center py-10 bg-white">
            <p className="text-gray-400 italic">No hay reservas registradas en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
