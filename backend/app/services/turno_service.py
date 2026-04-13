from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models import Turno, TurnoServicio, Servicio, HorarioEmpleado
from app.services.horario_salon_service import get_horarios as get_salon_horarios
from app.schemas.turno import TurnoCreate, TurnoUpdate
from datetime import timedelta, date, datetime, timezone
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


def _check_horario_salon(db: Session, salon_id: int, fecha_hora: datetime):
    """Valida que el turno esté dentro del horario del salón configurado."""
    dia_semana = fecha_hora.weekday()  # 0=Lunes...6=Domingo
    salon_horarios = {h.dia_semana: h for h in get_salon_horarios(db, salon_id)}
    horario = salon_horarios.get(dia_semana)
    if horario is None:
        return  # No debería ocurrir con get_salon_horarios, pero por seguridad
    if not horario.activo:
        raise HTTPException(status_code=400, detail="El salón está cerrado ese día.")
    hora_turno = fecha_hora.time()
    if hora_turno < horario.hora_apertura or hora_turno >= horario.hora_cierre:
        raise HTTPException(
            status_code=400,
            detail=f"El turno cae fuera del horario del salón ({horario.hora_apertura.strftime('%H:%M')} – {horario.hora_cierre.strftime('%H:%M')}).",
        )


def create_turno(db: Session, turno: TurnoCreate, salon_id: int):
    # 1. Verificar si el día ya está cerrado
    nuevo_inicio = to_argentina_naive(turno.fecha_hora)
    check_dia_abierto(db, salon_id, nuevo_inicio.date())
    _check_horario_salon(db, salon_id, nuevo_inicio)

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

    update_data = turno_update.model_dump(exclude_unset=True)

    # Si el día está cerrado, solo permitimos cambiar el estado a 'cancelado'
    # y nada más. Si se intenta cambiar otra cosa, check_dia_abierto lanzará error.
    solo_cancelando = len(update_data) == 1 and update_data.get("estado") == "cancelado"
    
    if not solo_cancelando:
        check_dia_abierto(db, salon_id, db_turno.fecha_hora.date())

    if "fecha_hora" in update_data and update_data["fecha_hora"]:
        nueva_fecha = to_argentina_naive(update_data["fecha_hora"])
        check_dia_abierto(db, salon_id, nueva_fecha.date())
        _check_horario_salon(db, salon_id, nueva_fecha)
        update_data["fecha_hora"] = nueva_fecha

    # Verificar conflictos de horario si cambia fecha_hora o empleado_id
    if "fecha_hora" in update_data or "empleado_id" in update_data:
        fecha_final    = update_data.get("fecha_hora", to_argentina_naive(db_turno.fecha_hora))
        empleado_final = update_data.get("empleado_id", db_turno.empleado_id)
        duracion_final = db_turno.duracion
        fin_final      = fecha_final + timedelta(minutes=duracion_final)
        dia_final      = fecha_final.date()

        turnos_empleado = db.query(Turno).filter(
            Turno.salon_id == salon_id,
            Turno.empleado_id == empleado_final,
            Turno.estado != "cancelado",
            Turno.id != turno_id,
            func.date(Turno.fecha_hora) == dia_final,
        ).all()

        for t in turnos_empleado:
            t_inicio = to_argentina_naive(t.fecha_hora)
            t_fin    = t_inicio + timedelta(minutes=t.duracion)
            if fecha_final < t_fin and fin_final > t_inicio:
                raise HTTPException(
                    status_code=400,
                    detail="El profesional ya tiene un turno en ese horario.",
                )

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
    from app.models.pago import Pago

    db_turno = db.query(Turno).filter(
        Turno.id == turno_id,
        Turno.salon_id == salon_id,
    ).first()
    if db_turno:
        # Eliminar registros hijos antes de borrar el turno
        db.query(TurnoServicio).filter(TurnoServicio.turno_id == turno_id).delete(
            synchronize_session=False
        )
        db.query(Pago).filter(Pago.turno_id == turno_id).delete(
            synchronize_session=False
        )
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

    # Horarios del salón (con defaults si no hay configuración guardada)
    salon_dias = {h.dia_semana: h for h in get_salon_horarios(db, salon_id)}

    for i in range(7):
        fecha_actual = fecha_inicio + timedelta(days=i)
        dia_semana   = fecha_actual.weekday()

        # Si el salón tiene configurado ese día como cerrado → sin slots
        salon_dia = salon_dias.get(dia_semana)
        if salon_dia is not None and not salon_dia.activo:
            resultado[fecha_actual.isoformat()] = []
            continue

        # Determinar el rango horario efectivo:
        # - Si el empleado tiene config propia → intersectar con salón
        # - Si no tiene config → usar el horario del salón directamente
        if dia_semana in config_dias:
            config = config_dias[dia_semana]
            hora_inicio_efectiva = config.hora_inicio
            hora_fin_efectiva    = config.hora_fin
            if salon_dia is not None:
                hora_inicio_efectiva = max(hora_inicio_efectiva, salon_dia.hora_apertura)
                hora_fin_efectiva    = min(hora_fin_efectiva,    salon_dia.hora_cierre)
        elif salon_dia is not None:
            # Sin horario propio → heredar del salón
            hora_inicio_efectiva = salon_dia.hora_apertura
            hora_fin_efectiva    = salon_dia.hora_cierre
        else:
            resultado[fecha_actual.isoformat()] = []
            continue

        if hora_inicio_efectiva >= hora_fin_efectiva:
            resultado[fecha_actual.isoformat()] = []
            continue

        slots  = []
        actual = datetime.combine(fecha_actual, hora_inicio_efectiva)
        fin    = datetime.combine(fecha_actual, hora_fin_efectiva)

        turnos_dia = db.query(Turno).filter(
            Turno.salon_id == salon_id,
            Turno.empleado_id == empleado_id,
            Turno.estado != "cancelado",
            func.date(Turno.fecha_hora) == fecha_actual,
        ).all()

        INTERVALO = 15
        while actual + timedelta(minutes=INTERVALO) <= fin:
            slot_fin = actual + timedelta(minutes=INTERVALO)
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
            actual += timedelta(minutes=INTERVALO)
        resultado[fecha_actual.isoformat()] = slots
    return resultado


