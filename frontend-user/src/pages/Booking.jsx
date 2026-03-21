import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCliente, createTurno } from '../services/api';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

  .booking-page {
    min-height: 100vh;
    background: #080c14;
    padding-top: 68px;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    justify-content: center;
  }

  .booking-wrap {
    width: 100%;
    max-width: 520px;
    padding: 4rem 2rem 6rem;
    animation: fadeUp 0.6s ease forwards;
  }

  .booking-tag {
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #5fa8c8;
    display: block;
    margin-bottom: 0.75rem;
  }

  .booking-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    font-weight: 400;
    color: #eeeae3;
    line-height: 1.15;
    margin-bottom: 2rem;
  }

  /* Service summary */
  .services-summary {
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2.5rem;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1.1rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 0.85rem;
  }

  .summary-row:last-child { border-bottom: none; }

  .summary-row.total {
    background: rgba(95,168,200,0.05);
    border-top: 1px solid rgba(95,168,200,0.1);
    border-bottom: none;
  }

  .summary-name {
    color: rgba(255,255,255,0.8);
    font-weight: 300;
    font-size: 0.95rem;
  }
  .summary-duration {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    margin-left: 0.5rem;
  }
  .summary-price {
    color: #d4c9b0;
    font-family: 'DM Serif Display', serif;
    font-size: 1.1rem;
  }

  .summary-total-label {
    font-size: 0.68rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    font-weight: 400;
  }

  .summary-total-amount {
    font-family: 'DM Serif Display', serif;
    font-size: 1.3rem;
    color: #d4c9b0;
  }

  /* Form */
  .form { display: flex; flex-direction: column; gap: 1.4rem; }

  .field { display: flex; flex-direction: column; gap: 0.45rem; }

  .field-label {
    font-size: 0.72rem;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
  }

  .field-req { color: #5fa8c8; }

  .field-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 3px;
    padding: 0.9rem 1.1rem;
    color: #eeeae3;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 300;
    outline: none;
    transition: border-color 0.25s, background 0.25s;
    width: 100%;
    color-scheme: dark;
  }

  .field-input::placeholder {
    color: rgba(255,255,255,0.4);
  }

  .field-input:focus {
    border-color: rgba(95,168,200,0.45);
    background: rgba(95,168,200,0.03);
  }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  .error-box {
    background: rgba(200,80,80,0.07);
    border: 1px solid rgba(200,80,80,0.18);
    border-radius: 3px;
    padding: 0.8rem 1rem;
    font-size: 0.82rem;
    font-weight: 300;
    color: rgba(255,120,120,0.85);
    line-height: 1.5;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: #5fa8c8;
    border: none;
    border-radius: 3px;
    color: #080c14;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.25s, transform 0.2s, opacity 0.25s;
    margin-top: 0.5rem;
  }

  .submit-btn:hover:not(:disabled) { background: #7dbdd8; transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  // Soporta tanto un servicio como múltiples
  const selectedServices = location.state?.selectedServices
    || (location.state?.selectedService ? [location.state.selectedService] : null);

  const [formData, setFormData] = useState({ nombre: '', telefono: '', email: '', fecha_hora: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedServices || selectedServices.length === 0) navigate('/');
  }, [selectedServices, navigate]);

  if (!selectedServices || selectedServices.length === 0) return null;

  const totalPrecio = selectedServices.reduce((sum, s) => sum + Number(s.precio), 0);
  const totalDuracion = selectedServices.reduce((sum, s) => sum + s.duracion_minutos, 0);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const clienteResponse = await createCliente({
        nombre: formData.nombre,
        telefono: formData.telefono || null,
        email: formData.email || null,
      });
      const clienteId = clienteResponse.data.id;

      const turnoData = {
        fecha_hora: new Date(formData.fecha_hora).toISOString(),
        duracion: totalDuracion,
        estado: 'pendiente',
        observaciones: '',
        cliente_id: clienteId,
        empleado_id: 1,
        servicios_ids: selectedServices.map(s => s.id),
      };

      const turnoResponse = await createTurno(turnoData);
      navigate('/confirmation', { state: { turno: turnoResponse.data } });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        err.message;
      setError(`Error al reservar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="booking-page">
        <div className="booking-wrap">
          <span className="booking-tag">Reserva de turno</span>
          <h1 className="booking-title">Completá<br />tus datos</h1>

          {/* Resumen de servicios */}
          <div className="services-summary">
            {selectedServices.map(s => (
              <div key={s.id} className="summary-row">
                <span className="summary-name">
                  {s.nombre}
                  <span className="summary-duration">{s.duracion_minutos} min</span>
                </span>
                <span className="summary-price">${s.precio}</span>
              </div>
            ))}
            {selectedServices.length > 1 && (
              <div className="summary-row total">
                <span className="summary-total-label">Total · {totalDuracion} min</span>
                <span className="summary-total-amount">${totalPrecio}</span>
              </div>
            )}
          </div>

          {error && <div className="error-box" style={{marginBottom:'1.5rem'}}>{error}</div>}

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Nombre completo <span className="field-req">*</span></label>
              <input className="field-input" type="text" name="nombre" value={formData.nombre}
                onChange={handleChange} placeholder="Tu nombre y apellido" required />
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label">Teléfono</label>
                <input className="field-input" type="tel" name="telefono" value={formData.telefono}
                  onChange={handleChange} placeholder="2235000000" />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input className="field-input" type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="tu@email.com" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Fecha y hora <span className="field-req">*</span></label>
              <input className="field-input" type="datetime-local" name="fecha_hora"
                value={formData.fecha_hora} onChange={handleChange} required />
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar turno'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}