from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .cliente import Cliente
from .empleado import Empleado
from .turno_servicio import TurnoServicio

class TurnoBase(BaseModel):
    fecha_hora: datetime
    duracion: int = 30
    estado: str = "pendiente"
    observaciones: Optional[str] = None
    cliente_id: int
    empleado_id: int

class TurnoCreate(TurnoBase):
    servicios_ids: List[int]  # IDs de servicios incluidos

class TurnoUpdate(BaseModel):
    fecha_hora: Optional[datetime] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    cliente_id: Optional[int] = None
    empleado_id: Optional[int] = None
    servicios_ids: Optional[List[int]] = None

class Turno(TurnoBase):
    id: int
    cliente: Cliente
    empleado: Empleado
    servicios: List[TurnoServicio] 

    class Config:
        from_attributes = True
