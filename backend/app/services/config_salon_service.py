from typing import Optional
from sqlalchemy.orm import Session
from app.models.config_salon import ConfigSalon
from app.models.salon import Salon
from app.schemas.config_salon import ConfigSalonUpdate, ConfigSalonOut
from app import crypto


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
        # Mercado Pago — el token nunca se devuelve, solo si está configurado
        mp_activo=cfg.mp_activo if cfg else False,
        mp_configurado=bool(cfg and cfg.mp_access_token),
        mp_public_key=cfg.mp_public_key if cfg else None,
        sena_porcentaje=cfg.sena_porcentaje if cfg else 0,
        sena_obligatoria=cfg.sena_obligatoria if cfg else False,
    )


def _apply_mp_fields(cfg: ConfigSalon, data: ConfigSalonUpdate) -> None:
    """Aplica los campos de Mercado Pago sobre el ConfigSalon, con guardas."""
    if data.mp_activo is not None:
        cfg.mp_activo = data.mp_activo
    if data.mp_public_key is not None:
        cfg.mp_public_key = data.mp_public_key.strip() or None
    if data.sena_porcentaje is not None:
        cfg.sena_porcentaje = max(0, min(100, data.sena_porcentaje))
    if data.sena_obligatoria is not None:
        cfg.sena_obligatoria = data.sena_obligatoria
    # El access token solo se actualiza si llega uno nuevo no vacío.
    # Se guarda CIFRADO; nunca se pisa con None ni se devuelve.
    if data.mp_access_token is not None:
        token = data.mp_access_token.strip()
        cfg.mp_access_token = crypto.encrypt(token) if token else None


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
        _apply_mp_fields(cfg, data)
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
        _apply_mp_fields(cfg, data)
        db.add(cfg)

    db.commit()
    return get_config(db, salon_id)


def get_mp_access_token(db: Session, salon_id: int) -> Optional[str]:
    """Devuelve el Access Token de MP descifrado (uso interno, nunca vía API)."""
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg or not cfg.mp_access_token:
        return None
    return crypto.decrypt(cfg.mp_access_token)
