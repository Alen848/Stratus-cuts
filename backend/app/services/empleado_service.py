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
    """Profesional vigente del salón (los dados de baja no se devuelven)."""
    return db.query(Empleado).filter(
        Empleado.id == empleado_id,
        Empleado.salon_id == salon_id,
        Empleado.eliminado == False,
    ).first()


def get_empleados(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Empleado).filter(
        Empleado.salon_id == salon_id,
        Empleado.eliminado == False,
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
    """
    Elimina un profesional.

    - Si tiene turnos FUTUROS vigentes se corta con aviso: hay clientes esperando
      ser atendidos por él y primero hay que reasignarlos o cancelarlos.
    - Si tiene historial (turnos pasados) se da de BAJA: queda `eliminado`, deja de
      aparecer en listados, reservas y disponibilidad, pero sus turnos y los pagos
      que la Caja ya registró se conservan (borrarlos alteraría cierres pasados).
    - Si nunca tuvo turnos se borra de verdad.

    En ambos casos se le quitan horarios, bloqueos y servicios asignados, y si
    tenía un usuario para entrar al admin se desactiva.
    """
    from datetime import datetime
    from app.models.turno import Turno
    from app.models.horario_empleado import HorarioEmpleado
    from app.models.bloqueo_agenda import BloqueoAgenda
    from app.models.usuario import Usuario
    from app.services.turno_service import ARG_TZ, expirar_turnos_vencidos

    db_empleado = get_empleado(db, empleado_id, salon_id)
    if not db_empleado:
        return None

    # Holds de seña vencidos no cuentan como turnos futuros
    expirar_turnos_vencidos(db, salon_id)

    ahora = datetime.now(ARG_TZ).replace(tzinfo=None)
    futuros = db.query(Turno).filter(
        Turno.salon_id == salon_id,
        Turno.empleado_id == empleado_id,
        Turno.fecha_hora >= ahora,
        Turno.estado.in_(("pendiente", "pendiente_pago", "confirmado")),
    ).count()
    if futuros:
        raise HTTPException(
            status_code=400,
            detail=f"{db_empleado.nombre} tiene {futuros} turno(s) a futuro. "
                   "Reasignalos a otro profesional o cancelalos antes de eliminarlo.",
        )

    tiene_historial = db.query(Turno).filter(
        Turno.salon_id == salon_id,
        Turno.empleado_id == empleado_id,
    ).first() is not None

    db.query(HorarioEmpleado).filter(HorarioEmpleado.empleado_id == empleado_id).delete(
        synchronize_session=False
    )
    db.query(BloqueoAgenda).filter(BloqueoAgenda.empleado_id == empleado_id).delete(
        synchronize_session=False
    )
    db_empleado.servicios = []

    usuario = db.query(Usuario).filter(Usuario.empleado_id == empleado_id).first()
    if usuario:
        usuario.activo = False

    if tiene_historial:
        db_empleado.eliminado = True
        db_empleado.activo = False
    else:
        if usuario:
            usuario.empleado_id = None
        db.delete(db_empleado)

    db.commit()
    return db_empleado
