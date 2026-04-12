import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../../styles/ui/HelpPanel.module.css';

const HELP = {
  '/': {
    title: 'Dashboard',
    desc: 'Resumen en tiempo real del día: turnos agendados, ingresos cobrados y actividad reciente del salón.',
    faqs: [
      {
        q: '¿Por qué los números del dashboard no coinciden con Caja?',
        a: 'El dashboard muestra solo el día de hoy. Caja incluye todos los registros del período abierto.',
      },
      {
        q: '¿Los ingresos incluyen cobros pendientes?',
        a: 'No, solo se cuentan los pagos ya registrados con método de pago (efectivo, tarjeta, etc.).',
      },
    ],
  },
  '/turnos': {
    title: 'Turnos',
    desc: 'Creá, editás y cancelás citas desde el tablero semanal o la lista. Cada turno vincula un cliente, un empleado y uno o más servicios.',
    faqs: [
      {
        q: '¿Por qué no aparecen horarios disponibles al reservar?',
        a: 'El empleado puede no tener horarios cargados para ese día. Verificá en Empleados → Horarios.',
      },
      {
        q: '¿Qué significa el estado "Pendiente"?',
        a: 'El turno está agendado pero aún no se confirmó ni cobró. Cambiá el estado al atender al cliente.',
      },
      {
        q: '¿Puedo asignar varios servicios a un mismo turno?',
        a: 'Sí, podés seleccionar múltiples servicios. La duración total se calcula automáticamente.',
      },
    ],
  },
  '/clientes': {
    title: 'Clientes',
    desc: 'Base de datos de todos los clientes. Podés buscar por nombre o teléfono, editar sus datos y ver el historial de turnos.',
    faqs: [
      {
        q: '¿Puedo eliminar un cliente que tiene turnos?',
        a: 'No se recomienda. Si tiene historial, dejalo sin modificar para no perder los registros de caja asociados.',
      },
      {
        q: '¿Cómo busco un cliente rápido?',
        a: 'Usá la barra de búsqueda: filtra por nombre o teléfono en tiempo real mientras escribís.',
      },
    ],
  },
  '/empleados': {
    title: 'Empleados',
    desc: 'Gestionás el equipo: datos personales, servicios que realizan, porcentaje de comisión y disponibilidad horaria por día.',
    faqs: [
      {
        q: '¿Por qué un empleado no aparece al crear un turno?',
        a: 'Verificá que esté activo y tenga horarios cargados para el día que estás reservando.',
      },
      {
        q: '¿Cómo cargo los horarios de un empleado?',
        a: 'Entrá al empleado → sección Horarios y asigná los días y rangos de atención de cada semana.',
      },
    ],
  },
  '/servicios': {
    title: 'Servicios',
    desc: 'Catálogo del salón: nombre, precio y duración de cada servicio. La duración define el tiempo bloqueado en la agenda al reservar.',
    faqs: [
      {
        q: '¿La duración del servicio afecta la disponibilidad?',
        a: 'Sí, el sistema bloquea el tiempo exacto según la duración al calcular los slots libres del empleado.',
      },
      {
        q: '¿Puedo asignar un servicio solo a ciertos empleados?',
        a: 'Sí, desde la pestaña Empleados podés indicar qué servicios realiza cada profesional.',
      },
    ],
  },
  '/caja': {
    title: 'Caja',
    desc: 'Registrá ingresos de turnos y egresos manuales (gastos). Al finalizar la jornada hacés el cierre con el monto físico en caja.',
    faqs: [
      {
        q: '¿Qué pasa si no hago el cierre del día?',
        a: 'Los registros quedan abiertos. Podés cerrar días anteriores, pero es recomendable cerrar al fin de cada jornada.',
      },
      {
        q: '¿Por qué no aparece un cobro que registré en Turnos?',
        a: 'El turno debe tener un método de pago asignado y estar en estado "Completado" para que impacte en caja.',
      },
      {
        q: '¿Los egresos se descuentan del total?',
        a: 'Sí. El cierre calcula: total ingresos − total egresos = resultado neto del día.',
      },
    ],
  },
  '/analisis': {
    title: 'Análisis',
    desc: 'Estadísticas del negocio por período: facturación, servicios más pedidos, rendimiento por empleado y tendencias de crecimiento.',
    faqs: [
      {
        q: '¿Con qué frecuencia se actualizan los datos?',
        a: 'En tiempo real. Cada cierre de caja o nuevo turno se refleja de inmediato en los gráficos.',
      },
      {
        q: '¿Puedo ver datos de meses anteriores?',
        a: 'Sí, usá el selector de período en la parte superior para navegar entre meses o semanas.',
      },
    ],
  },
  '/recordatorios': {
    title: 'Recordatorios',
    desc: 'Enviá recordatorios por WhatsApp a clientes con turno próximo. El sistema genera el mensaje listo — vos solo lo enviás.',
    faqs: [
      {
        q: '¿Los mensajes se envían solos?',
        a: 'No, el sistema prepara el link de WhatsApp y vos lo enviás manualmente. No hay envío automático.',
      },
      {
        q: '¿Puedo cambiar el texto del mensaje?',
        a: 'Por ahora el mensaje es estándar. La personalización estará disponible en próximas versiones.',
      },
    ],
  },
  '/configuracion': {
    title: 'Configuración',
    desc: 'Ajustes generales del salón: nombre, horarios de atención, datos de contacto y preferencias del sistema.',
    faqs: [
      {
        q: '¿Cambiar los horarios afecta los turnos ya reservados?',
        a: 'No, solo impacta en la disponibilidad para nuevas reservas. Los turnos existentes no se modifican.',
      },
      {
        q: '¿Dónde cambio la contraseña de acceso?',
        a: 'En la sección Usuarios dentro de Configuración podés actualizar tu contraseña.',
      },
    ],
  },
};

export default function HelpPanel({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const help = HELP[pathname];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!help) return null;

  return (
    <>
      {isOpen && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.panel} ${isOpen ? styles.open : ''}`} aria-label="Ayuda contextual">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
              </svg>
            </span>
            <span className={styles.headerTitle}>Ayuda · {help.title}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar ayuda">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.desc}>{help.desc}</p>

          <div className={styles.faqSection}>
            <span className={styles.faqLabel}>Dudas frecuentes</span>
            <ul className={styles.faqList}>
              {help.faqs.map((faq, i) => (
                <li key={i} className={styles.faqItem}>
                  <span className={styles.faqQ}>{faq.q}</span>
                  <span className={styles.faqA}>{faq.a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
