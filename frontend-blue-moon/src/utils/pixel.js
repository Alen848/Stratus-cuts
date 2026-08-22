/**
 * Meta Pixel (Facebook/Instagram Ads).
 *
 * El pixel se activa SÓLO si el build tiene VITE_META_PIXEL_ID. Sin esa
 * variable, initPixel() no carga nada y trackEvent()/trackPageView() son no-ops:
 * así dev y staging no ensucian los datos de la campaña con turnos de prueba.
 * El ID se pasa como build arg de Docker (ver Dockerfile y docker-compose.yml).
 *
 * Este frontend es una SPA, por lo que el PageView inicial se dispara en
 * initPixel() y los cambios de ruta se reportan a mano con trackPageView().
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

/** Snippet oficial de Meta: crea window.fbq y carga fbevents.js de forma async. */
function cargarFbq() {
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
}

/** Llamada segura: no rompe si el pixel está apagado o lo bloquea un adblocker. */
function fbq(...args) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq(...args);
}

/** Arranca el pixel y manda el PageView inicial. Se llama una vez, en main.jsx. */
export function initPixel() {
  if (!PIXEL_ID) return;
  cargarFbq();
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

/** PageView manual, para los cambios de ruta del router. */
export function trackPageView() {
  fbq('track', 'PageView');
}

/**
 * Evento estándar de Meta (Schedule, Lead, Purchase, etc.).
 * @param {string} evento nombre del evento estándar
 * @param {object} [params] parámetros opcionales (value, currency, ...)
 */
export function trackEvent(evento, params) {
  fbq('track', evento, params);
}
