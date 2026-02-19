from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base

class TurnoServicio(Base):
    __tablename__ = "turno_servicios"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(Float)  # se puede copiar del servicio al momento de crear

    # Relaciones
    turno = relationship("Turno", back_populates="servicios")
    servicio = relationship("Servicio", back_populates="turnos")