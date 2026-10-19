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


class SheetsConfigIn(BaseModel):
    """Acepta el ID del Sheet o la URL completa (se extrae el ID)."""
    spreadsheet: Optional[str] = None
    activo:      Optional[bool] = None


class SheetsUltimaSync(BaseModel):
    ok:      Optional[bool]       # None = en curso
    detalle: str
    inicio:  Optional[datetime]
    fin:     Optional[datetime]


class SheetsEstado(BaseModel):
    activo:          bool
    spreadsheet_id:  Optional[str]
    cuenta_servicio: Optional[str]   # el email con el que hay que compartir el Sheet
    ultima_sync:     Optional[SheetsUltimaSync]
