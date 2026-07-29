from pydantic import BaseModel, Field
from typing import Optional


class CategoriaServicioBase(BaseModel):
    nombre:      str           = Field(max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    orden:       int           = 0


class CategoriaServicioCreate(CategoriaServicioBase):
    pass


class CategoriaServicioUpdate(BaseModel):
    nombre:      Optional[str] = None
    descripcion: Optional[str] = None
    orden:       Optional[int] = None


class CategoriaServicio(CategoriaServicioBase):
    id: int

    class Config:
        from_attributes = True
