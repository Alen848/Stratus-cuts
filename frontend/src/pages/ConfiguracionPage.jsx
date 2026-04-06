import { useState, useEffect, useCallback } from 'react';
import { horariosSalon as horariosSalonApi, configSalon as configSalonApi } from '../api/api';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_HORARIOS = DIAS.map((_, i) => ({
  dia_semana:    i,
  hora_apertura: '09:00',
  hora_cierre:   i < 5 ? '20:00' : '18:00',
  activo:        i < 6,
}));

const DEFAULT_CONFIG = {
  nombre_salon: '',
  telefono:     '',
  direccion:    '',
  url_reserva:  '',
};

function timeToStr(t) {
  return t ? String(t).slice(0, 5) : '';
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: value ? 'var(--gold)' : 'var(--border-strong)',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '4px',
        left: value ? '22px' : '4px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

function FieldRow({ label, hint, children }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '200px 1fr',
      gap: '20px', alignItems: 'start',
      padding: '16px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          padding: '9px 24px', borderRadius: 'var(--radius-sm)',
          border: 'none', background: 'var(--gold)', color: '#000',
          fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
      {saved && !error && (
        <span style={{ fontSize: '13px', color: 'var(--color-success, #4caf7d)' }}>Guardado correctamente</span>
      )}
      {error && (
        <span style={{ fontSize: '13px', color: '#e53e3e' }}>{error}</span>
      )}
    </div>
  );
}

// ─── Sub-tab: Horarios ────────────────────────────────────────────────────────
function TabHorarios({ horarios, setDia }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    setError('');
    for (const h of horarios) {
      if (h.activo && h.hora_apertura >= h.hora_cierre) {
        setError(`Horario de ${DIAS[h.dia_semana]} inválido (apertura debe ser antes del cierre).`);
        return;
      }
    }
    try {
      setSaving(true);
      await horariosSalonApi.update(horarios);
      setSaved(true);
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
        Definí los días y horas de atención. Esto determina los horarios disponibles al crear turnos y en la reserva de clientes.
      </p>

      {horarios.map((h, idx) => (
        <div
          key={h.dia_semana}
          style={{
            display: 'grid', gridTemplateColumns: '200px 1fr',
            gap: '20px', alignItems: 'center',
            padding: '14px 0',
            borderBottom: '1px solid var(--border)',
            opacity: h.activo ? 1 : 0.5,
            transition: 'opacity 0.15s',
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
            {DIAS[h.dia_semana]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <input
              type="time"
              disabled={!h.activo}
              value={h.hora_apertura}
              onChange={e => { setDia(idx, 'hora_apertura', e.target.value); setSaved(false); }}
              style={{ ...inputSt, width: '120px' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>a</span>
            <input
              type="time"
              disabled={!h.activo}
              value={h.hora_cierre}
              onChange={e => { setDia(idx, 'hora_cierre', e.target.value); setSaved(false); }}
              style={{ ...inputSt, width: '120px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
              <Toggle value={h.activo} onChange={v => { setDia(idx, 'activo', v); setSaved(false); }} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '52px' }}>
                {h.activo ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
          </div>
        </div>
      ))}

      <SaveBar onSave={handleSave} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ─── Sub-tab: Info del local ──────────────────────────────────────────────────
function TabInfo({ config, setField }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = config.url_reserva || window.location.origin.replace('5173', '5174');
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = async () => {
    setError('');
    try {
      setSaving(true);
      await configSalonApi.update({
        nombre_salon:          config.nombre_salon,
        telefono:              config.telefono,
        direccion:             config.direccion,
        url_reserva:           config.url_reserva,
        reservas_online:       true,
        max_dias_anticipacion: 60,
        min_hs_anticipacion:   1,
      });
      setSaved(true);
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
        Datos generales del negocio. El nombre aparece en el panel y en las comunicaciones con clientes.
      </p>

      <FieldRow label="Nombre del salón" hint="Se muestra en el panel y en los recordatorios.">
        <input
          type="text"
          value={config.nombre_salon}
          onChange={e => { setField('nombre_salon', e.target.value); setSaved(false); }}
          placeholder="Ej: Studio Élite"
          style={inputSt}
        />
      </FieldRow>

      <FieldRow label="Teléfono" hint="Número de contacto del salón.">
        <input
          type="tel"
          value={config.telefono}
          onChange={e => { setField('telefono', e.target.value); setSaved(false); }}
          placeholder="Ej: 221 555-1234"
          style={inputSt}
        />
      </FieldRow>

      <FieldRow label="Dirección" hint="Dirección física del local.">
        <input
          type="text"
          value={config.direccion}
          onChange={e => { setField('direccion', e.target.value); setSaved(false); }}
          placeholder="Ej: Av. Corrientes 1234, CABA"
          style={inputSt}
        />
      </FieldRow>

      <FieldRow label="Link de reserva" hint="URL que compartís con tus clientes para que reserven online.">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="url"
            value={config.url_reserva}
            onChange={e => { setField('url_reserva', e.target.value); setSaved(false); }}
            placeholder="https://tudominio.com/reservas"
            style={{ ...inputSt, flex: 1, width: 'auto' }}
          />
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
              color: copied ? 'var(--color-success, #4caf7d)' : 'var(--text-secondary)',
              fontSize: '12px', fontFamily: 'var(--font-body)', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'color 0.2s', flexShrink: 0,
            }}
          >
            {copied ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
      </FieldRow>

      <SaveBar onSave={handleSave} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('horarios');
  const [config, setConfig]       = useState(DEFAULT_CONFIG);
  const [horarios, setHorarios]   = useState(DEFAULT_HORARIOS);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      configSalonApi.get().catch(() => null),
      horariosSalonApi.getAll().catch(() => null),
    ]).then(([cfgRes, horRes]) => {
      if (cfgRes?.data) {
        const d = cfgRes.data;
        setConfig({
          nombre_salon: d.nombre_salon || '',
          telefono:     d.telefono     || '',
          direccion:    d.direccion    || '',
          url_reserva:  d.url_reserva  || '',
        });
      }
      if (horRes?.data?.length > 0) {
        const sorted = [...horRes.data].sort((a, b) => a.dia_semana - b.dia_semana);
        setHorarios(sorted.map(h => ({
          dia_semana:    h.dia_semana,
          hora_apertura: timeToStr(h.hora_apertura),
          hora_cierre:   timeToStr(h.hora_cierre),
          activo:        h.activo,
        })));
      }
    }).finally(() => setLoading(false));
  }, []);

  const setField = useCallback((field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const setDia = useCallback((idx, field, value) => {
    setHorarios(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>Cargando configuración...</div>;
  }

  const TABS = [
    { key: 'horarios', label: 'Horarios' },
    { key: 'info',     label: 'Info del local' },
  ];

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* Título */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '28px' }}>
        Configuración
      </h2>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '32px',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 22px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === 'horarios' && (
        <TabHorarios horarios={horarios} setDia={setDia} />
      )}
      {activeTab === 'info' && (
        <TabInfo config={config} setField={setField} />
      )}

    </div>
  );
}

const inputSt = {
  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
  color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-body)',
  colorScheme: 'dark', boxSizing: 'border-box', width: '100%',
};
