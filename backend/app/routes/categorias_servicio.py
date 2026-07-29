from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.services import categoria_servicio_service
from app.schemas.categoria_servicio import (
    CategoriaServicio, CategoriaServicioCreate, CategoriaServicioUpdate,
)

router = APIRouter(prefix="/categorias-servicio", tags=["Categorías de servicio"])


@router.get("/", response_model=List[CategoriaServicio])
def read_categorias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return categoria_servicio_service.get_categorias(db, salon_id=current_user.salon_id)


@router.post("/", response_model=CategoriaServicio)
def create_categoria(
    categoria: CategoriaServicioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return categoria_servicio_service.create_categoria(db, categoria, salon_id=current_user.salon_id)


@router.put("/{categoria_id}", response_model=CategoriaServicio)
def update_categoria(
    categoria_id: int, categoria: CategoriaServicioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    updated = categoria_servicio_service.update_categoria(
        db, categoria_id, categoria, salon_id=current_user.salon_id
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return updated


@router.delete("/{categoria_id}")
def delete_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    deleted = categoria_servicio_service.delete_categoria(db, categoria_id, salon_id=current_user.salon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"detail": "Categoría eliminada"}
