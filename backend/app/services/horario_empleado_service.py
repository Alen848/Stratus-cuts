from sqlalchemy.orm import Session
from app.models.horario_empleado import HorarioEmpleado
from app.schemas.horario_empleado import HorarioEmpleadoCreate

def get_horarios_by_empleado(db: Session, empleado_id: int):
    return db.query(HorarioEmpleado).filter(HorarioEmpleado.empleado_id == empleado_id).all()

def create_or_update_horario(db: Session, horario: HorarioEmpleadoCreate):
    # Buscar si ya existe para ese día
    existing = db.query(HorarioEmpleado).filter(
        HorarioEmpleado.empleado_id == horario.empleado_id,
        HorarioEmpleado.dia_semana == horario.dia_semana
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

def delete_horario(db: Session, horario_id: int):
    db_horario = db.query(HorarioEmpleado).filter(HorarioEmpleado.id == horario_id).first()
    if db_horario:
        db.delete(db_horario)
        db.commit()
        return True
    return False
