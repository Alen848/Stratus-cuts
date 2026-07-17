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
import urllib.request
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from app.models.config_salon import ConfigSalon

ARG_TZ = timezone(timedelta(hours=-3))
_TIMEOUT_SEG = 5


def _firmar(secret: str, cuerpo: bytes) -> str:
    return hmac.new(secret.encode(), cuerpo, hashlib.sha256).hexdigest()


def _enviar(url: str, cuerpo: bytes, firma: str) -> None:
    """Hace el POST. Corre en un hilo aparte; los errores se ignoran a propósito."""
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
        urllib.request.urlopen(req, timeout=_TIMEOUT_SEG).close()
    except Exception:
        # Best-effort: si el destino falla, no reintentamos ni propagamos el error.
        pass


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

        payload = {
            "evento": evento,
            "salon_id": salon_id,
            "enviado_en": datetime.now(ARG_TZ).isoformat(),
            "data": data,
        }
        cuerpo = json.dumps(payload, default=str).encode()
        firma = _firmar(cfg.webhook_secret or "", cuerpo)

        threading.Thread(
            target=_enviar,
            args=(cfg.webhook_url, cuerpo, firma),
            daemon=True,
        ).start()
    except Exception:
        pass


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
