from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.empleado import Empleado
from app.models.servicio import Servicio
from app.schemas.empleado import EmpleadoCreate, EmpleadoUpdate


def _servicios_del_salon(db: Session, servicio_ids, salon_id: int):
    """Devuelve los objetos Servicio del salón cuyos ids se pasan (ignora ajenos)."""
    if not servicio_ids:
        return []
    return db.query(Servicio).filter(
        Servicio.salon_id == salon_id,
        Servicio.id.in_(servicio_ids),
    ).all()


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
    data = empleado.model_dump()
    servicio_ids = data.pop("servicio_ids", None)
    db_empleado = Empleado(salon_id=salon_id, **data)
    if servicio_ids:
        db_empleado.servicios = _servicios_del_salon(db, servicio_ids, salon_id)
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado


def update_empleado(db: Session, empleado_id: int, empleado: EmpleadoUpdate, salon_id: int):
    db_empleado = get_empleado(db, empleado_id, salon_id)
    if not db_empleado:
        return None
    data = empleado.model_dump(exclude_unset=True)
    servicio_ids = data.pop("servicio_ids", None)
    for key, value in data.items():
        setattr(db_empleado, key, value)
    # Solo tocar la asignación de servicios si vino explícita en el payload.
    if servicio_ids is not None:
        db_empleado.servicios = _servicios_del_salon(db, servicio_ids, salon_id)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado


def delete_empleado(db: Session, empleado_id: int, salon_id: int):
    from app.models.turno import Turno
    from app.models.turno_servicio import TurnoServicio
    from app.models.pago import Pago
    from app.models.horario_empleado import HorarioEmpleado
    from app.models.bloqueo_agenda import BloqueoAgenda

    db_empleado = get_empleado(db, empleado_id, salon_id)
    if not db_empleado:
        return None

    turnos = db.query(Turno).filter(
        Turno.salon_id == salon_id,
        Turno.empleado_id == empleado_id,
    ).all()
    turno_ids = [t.id for t in turnos]

    # Proteger la caja: si algún turno tiene un pago aprobado (seña/cobro), no se puede
    # eliminar el profesional sin borrar ese ingreso. En ese caso se corta con aviso.
    if turno_ids:
        tiene_pago = db.query(Pago).filter(
            Pago.turno_id.in_(turno_ids),
            Pago.estado == "aprobada",
        ).first()
        if tiene_pago:
            raise HTTPException(
                status_code=400,
                detail="El profesional tiene turnos con pagos registrados (seña/cobro). "
                       "No se puede eliminar sin borrar esos ingresos.",
            )

    # Eliminar los turnos del profesional y sus registros hijos.
    # (empleado_id es NOT NULL, así que no se pueden "desvincular" poniéndolo en NULL.)
    if turno_ids:
        db.query(TurnoServicio).filter(TurnoServicio.turno_id.in_(turno_ids)).delete(
            synchronize_session=False
        )
        db.query(Pago).filter(Pago.turno_id.in_(turno_ids)).delete(
            synchronize_session=False
        )
        db.query(Turno).filter(Turno.id.in_(turno_ids)).delete(
            synchronize_session=False
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
