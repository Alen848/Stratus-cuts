/**
 * Devuelve el slug del salón.
 *
 * Este frontend es DEDICADO a un único salón (Blue Moon), por lo que el slug
 * configurado en el build (VITE_SALON_SLUG) es la fuente de verdad y no debe
 * depender de cómo se llame el subdominio en producción. El slug de la BD puede
 * no coincidir con el subdominio (ej. subdominio "bluemoon" vs slug "blue-moon").
 *
 * Orden de resolución:
 * - VITE_SALON_SLUG configurado en el build (autoritativo)
 * - query param ?salon= (override para pruebas locales)
 * - subdominio del host (fallback)
 */
export function getSalonSlug() {
  const configured = import.meta.env.VITE_SALON_SLUG;
  if (configured) return configured;

  const queryOverride = new URLSearchParams(window.location.search).get('salon');
  if (queryOverride) return queryOverride;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '';
  return host.split('.')[0];
}
