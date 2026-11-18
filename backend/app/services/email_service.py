"""
Envío de emails transaccionales (confirmación de turno).

Provider-agnóstico: usa SMTP estándar configurado por entorno, así funciona con
Gmail, el correo del dominio, Resend/Brevo/SendGrid (todos ofrecen SMTP), etc.,
sin cambiar código. Variables:

    SMTP_HOST      ej: smtp.gmail.com
    SMTP_PORT      ej: 587
    SMTP_USER      usuario / login
    SMTP_PASSWORD  contraseña (en Gmail: "contraseña de aplicación")
    SMTP_FROM      remitente visible, ej: "Blue Moon <turnos@tudominio.com>"
                   (si falta, se usa SMTP_USER)

El envío es best-effort en un hilo aparte: si el mail falla o no está
configurado, la reserva NO se ve afectada (igual criterio que los webhooks).
"""
import os
import ssl
import smtplib
import threading
from datetime import datetime
from email.message import EmailMessage

from sqlalchemy.orm import Session

_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
          "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def _smtp():
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    if not (host and user and password):
        return None
    return {
        "host": host,
        "port": int(os.getenv("SMTP_PORT", "587") or 587),
        "user": user,
        "password": password,
        "from": os.getenv("SMTP_FROM", "").strip() or user,
    }


def _fecha_legible(dt: datetime) -> str:
    """'sábado 3 de agosto, 10:00 hs' (sin depender del locale del sistema)."""
    return f"{_DIAS[dt.weekday()]} {dt.day} de {_MESES[dt.month - 1]}, {dt.strftime('%H:%M')} hs"


def _enviar(to: str, asunto: str, html: str, texto: str) -> None:
    """POST del email por SMTP. Corre en un hilo; los errores se tragan a propósito."""
    cfg = _smtp()
    if not cfg or not to:
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = asunto
        msg["From"] = cfg["from"]
        msg["To"] = to
        msg.set_content(texto)
        msg.add_alternative(html, subtype="html")
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as s:
            s.starttls(context=ssl.create_default_context())
            s.login(cfg["user"], cfg["password"])
            s.send_message(msg)
    except Exception:
        pass


def enviar_confirmacion_turno(db: Session, turno, salon=None, config=None) -> None:
    """
    Manda el email de confirmación al cliente del turno (si tiene email y el SMTP
    está configurado). Best-effort: nunca lanza excepción.
    """
    try:
        if _smtp() is None:
            return
        cliente = turno.cliente
        email = getattr(cliente, "email", None) if cliente else None
        if not email:
            return

        # Datos del salón (para el encabezado/pie del email)
        if salon is None:
            from app.models.salon import Salon
            salon = db.query(Salon).filter(Salon.id == turno.salon_id).first()
        if config is None:
            from app.models.config_salon import ConfigSalon
            config = db.query(ConfigSalon).filter(ConfigSalon.salon_id == turno.salon_id).first()

        salon_nombre = (salon.nombre if salon else "el salón")
        telefono = getattr(config, "telefono", None) if config else None
        direccion = getattr(config, "direccion", None) if config else None

        servicios = [ts.servicio.nombre for ts in turno.servicios if ts.servicio]
        profesional = turno.empleado.nombre if turno.empleado else "—"
        fecha = _fecha_legible(turno.fecha_hora)
        cliente_nombre = (cliente.nombre if cliente else "").strip() or "Hola"

        # Bloque de pago (si hubo seña)
        pago_html = ""
        pago_txt = ""
        if turno.sena_estado == "pagada" and (turno.monto_sena or 0) > 0:
            sena = f"${turno.monto_sena:,.0f}".replace(",", ".")
            saldo = f"${(turno.saldo_pendiente or 0):,.0f}".replace(",", ".")
            pago_html = (f"<tr><td style='padding:6px 0;color:#6b6b6b'>Seña pagada</td>"
                         f"<td style='padding:6px 0;text-align:right;font-weight:600'>{sena}</td></tr>"
                         f"<tr><td style='padding:6px 0;color:#6b6b6b'>Resto a pagar en el local</td>"
                         f"<td style='padding:6px 0;text-align:right;font-weight:600'>{saldo}</td></tr>")
            pago_txt = f"\nSeña pagada: {sena}\nResto en el local: {saldo}"

        pie = []
        if direccion:
            pie.append(f"📍 {direccion}")
        if telefono:
            pie.append(f"📞 {telefono}")
        pie_txt = "  ·  ".join(pie)

        asunto = f"Turno confirmado en {salon_nombre} — {fecha}"

        html = f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
  <div style="background:#1a1a1a;color:#fff;padding:24px;border-radius:12px 12px 0 0">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.7">{salon_nombre}</div>
    <div style="font-size:22px;font-weight:700;margin-top:6px">¡Tu turno está confirmado! ✅</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px">
    <p style="margin:0 0 16px">Hola <strong>{cliente_nombre}</strong>, reservaste tu turno. Estos son los detalles:</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:6px 0;color:#6b6b6b">Servicio</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">{', '.join(servicios) or '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b">Profesional</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">{profesional}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b">Fecha y hora</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">{fecha}</td></tr>
      {pago_html}
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#6b6b6b">{pie_txt}</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#aaa;margin-top:16px">
    Te esperamos en {salon_nombre}.
  </p>
