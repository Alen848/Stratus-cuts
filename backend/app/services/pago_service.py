from sqlalchemy import func, extract
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date, timezone, timedelta
from fastapi import HTTPException

from app.models.pago import Pago
from app.models.turno import Turno
from app.models.turno_servicio import TurnoServicio
from app.models.gasto import Gasto
from app.models.cierre_caja import CierreCaja
from app.schemas.pago import PagoCreate, PagoUpdate
from app.schemas.cierre_caja import CierreCajaCreate

ARG_TZ = timezone(timedelta(hours=-3))

def check_dia_abierto(db: Session, fecha: date):
    """Verifica si el día ya tiene un cierre de caja."""
    cierre = db.query(CierreCaja).filter(CierreCaja.fecha == fecha).first()
    if cierre:
        raise HTTPException(
            status_code=400, 
            detail=f"El día {fecha} ya está cerrado. No se pueden realizar modificaciones."
        )

# ─── CRUD Pagos ────────────────────────────────────────────────────────────────

def get_pago(db: Session, pago_id: int):
    return db.query(Pago).filter(Pago.id == pago_id).first()


def get_pagos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Pago).order_by(Pago.fecha_pago.desc()).offset(skip).limit(limit).all()


def create_pago(db: Session, pago: PagoCreate):
    turno = db.query(Turno).filter(Turno.id == pago.turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado.")
    if turno.estado == "cancelado":
        raise HTTPException(status_code=400, detail="No se puede registrar un pago en un turno cancelado.")
    pago_existente = db.query(Pago).filter(Pago.turno_id == pago.turno_id).first()
    if pago_existente:
        raise HTTPException(status_code=400, detail="Este turno ya tiene un pago registrado.")
    if pago.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
    db_pago = Pago(
        turno_id=pago.turno_id,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        observaciones=pago.observaciones,
        fecha_pago=datetime.now()
    )
    db.add(db_pago)
    turno.estado = "completado"
    db.commit()
    db.refresh(db_pago)
    return db_pago


def update_pago(db: Session, pago_id: int, pago_update: PagoUpdate):
    db_pago = get_pago(db, pago_id)
    if not db_pago:
        return None
    update_data = pago_update.model_dump(exclude_unset=True)
    if "monto" in update_data and update_data["monto"] <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
    for field, value in update_data.items():
        setattr(db_pago, field, value)
    db.commit()
    db.refresh(db_pago)
    return db_pago


def delete_pago(db: Session, pago_id: int):
    db_pago = get_pago(db, pago_id)
    if not db_pago:
        return None
    turno = db.query(Turno).filter(Turno.id == db_pago.turno_id).first()
    if turno and turno.estado == "completado":
        turno.estado = "confirmado"
    db.delete(db_pago)
    db.commit()
    return db_pago


# ─── CRUD Gastos ───────────────────────────────────────────────────────────────

def get_gasto(db: Session, gasto_id: int):
    return db.query(Gasto).filter(Gasto.id == gasto_id).first()


def get_gastos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Gasto).order_by(Gasto.fecha.desc()).offset(skip).limit(limit).all()


def create_gasto(db: Session, gasto_data):
    fecha = gasto_data.fecha if gasto_data.fecha else datetime.now()
    check_dia_abierto(db, fecha.date())
    db_gasto = Gasto(
        descripcion=gasto_data.descripcion,
        monto=gasto_data.monto,
        categoria=gasto_data.categoria,
        fecha=fecha,
        observaciones=gasto_data.observaciones
    )
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto


def update_gasto(db: Session, gasto_id: int, gasto_update):
    db_gasto = get_gasto(db, gasto_id)
    if not db_gasto:
        return None
    
    check_dia_abierto(db, db_gasto.fecha.date())
    
    for field, value in gasto_update.model_dump(exclude_unset=True).items():
        setattr(db_gasto, field, value)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto


def delete_gasto(db: Session, gasto_id: int):
    db_gasto = get_gasto(db, gasto_id)
    if not db_gasto:
        return None
        
    check_dia_abierto(db, db_gasto.fecha.date())
    
    db.delete(db_gasto)
    db.commit()
    return db_gasto


# ─── Cierres de caja ───────────────────────────────────────────────────────────

def get_cierre_caja(db: Session, fecha: date):
    return db.query(CierreCaja).filter(CierreCaja.fecha == fecha).first()

def get_ultimo_saldo_real(db: Session, fecha: date) -> float:
    """Busca el cierre más reciente anterior a la fecha dada y retorna su efectivo_real."""
    ultimo_cierre = db.query(CierreCaja)\
        .filter(CierreCaja.fecha < fecha)\
        .order_by(CierreCaja.fecha.desc())\
        .first()
    return ultimo_cierre.efectivo_real if ultimo_cierre else 0.0

def create_cierre_caja(db: Session, cierre: CierreCajaCreate):
    try:
        db_cierre = CierreCaja(
            fecha=cierre.fecha,
            saldo_anterior=cierre.saldo_anterior,
            total_efectivo_teorico=cierre.total_efectivo_teorico,
            total_transferencia=cierre.total_transferencia,
            total_debito=cierre.total_debito,
            total_gastos=cierre.total_gastos,
            efectivo_real=cierre.efectivo_real,
            diferencia=cierre.diferencia,
            observaciones=cierre.observaciones
        )
        db.add(db_cierre)
        db.commit()
        db.refresh(db_cierre)
        return db_cierre
    except Exception as e:
        db.rollback()
        print(f"Error guardando cierre: {e}")
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")


