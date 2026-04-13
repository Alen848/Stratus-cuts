from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.horario_empleado import HorarioEmpleado
from app.models.empleado import Empleado
from app.schemas.horario_empleado import HorarioEmpleadoCreate


def _verificar_empleado_salon(db: Session, empleado_id: int, salon_id: int) -> Empleado:
    empleado = db.query(Empleado).filter(
        Empleado.id == empleado_id,
        Empleado.salon_id == salon_id,
    ).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Profesional no encontrado en este salón.")
    return empleado


def get_horarios(db: Session, salon_id: int):
    """Todos los horarios de empleados de un salón (uso interno)."""
    return db.query(HorarioEmpleado).join(Empleado).filter(
        Empleado.salon_id == salon_id
    ).all()


def get_horarios_by_empleado(db: Session, empleado_id: int, salon_id: int):
    _verificar_empleado_salon(db, empleado_id, salon_id)
    return db.query(HorarioEmpleado).filter(HorarioEmpleado.empleado_id == empleado_id).all()


def create_or_update_horario(db: Session, horario: HorarioEmpleadoCreate, salon_id: int):
    _verificar_empleado_salon(db, horario.empleado_id, salon_id)

    existing = db.query(HorarioEmpleado).filter(
        HorarioEmpleado.empleado_id == horario.empleado_id,
        HorarioEmpleado.dia_semana == horario.dia_semana,
    ).first()

    if existing:
        existing.hora_inicio = horario.hora_inicio
        existing.hora_fin = horario.hora_fin
        db.commit()
        db.refresh(existing)
        return existing

    db_horario = HorarioEmpleado(**horario.model_dump())
    db.add(db_horario)
    db.commit()
    db.refresh(db_horario)
    return db_horario


def delete_horario(db: Session, horario_id: int, salon_id: int):
    db_horario = db.query(HorarioEmpleado).join(Empleado).filter(
        HorarioEmpleado.id == horario_id,
        Empleado.salon_id == salon_id,
    ).first()
    if db_horario:
        db.delete(db_horario)
        db.commit()
        return True
    return False
