from datetime import date as DateType
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.servicio import Servicio
from app.models.servicio_fecha_especial import ServicioFechaEspecial
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


def _empleados_del_salon(db: Session, empleado_ids, salon_id: int):
    """Objetos Empleado del salón cuyos ids se pasan (ignora los ajenos)."""
    from app.models.empleado import Empleado

    if not empleado_ids:
        return []
    return db.query(Empleado).filter(
        Empleado.salon_id == salon_id,
        Empleado.id.in_(empleado_ids),
    ).all()


def _set_fechas_especiales(db_servicio: Servicio, fechas, salon_id: int):
    """
    Reemplaza las fechas especiales del servicio por las recibidas.
    Lista vacía = el servicio vuelve a estar disponible siempre.
    """
    unicas = sorted({f for f in (fechas or [])})
    db_servicio.fechas_especiales_rel = [
        ServicioFechaEspecial(salon_id=salon_id, fecha=f) for f in unicas
    ]


def create_servicio(db: Session, servicio: ServicioCreate, salon_id: int):
    _validar_categoria(db, servicio.categoria_id, salon_id)
    data = servicio.model_dump()
    empleado_ids = data.pop("empleado_ids", None)
    fechas = data.pop("fechas_especiales", None)
    db_servicio = Servicio(salon_id=salon_id, **data)
    if empleado_ids:
        db_servicio.empleados = _empleados_del_salon(db, empleado_ids, salon_id)
    if fechas:
        _set_fechas_especiales(db_servicio, fechas, salon_id)
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
    # Solo tocar la asignación de profesionales si vino explícita en el payload
    empleado_ids = cambios.pop("empleado_ids", None)
    if empleado_ids is not None:
        db_servicio.empleados = _empleados_del_salon(db, empleado_ids, salon_id)
    # Ídem con las fechas especiales: si no vinieron, quedan como estaban
    fechas = cambios.pop("fechas_especiales", None)
    if fechas is not None:
        _set_fechas_especiales(db_servicio, fechas, salon_id)
    for key, value in cambios.items():
        setattr(db_servicio, key, value)
    db.commit()
    db.refresh(db_servicio)
    return db_servicio


def validar_fechas_especiales(db: Session, servicios_ids, fecha: DateType, salon_id: int):
    """
    Si alguno de los servicios elegidos es de "fecha especial", la reserva solo
    vale en uno de sus días. Lanza HTTPException 400 si no.

    Se valida en el backend y no solo en el front: la UI puede esconder los días,
    pero un POST directo a /public/{slug}/turnos podría mandar cualquier fecha.
    """
    if not servicios_ids:
        return

    servicios = db.query(Servicio).filter(
        Servicio.salon_id == salon_id,
        Servicio.id.in_(servicios_ids),
    ).all()

    for s in servicios:
        fechas = s.fechas_especiales
        if not fechas:
            continue  # servicio normal: disponible siempre
        if fecha not in fechas:
            proximas = [f for f in fechas if f >= DateType.today()]
            detalle = f'"{s.nombre}" solo se realiza en fechas puntuales.'
            if proximas:
                legibles = ", ".join(f.strftime("%d/%m/%Y") for f in proximas[:3])
                detalle += f" Próximas fechas disponibles: {legibles}."
            else:
                detalle += " No hay próximas fechas cargadas."
            raise HTTPException(status_code=400, detail=detalle)


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
