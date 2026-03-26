import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useApp } from '../context/AppContext';
import { buildWhatsAppLink, mensajePreTurno, mensajeRetorno } from '../utils/whatsapp';
import styles from '../styles/pages/RecordatoriosPage.module.css';

function formatFecha(fechaHora) {
  const d = new Date(fechaHora);
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + 'hs';
}

function RecordatorioCard({ item, tipo, salonNombre, onSent }) {
  const [sending, setSending] = useState(false);

  const message = tipo === 'pre'
    ? mensajePreTurno({
        clienteNombre: item.cliente_nombre,
        empleadoNombre: item.empleado_nombre,
        fechaHora: item.fecha_hora,
        servicios: item.servicios,
        salonNombre,
      })
    : mensajeRetorno({
        clienteNombre: item.cliente_nombre,
        empleadoNombre: item.empleado_nombre,
        salonNombre,
      });

  const waLink = buildWhatsAppLink(item.cliente_phone, message);

  const handleSend = async () => {
    if (!waLink) return;
    setSending(true);
    window.open(waLink, '_blank');
    // Marcar como enviado después de abrir WhatsApp
    await onSent(item.turno_id, tipo);
    setSending(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <div className={styles.clienteNombre}>{item.cliente_nombre}</div>
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>◉</span>
            {item.empleado_nombre}
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>◷</span>
            {formatFecha(item.fecha_hora)}
          </span>
          {item.servicios && item.servicios.length > 0 && (
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>◆</span>
              {item.servicios.join(', ')}
            </span>
          )}
          {tipo === 'retorno' && item.dias_desde != null && (
            <span className={`${styles.metaItem} ${styles.diasBadge}`}>
              hace {item.dias_desde} días
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardRight}>
        {item.cliente_phone ? (
          <button
            className={styles.btnWa}
            onClick={handleSend}
            disabled={sending}
          >
            <span className={styles.waIcon}>💬</span>
            {sending ? 'Abriendo…' : 'Enviar'}
          </button>
        ) : (
          <span className={styles.noPhone}>Sin teléfono</span>
        )}
      </div>
    </div>
  );
}

export default function RecordatoriosPage() {
  const { salonName } = useApp();
  const queryClient = useQueryClient();
  const [sendingAll, setSendingAll] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recordatorios'],
    queryFn: () => api.get('/turns/recordatorios').then(r => r.data),
    refetchInterval: 60_000,
  });

  const markSent = useMutation({
    mutationFn: ({ turno_id, tipo }) =>
      api.patch(`/turns/${turno_id}/reminder-sent?tipo=${tipo}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordatorios'] }),
  });

  const handleSent = useCallback(async (turno_id, tipo) => {
    await markSent.mutateAsync({ turno_id, tipo });
  }, [markSent]);

  const handleEnviarTodos = async (lista, tipo) => {
    if (!lista || lista.length === 0) return;
    setSendingAll(true);
    for (const item of lista) {
      if (!item.cliente_phone) continue;
      const message = tipo === 'pre'
        ? mensajePreTurno({
            clienteNombre: item.cliente_nombre,
            empleadoNombre: item.empleado_nombre,
            fechaHora: item.fecha_hora,
            servicios: item.servicios,
            salonNombre: salonName,
          })
        : mensajeRetorno({
            clienteNombre: item.cliente_nombre,
            empleadoNombre: item.empleado_nombre,
            salonNombre: salonName,
          });
      const waLink = buildWhatsAppLink(item.cliente_phone, message);
      if (waLink) window.open(waLink, '_blank');
      await markSent.mutateAsync({ turno_id: item.turno_id, tipo });
      // Pequeña pausa para no saturar pop-ups del browser
      await new Promise(r => setTimeout(r, 600));
    }
    setSendingAll(false);
  };

  const proximos = data?.proximos ?? [];
  const retorno  = data?.retorno  ?? [];

  return (
    <div className={styles.page}>

      {/* ── Próximos ──────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recordatorios previos</h2>
            <p className={styles.sectionSub}>
              Turnos en las próximas 24 hs sin recordatorio enviado
            </p>
          </div>
          <div className={styles.sectionActions}>
            <span className={styles.badge}>{proximos.length}</span>
            {proximos.length > 0 && (
              <button
                className={styles.btnAll}
                onClick={() => handleEnviarTodos(proximos, 'pre')}
                disabled={sendingAll}
              >
                Enviar todos
              </button>
            )}
          </div>
        </div>

        {isLoading && <p className={styles.empty}>Cargando…</p>}
        {isError  && <p className={styles.empty}>Error al cargar recordatorios.</p>}
        {!isLoading && proximos.length === 0 && (
          <p className={styles.empty}>No hay recordatorios pendientes para hoy. ✓</p>
        )}
        {proximos.map(item => (
          <RecordatorioCard
            key={item.turno_id}
            item={item}
            tipo="pre"
            salonNombre={salonName}
            onSent={handleSent}
          />
        ))}
      </section>

      {/* ── Retorno ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recordatorios de retorno</h2>
            <p className={styles.sectionSub}>
              Clientes con turno completado hace 20–25 días
            </p>
          </div>
          <div className={styles.sectionActions}>
            <span className={styles.badge}>{retorno.length}</span>
            {retorno.length > 0 && (
              <button
                className={styles.btnAll}
                onClick={() => handleEnviarTodos(retorno, 'retorno')}
                disabled={sendingAll}
              >
                Enviar todos
              </button>
            )}
          </div>
        </div>

        {!isLoading && retorno.length === 0 && (
          <p className={styles.empty}>No hay clientes para retorno en este momento. ✓</p>
        )}
        {retorno.map(item => (
          <RecordatorioCard
            key={item.turno_id}
            item={item}
            tipo="retorno"
            salonNombre={salonName}
            onSent={handleSent}
          />
        ))}
      </section>

    </div>
  );
}
