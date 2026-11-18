import { useEffect } from 'react';

// El tema del sitio está fijo en "claro". El usuario no puede cambiarlo.
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    // Limpiar cualquier preferencia guardada de versiones anteriores
    localStorage.removeItem('theme');
  }, []);

  return children;
}
