from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models import Turno, TurnoServicio, Servicio, HorarioEmpleado
from app.schemas.turno import TurnoCreate, TurnoUpdate
from datetime import timedelta, date, datetime, time, timezone
from fastapi import HTTPException
from app.services.pago_service import check_dia_abierto

# ─── Timezone Argentina ────────────────────────────────────────────────────────
ARG_TZ = timezone(timedelta(hours=-3))


def to_argentina_naive(dt: datetime) -> datetime:
    """Convierte cualquier datetime a hora Argentina sin timezone (naive)."""
    if dt.tzinfo is not None:
        return dt.astimezone(ARG_TZ).replace(tzinfo=None)
    return dt


# ─── CRUD básico ───────────────────────────────────────────────────────────────

def get_turno(db: Session, turno_id: int, salon_id: int):
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio)
    ).filter(Turno.id == turno_id, Turno.salon_id == salon_id).first()


def get_turnos(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio)
    ).filter(Turno.salon_id == salon_id).offset(skip).limit(limit).all()


def create_turno(db: Session, turno: TurnoCreate, salon_id: int):
    # 1. Verificar si el día ya está cerrado
    nuevo_inicio = to_argentina_naive(turno.fecha_hora)
    check_dia_abierto(db, salon_id, nuevo_inicio.date())

    # 2. Obtener servicios y calcular duración
    servicios_db = db.query(Servicio).filter(
        Servicio.id.in_(turno.servicios_ids),
        Servicio.salon_id == salon_id,
    ).all()

    total_duracion = sum(s.duracion_minutos for s in servicios_db)
    if total_duracion == 0:
        total_duracion = turno.duracion if turno.duracion > 0 else 30

    nuevo_fin    = nuevo_inicio + timedelta(minutes=total_duracion)
    dia_del_turno = nuevo_inicio.date()

    # 3. Verificar conflictos de empleado
    turnos_empleado = db.query(Turno).filter(
        Turno.salon_id == salon_id,
        Turno.empleado_id == turno.empleado_id,
        Turno.estado != "cancelado",
        func.date(Turno.fecha_hora) == dia_del_turno,
    ).all()

    for t in turnos_empleado:
        t_inicio = to_argentina_naive(t.fecha_hora)
        t_fin = t_inicio + timedelta(minutes=t.duracion)
        if nuevo_inicio < t_fin and nuevo_fin > t_inicio:
            raise HTTPException(status_code=400, detail="El profesional ya tiene un turno en ese horario.")

    # Verificar conflictos de cliente
    if turno.cliente_id is not None:
        turnos_cliente = db.query(Turno).filter(
            Turno.salon_id == salon_id,
            Turno.cliente_id == turno.cliente_id,
            Turno.estado != "cancelado",
            func.date(Turno.fecha_hora) == dia_del_turno,
        ).all()
        for t in turnos_cliente:
            t_inicio = to_argentina_naive(t.fecha_hora)
            t_fin = t_inicio + timedelta(minutes=t.duracion)
            if nuevo_inicio < t_fin and nuevo_fin > t_inicio:
                raise HTTPException(status_code=400, detail="El cliente ya tiene otro turno en ese horario.")

    # 4. Crear turno
    db_turno = Turno(
        salon_id=salon_id,
        fecha_hora=nuevo_inicio,
        duracion=total_duracion,
        estado=turno.estado,
        metodo_pago=turno.metodo_pago,
        observaciones=turno.observaciones,
        cliente_id=turno.cliente_id,
        empleado_id=turno.empleado_id,
    )
    db.add(db_turno)
    db.flush()

    for servicio in servicios_db:
        db.add(TurnoServicio(
            turno_id=db_turno.id,
            servicio_id=servicio.id,
            cantidad=1,
            precio_unitario=servicio.precio,
        ))

    db.commit()
    db.refresh(db_turno)
    return db_turno


