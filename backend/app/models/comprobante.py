from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, LargeBinary
from sqlalchemy.sql import func
from app.database.connection import Base


class Comprobante(Base):
    """Comprobante de transferencia que sube el cliente para una reserva.

    Se guarda el binario en la DB (archivos chicos, bajo volumen) para que
    sobreviva a los redeploys sin depender de un volumen persistente.
    length=16MB => MEDIUMBLOB en MySQL (suficiente para fotos/PDF de comprobantes).
    """
    __tablename__ = "comprobantes"

    id           = Column(Integer, primary_key=True, index=True)
    turno_id     = Column(Integer, ForeignKey("turnos.id"), nullable=False, index=True)
    salon_id     = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    filename     = Column(String(255))
    content_type = Column(String(100))
    data         = Column(LargeBinary(length=16_777_215), nullable=False)
    created_at   = Column(DateTime, server_default=func.now())
