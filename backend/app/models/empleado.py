from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20))
    email = Column(String(100), unique=True, index=True)
    especialidad = Column(String(100))
    activo = Column(Boolean, default=True)

    # Relaciones
    turnos = relationship("Turno", back_populates="empleado")
    horarios = relationship("HorarioEmpleado", back_populates="empleado")
    bloqueos = relationship("BloqueoAgenda", back_populates="empleado")
    usuario = relationship("Usuario", back_populates="empleado", uselist=False)