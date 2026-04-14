// Stratus Industries — Admin Frontend
// Powered by Stratus · stratus.app
import { createContext, useContext, useState, useEffect } from 'react';
import { configSalon as configSalonApi } from '../api/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [salonName, setSalonName]           = useState('');
  const [notification, setNotification]     = useState(null);
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cargar el nombre real del salón desde la API
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    configSalonApi.get()
      .then(res => {
        if (res.data?.nombre_salon) setSalonName(res.data.nombre_salon);
      })
      .catch(() => {
        // Si falla (ej: token expirado) no hacer nada, el nombre queda vacío
      });
  }, []);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const toggleSidebar   = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar    = () => setIsSidebarOpen(false);
  const toggleCollapse  = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <AppContext.Provider value={{
      salonName,
      notification,
      notify,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      isSidebarCollapsed,
      toggleCollapse,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
