import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteList } from './components/ClienteList';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Evita reintentos infinitos para ver el error rápido
    },
  },
});

function App() {
  console.log("App se está renderizando...");

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', color: '#4338ca' }}>Turnera SaaS</h1>
          <p style={{ color: '#6b7280' }}>Si ves esto, React está funcionando correctamente.</p>
        </header>
        <main>
          <ClienteList />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