def update_turno(db: Session, turno_id: int, turno_update: TurnoUpdate, salon_id: int):
    db_turno = get_turno(db, turno_id, salon_id)
    if not db_turno:
        return None

    check_dia_abierto(db, salon_id, db_turno.fecha_hora.date())
    update_data = turno_update.dict(exclude_unset=True)

    if "fecha_hora" in update_data and update_data["fecha_hora"]:
        nueva_fecha = to_argentina_naive(update_data["fecha_hora"])
        check_dia_abierto(db, salon_id, nueva_fecha.date())
        update_data["fecha_hora"] = nueva_fecha

    if "servicios_ids" in update_data:
        db.query(TurnoServicio).filter(TurnoServicio.turno_id == turno_id).delete()
        nueva_duracion = 0
        for s_id in update_data["servicios_ids"]:
            srv = db.query(Servicio).filter(
                Servicio.id == s_id,
                Servicio.salon_id == salon_id,
            ).first()
            if srv:
                db.add(TurnoServicio(turno_id=turno_id, servicio_id=s_id, cantidad=1, precio_unitario=srv.precio))
                nueva_duracion += srv.duracion_minutos
        if nueva_duracion > 0:
            db_turno.duracion = nueva_duracion
        del update_data["servicios_ids"]

    for field, value in update_data.items():
        setattr(db_turno, field, value)

    db.commit()
    db.refresh(db_turno)
    return db_turno


def delete_turno(db: Session, turno_id: int, salon_id: int):
    db_turno = db.query(Turno).filter(
        Turno.id == turno_id,
        Turno.salon_id == salon_id,
    ).first()
    if db_turno:
        check_dia_abierto(db, salon_id, db_turno.fecha_hora.date())
        db.delete(db_turno)
        db.commit()
    return db_turno


# ─── Disponibilidad Semanal ──────────────────────────────────────────────────

def get_horarios_semanales(db: Session, empleado_id: int, fecha_inicio: date, salon_id: int):
    resultado = {}
    horarios_laborales = db.query(HorarioEmpleado).filter(
        HorarioEmpleado.empleado_id == empleado_id,
    ).all()
    config_dias = {h.dia_semana: h for h in horarios_laborales}

    for i in range(7):
        fecha_actual = fecha_inicio + timedelta(days=i)
        dia_semana   = fecha_actual.weekday()

        if dia_semana not in config_dias:
            resultado[fecha_actual.isoformat()] = []
            continue

        config = config_dias[dia_semana]
        slots  = []
        actual = datetime.combine(fecha_actual, config.hora_inicio)
        fin    = datetime.combine(fecha_actual, config.hora_fin)

        turnos_dia = db.query(Turno).filter(
            Turno.salon_id == salon_id,
            Turno.empleado_id == empleado_id,
            Turno.estado != "cancelado",
            func.date(Turno.fecha_hora) == fecha_actual,
        ).all()

        while actual + timedelta(minutes=30) <= fin:
            slot_fin = actual + timedelta(minutes=30)
            turno_existente = None
            for t in turnos_dia:
                t_inicio = to_argentina_naive(t.fecha_hora)
                t_fin    = t_inicio + timedelta(minutes=t.duracion)
                if actual < t_fin and slot_fin > t_inicio:
                    turno_existente = t
                    break

            slots.append({
                "hora":        actual.strftime("%H:%M"),
                "disponible":  turno_existente is None,
                "fecha_hora":  actual.isoformat(),
                "cliente":     f"{turno_existente.cliente.nombre} {turno_existente.cliente.apellido}" if turno_existente and turno_existente.cliente else None,
                "profesional": turno_existente.empleado.nombre if turno_existente else None,
                "servicio":    ", ".join([ts.servicio.nombre for ts in turno_existente.servicios]) if turno_existente else None,
            })
            actual += timedelta(minutes=30)
        resultado[fecha_actual.isoformat()] = slots
    return resultado
