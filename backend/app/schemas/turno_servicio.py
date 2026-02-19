from pydantic import BaseModel
from .servicio import Servicio

class TurnoServicioBase(BaseModel):
    turno_id: int
    servicio_id: int
    cantidad: int = 1
    precio_unitario: float

class TurnoServicioCreate(TurnoServicioBase):
    pass

class TurnoServicio(TurnoServicioBase):
    id: int
    servicio: Servicio

    class Config:
        from_attributes = True