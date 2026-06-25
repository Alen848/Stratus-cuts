from sqlalchemy import func, extract, and_
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date, timezone, timedelta

ARG_TZ = timezone(timedelta(hours=-3))
def now_arg(): return datetime.now(ARG_TZ).replace(tzinfo=None)
from fastapi import HTTPException

from app.models.pago import Pago
from app.models.turno import Turno
from app.models.turno_servicio import TurnoServicio
from app.models.gasto import Gasto
from app.models.cierre_caja import CierreCaja
from app.schemas.pago import PagoCreate, PagoUpdate
from app.schemas.cierre_caja import CierreCajaCreate

ARG_TZ = timezone(timedelta(hours=-3))


def check_dia_abierto(db: Session, salon_id: int, fecha: date):
    """Verifica si el día ya tiene un cierre de caja para este salón."""
    cierre = db.query(CierreCaja).filter(
        CierreCaja.salon_id == salon_id,
        CierreCaja.fecha == fecha,
    ).first()
    if cierre:
        raise HTTPException(
            status_code=400,
            detail=f"El día {fecha} ya está cerrado. No se pueden realizar modificaciones."
        )


# ─── CRUD Pagos ────────────────────────────────────────────────────────────────

def get_pago(db: Session, pago_id: int, salon_id: int):
    return db.query(Pago).join(Turno).filter(
        Pago.id == pago_id,
        Turno.salon_id == salon_id,
    ).first()


def get_pagos(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Pago).join(Turno).filter(
        Turno.salon_id == salon_id
    ).order_by(Pago.fecha_pago.desc()).offset(skip).limit(limit).all()


# ─── Saldo de un turno ──────────────────────────────────────────────────────

def _total_turno(turno: Turno) -> float:
    """Total del turno: snapshot monto_total (reservas con seña) o suma de servicios."""
    if getattr(turno, "monto_total", None) is not None:
        return float(turno.monto_total)
    return _calcular_monto_turno(turno)


def estado_pago_turno(db: Session, turno: Turno) -> dict:
    """Devuelve total, pagado (suma de pagos aprobados) y saldo del turno."""
    pagado = db.query(func.coalesce(func.sum(Pago.monto), 0.0)).filter(
        Pago.turno_id == turno.id,
        Pago.estado == "aprobada",
    ).scalar() or 0.0
    total = _total_turno(turno)
    pagado = float(pagado)
    return {"total": round(total, 2), "pagado": round(pagado, 2), "saldo": round(total - pagado, 2)}


def registrar_cobro(db: Session, salon_id: int, turno_id: int, lineas: list, observaciones: str = None) -> dict:
    """
    Registra el cobro del saldo de un turno. `lineas` = [{metodo_pago, monto}].
    Permite varios métodos (split). El pago entra a la caja del día actual
    (fecha_pago=hoy). Completa el turno cuando se cubre el total.
    """
    turno = db.query(Turno).options(joinedload(Turno.servicios)).filter(
        Turno.id == turno_id,
        Turno.salon_id == salon_id,
    ).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado.")
    if turno.estado in ("cancelado", "expirado"):
        raise HTTPException(status_code=400, detail="No se puede cobrar un turno cancelado o expirado.")

    # El cobro entra a la caja de HOY
    hoy = now_arg().date()
    check_dia_abierto(db, salon_id, hoy)

    est = estado_pago_turno(db, turno)
    if est["saldo"] <= 0.01:
        raise HTTPException(status_code=400, detail="Este turno ya está pagado por completo.")

    lineas = [l for l in (lineas or []) if (l.get("monto") or 0) > 0]
    if not lineas:
        raise HTTPException(status_code=400, detail="Ingresá al menos un monto mayor a 0.")
    total_cobro = round(sum(float(l["monto"]) for l in lineas), 2)
    if total_cobro - est["saldo"] > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"El cobro (${total_cobro}) supera el saldo pendiente (${est['saldo']}).",
        )

    for l in lineas:
        db.add(Pago(
            turno_id=turno.id,
            monto=round(float(l["monto"]), 2),
            metodo_pago=l.get("metodo_pago"),
            tipo="saldo",
            estado="aprobada",
            fecha_pago=now_arg(),
            observaciones=observaciones,
        ))

    metodo = lineas[0].get("metodo_pago") if len(lineas) == 1 else "varios"
    turno.metodo_pago = metodo
    if est["pagado"] + total_cobro + 0.01 >= est["total"] and est["total"] > 0:
        turno.estado = "completado"

    db.commit()
    db.refresh(turno)
    return {**estado_pago_turno(db, turno), "estado": turno.estado}


