"""
Recordatorio automático del comprobante de la seña.

Cuando alguien reserva y elige transferencia, el turno queda en 'pendiente' con
la seña sin acreditar. Si no sube el comprobante, hoy nadie se entera: el
horario queda tomado y el cliente no recibe ningún aviso. Este proceso le manda
un email una sola vez, con el link para subirlo.

No usa scheduler externo: el backend corre en un único proceso (ver Dockerfile,
uvicorn sin --workers), así que alcanza con una tarea asyncio en el arranque.
"""
import asyncio
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import joinedload

from app.database.connection import SessionLocal
from app.models.turno import Turno
from app.models.turno_servicio import TurnoServicio
from app.services import email_service

ARG_TZ = timezone(timedelta(hours=-3))

# Cuántas horas esperamos antes de pedirle el comprobante
HORAS_ESPERA = int(os.getenv("SENA_RECORDATORIO_HORAS", "6"))
# Cada cuánto revisa
INTERVALO_MINUTOS = int(os.getenv("SENA_RECORDATORIO_INTERVALO_MIN", "30"))


def _ahora():
    return datetime.now(ARG_TZ).replace(tzinfo=None)


def turnos_pendientes_de_comprobante(db, ahora=None):
    """
    Turnos que reservaron por transferencia, no subieron el comprobante, ya
    pasó la espera y todavía no se les avisó. Solo turnos a futuro: no tiene
    sentido pedir el comprobante de un turno que ya pasó.
    """
    ahora = ahora or _ahora()
    corte = ahora - timedelta(hours=HORAS_ESPERA)
    return db.query(Turno).options(
        joinedload(Turno.cliente),
        joinedload(Turno.servicios).joinedload(TurnoServicio.servicio),
    ).filter(
        Turno.estado == "pendiente",
        Turno.sena_estado == "pendiente",
        Turno.comprobante_subido == False,
        Turno.sena_recordatorio_sent == False,
        Turno.creado_en.isnot(None),      # los turnos viejos no tienen fecha de alta
        Turno.creado_en <= corte,
        Turno.fecha_hora >= ahora,
    ).all()


def procesar(db) -> int:
    """Manda los recordatorios pendientes. Devuelve cuántos mandó."""
    enviados = 0
    for turno in turnos_pendientes_de_comprobante(db):
        email_service.enviar_recordatorio_sena(db, turno)
        turno.sena_recordatorio_sent = True
        enviados += 1
    if enviados:
        db.commit()
    return enviados


async def loop_recordatorios():
    """Tarea de fondo: revisa cada INTERVALO_MINUTOS. Nunca corta por un error."""
    while True:
        await asyncio.sleep(INTERVALO_MINUTOS * 60)
        db = SessionLocal()
        try:
            procesar(db)
        except Exception:
            db.rollback()
        finally:
            db.close()
