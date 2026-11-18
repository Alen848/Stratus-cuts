from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.config_salon import ConfigSalon
from app.models.salon import Salon
from app.schemas.config_salon import ConfigSalonUpdate, ConfigSalonOut
from app import crypto
from app.auth.security import hash_password, verify_password


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
        # Seña por transferencia (los datos bancarios se muestran al cliente)
        transferencia_activa=cfg.transferencia_activa if cfg else False,
        transferencia_cbu=cfg.transferencia_cbu if cfg else None,
        transferencia_alias=cfg.transferencia_alias if cfg else None,
        transferencia_titular=cfg.transferencia_titular if cfg else None,
        # Webhooks — el secreto nunca se devuelve, solo si está configurado
        webhook_url=cfg.webhook_url if cfg else None,
        webhook_configurado=bool(cfg and cfg.webhook_secret),
        webhook_activo=cfg.webhook_activo if cfg else False,
        # Candado de Configuración — nunca se devuelve el hash
        config_lock_activo=bool(cfg and cfg.config_password_hash),
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


def _apply_transferencia_fields(cfg: ConfigSalon, data: ConfigSalonUpdate) -> None:
    """Aplica los datos de seña por transferencia sobre el ConfigSalon."""
    if data.transferencia_activa is not None:
        cfg.transferencia_activa = data.transferencia_activa
    if data.transferencia_cbu is not None:
        cfg.transferencia_cbu = data.transferencia_cbu.strip() or None
    if data.transferencia_alias is not None:
        cfg.transferencia_alias = data.transferencia_alias.strip() or None
    if data.transferencia_titular is not None:
        cfg.transferencia_titular = data.transferencia_titular.strip() or None


def _apply_webhook_fields(cfg: ConfigSalon, data: ConfigSalonUpdate) -> None:
    """Aplica los campos de webhooks salientes sobre el ConfigSalon."""
    if data.webhook_url is not None:
        cfg.webhook_url = data.webhook_url.strip() or None
    if data.webhook_secret is not None:
        cfg.webhook_secret = data.webhook_secret.strip() or None
    if data.webhook_activo is not None:
        cfg.webhook_activo = data.webhook_activo


def update_config(db: Session, salon_id: int, data: ConfigSalonUpdate) -> ConfigSalonOut:
    # Candado: si hay una clave de configuración seteada, exigirla para guardar.
    existente = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if existente and existente.config_password_hash:
        if not data.config_password or not verify_password(data.config_password, existente.config_password_hash):
            raise HTTPException(status_code=403, detail="Clave de configuración incorrecta.")

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
        _apply_transferencia_fields(cfg, data)
        _apply_webhook_fields(cfg, data)
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
        _apply_transferencia_fields(cfg, data)
        _apply_webhook_fields(cfg, data)
        db.add(cfg)

    db.commit()
    return get_config(db, salon_id)


def _get_or_create_config(db: Session, salon_id: int) -> ConfigSalon:
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg:
        cfg = ConfigSalon(salon_id=salon_id)
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def verify_config_password(db: Session, salon_id: int, password: str) -> bool:
    """True si la clave coincide, o si no hay candado activo."""
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg or not cfg.config_password_hash:
        return True
    return verify_password(password or "", cfg.config_password_hash)


def set_config_password(db: Session, salon_id: int, current_password, nueva_password) -> ConfigSalonOut:
    """Setea, cambia o quita (nueva vacía) la clave de Configuración."""
    cfg = _get_or_create_config(db, salon_id)

    # Si ya hay candado, exigir la clave actual correcta
    if cfg.config_password_hash:
        if not current_password or not verify_password(current_password, cfg.config_password_hash):
            raise HTTPException(status_code=403, detail="La clave actual es incorrecta.")

    nueva = (nueva_password or "").strip()
    if nueva:
        if len(nueva) < 4:
            raise HTTPException(status_code=400, detail="La clave debe tener al menos 4 caracteres.")
        cfg.config_password_hash = hash_password(nueva)
    else:
        # Quitar el candado
        cfg.config_password_hash = None

    db.commit()
    return get_config(db, salon_id)


def get_mp_access_token(db: Session, salon_id: int) -> Optional[str]:
    """Devuelve el Access Token de MP descifrado (uso interno, nunca vía API)."""
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg or not cfg.mp_access_token:
        return None
    return crypto.decrypt(cfg.mp_access_token)
