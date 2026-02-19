from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BloqueoAgendaBase(BaseModel):
    empleado_id: Optional[int] = None
    fecha_inicio: datetime
    fecha_fin: datetime
    motivo: str

class BloqueoAgendaCreate(BloqueoAgendaBase):
    pass

class BloqueoAgendaUpdate(BaseModel):
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    motivo: Optional[str] = None

class BloqueoAgenda(BloqueoAgendaBase):
    id: int

    class Config:
        from_attributes = True