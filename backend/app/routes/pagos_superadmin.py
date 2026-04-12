"""
Rutas de control de pagos de salones (exclusivo superadmin).
Prefijo: /superadmin/pagos
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from app.database.connection import get_db
from app.auth.dependencies import require_superadmin
from app.models.usuario import Usuario
from app.models.salon import Salon
from app.models.pago_salon import PagoSalon

router = APIRouter(prefix="/superadmin/pagos", tags=["Superadmin - Pagos"])


class PagoUpsert(BaseModel):
    salon_id: int
    anio: int
    mes: int
    monto: Optional[float] = 0
    pagado: Optional[bool] = False
    fecha_pago: Optional[date] = None
    metodo: Optional[str] = None
    notas: Optional[str] = None


class PagoUpdate(BaseModel):
    monto: Optional[float] = None
    pagado: Optional[bool] = None
    fecha_pago: Optional[date] = None
    metodo: Optional[str] = None
    notas: Optional[str] = None


@router.get("/")
def listar_pagos_mes(
    anio: int,
    mes: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    """
    Devuelve todos los salones con su estado de pago para el mes/año dado.
    Si un salón no tiene registro aún, devuelve defaults (pagado=False).
    """
    salones = db.query(Salon).order_by(Salon.nombre).all()
    pagos = {
        p.salon_id: p
        for p in db.query(PagoSalon).filter(
            PagoSalon.anio == anio,
            PagoSalon.mes == mes,
        ).all()
    }

    result = []
    for s in salones:
        p = pagos.get(s.id)
        result.append({
            "salon_id": s.id,
            "salon_nombre": s.nombre,
            "salon_slug": s.slug,
            "salon_activo": s.activo,
            "plan": s.plan,
            "pago_id": p.id if p else None,
            "monto": float(p.monto) if p else 0,
            "pagado": p.pagado if p else False,
            "fecha_pago": p.fecha_pago if p else None,
            "metodo": p.metodo if p else None,
            "notas": p.notas if p else None,
        })
    return result


@router.post("/", status_code=201)
def crear_o_actualizar_pago(
    payload: PagoUpsert,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    """Crea el registro de pago si no existe, o lo actualiza si ya existe."""
    pago = db.query(PagoSalon).filter(
        PagoSalon.salon_id == payload.salon_id,
        PagoSalon.anio == payload.anio,
        PagoSalon.mes == payload.mes,
    ).first()

    if pago:
        if payload.monto is not None:
            pago.monto = payload.monto
        if payload.pagado is not None:
            pago.pagado = payload.pagado
        if payload.fecha_pago is not None:
            pago.fecha_pago = payload.fecha_pago
        if payload.metodo is not None:
            pago.metodo = payload.metodo
        if payload.notas is not None:
            pago.notas = payload.notas
    else:
        pago = PagoSalon(
            salon_id=payload.salon_id,
            anio=payload.anio,
            mes=payload.mes,
            monto=payload.monto or 0,
            pagado=payload.pagado or False,
            fecha_pago=payload.fecha_pago,
            metodo=payload.metodo,
            notas=payload.notas,
        )
        db.add(pago)

    db.commit()
    db.refresh(pago)
    return {"pago_id": pago.id, "pagado": pago.pagado}


@router.patch("/{pago_id}")
def actualizar_pago(
    pago_id: int,
    payload: PagoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    pago = db.query(PagoSalon).filter(PagoSalon.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Registro de pago no encontrado.")

    if payload.monto is not None:
        pago.monto = payload.monto
    if payload.pagado is not None:
        pago.pagado = payload.pagado
    if payload.fecha_pago is not None:
        pago.fecha_pago = payload.fecha_pago
    if payload.metodo is not None:
        pago.metodo = payload.metodo
    if payload.notas is not None:
        pago.notas = payload.notas

    db.commit()
    return {"pago_id": pago.id, "pagado": pago.pagado}
