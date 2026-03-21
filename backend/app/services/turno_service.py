from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models import Turno, TurnoServicio, Servicio
from app.schemas.turno import TurnoCreate, TurnoUpdate
from datetime import timedelta, date, datetime, time, timezone
from fastapi import HTTPException

# ─── Timezone Argentina ────────────────────────────────────────────────────────
ARG_TZ = timezone(timedelta(hours=-3))

def to_argentina_naive(dt: datetime) -> datetime:
    """Convierte cualquier datetime a hora Argentina sin timezone (naive)."""
    if dt.tzinfo is not None:
        return dt.astimezone(ARG_TZ).replace(tzinfo=None)
    return dt  # ya es naive, se asume que está en hora local Argentina


# ─── CRUD básico ───────────────────────────────────────────────────────────────

def get_turno(db: Session, turno_id: int):
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio)
    ).filter(Turno.id == turno_id).first()


def get_turnos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio)
    ).offset(skip).limit(limit).all()


def create_turno(db: Session, turno: TurnoCreate):
    servicios_db = db.query(Servicio).filter(Servicio.id.in_(turno.servicios_ids)).all()

    # Calcular duración total
    total_duracion = sum(s.duracion_minutos for s in servicios_db)
    if total_duracion == 0:
        total_duracion = turno.duracion

    # Convertir correctamente a hora Argentina (fix bug de las 3 horas)
    nuevo_inicio = to_argentina_naive(turno.fecha_hora)
    nuevo_fin = nuevo_inicio + timedelta(minutes=total_duracion)
    dia_del_turno = nuevo_inicio.date()

    # ── Verificar conflicto de empleado ────────────────────────────────────────
    # FIX: Consultas separadas en lugar de OR para evitar falsos positivos
    turnos_empleado = db.query(Turno).filter(
        Turno.empleado_id == turno.empleado_id,
        Turno.estado != "cancelado",
        func.date(Turno.fecha_hora) == dia_del_turno
    ).all()

    for t in turnos_empleado:
        t_inicio = to_argentina_naive(t.fecha_hora)
        t_fin = t_inicio + timedelta(minutes=t.duracion)
        if nuevo_inicio < t_fin and nuevo_fin > t_inicio:
            raise HTTPException(
                status_code=400,
                detail="El profesional seleccionado ya tiene un turno en ese horario."
            )

    # ── Verificar conflicto de cliente ─────────────────────────────────────────
    turnos_cliente = db.query(Turno).filter(
        Turno.cliente_id == turno.cliente_id,
        Turno.estado != "cancelado",
        func.date(Turno.fecha_hora) == dia_del_turno
    ).all()

    for t in turnos_cliente:
        t_inicio = to_argentina_naive(t.fecha_hora)
        t_fin = t_inicio + timedelta(minutes=t.duracion)
        if nuevo_inicio < t_fin and nuevo_fin > t_inicio:
            raise HTTPException(
                status_code=400,
                detail="El cliente ya tiene otro turno en ese horario."
            )

    # ── Crear turno ────────────────────────────────────────────────────────────
    db_turno = Turno(
        fecha_hora=nuevo_inicio,  # guardado en hora Argentina, sin timezone
        duracion=total_duracion,
        estado=turno.estado,
        observaciones=turno.observaciones,
        cliente_id=turno.cliente_id,
        empleado_id=turno.empleado_id
    )
    db.add(db_turno)
    db.flush()

    for servicio in servicios_db:
        turno_servicio = TurnoServicio(
            turno_id=db_turno.id,
            servicio_id=servicio.id,
            cantidad=1,
            precio_unitario=servicio.precio
        )
        db.add(turno_servicio)

    db.commit()
    db.refresh(db_turno)
    return db_turno


def update_turno(db: Session, turno_id: int, turno_update: TurnoUpdate):
    db_turno = get_turno(db, turno_id)
    if not db_turno:
        return None

    update_data = turno_update.dict(exclude_unset=True)

    # Si se actualiza fecha_hora, también corregir timezone
    if "fecha_hora" in update_data and update_data["fecha_hora"] is not None:
        update_data["fecha_hora"] = to_argentina_naive(update_data["fecha_hora"])

    if "servicios_ids" in update_data:
        db.query(TurnoServicio).filter(TurnoServicio.turno_id == turno_id).delete()
        for servicio_id in update_data["servicios_ids"]:
            servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
            if servicio:
                turno_servicio = TurnoServicio(
                    turno_id=turno_id,
                    servicio_id=servicio_id,
                    cantidad=1,
                    precio_unitario=servicio.precio
                )
                db.add(turno_servicio)
        del update_data["servicios_ids"]

    for field, value in update_data.items():
        setattr(db_turno, field, value)

    db.commit()
    db.refresh(db_turno)
    return db_turno


def delete_turno(db: Session, turno_id: int):
    db_turno = db.query(Turno).filter(Turno.id == turno_id).first()
    if db_turno:
        db.delete(db_turno)
        db.commit()
    return db_turno


# ─── Horarios disponibles ──────────────────────────────────────────────────────

def get_horarios_disponibles(db: Session, empleado_id: int, fecha: date, duracion: int = 30):
    """
    Retorna los slots de 30 min entre 10:00 y 20:00 para un empleado en una fecha.
    Cada slot indica si está disponible u ocupado.
    """
    HORA_INICIO = time(10, 0)
    HORA_FIN    = time(20, 0)
    INTERVALO   = timedelta(minutes=30)

    # Generar todos los slots del día
    slots = []
    slot_actual  = datetime.combine(fecha, HORA_INICIO)
    slot_fin_dia = datetime.combine(fecha, HORA_FIN)

    while slot_actual + timedelta(minutes=duracion) <= slot_fin_dia:
        slots.append(slot_actual)
        slot_actual += INTERVALO

    # Traer turnos del empleado ese día (excluyendo cancelados)
    turnos_del_dia = db.query(Turno).filter(
        Turno.empleado_id == empleado_id,
        Turno.estado != "cancelado",
        func.date(Turno.fecha_hora) == fecha
    ).all()

    # Marcar cada slot como disponible u ocupado
    resultado = []
    for slot in slots:
        slot_fin = slot + timedelta(minutes=duracion)
        ocupado = False

        for t in turnos_del_dia:
            t_inicio = to_argentina_naive(t.fecha_hora)
            t_fin    = t_inicio + timedelta(minutes=t.duracion)
            if slot < t_fin and slot_fin > t_inicio:
                ocupado = True
                break

        resultado.append({
            "hora":        slot.strftime("%H:%M"),
            "disponible":  not ocupado,
            "fecha_hora":  slot.isoformat()
        })

    return resultado