from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class ClienteBase(BaseModel):
    nombre:    str            = Field(max_length=100)
    apellido:  Optional[str] = Field(None, max_length=100)
    telefono:  Optional[str] = Field(None, max_length=20)
    email:     Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=200)

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