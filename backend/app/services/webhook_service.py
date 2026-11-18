"""
Webhooks salientes: notifican a un sistema externo (ej. sistema de gestión) cuando
pasa algo en un salón (turno creado, actualizado, eliminado, seña pagada).

Diseño defensivo:
- Es OPT-IN por salón (webhook_activo + webhook_url). Si el salón no lo configuró,
  no pasa absolutamente nada: no afecta a ningún otro salón ni al flujo normal.
- El envío es en un hilo aparte (best-effort) con timeout corto: un webhook lento
  o caído JAMÁS bloquea ni rompe la creación de un turno.
- Cada request va firmado con HMAC-SHA256 (header X-Stratus-Signature) usando el
  secreto compartido, para que el receptor pueda verificar que vino de nosotros.
- Cada intento queda registrado en `webhook_entregas` con el código HTTP que
  devolvió el receptor. Sigue sin haber reintentos, pero al menos ahora se puede
  saber qué se envió y qué contestaron.

Formato del envío (JSON):
    {
      "evento": "turno.creado",
      "salon_id": 1,
      "enviado_en": "2026-07-18T12:00:00-03:00",
      "data": { ... }
    }
"""
import hashlib
import hmac
import json
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.config_salon import ConfigSalon
from app.models.webhook_entrega import WebhookEntrega

ARG_TZ = timezone(timedelta(hours=-3))
_TIMEOUT_SEG = 5
# Los eventos que emitimos. No se activan por separado: el interruptor es
# `webhook_activo`, y con él prendido se envían todos.
EVENTOS = ("turno.creado", "turno.actualizado", "turno.eliminado", "turno.confirmado")


def _firmar(secret: str, cuerpo: bytes) -> str:
    return hmac.new(secret.encode(), cuerpo, hashlib.sha256).hexdigest()


def _ahora():
    return datetime.now(ARG_TZ).replace(tzinfo=None)


def _post(url: str, cuerpo: bytes, firma: str) -> tuple:
    """
    Hace el POST y devuelve (http_status, error, duracion_ms).
    Nunca lanza: un fallo del receptor no es un fallo nuestro.
    """
    inicio = time.monotonic()
    try:
        req = urllib.request.Request(
            url,
            data=cuerpo,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Stratus-Signature": firma,
                "User-Agent": "Stratus-Webhooks/1.0",
            },
        )
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SEG) as resp:
            ms = int((time.monotonic() - inicio) * 1000)
            return resp.status, None, ms
    except urllib.error.HTTPError as e:
        # El receptor contestó, pero con un código de error (4xx/5xx)
        ms = int((time.monotonic() - inicio) * 1000)
        detalle = ""
        try:
            detalle = e.read()[:500].decode("utf-8", "replace")
        except Exception:
            pass
        return e.code, f"HTTP {e.code}: {detalle}".strip(), ms
    except Exception as e:
        # No hubo respuesta: timeout, DNS, conexión rechazada, URL inválida...
        ms = int((time.monotonic() - inicio) * 1000)
        return None, f"{type(e).__name__}: {e}"[:500], ms


