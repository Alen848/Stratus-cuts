from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.services import servicio_service
from app.schemas.servicio import Servicio, ServicioCreate

router = APIRouter(prefix="/servicios", tags=["Servicios"])

@router.get("/", response_model=List[Servicio])
def read_servicios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return servicio_service.get_servicios(db, skip=skip, limit=limit)

@router.post("/", response_model=Servicio)
def create_servicio(servicio: ServicioCreate, db: Session = Depends(get_db)):
    return servicio_service.create_servicio(db, servicio)
