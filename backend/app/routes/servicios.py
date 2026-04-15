from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.services import servicio_service
from app.schemas.servicio import Servicio, ServicioCreate, ServicioUpdate

router = APIRouter(prefix="/servicios", tags=["Servicios"])


@router.get("/", response_model=List[Servicio])
def read_servicios(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return servicio_service.get_servicios(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@router.post("/", response_model=Servicio)
def create_servicio(
    servicio: ServicioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return servicio_service.create_servicio(db, servicio, salon_id=current_user.salon_id)


@router.put("/{servicio_id}", response_model=Servicio)
def update_servicio(
    servicio_id: int, servicio: ServicioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    updated = servicio_service.update_servicio(db, servicio_id, servicio, salon_id=current_user.salon_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return updated


@router.delete("/{servicio_id}")
def delete_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    deleted = servicio_service.delete_servicio(db, servicio_id, salon_id=current_user.salon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"detail": "Servicio eliminado"}
