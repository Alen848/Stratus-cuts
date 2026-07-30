from pydantic import BaseModel, Field
from typing import Optional, List

class ServicioBase(BaseModel):
    nombre:           str           = Field(max_length=100)
    descripcion:      Optional[str] = Field(None, max_length=1000)
    duracion_minutos: int
    precio:           float
    categoria_id:     Optional[int] = None
    # Profesionales que realizan este servicio (lado inverso de empleado.servicio_ids)
    empleado_ids:     List[int]     = []

class ServicioCreate(ServicioBase):
    pass

class ServicioUpdate(BaseModel):
    nombre:           Optional[str]   = None
    descripcion:      Optional[str]   = None
    duracion_minutos: Optional[int]   = None
    precio:           Optional[float] = None
    categoria_id:     Optional[int]   = None
    empleado_ids:     Optional[List[int]] = None

class Servicio(ServicioBase):
    id: int

    class Config:
        from_attributes = True