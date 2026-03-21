import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [salonName] = useState('Studio Élite');
  const [notification, setNotification] = useState(null);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <AppContext.Provider value={{ salonName, notification, notify }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);