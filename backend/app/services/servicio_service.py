from sqlalchemy.orm import Session
from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCreate

def get_servicios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Servicio).offset(skip).limit(limit).all()

def create_servicio(db: Session, servicio: ServicioCreate):
    db_servicio = Servicio(**servicio.dict())
    db.add(db_servicio)
    db.commit()
    db.refresh(db_servicio)
    return db_servicio
