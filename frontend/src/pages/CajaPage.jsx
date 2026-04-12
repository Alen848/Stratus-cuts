import { useState } from 'react';
import CajaDiaria      from '../components/caja/CajaDiaria';
import CajaMensual     from '../components/caja/CajaMensual';
import HistorialCierres from '../components/caja/HistorialCierres';

const TABS = [
  { key: 'diaria',    label: 'Caja diaria'   },
  { key: 'mensual',   label: 'Análisis mes'  },
  { key: 'historial', label: 'Historial'     },
];

export default function CajaPage() {
  const [tab, setTab] = useState('diaria');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '7px 20px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
              border: tab === t.key ? '1px solid var(--gold-border)' : '1px solid transparent',
              background: tab === t.key ? 'var(--gold-dim)' : 'transparent',
              color:      tab === t.key ? 'var(--gold)'     : 'var(--text-secondary)',
              fontWeight: tab === t.key ? 500               : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'diaria'    && <CajaDiaria />}
      {tab === 'mensual'   && <CajaMensual />}
      {tab === 'historial' && <HistorialCierres />}
    </div>
  );
}