def create_pago(db: Session, pago: PagoCreate, salon_id: int):
    """Compat: registra un cobro de un solo método. Reusa registrar_cobro."""
    registrar_cobro(
        db, salon_id, pago.turno_id,
        [{"metodo_pago": pago.metodo_pago, "monto": pago.monto}],
        pago.observaciones,
    )
    return db.query(Pago).filter(Pago.turno_id == pago.turno_id).order_by(Pago.id.desc()).first()


def update_pago(db: Session, pago_id: int, pago_update: PagoUpdate, salon_id: int):
    db_pago = get_pago(db, pago_id, salon_id)
    if not db_pago:
        return None
    turno = db.query(Turno).filter(Turno.id == db_pago.turno_id).first()
    if turno:
        check_dia_abierto(db, salon_id, turno.fecha_hora.date())
    update_data = pago_update.model_dump(exclude_unset=True)
    if "monto" in update_data and update_data["monto"] <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
    if "metodo_pago" in update_data and turno:
        turno.metodo_pago = update_data["metodo_pago"]
    for field, value in update_data.items():
        setattr(db_pago, field, value)
    db.commit()
    db.refresh(db_pago)
    return db_pago


def delete_pago(db: Session, pago_id: int, salon_id: int):
    db_pago = get_pago(db, pago_id, salon_id)
    if not db_pago:
        return None
    turno = db.query(Turno).filter(Turno.id == db_pago.turno_id).first()
    if turno:
        check_dia_abierto(db, salon_id, turno.fecha_hora.date())
        if turno.estado == "completado":
            turno.estado = "confirmado"
    db.delete(db_pago)
    db.commit()
    return db_pago


# ─── CRUD Gastos ───────────────────────────────────────────────────────────────

def get_gasto(db: Session, gasto_id: int, salon_id: int):
    return db.query(Gasto).filter(
        Gasto.id == gasto_id,
        Gasto.salon_id == salon_id,
    ).first()


def get_gastos(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Gasto).filter(
        Gasto.salon_id == salon_id
    ).order_by(Gasto.fecha.desc()).offset(skip).limit(limit).all()


def create_gasto(db: Session, gasto_data, salon_id: int):
    fecha = gasto_data.fecha if gasto_data.fecha else now_arg()
    check_dia_abierto(db, salon_id, fecha.date())
    db_gasto = Gasto(
        salon_id=salon_id,
        descripcion=gasto_data.descripcion,
        monto=gasto_data.monto,
        categoria=gasto_data.categoria,
        fecha=fecha,
        observaciones=gasto_data.observaciones,
    )
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto


def update_gasto(db: Session, gasto_id: int, gasto_update, salon_id: int):
    db_gasto = get_gasto(db, gasto_id, salon_id)
    if not db_gasto:
        return None
    check_dia_abierto(db, salon_id, db_gasto.fecha.date())
    for field, value in gasto_update.model_dump(exclude_unset=True).items():
        setattr(db_gasto, field, value)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto


def delete_gasto(db: Session, gasto_id: int, salon_id: int):
    db_gasto = get_gasto(db, gasto_id, salon_id)
    if not db_gasto:
        return None
    check_dia_abierto(db, salon_id, db_gasto.fecha.date())
    db.delete(db_gasto)
    db.commit()
    return db_gasto


