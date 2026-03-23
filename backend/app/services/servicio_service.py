from sqlalchemy.orm import Session
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
    db_servicio = get_servicio(db, servicio_id, salon_id)
    if not db_servicio:
        return None
    db.delete(db_servicio)
    db.commit()
    return db_servicio
