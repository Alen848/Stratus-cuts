from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.empleado import Empleado
from app.schemas.empleado import EmpleadoCreate, EmpleadoUpdate


def get_empleado(db: Session, empleado_id: int, salon_id: int):
    return db.query(Empleado).filter(
        Empleado.id == empleado_id,
        Empleado.salon_id == salon_id,
    ).first()


def get_empleados(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Empleado).filter(
        Empleado.salon_id == salon_id
    ).offset(skip).limit(limit).all()


def create_empleado(db: Session, empleado: EmpleadoCreate, salon_id: int):
    db_empleado = Empleado(salon_id=salon_id, **empleado.model_dump())
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado


def update_empleado(db: Session, empleado_id: int, empleado: EmpleadoUpdate, salon_id: int):
    db_empleado = get_empleado(db, empleado_id, salon_id)
    if not db_empleado:
        return None
    for key, value in empleado.model_dump(exclude_unset=True).items():
        setattr(db_empleado, key, value)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado


def delete_empleado(db: Session, empleado_id: int, salon_id: int):
    db_empleado = get_empleado(db, empleado_id, salon_id)
    if not db_empleado:
        return None
    from app.models.turno import Turno
    tiene_turnos = db.query(Turno).filter(Turno.empleado_id == empleado_id).first()
    if tiene_turnos:
        return "tiene_turnos"
    db.delete(db_empleado)
    db.commit()
    return db_empleado
