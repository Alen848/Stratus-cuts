from sqlalchemy.orm import Session
from app.models.config_salon import ConfigSalon
from app.models.salon import Salon
from app.schemas.config_salon import ConfigSalonUpdate, ConfigSalonOut


def get_config(db: Session, salon_id: int) -> ConfigSalonOut:
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    cfg   = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()

    return ConfigSalonOut(
        salon_id=salon_id,
        nombre_salon=salon.nombre if salon else "",
        slug=salon.slug if salon else "",
        telefono=cfg.telefono if cfg else None,
        direccion=cfg.direccion if cfg else None,
        url_reserva=cfg.url_reserva if cfg else None,
        reservas_online=cfg.reservas_online if cfg else True,
        max_dias_anticipacion=cfg.max_dias_anticipacion if cfg else 60,
        min_hs_anticipacion=cfg.min_hs_anticipacion if cfg else 1,
    )


def update_config(db: Session, salon_id: int, data: ConfigSalonUpdate) -> ConfigSalonOut:
    # Actualizar nombre del salón si viene
    if data.nombre_salon is not None:
        salon = db.query(Salon).filter(Salon.id == salon_id).first()
        if salon:
            salon.nombre = data.nombre_salon

    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if cfg:
        if data.telefono is not None:
            cfg.telefono = data.telefono
        if data.direccion is not None:
            cfg.direccion = data.direccion
        if data.url_reserva is not None:
            cfg.url_reserva = data.url_reserva
        cfg.reservas_online       = data.reservas_online
        cfg.max_dias_anticipacion = data.max_dias_anticipacion
        cfg.min_hs_anticipacion   = data.min_hs_anticipacion
    else:
        cfg = ConfigSalon(
            salon_id=salon_id,
            telefono=data.telefono,
            direccion=data.direccion,
            url_reserva=data.url_reserva,
            reservas_online=data.reservas_online,
            max_dias_anticipacion=data.max_dias_anticipacion,
            min_hs_anticipacion=data.min_hs_anticipacion,
        )
        db.add(cfg)

    db.commit()
    return get_config(db, salon_id)
