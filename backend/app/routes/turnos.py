from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.services import turno_service
from app.schemas.turno import Turno, TurnoCreate

router = APIRouter(prefix="/turns", tags=["Turns"])

@router.get("/", response_model=List[Turno])
def read_turnos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return turno_service.get_turnos(db, skip=skip, limit=limit)

@router.post("/", response_model=Turno)
def create_turno(turno: TurnoCreate, db: Session = Depends(get_db)):
    return turno_service.create_turno(db, turno)
