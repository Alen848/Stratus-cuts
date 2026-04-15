/**
 * Devuelve el slug del salón en runtime.
 * - En producción: lo toma del subdominio (river.stratuscuts.com → "river")
 * - En desarrollo:  cae al .env VITE_SALON_SLUG o al query param ?salon=
 */
export function getSalonSlug() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return (
      new URLSearchParams(window.location.search).get('salon') ||
      import.meta.env.VITE_SALON_SLUG ||
      ''
    );
  }
  return host.split('.')[0];
}
