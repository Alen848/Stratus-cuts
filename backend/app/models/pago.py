from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    monto = Column(Float, nullable=False)
    fecha_pago = Column(DateTime, server_default=func.now())
    metodo_pago = Column(String(50))  # efectivo, tarjeta, transferencia, Mercado Pago, etc.
    observaciones = Column(String(255))

    # ── Clasificación para sincronía con Caja ────────────────────────────────
    tipo   = Column(String(20), default="saldo")     # sena, saldo, otro
    estado = Column(String(20), default="aprobada")  # aprobada, pendiente, anulada
    mp_payment_id = Column(String(50), nullable=True)  # id del pago en Mercado Pago (si aplica)

    # Relaciones
    turno = relationship("Turno", back_populates="pagos")