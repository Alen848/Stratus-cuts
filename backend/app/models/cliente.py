from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Cliente(Base) :
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=True)
    telefono = Column(String(20))
    email = Column(String(100), unique=True, index=True)
    direccion = Column(String(200))
    fecha_registro = Column(DateTime, server_default=func.now())

    # Relaciones
    turnos = relationship("Turno", back_populates="cliente")