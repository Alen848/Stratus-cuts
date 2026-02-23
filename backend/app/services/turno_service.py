from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models import Turno, TurnoServicio, Servicio
from app.schemas.turno import TurnoCreate, TurnoUpdate
from datetime import timedelta, date
from fastapi import HTTPException

def get_turno(db: Session, turno_id: int):
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio)
    ).filter(Turno.id == turno_id).first()

def get_turnos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio)
    ).offset(skip).limit(limit).all()

def create_turno(db: Session, turno: TurnoCreate):
    servicios_db = db.query(Servicio).filter(Servicio.id.in_(turno.servicios_ids)).all()
    
    # Calcula la duracion total del turno
    total_duracion = sum(s.duracion_minutos for s in servicios_db)

    if total_duracion == 0:
        total_duracion = turno.duracion

    # Comprueba la disponibilidad del horario con el profesional seleccionado
    nuevo_inicio = turno.fecha_hora
    nuevo_fin = nuevo_inicio + timedelta(minutes=total_duracion)
    dia_del_turno = turno.fecha_hora.date()

    turnos_existentes = db.query(Turno).filter(
        (Turno.empleado_id == turno.empleado_id) | (Turno.cliente_id == turno.cliente_id), 
        Turno.estado != "cancelado", 
        func.date(Turno.fecha_hora) == dia_del_turno
    ).all()

    for t_existente in turnos_existentes:
        existente_inicio = t_existente.fecha_hora
        existente_fin = existente_inicio + timedelta(minutes=t_existente.duracion)
        
        if nuevo_inicio < existente_fin and nuevo_fin > existente_inicio:
            # El empleado no esta disponible
            if t_existente.empleado_id == turno.empleado_id:
                raise HTTPException(status_code=400, detail = "El profesional seleccionado ya tiene un turno en ese horario.")
            # El cliente ya tiene un turno en ese horario
            if t_existente.cliente_id == turno.cliente_id:
                raise HTTPException(status_code=400, detail = "El cliente ya tiene otro turno en ese horario.")

    db_turno = Turno(
        fecha_hora = turno.fecha_hora,
        duracion = total_duracion,
        estado = turno.estado,
        observaciones = turno.observaciones,
        cliente_id = turno.cliente_id,
        empleado_id = turno.empleado_id
    )
    db.add(db_turno)
    db.flush()

    for servicio in servicios_db:
        turno_servicio = TurnoServicio(
            turno_id = db_turno.id,
            servicio_id = servicio.id,
            cantidad = 1,
            precio_unitario = servicio.precio
        )
        db.add(turno_servicio)

    db.commit()
    db.refresh(db_turno)
    return db_turno

def update_turno(db: Session, turno_id: int, turno_update: TurnoUpdate):
    db_turno = get_turno(db, turno_id)
    if not db_turno:
        return None
    update_data = turno_update.dict(exclude_unset=True)
    # Manejar actualización de servicios si viene
    if "servicios_ids" in update_data:
        # Eliminar relaciones anteriores
        db.query(TurnoServicio).filter(TurnoServicio.turno_id == turno_id).delete()
        # Agregar nuevas
        for servicio_id in update_data["servicios_ids"]:
            servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
            if servicio:
                turno_servicio = TurnoServicio(
                    turno_id=turno_id,
                    servicio_id=servicio_id,
                    cantidad=1,
                    precio_unitario=servicio.precio
                )
                db.add(turno_servicio)
        del update_data["servicios_ids"]
    # Actualizar otros campos
    for field, value in update_data.items():
        setattr(db_turno, field, value)
    db.commit()
    db.refresh(db_turno)
    return db_turno

def delete_turno(db: Session, turno_id: int):
    db_turno = db.query(Turno).filter(Turno.id == turno_id).first()
    if db_turno:
        db.delete(db_turno)
        db.commit()
    return db_turno
