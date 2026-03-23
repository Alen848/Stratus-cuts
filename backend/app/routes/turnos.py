from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date as DateType

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario
from app.services import turno_service
from app.schemas.turno import Turno, TurnoCreate, TurnoUpdate

router = APIRouter(prefix="/turns", tags=["Turns"])


@router.get("/", response_model=List[Turno])
def read_turnos(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.get_turnos(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@router.get("/{turno_id}", response_model=Turno)
def read_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    turno = turno_service.get_turno(db, turno_id, salon_id=current_user.salon_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.post("/", response_model=Turno)
def create_turno(
    turno: TurnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.create_turno(db, turno, salon_id=current_user.salon_id)


@router.put("/{turno_id}", response_model=Turno)
def update_turno(
    turno_id: int, turno: TurnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    updated = turno_service.update_turno(db, turno_id, turno, salon_id=current_user.salon_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return updated


@router.delete("/{turno_id}")
def delete_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    deleted = turno_service.delete_turno(db, turno_id, salon_id=current_user.salon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return {"detail": "Turno eliminado correctamente"}


@router.get("/disponibilidad-semanal/{empleado_id}")
def get_disponibilidad_semanal(
    empleado_id: int,
    fecha_inicio: DateType,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.get_horarios_semanales(
        db, empleado_id, fecha_inicio, salon_id=current_user.salon_id
    )