def _registrar(salon_id: int, evento: str, url: str, turno_id, resultado: tuple):
    """Guarda el intento. Usa su propia sesión: corre en un hilo aparte."""
    status, error, ms = resultado
    db = SessionLocal()
    try:
        db.add(WebhookEntrega(
            salon_id=salon_id, evento=evento, url=url,
            http_status=status, error=error, duracion_ms=ms,
            turno_id=turno_id, enviado_en=_ahora(),
        ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _enviar_y_registrar(salon_id, evento, url, cuerpo, firma, turno_id):
    """Cuerpo del hilo: manda el POST y deja constancia del resultado."""
    try:
        resultado = _post(url, cuerpo, firma)
        _registrar(salon_id, evento, url, turno_id, resultado)
    except Exception:
        # Best-effort de punta a punta: ni siquiera el registro puede romper nada.
        pass


def _armar(salon_id: int, evento: str, data: dict, secret: str) -> tuple:
    """Devuelve (cuerpo_bytes, firma) del payload a enviar."""
    payload = {
        "evento": evento,
        "salon_id": salon_id,
        "enviado_en": datetime.now(ARG_TZ).isoformat(),
        "data": data,
    }
    cuerpo = json.dumps(payload, default=str).encode()
    return cuerpo, _firmar(secret or "", cuerpo)


def emit(db: Session, salon_id: int, evento: str, data: dict) -> None:
    """
    Dispara un webhook para el salón, si lo tiene configurado y activo.
    Nunca lanza excepción: cualquier problema se traga silenciosamente para no
    afectar la operación que lo originó (crear/editar un turno, etc.).
    """
    try:
        cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
        if not cfg or not cfg.webhook_activo or not cfg.webhook_url:
            return

        cuerpo, firma = _armar(salon_id, evento, data, cfg.webhook_secret)

        threading.Thread(
            target=_enviar_y_registrar,
            args=(salon_id, evento, cfg.webhook_url, cuerpo, firma,
                  (data or {}).get("id")),
            daemon=True,
        ).start()
    except Exception:
        pass


def probar(db: Session, salon_id: int) -> dict:
    """
    Envía un evento de prueba y espera la respuesta, para que el dueño vea al
    instante si el receptor lo recibe bien. A diferencia de `emit`, es sincrónico
    (lo dispara una acción manual, no una reserva de un cliente).

    El payload usa el evento `turno.creado` con datos ficticios y la marca
    `"prueba": true`, para que el receptor pueda ignorarlo si quiere.
    """
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg or not cfg.webhook_url:
        return {"ok": False, "detalle": "No hay una URL de webhook configurada."}
    if not cfg.webhook_secret:
        return {"ok": False, "detalle": "Falta el secreto compartido para firmar el envío."}

    data = {
        "id": 0,
        "prueba": True,
        "estado": "pendiente",
        "fecha_hora": _ahora().isoformat(),
        "duracion": 60,
        "empleado_id": None,
        "cliente_id": None,
        "cliente_nombre": "Turno de prueba",
        "empleado_nombre": None,
        "servicios": [],
        "monto_total": 0,
        "monto_sena": None,
        "saldo_pendiente": None,
        "sena_estado": "no_aplica",
    }
    cuerpo, firma = _armar(salon_id, "turno.creado", data, cfg.webhook_secret)
    resultado = _post(cfg.webhook_url, cuerpo, firma)
    _registrar(salon_id, "prueba", cfg.webhook_url, None, resultado)

    status, error, ms = resultado
    ok = status is not None and 200 <= status < 300
    if ok:
        detalle = f"El receptor respondió {status} en {ms} ms."
    elif status is not None:
        detalle = f"El receptor respondió {status} (esperábamos 2xx). {error or ''}".strip()
    else:
        detalle = f"No hubo respuesta: {error}"
    return {"ok": ok, "http_status": status, "duracion_ms": ms, "detalle": detalle}


def listar_entregas(db: Session, salon_id: int, limit: int = 50):
    """Últimos envíos del salón, del más reciente al más viejo."""
    return db.query(WebhookEntrega).filter(
        WebhookEntrega.salon_id == salon_id
    ).order_by(WebhookEntrega.id.desc()).limit(min(limit, 200)).all()


def turno_payload(turno) -> dict:
    """Representación estándar de un turno para los webhooks (datos ya cargados)."""
    return {
        "id": turno.id,
        "estado": turno.estado,
        "fecha_hora": turno.fecha_hora.isoformat() if turno.fecha_hora else None,
        "duracion": turno.duracion,
        "empleado_id": turno.empleado_id,
        "cliente_id": turno.cliente_id,
        "cliente_nombre": (
            f"{turno.cliente.nombre} {turno.cliente.apellido or ''}".strip()
            if turno.cliente else None
        ),
        "empleado_nombre": turno.empleado.nombre if turno.empleado else None,
        "servicios": [ts.servicio.nombre for ts in turno.servicios if ts.servicio],
        "monto_total": turno.monto_total,
        "monto_sena": turno.monto_sena,
        "saldo_pendiente": turno.saldo_pendiente,
        "sena_estado": turno.sena_estado,
    }
