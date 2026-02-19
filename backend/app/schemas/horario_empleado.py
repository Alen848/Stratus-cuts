from pydantic import BaseModel
from datetime import time

class HorarioEmpleadoBase(BaseModel):
    empleado_id: int
    dia_semana: int
    hora_inicio: time
    hora_fin: time

class HorarioEmpleadoCreate(HorarioEmpleadoBase):
    pass

class HorarioEmpleadoUpdate(BaseModel):
    dia_semana: int
    hora_inicio: time
    hora_fin: time

class HorarioEmpleado(HorarioEmpleadoBase):
    id: int

    class Config:
        from_attributes = True