"""
Rutas públicas para el frontend del cliente (sin autenticación).
Prefijo: /public/{slug}/...
El slug identifica el salón.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date as DateType, datetime, timezone, timedelta

from app.database.connection import get_db
from app.models.salon import Salon
from app.models.config_salon import ConfigSalon
from app.services import empleado_service, servicio_service, cliente_service, turno_service
from app.schemas.empleado import Empleado
from app.schemas.servicio import Servicio
from app.schemas.cliente import ClienteCreate
from app.schemas.turno import TurnoCreate

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
def public_create_cliente(slug: str, cliente: ClienteCreate, db: Session = Depends(get_db)):
    salon = _get_salon(slug, db)
    return cliente_service.create_cliente(db, cliente, salon_id=salon.id)


@router.post("/{slug}/turnos")
def public_create_turno(slug: str, turno: TurnoCreate, db: Session = Depends(get_db)):
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

    return turno_service.create_turno(db, turno, salon_id=salon.id)
