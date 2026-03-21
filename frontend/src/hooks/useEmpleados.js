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

  return { empleados, loading, error, refetch: fetchEmpleados, addEmpleado };
}