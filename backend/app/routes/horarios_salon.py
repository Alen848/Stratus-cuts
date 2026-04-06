from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario
from app.services import horario_salon_service
from app.schemas.horario_salon import HorarioSalon, HorarioSalonUpsert

router = APIRouter(prefix="/horarios-salon", tags=["Horarios Salón"])


@router.get("/", response_model=List[HorarioSalon])
def read_horarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return horario_salon_service.get_horarios(db, current_user.salon_id)


@router.put("/", response_model=List[HorarioSalon])
def update_horarios(
    horarios: List[HorarioSalonUpsert],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return horario_salon_service.upsert_horarios(db, current_user.salon_id, horarios)
