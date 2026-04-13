from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario
from app.services import horario_empleado_service
from app.schemas.horario_empleado import HorarioEmpleado, HorarioEmpleadoCreate

router = APIRouter(prefix="/horarios-empleado", tags=["Horarios Empleado"])


@router.get("/{empleado_id}", response_model=List[HorarioEmpleado])
def read_horarios(
    empleado_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return horario_empleado_service.get_horarios_by_empleado(
        db, empleado_id, salon_id=current_user.salon_id
    )


@router.post("/", response_model=HorarioEmpleado)
def create_horario(
    horario: HorarioEmpleadoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return horario_empleado_service.create_or_update_horario(
        db, horario, salon_id=current_user.salon_id
    )


@router.delete("/{horario_id}")
def delete_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    deleted = horario_empleado_service.delete_horario(
        db, horario_id, salon_id=current_user.salon_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return {"message": "Horario eliminado"}
