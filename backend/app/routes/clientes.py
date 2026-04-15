from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.services import cliente_service
from app.schemas.cliente import Cliente, ClienteCreate, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/", response_model=List[Cliente])
def read_clientes(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return cliente_service.get_clientes(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@router.get("/{cliente_id}", response_model=Cliente)
def read_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_cliente = cliente_service.get_cliente(db, cliente_id, salon_id=current_user.salon_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente


@router.post("/", response_model=Cliente, status_code=status.HTTP_201_CREATED)
def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return cliente_service.create_cliente(db, cliente, salon_id=current_user.salon_id)


@router.put("/{cliente_id}", response_model=Cliente)
def update_cliente(
    cliente_id: int, cliente: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_cliente = cliente_service.update_cliente(db, cliente_id, cliente, salon_id=current_user.salon_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente


@router.delete("/{cliente_id}", response_model=Cliente)
def delete_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_cliente = cliente_service.delete_cliente(db, cliente_id, salon_id=current_user.salon_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente
