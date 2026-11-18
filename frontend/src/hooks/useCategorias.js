import { useState, useEffect, useCallback } from 'react';
import * as categoriasApi from '../api/categorias';

const byOrden = (a, b) =>
  (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre);

export function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoriasApi.getCategorias();
      setCategorias(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  const addCategoria = async (data) => {
    const res = await categoriasApi.createCategoria(data);
    setCategorias((prev) => [...prev, res.data].sort(byOrden));
    return res.data;
  };

  const editCategoria = async (id, data) => {
    const res = await categoriasApi.updateCategoria(id, data);
    setCategorias((prev) => prev.map((c) => (c.id === id ? res.data : c)).sort(byOrden));
    return res.data;
  };

  const removeCategoria = async (id) => {
    await categoriasApi.deleteCategoria(id);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  };

  return { categorias, loading, error, refetch: fetchCategorias, addCategoria, editCategoria, removeCategoria };
}
