from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCreate, ServicioUpdate


def get_servicio(db: Session, servicio_id: int, salon_id: int):
    return db.query(Servicio).filter(
        Servicio.id == servicio_id,
        Servicio.salon_id == salon_id,
    ).first()


def get_servicios(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Servicio).filter(
        Servicio.salon_id == salon_id
    ).offset(skip).limit(limit).all()


def create_servicio(db: Session, servicio: ServicioCreate, salon_id: int):
    db_servicio = Servicio(salon_id=salon_id, **servicio.model_dump())
    db.add(db_servicio)
    db.commit()
    db.refresh(db_servicio)
    return db_servicio


def update_servicio(db: Session, servicio_id: int, servicio: ServicioUpdate, salon_id: int):
    db_servicio = get_servicio(db, servicio_id, salon_id)
    if not db_servicio:
        return None
    for key, value in servicio.model_dump(exclude_unset=True).items():
        setattr(db_servicio, key, value)
    db.commit()
    db.refresh(db_servicio)
    return db_servicio


def delete_servicio(db: Session, servicio_id: int, salon_id: int):
    from app.models.turno_servicio import TurnoServicio

    db_servicio = get_servicio(db, servicio_id, salon_id)
    if not db_servicio:
        return None

    usado = db.query(TurnoServicio).filter(TurnoServicio.servicio_id == servicio_id).first()
    if usado:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un servicio que ya fue usado en turnos. Desactivalo en su lugar.",
        )

    db.delete(db_servicio)
    db.commit()
    return db_servicio
