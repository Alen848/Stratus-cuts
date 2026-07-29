from sqlalchemy.orm import Session

from app.models.categoria_servicio import CategoriaServicio
from app.models.servicio import Servicio
from app.schemas.categoria_servicio import CategoriaServicioCreate, CategoriaServicioUpdate


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
    db_categoria = CategoriaServicio(salon_id=salon_id, **categoria.model_dump())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


def update_categoria(db: Session, categoria_id: int, categoria: CategoriaServicioUpdate, salon_id: int):
    db_categoria = get_categoria(db, categoria_id, salon_id)
    if not db_categoria:
        return None
    for key, value in categoria.model_dump(exclude_unset=True).items():
        setattr(db_categoria, key, value)
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
