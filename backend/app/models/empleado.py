from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Empleado(Base):
    __tablename__ = "empleados"
    __table_args__ = (
        UniqueConstraint("salon_id", "email", name="uq_empleado_salon_email"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    salon_id     = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    nombre       = Column(String(100), nullable=False)
    telefono     = Column(String(20))
    email        = Column(String(100), index=True)
    especialidad = Column(String(100))
    activo       = Column(Boolean, default=True)
    sueldo_base  = Column(Float, nullable=True)

    # Relaciones
    turnos = relationship("Turno", back_populates="empleado")
    horarios = relationship("HorarioEmpleado", back_populates="empleado")
    bloqueos = relationship("BloqueoAgenda", back_populates="empleado")
    usuario = relationship("Usuario", back_populates="empleado", uselist=False)