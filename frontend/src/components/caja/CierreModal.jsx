import { useState, useEffect } from 'react';
import Modal  from '../ui/Modal';
import Input  from '../ui/Input';
import Button from '../ui/Button';

export default function CierreModal({ isOpen, onClose, onSubmit, resumen, fecha }) {
  const [efectivoReal, setEfectivoReal]   = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading]             = useState(false);

  // Totales calculados a partir del resumen
  const saldoAnterior = resumen?.saldo_anterior || 0;
  
  const ingresosEfectivo = resumen?.detalle_ingresos
    ?.filter(i => i.metodo_pago?.toLowerCase() === 'efectivo')
    ?.reduce((acc, curr) => acc + curr.monto, 0) || 0;
  
  const totalTransferencia = resumen?.detalle_ingresos
    ?.filter(i => i.metodo_pago?.toLowerCase() === 'transferencia')
    ?.reduce((acc, curr) => acc + curr.monto, 0) || 0;

  const totalDebito = resumen?.detalle_ingresos
    ?.filter(i => i.metodo_pago?.toLowerCase() === 'débito' || i.metodo_pago?.toLowerCase() === 'tarjeta')
    ?.reduce((acc, curr) => acc + curr.monto, 0) || 0;

  const totalGastos = resumen?.total_gastos || 0;
  
  // LOGICA: Saldo Anterior + Ingresos Efectivo - Gastos
  const teoricoEfectivo = saldoAnterior + ingresosEfectivo - totalGastos;
  
  const diferencia = (parseFloat(efectivoReal) || 0) - teoricoEfectivo;

  useEffect(() => {
    if (isOpen) {
      setEfectivoReal('');
      setObservaciones('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (efectivoReal === '') return;
    
    try {
      setLoading(true);
      await onSubmit({
        fecha,
        saldo_anterior:         saldoAnterior,
        total_efectivo_teorico: teoricoEfectivo,
        total_transferencia:    totalTransferencia,
        total_debito:           totalDebito,
        total_gastos:           totalGastos,
        efectivo_real:          parseFloat(efectivoReal),
        diferencia:             diferencia,
        observaciones:          observaciones
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cierre de Caja" width={480}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ 
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', 
          padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Cálculo Teórico</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>(+) Saldo inicial (ayer):</span>
            <span style={{ color: 'var(--text-primary)' }}>$ {saldoAnterior.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>(+) Ventas en Efectivo:</span>
            <span style={{ color: 'var(--color-success, #4caf7d)' }}>+ $ {ingresosEfectivo.toLocaleString()}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>(-) Gastos en Efectivo:</span>
            <span style={{ color: 'var(--color-danger, #e53e3e)' }}>- $ {totalGastos.toLocaleString()}</span>
          </div>

          <div style={{ 
            marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700 
          }}>
            <span>Total Teórico en Caja:</span>
            <span style={{ color: 'var(--gold)' }}>$ {teoricoEfectivo.toLocaleString()}</span>
          </div>
          
          <div style={{ marginTop: '12px', opacity: 0.6, fontSize: '11px', fontStyle: 'italic' }}>
            * No incluye Transferencias ($ {totalTransferencia.toLocaleString()}) ni Débito ($ {totalDebito.toLocaleString()}) ya que no afectan al efectivo físico.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input 
            label="Efectivo Real en Caja" 
            type="number" 
            step="0.01"
            value={efectivoReal} 
            onChange={e => setEfectivoReal(e.target.value)}
            placeholder="Monto contado físicamente..."
            required
            autoFocus
          />

          <div style={{ 
            padding: '12px', borderRadius: 'var(--radius-sm)', 
            background: diferencia === 0 ? 'var(--bg-elevated)' : (diferencia > 0 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(229, 62, 62, 0.1)'),
            border: '1px solid ' + (diferencia === 0 ? 'var(--border)' : (diferencia > 0 ? '#48bb78' : '#e53e3e')),
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Diferencia:</span>
            <span style={{ 
              fontWeight: 700, 
              color: diferencia === 0 ? 'var(--text-primary)' : (diferencia > 0 ? '#48bb78' : '#e53e3e') 
            }}>
              {diferencia > 0 ? '+' : ''} $ {diferencia.toLocaleString()}
            </span>
          </div>
        </div>

        <Input 
          label="Observaciones" 
          as="textarea" 
          value={observaciones} 
          onChange={e => setObservaciones(e.target.value)} 
          placeholder="Notas sobre el cierre..."
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading || efectivoReal === ''}>
            {loading ? 'Cerrando...' : 'Confirmar Cierre'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}