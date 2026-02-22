import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteList } from './components/ClienteList';
import { ReservaForm } from './components/ReservaForm';
import { TurnoList } from './components/TurnoList';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, 
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="py-10 px-5 min-h-screen bg-gray-50">
        <header className="mb-10 text-center">
          <h1 className="text-4xl text-indigo-700 font-extrabold tracking-tight">VilLan Turnera</h1>
          <p className="text-gray-500 mt-2 text-lg italic">Gestión profesional de turnos y clientes</p>
        </header>
        
        <main className="max-w-7xl mx-auto space-y-12">
          {/* Fila superior: Formulario y Clientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section>
              <ReservaForm />
            </section>

            <section className="bg-white shadow-xl rounded-2xl p-4 border border-gray-100 h-fit">
              <ClienteList />
            </section>
          </div>

          {/* Fila inferior: Reservas */}
          <section className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <TurnoList />
          </section>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
