import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider }   from './context/AppContext';
import Layout            from './components/layout/Layout';
import DashboardPage     from './pages/DashboardPage';
import TurnosPage        from './pages/TurnosPage';
import ClientesPage      from './pages/ClientesPage';
import EmpleadosPage     from './pages/EmpleadosPage';
import ServiciosPage     from './pages/ServiciosPage';
import CajaPage          from './pages/CajaPage';
import './styles/globals.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index              element={<DashboardPage />}  />
            <Route path="turnos"      element={<TurnosPage />}     />
            <Route path="clientes"    element={<ClientesPage />}   />
            <Route path="empleados"   element={<EmpleadosPage />}  />
            <Route path="servicios"   element={<ServiciosPage />}  />
            <Route path="caja"        element={<CajaPage />}       />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}