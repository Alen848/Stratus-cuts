from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as DateType

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario
from app.services import pago_service
from app.schemas.pago import Pago, PagoCreate, PagoUpdate
from app.schemas.gasto import Gasto, GastoCreate, GastoUpdate
from app.schemas.cierre_caja import CierreCaja, CierreCajaCreate

# ─── Router de Pagos (/pagos) ──────────────────────────────────────────────────
pagos_router = APIRouter(prefix="/pagos", tags=["Pagos"])


@pagos_router.get("/", response_model=List[Pago])
def read_pagos(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return pago_service.get_pagos(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@pagos_router.get("/{pago_id}", response_model=Pago)
def read_pago(
    pago_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pago = pago_service.get_pago(db, pago_id, salon_id=current_user.salon_id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return pago


@pagos_router.post("/", response_model=Pago)
def create_pago(
    pago: PagoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return pago_service.create_pago(db, pago, salon_id=current_user.salon_id)


@pagos_router.put("/{pago_id}", response_model=Pago)
def update_pago(
    pago_id: int, pago: PagoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    updated = pago_service.update_pago(db, pago_id, pago, salon_id=current_user.salon_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return updated


@pagos_router.delete("/{pago_id}")
def delete_pago(
    pago_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    deleted = pago_service.delete_pago(db, pago_id, salon_id=current_user.salon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return {"detail": "Pago eliminado correctamente"}


# ─── Router de Gastos (/gastos) ────────────────────────────────────────────────
gastos_router = APIRouter(prefix="/gastos", tags=["Gastos"])


@gastos_router.get("/", response_model=List[Gasto])
def read_gastos(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return pago_service.get_gastos(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@gastos_router.get("/{gasto_id}", response_model=Gasto)
def read_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    gasto = pago_service.get_gasto(db, gasto_id, salon_id=current_user.salon_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return gasto


@gastos_router.post("/", response_model=Gasto)
def create_gasto(
    gasto: GastoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return pago_service.create_gasto(db, gasto, salon_id=current_user.salon_id)


@gastos_router.put("/{gasto_id}", response_model=Gasto)
def update_gasto(
    gasto_id: int, gasto: GastoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    updated = pago_service.update_gasto(db, gasto_id, gasto, salon_id=current_user.salon_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return updated


@gastos_router.delete("/{gasto_id}")
def delete_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    deleted = pago_service.delete_gasto(db, gasto_id, salon_id=current_user.salon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"detail": "Gasto eliminado correctamente"}


# ─── Router de Caja (/caja) ────────────────────────────────────────────────────
caja_router = APIRouter(prefix="/caja", tags=["Caja"])


@caja_router.get("/diaria")
def caja_diaria(
    fecha: DateType,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return pago_service.get_caja_diaria(db, salon_id=current_user.salon_id, fecha=fecha)


@caja_router.get("/mensual")
def caja_mensual(
    anio: int, mes: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12.")
    return pago_service.get_caja_mensual(db, salon_id=current_user.salon_id, anio=anio, mes=mes)


@caja_router.get("/cierre", response_model=Optional[CierreCaja])
def get_cierre(
    fecha: DateType,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return pago_service.get_cierre_caja(db, salon_id=current_user.salon_id, fecha=fecha)


@caja_router.get("/historial", response_model=List[CierreCaja])
def historial_cierres(
    anio: int, mes: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12.")
    return pago_service.get_historial_cierres(db, salon_id=current_user.salon_id, anio=anio, mes=mes)


@caja_router.post("/cerrar", response_model=CierreCaja)
def cerrar_caja(
    cierre: CierreCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    existente = pago_service.get_cierre_caja(db, salon_id=current_user.salon_id, fecha=cierre.fecha)
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un cierre para esta fecha.")
    return pago_service.create_cierre_caja(db, cierre, salon_id=current_user.salon_id)
