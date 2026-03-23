"""
Rutas públicas para el frontend del cliente (sin autenticación).
Prefijo: /public/{slug}/...
El slug identifica el salón.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date as DateType

from app.database.connection import get_db
from app.models.salon import Salon
from app.services import empleado_service, servicio_service, cliente_service, turno_service
from app.schemas.empleado import Empleado
from app.schemas.servicio import Servicio
from app.schemas.cliente import ClienteCreate
from app.schemas.turno import TurnoCreate

router = APIRouter(prefix="/public", tags=["Público"])


def _get_salon(slug: str, db: Session) -> Salon:
    salon = db.query(Salon).filter(Salon.slug == slug, Salon.activo == True).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado.")
    return salon


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
    return turno_service.create_turno(db, turno, salon_id=salon.id)
