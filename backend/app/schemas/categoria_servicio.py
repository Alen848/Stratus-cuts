from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date as DateType


class CategoriaServicioBase(BaseModel):
    nombre:      str           = Field(max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    orden:       int           = 0


class CategoriaServicioCreate(CategoriaServicioBase):
    # Campos de "evento especial". Si `es_evento` es False se ignoran.
    es_evento:         bool             = False
    fechas_especiales: List[DateType]   = []
    # Cada cuántos minutos se ofrece un turno durante la jornada
    intervalo_minutos: int              = Field(default=60, ge=5, le=240)


class CategoriaServicioUpdate(BaseModel):
    nombre:      Optional[str] = None
    descripcion: Optional[str] = None
    orden:       Optional[int] = None
    es_evento:         Optional[bool]           = None
    fechas_especiales: Optional[List[DateType]] = None
    intervalo_minutos: Optional[int]            = Field(default=None, ge=5, le=240)


class CategoriaServicio(CategoriaServicioBase):
    id: int
    # Derivados del evento asociado (ver models/evento.py)
    es_evento:         bool           = False
    fechas_especiales: List[DateType] = []
    intervalo_minutos: Optional[int]  = None

    class Config:
        from_attributes = True
