from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    monto = Column(Float, nullable=False)
    fecha_pago = Column(DateTime, server_default="CURRENT_TIMESTAMP")
    metodo_pago = Column(String(50))  # efectivo, tarjeta, transferencia, etc.
    observaciones = Column(String(255))

    # Relaciones
    turno = relationship("Turno", back_populates="pagos")