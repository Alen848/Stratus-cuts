from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base


class ApiKey(Base):
    """
    Clave de acceso máquina-a-máquina para que sistemas externos (ej. un sistema
    de gestión) lean la API del salón sin usuario/contraseña.

    Solo se guarda el HASH de la clave (nunca el valor en claro). El `prefix`
    (primeros caracteres) sirve para identificarla en el panel sin revelarla.
    Cada clave pertenece a UN salón: jamás puede ver datos de otro (multi-tenant).
    """
    __tablename__ = "api_keys"

    id           = Column(Integer, primary_key=True, index=True)
    salon_id     = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    nombre       = Column(String(100), nullable=False)          # descripción (ej. "Sistema de gestión")
    prefix       = Column(String(16), nullable=False, index=True)  # visible; identifica la clave
    key_hash     = Column(String(64), nullable=False, index=True)  # SHA-256 de la clave completa
    activo       = Column(Boolean, default=True, nullable=False)
    created_at   = Column(DateTime, server_default=func.now())
    last_used_at = Column(DateTime, nullable=True)
