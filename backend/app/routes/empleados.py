from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.services import empleado_service
from app.schemas.empleado import Empleado, EmpleadoCreate, EmpleadoUpdate

router = APIRouter(prefix="/empleados", tags=["Empleados"])


@router.get("/", response_model=List[Empleado])
def read_empleados(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return empleado_service.get_empleados(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@router.post("/", response_model=Empleado)
def create_empleado(
    empleado: EmpleadoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return empleado_service.create_empleado(db, empleado, salon_id=current_user.salon_id)


@router.put("/{empleado_id}", response_model=Empleado)
def update_empleado(
    empleado_id: int, empleado: EmpleadoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    updated = empleado_service.update_empleado(db, empleado_id, empleado, salon_id=current_user.salon_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    return updated


@router.delete("/{empleado_id}", response_model=Empleado)
def delete_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    deleted = empleado_service.delete_empleado(db, empleado_id, salon_id=current_user.salon_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    return deleted
