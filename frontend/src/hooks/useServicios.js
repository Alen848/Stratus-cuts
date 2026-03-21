import { useState, useEffect, useCallback } from 'react';
import * as serviciosApi from '../api/servicios';

export function useServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await serviciosApi.getServicios();
      setServicios(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServicios(); }, [fetchServicios]);

  const addServicio = async (data) => {
    const res = await serviciosApi.createServicio(data);
    setServicios((prev) => [...prev, res.data]);
    return res.data;
  };

  return { servicios, loading, error, refetch: fetchServicios, addServicio };
}