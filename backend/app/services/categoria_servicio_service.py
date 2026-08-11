from sqlalchemy.orm import Session

from app.models.categoria_servicio import CategoriaServicio
from app.models.evento import Evento, EventoFecha
from app.models.servicio import Servicio
from app.schemas.categoria_servicio import CategoriaServicioCreate, CategoriaServicioUpdate

# Campos que no viven en la tabla de categorías sino en su evento asociado
CAMPOS_EVENTO = ("es_evento", "fechas_especiales", "intervalo_minutos")


def _aplicar_evento(db: Session, cat: CategoriaServicio, datos: dict, salon_id: int):
    """
    Crea, actualiza o elimina el Evento asociado a la categoría.

    `datos` son los campos de evento que vinieron en el payload (pueden faltar:
    lo que no viene, no se toca). `es_evento=False` desmarca la categoría y borra
    sus fechas; los servicios de adentro quedan intactos y pasan a estar
    disponibles todos los días.
    """
    es_evento = datos.get("es_evento")

    if es_evento is False:
        if cat.evento:
            db.delete(cat.evento)
            cat.evento = None
        return

    # Si no se pide marcarla como evento y no lo era, no hay nada que hacer
    if not cat.evento and not es_evento:
        return

    if not cat.evento:
        cat.evento = Evento(salon_id=salon_id, intervalo_minutos=60)

    if datos.get("intervalo_minutos") is not None:
        cat.evento.intervalo_minutos = datos["intervalo_minutos"]

    fechas = datos.get("fechas_especiales")
    if fechas is not None:
        unicas = sorted(set(fechas))
        cat.evento.fechas = [
            EventoFecha(salon_id=salon_id, fecha=f) for f in unicas
        ]


def get_categoria(db: Session, categoria_id: int, salon_id: int):
    return db.query(CategoriaServicio).filter(
        CategoriaServicio.id == categoria_id,
        CategoriaServicio.salon_id == salon_id,
    ).first()


def get_categorias(db: Session, salon_id: int):
    return db.query(CategoriaServicio).filter(
        CategoriaServicio.salon_id == salon_id
    ).order_by(CategoriaServicio.orden, CategoriaServicio.nombre).all()


def create_categoria(db: Session, categoria: CategoriaServicioCreate, salon_id: int):
    datos  = categoria.model_dump()
    evento = {k: datos.pop(k) for k in CAMPOS_EVENTO if k in datos}

    db_categoria = CategoriaServicio(salon_id=salon_id, **datos)
    db.add(db_categoria)
    _aplicar_evento(db, db_categoria, evento, salon_id)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


def update_categoria(db: Session, categoria_id: int, categoria: CategoriaServicioUpdate, salon_id: int):
    db_categoria = get_categoria(db, categoria_id, salon_id)
    if not db_categoria:
        return None
    datos  = categoria.model_dump(exclude_unset=True)
    evento = {k: datos.pop(k) for k in CAMPOS_EVENTO if k in datos}

    for key, value in datos.items():
        setattr(db_categoria, key, value)
    _aplicar_evento(db, db_categoria, evento, salon_id)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


def delete_categoria(db: Session, categoria_id: int, salon_id: int):
    """
    Borra la categoría. Los servicios que colgaban de ella no se borran:
    quedan sin categoría (se muestran sueltos en la reserva).
    """
    db_categoria = get_categoria(db, categoria_id, salon_id)
    if not db_categoria:
        return None

    db.query(Servicio).filter(
        Servicio.categoria_id == categoria_id,
        Servicio.salon_id == salon_id,
    ).update({Servicio.categoria_id: None}, synchronize_session=False)

    db.delete(db_categoria)
    db.commit()
    return db_categoria
