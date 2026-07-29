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
    ).order_by(Servicio.nombre).offset(skip).limit(limit).all()


def _validar_categoria(db: Session, categoria_id, salon_id: int):
    """La categoría debe existir y pertenecer al mismo salón."""
    if categoria_id is None:
        return
    from app.models.categoria_servicio import CategoriaServicio

    existe = db.query(CategoriaServicio).filter(
        CategoriaServicio.id == categoria_id,
        CategoriaServicio.salon_id == salon_id,
    ).first()
    if not existe:
        raise HTTPException(status_code=400, detail="La categoría indicada no existe.")


def create_servicio(db: Session, servicio: ServicioCreate, salon_id: int):
    _validar_categoria(db, servicio.categoria_id, salon_id)
    db_servicio = Servicio(salon_id=salon_id, **servicio.model_dump())
    db.add(db_servicio)
    db.commit()
    db.refresh(db_servicio)
    return db_servicio


def update_servicio(db: Session, servicio_id: int, servicio: ServicioUpdate, salon_id: int):
    db_servicio = get_servicio(db, servicio_id, salon_id)
    if not db_servicio:
        return None
    cambios = servicio.model_dump(exclude_unset=True)
    if "categoria_id" in cambios:
        _validar_categoria(db, cambios["categoria_id"], salon_id)
    for key, value in cambios.items():
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
