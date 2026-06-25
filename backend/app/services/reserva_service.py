"""
Orquesta la reserva pública con seña de Mercado Pago.

Decide si una reserva requiere pago de seña, crea el turno (que mantiene el
horario reservado mientras se paga) y la preferencia de pago, y confirma el
pago cuando llega el webhook. Mantiene la Caja en sincronía con MP.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.servicio import Servicio
from app.models.turno import Turno
from app.models.pago import Pago
from app.services import turno_service, config_salon_service, mercadopago_service

ARG_TZ = timezone(timedelta(hours=-3))
HOLD_MINUTOS = 10  # tiempo que se mantiene el horario reservado mientras se paga


def _ahora() -> datetime:
    return datetime.now(ARG_TZ).replace(tzinfo=None)


def calcular_total(db: Session, servicios_ids, salon_id: int) -> float:
    servicios = db.query(Servicio).filter(
        Servicio.id.in_(servicios_ids),
        Servicio.salon_id == salon_id,
    ).all()
    return float(sum(s.precio for s in servicios))


def calcular_sena(total: float, porcentaje: int) -> float:
    return round(total * (porcentaje or 0) / 100, 2)


def crear_reserva(db: Session, data, salon, config, webhook_url: str = None) -> dict:
    """
    data: ReservaPublicaCreate. config: ConfigSalon (puede ser default sin guardar).
    Devuelve dict con: requiere_pago, turno, e (si aplica) init_point + montos.
    """
    total = calcular_total(db, data.servicios_ids, salon.id)

    mp_activo   = bool(getattr(config, "mp_activo", False))
    porcentaje  = int(getattr(config, "sena_porcentaje", 0) or 0)
    obligatoria = bool(getattr(config, "sena_obligatoria", False))
    token       = config_salon_service.get_mp_access_token(db, salon.id)
    quiere_pagar = bool(getattr(data, "pagar_sena", False))

    sena = calcular_sena(total, porcentaje)
    requiere_pago = bool(mp_activo and token and sena > 0 and (obligatoria or quiere_pagar))

    # ── Camino sin pago: turno normal (comportamiento de siempre) ────────────
    if not requiere_pago:
        turno = turno_service.create_turno(db, data, salon_id=salon.id)
        turno.monto_total     = total
        turno.monto_sena      = 0
        turno.saldo_pendiente = total
        turno.sena_estado     = "no_aplica"
        db.commit()
        db.refresh(turno)
        return {"requiere_pago": False, "turno": turno}

    # ── Camino con seña: crear turno en pendiente_pago + preferencia MP ──────
    data.estado = "pendiente_pago"
    turno = turno_service.create_turno(db, data, salon_id=salon.id)
    turno.monto_total     = total
    turno.monto_sena      = sena
    turno.saldo_pendiente = round(total - sena, 2)
    turno.sena_estado     = "pendiente"
    turno.expira_en       = _ahora() + timedelta(minutes=HOLD_MINUTOS)
    db.commit()
    db.refresh(turno)

    try:
        ret = (data.return_url or getattr(config, "url_reserva", None) or "").strip() or None
        pref = mercadopago_service.crear_preferencia(
            token,
            titulo=f"Seña reserva - {salon.nombre}",
            monto=sena,
            external_reference=str(turno.id),
            notification_url=webhook_url,
            success_url=ret,
            failure_url=ret,
            pending_url=ret,
        )
    except Exception as e:
        # Si no se pudo iniciar el pago, liberar el horario y avisar
        turno.estado = "expirado"
        turno.sena_estado = "anulada"
        db.commit()
        raise RuntimeError(f"No se pudo iniciar el pago con Mercado Pago: {e}")

    turno.mp_preference_id = pref["id"]
    db.commit()
    db.refresh(turno)

    return {
        "requiere_pago": True,
        "turno": turno,
        "init_point": pref["init_point"],
        "monto_total": total,
        "monto_sena": sena,
        "saldo_pendiente": turno.saldo_pendiente,
    }


def confirmar_pago(db: Session, salon_id: int, payment_id: str, access_token: str) -> dict:
    """
    Procesa la notificación de un pago (webhook). Fuente de verdad: la API de MP.
    Idempotente: el mismo payment_id no genera dos veces el ingreso en Caja.
    """
    pago_mp = mercadopago_service.obtener_pago(access_token, payment_id)
    if not pago_mp:
        return {"ok": False, "motivo": "pago no encontrado en MP"}

    status = pago_mp.get("status")
    ext = pago_mp.get("external_reference")
    if not ext:
        return {"ok": False, "motivo": "pago sin external_reference"}

    turno = db.query(Turno).filter(
        Turno.id == int(ext),
        Turno.salon_id == salon_id,
    ).first()
    if not turno:
        return {"ok": False, "motivo": "turno no encontrado"}

    # Idempotencia: ya estaba confirmado por este mismo pago
    if turno.sena_estado == "pagada" and turno.mp_payment_id == str(payment_id):
        return {"ok": True, "estado": turno.estado, "idempotente": True}

    if status == "approved":
        turno.estado      = "confirmado"
        turno.sena_estado = "pagada"
        turno.mp_payment_id = str(payment_id)
        turno.expira_en   = None
        # Registrar el ingreso de la seña en Caja (idempotente por mp_payment_id).
        # fecha_pago = ahora (server_default) => se imputa al día que se pagó.
        ya_registrado = db.query(Pago).filter(Pago.mp_payment_id == str(payment_id)).first()
        if not ya_registrado:
            db.add(Pago(
                turno_id=turno.id,
                monto=turno.monto_sena or 0,
                metodo_pago="Mercado Pago",
                tipo="sena",
                estado="aprobada",
                mp_payment_id=str(payment_id),
                observaciones="Seña de reserva online",
                fecha_pago=_ahora(),  # hora Argentina, para imputar a la caja del día correcto
            ))
        db.commit()
        return {"ok": True, "estado": "confirmado"}

    # Rechazado / cancelado: liberar el horario si seguía esperando pago
    if turno.estado == "pendiente_pago":
        turno.estado = "expirado"
        turno.sena_estado = "anulada"
        db.commit()
    return {"ok": True, "estado": turno.estado, "pago_status": status}
