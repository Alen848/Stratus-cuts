import { useState, useEffect, useCallback } from 'react';
import * as turnosApi from '../api/turnos';

export function useTurnos() {
  const [turnos, setTurnos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTurnos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await turnosApi.getTurnos();
      setTurnos(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTurnos(); }, [fetchTurnos]);

  const addTurno = async (data) => {
    const res = await turnosApi.createTurno(data);
    setTurnos((prev) => [...prev, res.data]);
    return res.data;
  };

  const editTurno = async (id, data) => {
    const res = await turnosApi.updateTurno(id, data);
    setTurnos((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    return res.data;
  };

  const removeTurno = async (id) => {
    await turnosApi.deleteTurno(id);
    setTurnos((prev) => prev.filter((t) => t.id !== id));
  };

  return { turnos, loading, error, refetch: fetchTurnos, addTurno, editTurno, removeTurno };
}