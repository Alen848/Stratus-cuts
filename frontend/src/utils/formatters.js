// ─── Fechas ───────────────────────────────────────────────────────────────────

// La BD guarda las fechas en hora Argentina sin timezone.
// Al parsearlas con `new Date()` el navegador las interpreta como UTC → +3hs de error.
// Solución: tratarlas como hora local forzando que NO se conviertan desde UTC.
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  // Si ya trae offset (ej: "2024-12-01T17:00:00-03:00"), parsearlo normalmente
  if (dateStr.includes('+') || /[-+]\d{2}:\d{2}$/.test(dateStr) || dateStr.endsWith('Z')) {
    return new Date(dateStr);
  }
  // Sin offset: la BD mandó hora Argentina naive → parsear como local para no sumar 3hs
  return new Date(dateStr.replace('T', ' '));
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
};

// ─── Duración ─────────────────────────────────────────────────────────────────

export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

// ─── Moneda ───────────────────────────────────────────────────────────────────

export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

// ─── Iniciales ────────────────────────────────────────────────────────────────
// FIX: el backend puede devolver null (no solo undefined), el default '' no alcanzaba

export const getInitials = (nombre, apellido) => {
  const n = (nombre  ?? '').charAt(0);
  const a = (apellido ?? '').charAt(0);
  return (n + a).toUpperCase() || '?';
};

// ─── Estado de turno ──────────────────────────────────────────────────────────

export const estadoColor = (estado) => {
  const map = {
    pendiente:  'warning',
    confirmado: 'info',
    completado: 'success',
    cancelado:  'danger',
  };
  return map[estado?.toLowerCase()] || 'default';
};