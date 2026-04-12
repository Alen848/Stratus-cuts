import { useState, useEffect } from 'react';
import Modal  from '../ui/Modal';
import Input  from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

function FilaMetodo({ label, teorico, real, setReal, dif }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '110px 1fr 1fr 80px',
      gap: '8px',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
        {formatCurrency(teorico)}
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={real}
        onChange={e => setReal(e.target.value)}
        placeholder="0"
        required
        style={{
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-strong)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          width: '100%',
          fontFamily: 'var(--font-body)',
        }}
      />
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        textAlign: 'right',
        color: real === ''
          ? 'var(--text-muted)'
          : dif === 0
            ? 'var(--text-muted)'
            : dif > 0
              ? 'var(--color-success, #4caf7d)'
              : 'var(--color-danger, #e53e3e)',
      }}>
        {real === '' ? '—' : dif === 0 ? '✓' : `${dif > 0 ? '+' : ''}${formatCurrency(dif)}`}
      </span>
    </div>
  );
}

export default function CierreModal({ isOpen, onClose, onSubmit, resumen, fecha }) {
  const [efectivoReal, setEfectivoReal]           = useState('');
  const [transferenciaReal, setTransferenciaReal] = useState('');
  const [tarjetaReal, setTarjetaReal]             = useState('');
  const [fondoCaja, setFondoCaja]                 = useState('');
  const [observaciones, setObservaciones]         = useState('');
  const [loading, setLoading]                     = useState(false);

  const saldoAnterior    = resumen?.saldo_anterior || 0;
  const detalleIngresos  = resumen?.detalle_ingresos || [];

  const ingresosEfectivo = detalleIngresos
    .filter(i => { const m = i.metodo_pago?.toLowerCase(); return m === 'efectivo' || !m || m === 'no especificado'; })
    .reduce((acc, curr) => acc + curr.monto, 0);

  const totalTransferencia = detalleIngresos
    .filter(i => i.metodo_pago?.toLowerCase() === 'transferencia')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const totalDebito = detalleIngresos
    .filter(i => ['débito', 'debito', 'tarjeta'].includes(i.metodo_pago?.toLowerCase()))
    .reduce((acc, curr) => acc + curr.monto, 0);

  const totalGastos      = resumen?.total_gastos || 0;
  const teoricoEfectivo  = saldoAnterior + ingresosEfectivo - totalGastos;

  const difEfectivo      = (parseFloat(efectivoReal)      || 0) - teoricoEfectivo;
  const difTransferencia = (parseFloat(transferenciaReal) || 0) - totalTransferencia;
  const difTarjeta       = (parseFloat(tarjetaReal)       || 0) - totalDebito;
  const totalDiferencia  = difEfectivo + difTransferencia + difTarjeta;

  const fondoVal = parseFloat(fondoCaja) || 0;

  useEffect(() => {
    if (isOpen) {
      setEfectivoReal('');
      setTransferenciaReal('');
      setTarjetaReal('');
      setFondoCaja('');
      setObservaciones('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (efectivoReal === '' || transferenciaReal === '' || tarjetaReal === '') return;
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
        transferencia_real:     parseFloat(transferenciaReal),
        tarjeta_real:           parseFloat(tarjetaReal),
        fondo_caja:             fondoVal,
        diferencia:             totalDiferencia,
        observaciones,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cerrar caja" width={520}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Encabezados de la tabla */}
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 1fr 80px',
            gap: '8px',
            padding: '6px 0',
            borderBottom: '2px solid var(--border-strong)',
            marginBottom: '2px',
          }}>
            {['Método', 'Teórico', 'Real contado', 'Diferencia'].map(h => (
              <span key={h} style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                textAlign: h === 'Teórico' || h === 'Diferencia' ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          <FilaMetodo
            label="Efectivo"
            teorico={teoricoEfectivo}
            real={efectivoReal}
            setReal={setEfectivoReal}
            dif={difEfectivo}
          />
          <FilaMetodo
            label="Tarjeta / Posnet"
            teorico={totalDebito}
            real={tarjetaReal}
            setReal={setTarjetaReal}
            dif={difTarjeta}
          />
          <FilaMetodo
            label="Transferencia"
            teorico={totalTransferencia}
            real={transferenciaReal}
            setReal={setTransferenciaReal}
            dif={difTransferencia}
          />
        </div>

        {/* Fondo de caja */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Fondo de caja para mañana
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Efectivo que dejás en la caja para dar vueltos
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={fondoCaja}
            onChange={e => setFondoCaja(e.target.value)}
            placeholder="0"
            style={{
              width: '110px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              textAlign: 'right',
            }}
          />
        </div>

        {/* Resumen de gastos + diferencia total */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', flexDirection: 'column', gap: '2px',
          }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              Gastos del día
            </span>
            <span style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--color-danger, #e53e3e)' }}>
              {formatCurrency(totalGastos)}
            </span>
          </div>

          <div style={{
            padding: '10px 14px',
            background: totalDiferencia === 0
              ? 'var(--bg-card)'
              : totalDiferencia > 0
                ? 'rgba(72,187,120,0.08)'
                : 'rgba(229,62,62,0.08)',
            border: '1px solid ' + (totalDiferencia === 0
              ? 'var(--border)'
              : totalDiferencia > 0
                ? 'rgba(72,187,120,0.35)'
                : 'rgba(229,62,62,0.35)'),
            borderRadius: 'var(--radius-sm)',
            display: 'flex', flexDirection: 'column', gap: '2px',
          }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              Diferencia total
            </span>
            <span style={{
              fontSize: '16px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: totalDiferencia === 0
                ? 'var(--text-muted)'
                : totalDiferencia > 0
                  ? 'var(--color-success, #4caf7d)'
                  : 'var(--color-danger, #e53e3e)',
            }}>
              {totalDiferencia === 0
                ? 'Sin diferencia'
                : `${totalDiferencia > 0 ? '+' : ''}${formatCurrency(totalDiferencia)}`}
            </span>
          </div>
        </div>

        {/* Saldo anterior — nota pequeña */}
        {saldoAnterior > 0 && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            * El teórico de efectivo incluye el fondo de {formatCurrency(saldoAnterior)} dejado ayer.
          </p>
        )}

        {/* Observaciones */}
        <Input
          label="Observaciones (opcional)"
          as="textarea"
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Notas sobre el cierre..."
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || efectivoReal === '' || transferenciaReal === '' || tarjetaReal === ''}
          >
            {loading ? 'Cerrando...' : 'Confirmar cierre'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
