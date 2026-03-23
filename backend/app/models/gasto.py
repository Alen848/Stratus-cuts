from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base

class Gasto(Base):
    __tablename__ = "gastos"

    id            = Column(Integer, primary_key=True, index=True)
    salon_id      = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    descripcion   = Column(String(255), nullable=False)
    monto         = Column(Float, nullable=False)
    categoria     = Column(String(100), nullable=False)  # alquiler, productos, sueldos, servicios, otros
    fecha         = Column(DateTime, nullable=False, server_default=func.now())
    observaciones = Column(String(500), nullable=True)