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
  // Se preservan al guardar (no se pisan)
  reservas_online:       true,
  max_dias_anticipacion: 60,
  min_hs_anticipacion:   1,
  // Mercado Pago
  mp_activo:        false,
  mp_configurado:   false,
  mp_public_key:    '',
  sena_porcentaje:  0,
  sena_obligatoria: false,
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

// ─── Sub-tab: Mercado Pago ────────────────────────────────────────────────────
function TabPagos({ config, setField }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');
  const [tokenInput, setTokenInput] = useState('');

  const pct = Number(config.sena_porcentaje) || 0;
  const ejemploSena = Math.round(10000 * pct / 100);

  const handleSave = async () => {
    setError('');
    if (config.mp_activo && !config.mp_configurado && !tokenInput.trim()) {
      setError('Para activar Mercado Pago, ingresá tu Access Token.');
      return;
    }
    if (pct < 0 || pct > 100) {
      setError('El porcentaje de seña debe estar entre 0 y 100.');
      return;
    }
    if (config.sena_obligatoria && pct <= 0) {
      setError('Si la seña es obligatoria, el porcentaje debe ser mayor a 0.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        // se preservan para no pisarlos en el backend
        reservas_online:       config.reservas_online,
        max_dias_anticipacion: config.max_dias_anticipacion,
        min_hs_anticipacion:   config.min_hs_anticipacion,
        // Mercado Pago
        mp_activo:        config.mp_activo,
        mp_public_key:    config.mp_public_key,
        sena_porcentaje:  pct,
        sena_obligatoria: config.sena_obligatoria,
      };
      // El token solo se envía si se ingresó uno nuevo (write-only)
      if (tokenInput.trim()) payload.mp_access_token = tokenInput.trim();

      await configSalonApi.update(payload);

      if (tokenInput.trim()) {
        setField('mp_configurado', true);
        setTokenInput('');
      }
      setSaved(true);
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
        Cobrá una <strong>seña</strong> al reservar online con tu propia cuenta de Mercado Pago.
        El dinero entra directo a tu cuenta — nosotros no lo tocamos.
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
        🔒 Tus credenciales se guardan <strong>cifradas</strong> y no se comparten con nadie.
        Obtenelas en Mercado Pago → Tu negocio → Credenciales.
      </p>

      <FieldRow label="Activar Mercado Pago" hint="Si está apagado, las reservas funcionan sin pago (como hasta ahora).">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Toggle value={config.mp_activo} onChange={v => { setField('mp_activo', v); setSaved(false); }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {config.mp_activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </FieldRow>

      <FieldRow
        label="Access Token"
        hint={config.mp_configurado
          ? 'Ya hay un token guardado. Dejá el campo vacío para conservarlo, o pegá uno nuevo para reemplazarlo.'
          : 'Token privado de tu cuenta de Mercado Pago. Se guarda cifrado.'}
      >
        <input
          type="password"
          autoComplete="off"
          value={tokenInput}
          onChange={e => { setTokenInput(e.target.value); setSaved(false); }}
          placeholder={config.mp_configurado ? '•••••••••• (configurado)' : 'APP_USR-...'}
          style={inputSt}
        />
      </FieldRow>

      <FieldRow label="Public Key" hint="Clave pública de tu cuenta (no es secreta).">
        <input
          type="text"
          autoComplete="off"
          value={config.mp_public_key}
          onChange={e => { setField('mp_public_key', e.target.value); setSaved(false); }}
          placeholder="APP_USR-..."
          style={inputSt}
        />
      </FieldRow>

      <FieldRow
        label="Porcentaje de seña"
        hint={pct > 0
          ? `Ej: en un turno de $10.000, la seña sería $${ejemploSena.toLocaleString('es-AR')}. Con 100% se paga el total online.`
          : 'Porcentaje del total que se cobra como seña. Con 100% se paga todo online.'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min={0}
            max={100}
            value={config.sena_porcentaje}
            onChange={e => { setField('sena_porcentaje', e.target.value); setSaved(false); }}
            style={{ ...inputSt, width: '100px' }}
          />
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>%</span>
        </div>
      </FieldRow>

      <FieldRow
        label="Seña obligatoria"
        hint="Si está activa, el cliente debe pagar la seña para confirmar. Si no, puede elegir pagar la seña o pagar todo en el local."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Toggle value={config.sena_obligatoria} onChange={v => { setField('sena_obligatoria', v); setSaved(false); }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {config.sena_obligatoria ? 'Obligatoria' : 'Opcional'}
          </span>
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
          reservas_online:       d.reservas_online ?? true,
          max_dias_anticipacion: d.max_dias_anticipacion ?? 60,
          min_hs_anticipacion:   d.min_hs_anticipacion ?? 1,
          mp_activo:        d.mp_activo ?? false,
          mp_configurado:   d.mp_configurado ?? false,
          mp_public_key:    d.mp_public_key || '',
          sena_porcentaje:  d.sena_porcentaje ?? 0,
          sena_obligatoria: d.sena_obligatoria ?? false,
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
    { key: 'pagos',    label: 'Mercado Pago' },
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
      {activeTab === 'pagos' && (
        <TabPagos config={config} setField={setField} />
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
