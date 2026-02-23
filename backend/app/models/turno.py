from sqlalchemy import Column, Integer, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    fecha_hora = Column(DateTime, nullable=False)
    duracion = Column(Integer, default=30)
    estado = Column(String(20), default="pendiente")  # pendiente, confirmado, cancelado, completado
    observaciones = Column(String(500))
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False)

    # Relaciones
    cliente = relationship("Cliente", back_populates="turnos")
    empleado = relationship("Empleado", back_populates="turnos")
    servicios = relationship("TurnoServicio", back_populates="turno")
    pagos = relationship("Pago", back_populates="turno")