# ─── Helpers caja ──────────────────────────────────────────────────────────────

def _calcular_monto_turno(turno: Turno) -> float:
    """Suma precio_unitario * cantidad de cada servicio del turno."""
    if not turno.servicios:
        return 0.0
    return sum(
        (ts.precio_unitario or 0.0) * (ts.cantidad or 1)
        for ts in turno.servicios
    )


def _ingresos_por_empleado(turnos: list) -> list:
    """Agrupa ingresos por empleado a partir de una lista de turnos."""
    emp_dict: dict = {}
    for turno in turnos:
        if not turno.empleado:
            continue
        emp    = turno.empleado
        emp_id = emp.id
        monto  = _calcular_monto_turno(turno)
        if emp_id not in emp_dict:
            emp_dict[emp_id] = {
                "empleado_id":     emp_id,
                "empleado_nombre": emp.nombre,
                "total_ingresos":  0.0,
                "cantidad_turnos": 0,
            }
        emp_dict[emp_id]["total_ingresos"]  += monto
        emp_dict[emp_id]["cantidad_turnos"] += 1
    return list(emp_dict.values())


def _query_turnos(db: Session, *filtros) -> list:
    """Trae turnos completados con todas las relaciones necesarias."""
    return db.query(Turno).options(
        joinedload(Turno.empleado),
        joinedload(Turno.cliente),
        joinedload(Turno.servicios)
    ).filter(
        Turno.estado == "completado",
        *filtros
    ).all()


# ─── Caja diaria ──────────────────────────────────────────────────────────────

def get_caja_diaria(db: Session, fecha: date) -> dict:
    turnos = _query_turnos(db, func.date(Turno.fecha_hora) == fecha)
    gastos = db.query(Gasto).filter(func.date(Gasto.fecha) == fecha).all()
    
    saldo_anterior = get_ultimo_saldo_real(db, fecha)

    total_ingresos = sum(_calcular_monto_turno(t) for t in turnos)
    total_gastos   = sum(g.monto for g in gastos)

    return {
        "fecha":           fecha.isoformat(),
        "saldo_anterior":  round(saldo_anterior, 2),
        "total_ingresos":  round(total_ingresos, 2),
        "total_gastos":    round(total_gastos, 2),
        "ganancia_neta":   round(total_ingresos - total_gastos, 2),
        "cantidad_turnos": len(turnos),
        "ingresos_por_empleado": _ingresos_por_empleado(turnos),
        "detalle_ingresos": [
            {
                "turno_id":    t.id,
                "cliente":     t.cliente.nombre if t.cliente else "—",
                "empleado":    t.empleado.nombre if t.empleado else "—",
                "estado":      t.estado,
                "metodo_pago": t.metodo_pago or "No especificado",
                "fecha_hora":  t.fecha_hora.isoformat(),
                "monto":       round(_calcular_monto_turno(t), 2),
                "servicios":   [ts.servicio.nombre for ts in t.servicios if ts.servicio],
            }
            for t in sorted(turnos, key=lambda x: x.fecha_hora)
        ],
        "detalle_gastos": [
            {
                "id":           g.id,
                "descripcion":  g.descripcion,
                "monto":        g.monto,
                "categoria":    g.categoria,
                "fecha":        g.fecha.isoformat(),
                "observaciones": g.observaciones,
            }
            for g in gastos
        ],
    }


# ─── Caja mensual ─────────────────────────────────────────────────────────────

def get_caja_mensual(db: Session, anio: int, mes: int) -> dict:
    turnos = _query_turnos(
        db,
        extract("year",  Turno.fecha_hora) == anio,
        extract("month", Turno.fecha_hora) == mes,
    )
    gastos = db.query(Gasto).filter(
        extract("year",  Gasto.fecha) == anio,
        extract("month", Gasto.fecha) == mes,
    ).all()

    total_ingresos = sum(_calcular_monto_turno(t) for t in turnos)
    total_gastos   = sum(g.monto for g in gastos)

    ingresos_por_dia: dict = {}
    for turno in turnos:
        dia = turno.fecha_hora.date().isoformat()
        ingresos_por_dia[dia] = ingresos_por_dia.get(dia, 0.0) + _calcular_monto_turno(turno)

    gastos_por_categoria: dict = {}
    for gasto in gastos:
        cat = gasto.categoria
        gastos_por_categoria[cat] = gastos_por_categoria.get(cat, 0.0) + gasto.monto

    return {
        "anio":            anio,
        "mes":             mes,
        "total_ingresos":  round(total_ingresos, 2),
        "total_gastos":    round(total_gastos, 2),
        "ganancia_neta":   round(total_ingresos - total_gastos, 2),
        "cantidad_turnos": len(turnos),
        "ingresos_por_empleado":  _ingresos_por_empleado(turnos),
        "ingresos_por_dia":       {k: round(v, 2) for k, v in sorted(ingresos_por_dia.items())},
        "gastos_por_categoria":   {k: round(v, 2) for k, v in gastos_por_categoria.items()},
    }