# ─── Cierres de caja ───────────────────────────────────────────────────────────

def get_cierre_caja(db: Session, salon_id: int, fecha: date):
    return db.query(CierreCaja).filter(
        CierreCaja.salon_id == salon_id,
        CierreCaja.fecha == fecha,
    ).first()


def get_historial_cierres(db: Session, salon_id: int, anio: int, mes: int):
    return db.query(CierreCaja).filter(
        CierreCaja.salon_id == salon_id,
        extract('year',  CierreCaja.fecha) == anio,
        extract('month', CierreCaja.fecha) == mes,
    ).order_by(CierreCaja.fecha.desc()).all()


def get_ultimo_saldo_real(db: Session, salon_id: int, fecha: date) -> float:
    ultimo_cierre = db.query(CierreCaja).filter(
        CierreCaja.salon_id == salon_id,
        CierreCaja.fecha < fecha,
    ).order_by(CierreCaja.fecha.desc()).first()
    if not ultimo_cierre:
        return 0.0
    return ultimo_cierre.fondo_caja or 0.0


def create_cierre_caja(db: Session, cierre: CierreCajaCreate, salon_id: int):
    try:
        db_cierre = CierreCaja(
            salon_id=salon_id,
            fecha=cierre.fecha,
            saldo_anterior=cierre.saldo_anterior,
            total_efectivo_teorico=cierre.total_efectivo_teorico,
            total_transferencia=cierre.total_transferencia,
            total_debito=cierre.total_debito,
            total_gastos=cierre.total_gastos,
            efectivo_real=cierre.efectivo_real,
            transferencia_real=cierre.transferencia_real,
            tarjeta_real=cierre.tarjeta_real,
            fondo_caja=cierre.fondo_caja,
            diferencia=cierre.diferencia,
            observaciones=cierre.observaciones,
        )
        db.add(db_cierre)
        db.commit()
        db.refresh(db_cierre)
        return db_cierre
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")


# ─── Helpers caja ──────────────────────────────────────────────────────────────

def _calcular_monto_turno(turno: Turno) -> float:
    if not turno.servicios:
        return 0.0
    return sum(
        (ts.precio_unitario or 0.0) * (ts.cantidad or 1)
        for ts in turno.servicios
    )


def _ingresos_por_empleado_pagos(pagos: list) -> list:
    """Ingresos por empleado a partir de los pagos aprobados (plata cobrada)."""
    emp_dict: dict = {}
    for p in pagos:
        turno = p.turno
        if not turno or not turno.empleado:
            continue
        emp = turno.empleado
        d = emp_dict.setdefault(emp.id, {
            "empleado_id":         emp.id,
            "empleado_nombre":     emp.nombre,
            "total_ingresos":      0.0,
            "comision_porcentaje": emp.comision_porcentaje or 0.0,
            "_turnos":             set(),
        })
        d["total_ingresos"] += p.monto
        d["_turnos"].add(turno.id)
    salida = []
    for d in emp_dict.values():
        d["cantidad_turnos"] = len(d.pop("_turnos"))
        d["total_ingresos"]  = round(d["total_ingresos"], 2)
        salida.append(d)
    return salida


def _query_pagos(db: Session, salon_id: int, *filtros) -> list:
    """Pagos APROBADOS del salón (excluye pendientes y anulados)."""
    return db.query(Pago).join(Turno).options(
        joinedload(Pago.turno).joinedload(Turno.empleado),
        joinedload(Pago.turno).joinedload(Turno.cliente),
        joinedload(Pago.turno).joinedload(Turno.servicios),
    ).filter(
        Turno.salon_id == salon_id,
        Pago.estado == "aprobada",
        *filtros,
    ).all()


# ─── Caja diaria (por pago) ───────────────────────────────────────────────────

