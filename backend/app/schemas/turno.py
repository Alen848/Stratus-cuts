from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from .cliente import Cliente
from .empleado import Empleado
from .turno_servicio import TurnoServicio


class TurnoBase(BaseModel):
    fecha_hora:    datetime
    duracion:      int            = 30
    estado:        str            = Field("pendiente", max_length=50)
    metodo_pago:   Optional[str]  = Field(None, max_length=50)
    observaciones: Optional[str]  = Field(None, max_length=1000)
    cliente_id:    Optional[int]  = None
    empleado_id:   int


class TurnoCreate(TurnoBase):
    servicios_ids: List[int]


class TurnoUpdate(BaseModel):
    fecha_hora:    Optional[datetime]   = None
    estado:        Optional[str]        = None
    metodo_pago:   Optional[str]        = None
    observaciones: Optional[str]        = None
    cliente_id:    Optional[int]        = None
    empleado_id:   Optional[int]        = None
    servicios_ids: Optional[List[int]]  = None


class Turno(TurnoBase):
    id:                       int
    reminder_pre_sent:        bool = False
    reminder_pre_sent_at:     Optional[datetime] = None
    reminder_retorno_sent:    bool = False
    reminder_retorno_sent_at: Optional[datetime] = None
    cliente:   Optional[Cliente]  = None
    empleado:  Empleado
    servicios: List[TurnoServicio]

    # Seña / pago (la seña entra a Caja el día que se pagó)
    monto_total:     Optional[float] = None
    monto_sena:      Optional[float] = None
    saldo_pendiente: Optional[float] = None
    sena_estado:     Optional[str]   = None
    # Calculados (total del turno, lo pagado y lo que resta cobrar)
    total_turno:     Optional[float] = None
    total_pagado:    Optional[float] = None
    saldo:           Optional[float] = None

    class Config:
        from_attributes = True


# ─── Schema específico para recordatorios ─────────────────────────────────────

class RecordatorioOut(BaseModel):
    turno_id:       int
    tipo:           str   # "pre" | "retorno"
    cliente_nombre: str
    cliente_phone:  Optional[str]
    empleado_nombre: str
    fecha_hora:     datetime
    servicios:      List[str]
    dias_desde:     Optional[int] = None  # solo para retorno

    class Config:
        from_attributes = True
