from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class EmpleadoBase(BaseModel):
    nombre:              str            = Field(max_length=100)
    telefono:            Optional[str]  = Field(None, max_length=20)
    email:               Optional[EmailStr] = None
    especialidad:        Optional[str]  = Field(None, max_length=100)
    activo:              bool           = True
    sueldo_base:         Optional[float]    = None
    comision_porcentaje: Optional[float]    = 0.0

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoUpdate(BaseModel):
    nombre:       Optional[str]        = None
    telefono:     Optional[str]        = None
    email:        Optional[EmailStr]   = None
    especialidad: Optional[str]        = None
    activo:       Optional[bool]       = None
    sueldo_base:  Optional[float]      = None
    comision_porcentaje: Optional[float] = None

class Empleado(EmpleadoBase):
    id: int

    class Config:
        from_attributes = True