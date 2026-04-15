from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

CATEGORIAS_VALIDAS = {"alquiler", "productos", "sueldos", "servicios", "otros"}

class GastoBase(BaseModel):
    descripcion:   str            = Field(..., max_length=200)
    monto:         float          = Field(..., gt=0, description="El monto debe ser mayor a 0")
    categoria:     str            = Field(..., max_length=50, description="alquiler | productos | sueldos | servicios | otros")
    observaciones: Optional[str]  = Field(None, max_length=500)

class GastoCreate(GastoBase):
    fecha: Optional[datetime] = None  # si no se pasa, se usa el momento actual

class GastoUpdate(BaseModel):
    descripcion:   Optional[str]      = None
    monto:         Optional[float]    = Field(None, gt=0)
    categoria:     Optional[str]      = None
    observaciones: Optional[str]      = None
    fecha:         Optional[datetime] = None

class Gasto(GastoBase):
    id:    int
    fecha: datetime

    class Config:
        from_attributes = True