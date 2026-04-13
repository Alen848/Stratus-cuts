from pydantic import BaseModel
from typing import Optional

class ServicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    duracion_minutos: int
    precio: float

class ServicioCreate(ServicioBase):
    pass

class ServicioUpdate(BaseModel):
    nombre:           Optional[str]   = None
    descripcion:      Optional[str]   = None
    duracion_minutos: Optional[int]   = None
    precio:           Optional[float] = None

class Servicio(ServicioBase):
    id: int

    class Config:
        from_attributes = True