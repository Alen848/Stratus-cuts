import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider }   from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient();
import Layout            from './components/layout/Layout';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import TurnosPage        from './pages/TurnosPage';
import ClientesPage      from './pages/ClientesPage';
import EmpleadosPage     from './pages/EmpleadosPage';
import ServiciosPage     from './pages/ServiciosPage';
import CajaPage          from './pages/CajaPage';
import AnalisisPage          from './pages/AnalisisPage';
import RecordatoriosPage     from './pages/RecordatoriosPage';
import ConfiguracionPage     from './pages/ConfiguracionPage';
import CambiarPasswordPage   from './pages/CambiarPasswordPage';
import './styles/globals.css';

function PrivateRoutes() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.debe_cambiar_password) return <CambiarPasswordPage />;

  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index              element={<DashboardPage />}  />
          <Route path="turnos"      element={<TurnosPage />}     />
          <Route path="clientes"    element={<ClientesPage />}   />
          <Route path="empleados"   element={<EmpleadosPage />}  />
          <Route path="servicios"   element={<ServiciosPage />}  />
          <Route path="caja"        element={<CajaPage />}       />
          <Route path="analisis"        element={<AnalisisPage />}        />
          <Route path="recordatorios"   element={<RecordatoriosPage />}   />
          <Route path="configuracion"   element={<ConfiguracionPage />}   />
        </Route>
      </Routes>
    </AppProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*"     element={<PrivateRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
