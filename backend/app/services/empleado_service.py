from sqlalchemy.orm import Session
from app.models.empleado import Empleado
from app.schemas.empleado import EmpleadoCreate

def get_empleados(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Empleado).offset(skip).limit(limit).all()

def create_empleado(db: Session, empleado: EmpleadoCreate):
    db_empleado = Empleado(**empleado.dict())
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado
