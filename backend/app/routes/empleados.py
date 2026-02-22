from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.services import empleado_service
from app.schemas.empleado import Empleado, EmpleadoCreate

router = APIRouter(prefix="/empleados", tags=["Empleados"])

@router.get("/", response_model=List[Empleado])
def read_empleados(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return empleado_service.get_empleados(db, skip=skip, limit=limit)

@router.post("/", response_model=Empleado)
def create_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    return empleado_service.create_empleado(db, empleado)
