// Burbuja flotante de WhatsApp para que los clientes escriban al salón.
// El número va en formato internacional para wa.me: 54 9 (Argentina móvil) + 223 (área) + 6919766.
const WHATSAPP_NUMERO = '5492236919766';
const MENSAJE = 'Hola! Quería hacer una consulta 😊';

export default function WhatsAppBubble() {
  const href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(MENSAJE)}`;

  return (
    <a
      className="wa-bubble"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="wa-bubble-icon" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.04 3.2C9.03 3.2 3.33 8.9 3.33 15.9c0 2.24.59 4.42 1.7 6.35L3.2 28.8l6.72-1.76a12.66 12.66 0 0 0 6.12 1.56h.01c7.01 0 12.71-5.7 12.71-12.7 0-3.4-1.32-6.59-3.72-8.99a12.63 12.63 0 0 0-9-3.71Zm0 23.28h-.01a10.55 10.55 0 0 1-5.37-1.47l-.39-.23-3.99 1.05 1.06-3.89-.25-.4a10.53 10.53 0 0 1-1.61-5.61c0-5.82 4.74-10.56 10.57-10.56 2.82 0 5.47 1.1 7.47 3.1a10.5 10.5 0 0 1 3.09 7.47c0 5.83-4.74 10.57-10.56 10.57Zm5.8-7.91c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.77-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.44.21 1.99.13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37Z"
        />
      </svg>
    </a>
  );
}
