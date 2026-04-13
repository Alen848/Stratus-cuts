import { useState, useEffect, useCallback } from 'react';
import * as clientesApi from '../api/clientes';

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clientesApi.getClientes();
      setClientes(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const addCliente = async (data) => {
    const res = await clientesApi.createCliente(data);
    setClientes((prev) => [...prev, res.data]);
    return res.data;
  };

  const editCliente = async (id, data) => {
    const res = await clientesApi.updateCliente(id, data);
    setClientes((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    return res.data;
  };

  const removeCliente = async (id) => {
    // Primero confirmar que el backend aceptó el borrado, luego actualizar el estado local
    await clientesApi.deleteCliente(id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return { clientes, loading, error, refetch: fetchClientes, addCliente, editCliente, removeCliente };
}
