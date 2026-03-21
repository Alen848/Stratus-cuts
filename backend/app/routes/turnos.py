from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date as DateType
from app.database.connection import get_db
from app.services import turno_service
from app.schemas.turno import Turno, TurnoCreate, TurnoUpdate

router = APIRouter(prefix="/turns", tags=["Turns"])


# ─── Listar todos ──────────────────────────────────────────────────────────────
@router.get("/", response_model=List[Turno])
def read_turnos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return turno_service.get_turnos(db, skip=skip, limit=limit)


# ─── Obtener uno por ID ────────────────────────────────────────────────────────
@router.get("/{turno_id}", response_model=Turno)
def read_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = turno_service.get_turno(db, turno_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


# ─── Crear ─────────────────────────────────────────────────────────────────────
@router.post("/", response_model=Turno)
def create_turno(turno: TurnoCreate, db: Session = Depends(get_db)):
    return turno_service.create_turno(db, turno)


# ─── Actualizar ────────────────────────────────────────────────────────────────
@router.put("/{turno_id}", response_model=Turno)
def update_turno(turno_id: int, turno: TurnoUpdate, db: Session = Depends(get_db)):
    updated = turno_service.update_turno(db, turno_id, turno)
    if not updated:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return updated


# ─── Eliminar ──────────────────────────────────────────────────────────────────
@router.delete("/{turno_id}")
def delete_turno(turno_id: int, db: Session = Depends(get_db)):
    deleted = turno_service.delete_turno(db, turno_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return {"detail": "Turno eliminado correctamente"}


# ─── Horarios disponibles ──────────────────────────────────────────────────────
@router.get("/disponibles/{empleado_id}")
def get_horarios_disponibles(
    empleado_id: int,
    fecha: DateType,      # query param: ?fecha=2024-12-01
    duracion: int = 30,   # query param opcional: ?duracion=60
    db: Session = Depends(get_db)
):
    """
    Retorna los slots horarios del día para un empleado.
    - Horario: 10:00 a 20:00
    - Intervalos: cada 30 minutos
    - Cada slot indica si está disponible u ocupado
    """
    return turno_service.get_horarios_disponibles(db, empleado_id, fecha, duracion)