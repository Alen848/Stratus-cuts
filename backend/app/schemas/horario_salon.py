from pydantic import BaseModel
from datetime import time


class HorarioSalonBase(BaseModel):
    dia_semana:    int
    hora_apertura: time
    hora_cierre:   time
    activo:        bool = True


class HorarioSalonUpsert(HorarioSalonBase):
    pass


class HorarioSalon(HorarioSalonBase):
    id:       int
    salon_id: int

    class Config:
        from_attributes = True
