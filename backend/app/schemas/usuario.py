from pydantic import BaseModel
from typing import Optional

class UsuarioBase(BaseModel):
    username: str
    rol: str = "empleado"
    empleado_id: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str  # contraseña en texto plano para registro

class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    empleado_id: Optional[int] = None

class Usuario(UsuarioBase):
    id: int
    # No incluimos password_hash por seguridad

    class Config:
        from_attributes = True