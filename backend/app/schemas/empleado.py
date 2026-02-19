from pydantic import BaseModel, EmailStr
from typing import Optional

class EmpleadoBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    especialidad: Optional[str] = None
    activo: bool = True

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoUpdate(EmpleadoBase):
    pass

class Empleado(EmpleadoBase):
    id: int

    class Config:
        from_attributes = True