from pydantic import BaseModel
from typing import Optional


class ConfigSalonUpdate(BaseModel):
    nombre_salon:         Optional[str] = None
    telefono:             Optional[str] = None
    direccion:            Optional[str] = None
    url_reserva:          Optional[str] = None
    reservas_online:      Optional[bool] = True
    max_dias_anticipacion: Optional[int] = 60
    min_hs_anticipacion:  Optional[int] = 1


class ConfigSalonOut(BaseModel):
    salon_id:             int
    nombre_salon:         str
    slug:                 str
    telefono:             Optional[str]
    direccion:            Optional[str]
    url_reserva:          Optional[str]
    reservas_online:      bool
    max_dias_anticipacion: int
    min_hs_anticipacion:  int

    class Config:
        from_attributes = True
