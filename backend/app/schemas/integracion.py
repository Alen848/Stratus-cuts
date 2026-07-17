from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ApiKeyCreate(BaseModel):
    nombre: str


class ApiKeyCreated(BaseModel):
    """Respuesta al crear: incluye la clave EN CLARO (solo se muestra esta vez)."""
    id:     int
    nombre: str
    prefix: str
    clave:  str      # ⚠️ guardala ahora; no se puede volver a ver


class ApiKeyOut(BaseModel):
    id:           int
    nombre:       str
    prefix:       str
    activo:       bool
    created_at:   Optional[datetime]
    last_used_at: Optional[datetime]

    class Config:
        from_attributes = True
