import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

# En producción, esta variable debe estar configurada en el entorno (ej. en Hostinger)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # En un deploy real (PRODUCTION_DOMAIN seteado) NUNCA arrancar con la clave
    # de dev: los JWT quedarían firmados con un secreto público del repo y
    # cualquiera podría fabricarse un token de superadmin.
    if os.getenv("PRODUCTION_DOMAIN"):
        raise RuntimeError(
            "SECRET_KEY no está configurada. Definila en el entorno del backend "
            "(Dokploy/.env). Generá una con: python -c \"import secrets; "
            "print(secrets.token_urlsafe(64))\""
        )
    # Solo permitir un valor por defecto en desarrollo local
    SECRET_KEY = "dev-secret-unsafe-change-me"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
