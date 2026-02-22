import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteList } from './components/ClienteList';
import { ReservaForm } from './components/ReservaForm';
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
      <div style={{ padding: '40px 20px', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#4338ca', fontWeight: 'bold' }}>VilLan Turnera</h1>
          <p style={{ color: '#6b7280' }}>Gestión profesional de turnos y clientes</p>
        </header>
        
        <main style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '40px', 
          maxWidth: '1200px', 
          margin: '0 auto' 
        }}>
          <section>
            <ReservaForm />
          </section>

          <section className="bg-white shadow-lg rounded-xl p-2 border border-gray-100">
            <ClienteList />
          </section>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
