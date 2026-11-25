import { useState, useEffect, useCallback } from 'react';
import * as turnosApi from '../api/turnos';

export function useTurnos() {
  const [turnos, setTurnos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTurnos = useCallback(async () => {
    try {
      setLoading(true);
      // El backend pagina: pedir páginas hasta traer todos. Con una sola
      // llamada (límite 100) los turnos nuevos quedaban fuera del panel.
      const PAGINA = 500;
      const todos = [];
      for (let skip = 0; ; skip += PAGINA) {
        const res = await turnosApi.getTurnos(skip, PAGINA);
        todos.push(...res.data);
        if (res.data.length < PAGINA) break;
      }
      setTurnos(todos);
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