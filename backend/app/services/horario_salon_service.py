from datetime import time
from sqlalchemy.orm import Session
from app.models.horario_salon import HorarioSalon
from app.schemas.horario_salon import HorarioSalonUpsert

# Horario predeterminado si el salón no tiene configuración guardada
DIAS_DEFAULT = [
    # (dia_semana, apertura, cierre, activo)
    (0, time(9, 0),  time(20, 0), True),   # Lunes
    (1, time(9, 0),  time(20, 0), True),   # Martes
    (2, time(9, 0),  time(20, 0), True),   # Miércoles
    (3, time(9, 0),  time(20, 0), True),   # Jueves
    (4, time(9, 0),  time(20, 0), True),   # Viernes
    (5, time(9, 0),  time(18, 0), True),   # Sábado
    (6, time(9, 0),  time(18, 0), False),  # Domingo (cerrado)
]


def get_horarios(db: Session, salon_id: int) -> list[HorarioSalon]:
    rows = db.query(HorarioSalon).filter(HorarioSalon.salon_id == salon_id).all()

    # Si no hay filas todavía, devolver los defaults sin persistirlos
    if not rows:
        return [
            HorarioSalon(
                id=0,
                salon_id=salon_id,
                dia_semana=dia,
                hora_apertura=apertura,
                hora_cierre=cierre,
                activo=activo,
            )
            for dia, apertura, cierre, activo in DIAS_DEFAULT
        ]

    # Rellenar días que falten con defaults
    by_dia = {r.dia_semana: r for r in rows}
    result = []
    for dia, apertura, cierre, activo in DIAS_DEFAULT:
        if dia in by_dia:
            result.append(by_dia[dia])
        else:
            result.append(
                HorarioSalon(
                    id=0,
                    salon_id=salon_id,
                    dia_semana=dia,
                    hora_apertura=apertura,
                    hora_cierre=cierre,
                    activo=activo,
                )
            )
    return result


def upsert_horarios(db: Session, salon_id: int, horarios: list[HorarioSalonUpsert]) -> list[HorarioSalon]:
    for h in horarios:
        existing = db.query(HorarioSalon).filter(
            HorarioSalon.salon_id == salon_id,
            HorarioSalon.dia_semana == h.dia_semana,
        ).first()

        if existing:
            existing.hora_apertura = h.hora_apertura
            existing.hora_cierre   = h.hora_cierre
            existing.activo        = h.activo
        else:
            db.add(HorarioSalon(
                salon_id=salon_id,
                dia_semana=h.dia_semana,
                hora_apertura=h.hora_apertura,
                hora_cierre=h.hora_cierre,
                activo=h.activo,
            ))

    db.commit()
    return get_horarios(db, salon_id)
