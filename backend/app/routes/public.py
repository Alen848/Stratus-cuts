"""
Rutas públicas para el frontend del cliente (sin autenticación).
Prefijo: /public/{slug}/...
El slug identifica el salón.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import date as DateType, datetime, timezone, timedelta

from app.database.connection import get_db
from app.models.salon import Salon
from app.models.config_salon import ConfigSalon
from app.models.turno import Turno
from app.services import (
    empleado_service, servicio_service, cliente_service, turno_service,
    reserva_service, config_salon_service,
)
from app.schemas.empleado import Empleado
from app.schemas.servicio import Servicio
from app.schemas.cliente import ClienteCreate
from app.schemas.reserva import ReservaPublicaCreate
from app.limiter import limiter

router = APIRouter(prefix="/public", tags=["Público"])

ARG_TZ = timezone(timedelta(hours=-3))


def _get_salon(slug: str, db: Session) -> Salon:
    salon = db.query(Salon).filter(Salon.slug == slug, Salon.activo == True).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado.")
    return salon


def _get_config(db: Session, salon_id: int) -> ConfigSalon:
    config = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if config:
        return config
    # Defaults si no hay config creada aún
    return ConfigSalon(
        salon_id=salon_id,
        reservas_online=True,
        max_dias_anticipacion=60,
        min_hs_anticipacion=1,
    )


@router.get("/{slug}/info")
def public_info(slug: str, db: Session = Depends(get_db)):
    salon = _get_salon(slug, db)
    return {"nombre": salon.nombre, "slug": salon.slug}


@router.get("/{slug}/empleados", response_model=List[Empleado])
def public_empleados(slug: str, db: Session = Depends(get_db)):
    salon = _get_salon(slug, db)
    return empleado_service.get_empleados(db, salon_id=salon.id)


@router.get("/{slug}/servicios", response_model=List[Servicio])
def public_servicios(slug: str, db: Session = Depends(get_db)):
    salon = _get_salon(slug, db)
    return servicio_service.get_servicios(db, salon_id=salon.id)


@router.get("/{slug}/disponibilidad/{empleado_id}")
def public_disponibilidad(
    slug: str,
    empleado_id: int,
    fecha_inicio: DateType,
    db: Session = Depends(get_db),
):
    salon = _get_salon(slug, db)
    return turno_service.get_horarios_semanales(db, empleado_id, fecha_inicio, salon_id=salon.id)


@router.post("/{slug}/clientes")
@limiter.limit("30/minute")
def public_create_cliente(request: Request, slug: str, cliente: ClienteCreate, db: Session = Depends(get_db)):
    salon = _get_salon(slug, db)
    return cliente_service.create_cliente(db, cliente, salon_id=salon.id)


@router.post("/{slug}/turnos")
@limiter.limit("30/minute")
def public_create_turno(request: Request, slug: str, turno: ReservaPublicaCreate, db: Session = Depends(get_db)):
    salon = _get_salon(slug, db)
    config = _get_config(db, salon.id)

    # Verificar que las reservas online estén habilitadas
    if not config.reservas_online:
        raise HTTPException(
            status_code=403,
            detail="Las reservas online están deshabilitadas para este salón.",
        )

    # Normalizar la fecha del turno a hora Argentina
    ahora = datetime.now(ARG_TZ).replace(tzinfo=None)
    fecha_turno = turno.fecha_hora
    if fecha_turno.tzinfo is not None:
        fecha_turno = fecha_turno.astimezone(ARG_TZ).replace(tzinfo=None)

    # Validar anticipación mínima
    min_hs = config.min_hs_anticipacion or 1
    if fecha_turno < ahora + timedelta(hours=min_hs):
        raise HTTPException(
            status_code=400,
            detail=f"El turno debe reservarse con al menos {min_hs} hora(s) de anticipación.",
        )

    # Validar anticipación máxima
    max_dias = config.max_dias_anticipacion or 60
    if fecha_turno > ahora + timedelta(days=max_dias):
        raise HTTPException(
            status_code=400,
            detail=f"No se pueden reservar turnos con más de {max_dias} días de anticipación.",
        )

    # La notification_url debe ser pública y HTTPS. Detrás de un proxy,
    # request.base_url puede ser incorrecta, por eso priorizamos BACKEND_PUBLIC_URL.
    base = (os.getenv("BACKEND_PUBLIC_URL") or str(request.base_url)).rstrip("/")
    webhook_url = f"{base}/public/{slug}/mp/webhook"
    try:
        resultado = reserva_service.crear_reserva(db, turno, salon, config, webhook_url=webhook_url)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Sin pago: devolvemos el turno tal cual (comportamiento de siempre)
    if not resultado["requiere_pago"]:
        return resultado["turno"]

    # Con seña: el frontend debe redirigir a init_point para pagar
    t = resultado["turno"]
    return {
        "requiere_pago": True,
        "turno_id": t.id,
        "estado": t.estado,
        "init_point": resultado["init_point"],
        "monto_total": resultado["monto_total"],
        "monto_sena": resultado["monto_sena"],
        "saldo_pendiente": resultado["saldo_pendiente"],
    }


@router.post("/{slug}/mp/webhook")
async def public_mp_webhook(slug: str, request: Request, db: Session = Depends(get_db)):
    """Notificación de Mercado Pago. Confirma la seña consultando el pago real."""
    salon = _get_salon(slug, db)
    token = config_salon_service.get_mp_access_token(db, salon.id)
    if not token:
        return {"ok": True, "ignored": True}

    tipo = request.query_params.get("type") or request.query_params.get("topic")
    payment_id = request.query_params.get("data.id") or request.query_params.get("id")
    if not payment_id:
        try:
            body = await request.json()
        except Exception:
            body = {}
        if isinstance(body, dict):
            tipo = tipo or body.get("type") or body.get("topic")
            payment_id = (body.get("data") or {}).get("id") or body.get("id")

    # Solo nos interesan notificaciones de pagos
    if tipo and "payment" not in str(tipo):
        return {"ok": True, "ignored": True}
    if not payment_id:
        return {"ok": True, "ignored": True}

    try:
        reserva_service.confirmar_pago(db, salon.id, str(payment_id), token)
    except Exception:
        # Devolver 200 igual para que MP no reintente en loop; ya quedó logueable
        pass
    return {"ok": True}


@router.get("/{slug}/pago-config")
def public_pago_config(slug: str, db: Session = Depends(get_db)):
    """
    Le dice al frontend si debe pedir seña y cuánto, SIN exponer credenciales.
    'habilitado' = MP activo + token cargado + porcentaje > 0.
    """
    salon = _get_salon(slug, db)
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon.id).first()
    token = config_salon_service.get_mp_access_token(db, salon.id)
    porcentaje = (cfg.sena_porcentaje if cfg else 0) or 0
    habilitado = bool(cfg and cfg.mp_activo and token and porcentaje > 0)
    return {
        "habilitado": habilitado,
        "sena_porcentaje": porcentaje,
        "sena_obligatoria": bool(cfg and cfg.sena_obligatoria),
    }


@router.get("/{slug}/turnos/{turno_id}/estado")
def public_estado_turno(slug: str, turno_id: int, db: Session = Depends(get_db)):
    """Estado del turno/seña, para que el frontend confirme tras el redirect de MP."""
    salon = _get_salon(slug, db)
    turno_service.expirar_turnos_vencidos(db, salon.id)
    t = turno_service.get_turno(db, turno_id, salon.id)
    if not t:
        raise HTTPException(status_code=404, detail="Turno no encontrado.")
    return {
        "estado": t.estado,
        "sena_estado": t.sena_estado,
        "monto_total": t.monto_total,
        "monto_sena": t.monto_sena,
        "saldo_pendiente": t.saldo_pendiente,
        "fecha_hora": t.fecha_hora,
        "cliente_nombre": t.cliente.nombre if t.cliente else None,
        "empleado_nombre": t.empleado.nombre if t.empleado else None,
        "servicios": [ts.servicio.nombre for ts in t.servicios if ts.servicio],
    }
