from sqlalchemy import Column, Integer, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class BloqueoAgenda(Base):
    __tablename__ = "bloqueos_agenda"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)  # null = bloqueo general
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    motivo = Column(String(255))

    # Relaciones
    empleado = relationship("Empleado", back_populates="bloqueos")