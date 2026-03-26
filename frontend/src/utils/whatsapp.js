/**
 * Formatea un número de teléfono al formato internacional argentino (54XXXXXXXXXX).
 * Acepta formatos: 11-1234-5678, 1112345678, +5411..., 15XXXXXXXX, etc.
 */
export function formatPhoneAR(phone) {
  if (!phone) return null;

  // Quitar todo lo que no sea dígito
  let digits = phone.replace(/\D/g, '');

  // Si empieza con 54, está bien
  if (digits.startsWith('54')) {
    // Asegurarse que tiene el 9 para móviles: 54 9 11 XXXXXXXX
    if (digits.length === 12 && !digits.startsWith('549')) {
      digits = '549' + digits.slice(2);
    }
    return digits;
  }

  // Si empieza con 0, quitar el 0
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Si empieza con 15 (celular viejo sin código de área), no podemos arreglarlo
  // Asumir CABA (11) si son solo 8 dígitos
  if (digits.length === 8) {
    digits = '11' + digits;
  }

  // Ahora agregar prefijo Argentina con 9 (móvil)
  return '549' + digits;
}

/**
 * Construye un link wa.me con mensaje pre-cargado.
 */
export function buildWhatsAppLink(phone, message) {
  const formatted = formatPhoneAR(phone);
  if (!formatted) return null;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

/**
 * Mensaje de recordatorio previo al turno.
 */
export function mensajePreTurno({ clienteNombre, empleadoNombre, fechaHora, servicios, salonNombre }) {
  const fecha = new Date(fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const serviciosStr = servicios && servicios.length > 0 ? servicios.join(', ') : 'tu servicio';

  return (
    `Hola ${clienteNombre} !!\n\n` +
    `Te recordamos que tenés turno en *${salonNombre}* el *${fechaStr}* a las *${horaStr} hs.* ` +
    `con *${empleadoNombre}*.\n\n` +
    `Servicio: ${serviciosStr}\n\n` +
    `Si necesitás cancelar o reprogramar, avisanos con anticipación y agendamos otro turno. Te esperamos! `
  );
}

/**
 * Mensaje de retorno (20-25 días después).
 */
export function mensajeRetorno({ clienteNombre, empleadoNombre, salonNombre }) {
  return (
    `Hola ${clienteNombre} 😊\n\n` +
    `¡Hace un tiempo que no te vemos por *${salonNombre}*!\n\n` +
    `Es el momento ideal para renovar tu look con *${empleadoNombre}*. ` +
    `¿Te gustaría sacar un nuevo turno? 💇‍♀️✨\n\n` +
    `Escribinos y te reservamos el horario que mejor te quede.`
  );
}
