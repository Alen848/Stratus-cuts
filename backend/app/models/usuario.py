from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(50), default="empleado")  # admin, empleado, etc.
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)  # puede ser null si es admin

    # Relaciones
    empleado = relationship("Empleado", back_populates="usuario")