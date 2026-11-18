import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/MiNavbar';
import Footer from './components/Footer';
import WhatsAppBubble from './components/WhatsAppBubble';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import { trackPageView } from './utils/pixel';
import './styles/whatsapp.css';

// initPixel() (main.jsx) dispara el PageView inicial; acá reportamos los
// cambios de ruta de la SPA (el primer render se saltea para no duplicarlo).
function PixelPageViews() {
  const { pathname } = useLocation();
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <PixelPageViews />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/confirmation" element={<Confirmation />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppBubble />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