# ─── Recordatorios WhatsApp ──────────────────────────────────────────────────

def get_recordatorios(
    db: Session,
    salon_id: int,
    horas_pre: int = 24,
    dias_retorno_desde: int = 20,
    dias_retorno_hasta: int = 25,
) -> dict:
    """
    Retorna dos listas:
    - proximos: turnos pendientes/confirmados dentro de las próximas `horas_pre` horas
                con reminder_pre_sent = False
    - retorno:  turnos completados entre `dias_retorno_desde` y `dias_retorno_hasta` días atrás
                con reminder_retorno_sent = False
    """
    # Usar hora Argentina naive para comparar con los turnos guardados como naive ARG
    ahora = datetime.now(ARG_TZ).replace(tzinfo=None)

    # ── Próximos ──────────────────────────────────────────────────────────────
    limite = ahora + timedelta(hours=horas_pre)
    proximos_db = db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio),
    ).filter(
        Turno.salon_id == salon_id,
        Turno.estado.in_(["pendiente", "confirmado"]),
        Turno.fecha_hora >= ahora,
        Turno.fecha_hora <= limite,
        Turno.reminder_pre_sent == False,
    ).order_by(Turno.fecha_hora).all()

    # ── Retorno ───────────────────────────────────────────────────────────────
    desde = ahora - timedelta(days=dias_retorno_hasta)
    hasta = ahora - timedelta(days=dias_retorno_desde)
    retorno_db = db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.empleado),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio),
    ).filter(
        Turno.salon_id == salon_id,
        Turno.estado == "completado",
        Turno.fecha_hora >= desde,
        Turno.fecha_hora <= hasta,
        Turno.reminder_retorno_sent == False,
    ).order_by(Turno.fecha_hora).all()

    def _build(turno, tipo):
        dias = int((ahora - turno.fecha_hora).days) if tipo == "retorno" else None
        return {
            "turno_id":        turno.id,
            "tipo":            tipo,
            "cliente_nombre":  f"{turno.cliente.nombre} {turno.cliente.apellido or ''}".strip() if turno.cliente else "Sin nombre",
            "cliente_phone":   turno.cliente.telefono if turno.cliente else None,
            "empleado_nombre": turno.empleado.nombre if turno.empleado else "—",
            "fecha_hora":      turno.fecha_hora,
            "servicios":       [ts.servicio.nombre for ts in turno.servicios if ts.servicio],
            "dias_desde":      dias,
        }

    return {
        "proximos": [_build(t, "pre")     for t in proximos_db],
        "retorno":  [_build(t, "retorno") for t in retorno_db],
    }


def mark_reminder_sent(db: Session, turno_id: int, tipo: str, salon_id: int):
    """Marca el recordatorio como enviado. tipo = 'pre' | 'retorno'"""
    turno = db.query(Turno).filter(
        Turno.id == turno_id,
        Turno.salon_id == salon_id,
    ).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado.")

    ahora = datetime.now(ARG_TZ).replace(tzinfo=None)
    if tipo == "pre":
        turno.reminder_pre_sent    = True
        turno.reminder_pre_sent_at = ahora
    elif tipo == "retorno":
        turno.reminder_retorno_sent    = True
        turno.reminder_retorno_sent_at = ahora
    else:
        raise HTTPException(status_code=422, detail="tipo debe ser 'pre' o 'retorno'.")

    db.commit()
    return {"ok": True}
