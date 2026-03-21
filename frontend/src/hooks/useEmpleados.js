import { useState, useEffect, useCallback } from 'react';
import * as empleadosApi from '../api/empleados';

export function useEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchEmpleados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await empleadosApi.getEmpleados();
      setEmpleados(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmpleados(); }, [fetchEmpleados]);

  const addEmpleado = async (data) => {
    const res = await empleadosApi.createEmpleado(data);
    setEmpleados((prev) => [...prev, res.data]);
    return res.data;
  };

  const editEmpleado = async (id, data) => {
    const res = await empleadosApi.updateEmpleado(id, data);
    setEmpleados((prev) => prev.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const removeEmpleado = async (id) => {
    await empleadosApi.deleteEmpleado(id);
    setEmpleados((prev) => prev.filter(e => e.id !== id));
  };

  return { 
    empleados, 
    loading, 
    error, 
    refetch: fetchEmpleados, 
    addEmpleado,
    editEmpleado,
    removeEmpleado
  };
}
