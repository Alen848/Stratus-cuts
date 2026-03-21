from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ClienteBase(BaseModel):
    nombre:    str
    apellido:  Optional[str] = None   # FIX: faltaba este campo, los apellidos nunca se guardaban
    telefono:  Optional[str] = None
    email:     Optional[EmailStr] = None  # completamente opcional, sin restricción de dominio
    direccion: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre:    Optional[str] = None
    apellido:  Optional[str] = None
    telefono:  Optional[str] = None
    email:     Optional[EmailStr] = None
    direccion: Optional[str] = None

class Cliente(ClienteBase):
    id:              int
    fecha_registro:  datetime

    class Config:
        from_attributes = True