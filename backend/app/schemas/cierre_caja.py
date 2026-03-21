from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class CierreCajaBase(BaseModel):
    fecha:                  date
    saldo_anterior:         float = 0.0
    total_efectivo_teorico: float = 0.0
    total_transferencia:    float = 0.0
    total_debito:           float = 0.0
    total_gastos:           float = 0.0
    efectivo_real:          float
    diferencia:             float = 0.0
    observaciones:          Optional[str] = None

class CierreCajaCreate(CierreCajaBase):
    pass

class CierreCaja(CierreCajaBase):
    id:           int
    fecha_cierre: datetime

    class Config:
        from_attributes = True
