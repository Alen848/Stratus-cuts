from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date as DateType

class ServicioBase(BaseModel):
    nombre:           str           = Field(max_length=100)
    descripcion:      Optional[str] = Field(None, max_length=1000)
    duracion_minutos: int
    precio:           float
    categoria_id:     Optional[int] = None
    # Profesionales que realizan este servicio (lado inverso de empleado.servicio_ids)
    empleado_ids:     List[int]     = []
    # Fechas puntuales en las que se dicta. Vacío = disponible siempre.
    # Con fechas cargadas, el servicio SOLO se puede reservar en esos días.
    fechas_especiales: List[DateType] = []

class ServicioCreate(ServicioBase):
    pass

class ServicioUpdate(BaseModel):
    nombre:           Optional[str]   = None
    descripcion:      Optional[str]   = None
    duracion_minutos: Optional[int]   = None
    precio:           Optional[float] = None
    categoria_id:     Optional[int]   = None
    empleado_ids:     Optional[List[int]] = None
    fechas_especiales: Optional[List[DateType]] = None

class Servicio(ServicioBase):
    id: int
    # Derivado: True si tiene fechas cargadas (lo usa el front para marcarlo)
    es_evento_especial: bool = False

    class Config:
        from_attributes = True