def get_caja_diaria(db: Session, salon_id: int, fecha: date) -> dict:
    # Ingresos = pagos aprobados imputados por fecha_pago (día que entró la plata)
    pagos = _query_pagos(db, salon_id, func.date(Pago.fecha_pago) == fecha)
    gastos = db.query(Gasto).filter(
        Gasto.salon_id == salon_id,
        func.date(Gasto.fecha) == fecha,
    ).all()

    saldo_anterior = get_ultimo_saldo_real(db, salon_id, fecha)
    total_ingresos = sum(p.monto for p in pagos)
    total_gastos   = sum(g.monto for g in gastos)

    por_metodo: dict = {}
    total_senas = 0.0
    for p in pagos:
        m = p.metodo_pago or "No especificado"
        por_metodo[m] = por_metodo.get(m, 0.0) + p.monto
        if (p.tipo or "") == "sena":
            total_senas += p.monto

    return {
        "fecha":           fecha.isoformat(),
        "saldo_anterior":  round(saldo_anterior, 2),
        "total_ingresos":  round(total_ingresos, 2),
        "total_gastos":    round(total_gastos, 2),
        "ganancia_neta":   round(total_ingresos - total_gastos, 2),
        "cantidad_turnos": len({p.turno_id for p in pagos}),
        "total_senas":     round(total_senas, 2),
        "por_metodo":      [{"metodo": k, "monto": round(v, 2)} for k, v in sorted(por_metodo.items())],
        "ingresos_por_empleado": _ingresos_por_empleado_pagos(pagos),
        "detalle_ingresos": [
            {
                "pago_id":     p.id,
                "turno_id":    p.turno_id,
                "cliente":     p.turno.cliente.nombre if p.turno and p.turno.cliente else "—",
                "empleado":    p.turno.empleado.nombre if p.turno and p.turno.empleado else "—",
                "tipo":        p.tipo or "saldo",
                "es_sena":     (p.tipo or "") == "sena",
                "metodo_pago": p.metodo_pago or "No especificado",
                "fecha_pago":  p.fecha_pago.isoformat() if p.fecha_pago else None,
                "monto":       round(p.monto, 2),
                "servicios":   [ts.servicio.nombre for ts in p.turno.servicios if ts.servicio] if p.turno else [],
            }
            for p in sorted(pagos, key=lambda x: x.fecha_pago or now_arg())
        ],
        "detalle_gastos": [
            {
                "id":            g.id,
                "descripcion":   g.descripcion,
                "monto":         g.monto,
                "categoria":     g.categoria,
                "fecha":         g.fecha.isoformat(),
                "observaciones": g.observaciones,
            }
            for g in gastos
        ],
    }


# ─── Caja mensual (por pago) ──────────────────────────────────────────────────

def get_caja_mensual(db: Session, salon_id: int, anio: int, mes: int) -> dict:
    pagos = _query_pagos(
        db, salon_id,
        extract("year",  Pago.fecha_pago) == anio,
        extract("month", Pago.fecha_pago) == mes,
    )
    gastos = db.query(Gasto).filter(
        Gasto.salon_id == salon_id,
        extract("year",  Gasto.fecha) == anio,
        extract("month", Gasto.fecha) == mes,
    ).all()

    total_ingresos = sum(p.monto for p in pagos)
    total_gastos   = sum(g.monto for g in gastos)

    ingresos_por_dia: dict = {}
    for p in pagos:
        if not p.fecha_pago:
            continue
        dia = p.fecha_pago.date().isoformat()
        ingresos_por_dia[dia] = ingresos_por_dia.get(dia, 0.0) + p.monto

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
        "cantidad_turnos": len({p.turno_id for p in pagos}),
        "ingresos_por_empleado":  _ingresos_por_empleado_pagos(pagos),
        "ingresos_por_dia":       {k: round(v, 2) for k, v in sorted(ingresos_por_dia.items())},
        "gastos_por_categoria":   {k: round(v, 2) for k, v in gastos_por_categoria.items()},
    }
