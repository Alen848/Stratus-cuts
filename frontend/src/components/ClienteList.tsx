import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Cliente } from '../types/cliente';

const fetchClientes = async (): Promise<Cliente[]> => {
  const { data } = await api.get('/clientes/');
  return data;
};

export function ClienteList() {
  const { data: clientes, isLoading, error } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
  });

  if (isLoading) return <div>Cargando clientes...</div>;
  if (error) return <div>Error al cargar clientes</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Lista de Clientes</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full text-left text-sm font-light">
          <thead className="border-b bg-gray-100 font-medium text-gray-600">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Teléfono</th>
              <th className="px-6 py-4">Email</th>
            </tr>
          </thead>
          <tbody>
            {clientes?.map((cliente) => (
              <tr key={cliente.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">{cliente.id}</td>
                <td className="px-6 py-4 font-semibold">{cliente.nombre}</td>
                <td className="px-6 py-4">{cliente.telefono || '-'}</td>
                <td className="px-6 py-4">{cliente.email || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes?.length === 0 && (
          <p className="text-center py-4 text-gray-500 italic">No hay clientes registrados aún.</p>
        )}
      </div>
    </div>
  );
}
