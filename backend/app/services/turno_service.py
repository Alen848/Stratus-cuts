from sqlalchemy.orm import Session, joinedload
from app.models import Turno, TurnoServicio, Servicio
from app.schemas.turno import TurnoCreate, TurnoUpdate

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
    # Crear el turno principal
    db_turno = Turno(
        fecha_hora=turno.fecha_hora,
        estado=turno.estado,
        observaciones=turno.observaciones,
        cliente_id=turno.cliente_id,
        empleado_id=turno.empleado_id
    )
    db.add(db_turno)
    db.flush()  # Para obtener el id del turno

    # Agregar servicios
    for servicio_id in turno.servicios_ids:
        # Obtener precio del servicio desde la base de datos (podríamos pasarlo en el request)
        servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
        if servicio:
            turno_servicio = TurnoServicio(
                turno_id=db_turno.id,
                servicio_id=servicio_id,
                cantidad=1,
                precio_unitario=servicio.precio
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