</div>"""

        texto = (f"¡Tu turno está confirmado en {salon_nombre}!\n\n"
                 f"Servicio: {', '.join(servicios) or '—'}\n"
                 f"Profesional: {profesional}\n"
                 f"Fecha y hora: {fecha}{pago_txt}\n\n"
                 f"{pie_txt}\n\nTe esperamos!")

        threading.Thread(
            target=_enviar, args=(email, asunto, html, texto), daemon=True
        ).start()
    except Exception:
        pass


def enviar_recordatorio_sena(db: Session, turno, salon=None, config=None) -> None:
    """
    Le pide al cliente el comprobante de la transferencia cuando reservó y no lo
    adjuntó. Incluye el link para subirlo, porque una vez que cerró la página de
    confirmación no tiene otra forma de volver.

    Best-effort: nunca lanza excepción.
    """
    try:
        if _smtp() is None:
            return
        cliente = turno.cliente
        email = getattr(cliente, "email", None) if cliente else None
        if not email:
            return

        if salon is None:
            from app.models.salon import Salon
            salon = db.query(Salon).filter(Salon.id == turno.salon_id).first()
        if config is None:
            from app.models.config_salon import ConfigSalon
            config = db.query(ConfigSalon).filter(ConfigSalon.salon_id == turno.salon_id).first()

        salon_nombre = (salon.nombre if salon else "el salón")
        cliente_nombre = (cliente.nombre if cliente else "").strip() or "Hola"
        fecha = _fecha_legible(turno.fecha_hora)
        servicios = [ts.servicio.nombre for ts in turno.servicios if ts.servicio]
        sena = f"${(turno.monto_sena or 0):,.0f}".replace(",", ".")

        # Link público para subir el comprobante (la página de confirmación lo
        # reconoce por el id del turno). Sale de la URL del salón, que es por
        # salón: el backend es compartido, una URL global mandaría a los clientes
        # de un salón al sitio de otro. FRONTEND_URL queda solo como respaldo.
        base = (getattr(config, "url_reserva", None) or os.getenv("FRONTEND_URL") or "").strip()
        base = base.rstrip("/")
        for sufijo in ("/booking", "/reservar"):
            if base.endswith(sufijo):
                base = base[: -len(sufijo)]
        link = f"{base}/confirmation?turno={turno.id}" if base else None

        cbu   = getattr(config, "transferencia_cbu", None) if config else None
        alias = getattr(config, "transferencia_alias", None) if config else None
        datos_html = ""
        datos_txt = ""
        if cbu or alias:
            datos_html = (
                f"<tr><td style='padding:6px 0;color:#6b6b6b'>CBU / CVU</td>"
                f"<td style='padding:6px 0;text-align:right;font-weight:600'>{cbu or '—'}</td></tr>"
                f"<tr><td style='padding:6px 0;color:#6b6b6b'>Alias</td>"
                f"<td style='padding:6px 0;text-align:right;font-weight:600'>{alias or '—'}</td></tr>"
            )
            datos_txt = f"\nCBU/CVU: {cbu or '—'}\nAlias: {alias or '—'}"

        boton_html = (
            f"<p style='margin:24px 0 0;text-align:center'>"
            f"<a href='{link}' style='display:inline-block;background:#1a1a1a;color:#fff;"
            f"text-decoration:none;padding:13px 26px;border-radius:6px;font-weight:600'>"
            f"Subir mi comprobante</a></p>"
        ) if link else ""
        boton_txt = f"\n\nSubí tu comprobante acá: {link}" if link else ""

        asunto = f"Nos falta tu comprobante para confirmar el turno — {salon_nombre}"

        html = f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
  <div style="background:#1a1a1a;color:#fff;padding:24px;border-radius:12px 12px 0 0">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.7">{salon_nombre}</div>
    <div style="font-size:22px;font-weight:700;margin-top:6px">Nos falta tu comprobante ⏳</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px">
    <p style="margin:0 0 16px">Hola <strong>{cliente_nombre}</strong>, reservaste este turno pero todavía
    no recibimos el comprobante de la seña, así que <strong>aún no está confirmado</strong>.</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:6px 0;color:#6b6b6b">Servicio</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">{', '.join(servicios) or '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b">Fecha y hora</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">{fecha}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b">Seña</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">{sena}</td></tr>
      {datos_html}
    </table>
    {boton_html}
    <p style="margin:20px 0 0;font-size:13px;color:#6b6b6b">Si ya transferiste, subí el comprobante
    para que podamos confirmarte el turno. ¡Gracias!</p>
  </div>
</div>"""

        texto = (f"Nos falta tu comprobante para confirmar tu turno en {salon_nombre}.\n\n"
                 f"Servicio: {', '.join(servicios) or '—'}\n"
                 f"Fecha y hora: {fecha}\n"
                 f"Seña: {sena}{datos_txt}{boton_txt}\n\n"
                 f"Si ya transferiste, subí el comprobante para confirmar el turno.")

        threading.Thread(
            target=_enviar, args=(email, asunto, html, texto), daemon=True
        ).start()
    except Exception:
        pass
