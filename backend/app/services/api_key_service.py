"""
Gestión de API Keys por salón (acceso máquina-a-máquina de solo lectura).

La clave en claro se muestra UNA sola vez, al crearla. En la base solo queda su
hash SHA-256; si se pierde, se revoca y se crea otra. Cada clave está atada a un
salón, por lo que nunca puede acceder a datos de otro (multi-tenant).
"""
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from app.models.api_key import ApiKey

ARG_TZ = timezone(timedelta(hours=-3))
_PREFIX = "sk_live_"


def _hash(clave: str) -> str:
    return hashlib.sha256(clave.encode()).hexdigest()


def generar_api_key(db: Session, salon_id: int, nombre: str) -> str:
    """Crea una API Key para el salón y devuelve la clave EN CLARO (solo esta vez)."""
    clave = _PREFIX + secrets.token_urlsafe(32)
    ak = ApiKey(
        salon_id=salon_id,
        nombre=(nombre or "Integración").strip()[:100],
        prefix=clave[:12],
        key_hash=_hash(clave),
        activo=True,
    )
    db.add(ak)
    db.commit()
    return clave


def listar_api_keys(db: Session, salon_id: int):
    return db.query(ApiKey).filter(ApiKey.salon_id == salon_id).order_by(ApiKey.id.desc()).all()


def revocar_api_key(db: Session, salon_id: int, key_id: int) -> bool:
    ak = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.salon_id == salon_id).first()
    if not ak:
        return False
    ak.activo = False
    db.commit()
    return True


def resolver_salon(db: Session, clave: str) -> Optional[int]:
    """Devuelve el salon_id dueño de la clave (si es válida y activa), o None."""
    if not clave:
        return None
    ak = db.query(ApiKey).filter(
        ApiKey.key_hash == _hash(clave),
        ApiKey.activo == True,
    ).first()
    if not ak:
        return None
    ak.last_used_at = datetime.now(ARG_TZ).replace(tzinfo=None)
    db.commit()
    return ak.salon_id
