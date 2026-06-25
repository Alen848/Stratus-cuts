from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class PagoBase(BaseModel):
    turno_id: int
    monto: float
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None


class CobroLinea(BaseModel):
    metodo_pago: Optional[str] = None
    monto: float


class CobroCreate(BaseModel):
    """Cobro del saldo de un turno; soporta varios métodos (split)."""
    turno_id: int
    lineas: List[CobroLinea]
    observaciones: Optional[str] = None

class PagoCreate(PagoBase):
    pass

class PagoUpdate(BaseModel):
    monto: Optional[float] = None
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None

class Pago(PagoBase):
    id: int
    fecha_pago: datetime

    class Config:
        from_attributes = True