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
    from app.models.turno import Turno
    from app.models.horario_empleado import HorarioEmpleado
    from app.models.bloqueo_agenda import BloqueoAgenda

    db_empleado = get_empleado(db, empleado_id, salon_id)
    if not db_empleado:
        return None

    # Bloquear si tiene turnos activos o futuros
    turno_activo = db.query(Turno).filter(
        Turno.salon_id == salon_id,
        Turno.empleado_id == empleado_id,
        Turno.estado.in_(["pendiente", "confirmado"]),
    ).first()
    if turno_activo:
        raise HTTPException(
            status_code=400,
            detail="El profesional tiene turnos pendientes o confirmados. Cancelalos antes de eliminar.",
        )

    # Desasociar turnos históricos
    db.query(Turno).filter(Turno.empleado_id == empleado_id).update(
        {"empleado_id": None}, synchronize_session=False
    )

    # Eliminar horarios y bloqueos asociados
    db.query(HorarioEmpleado).filter(HorarioEmpleado.empleado_id == empleado_id).delete(
        synchronize_session=False
    )
    db.query(BloqueoAgenda).filter(BloqueoAgenda.empleado_id == empleado_id).delete(
        synchronize_session=False
    )

    db.delete(db_empleado)
    db.commit()
    return db_empleado
