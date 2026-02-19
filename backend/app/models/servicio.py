from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255))
    duracion_minutos = Column(Integer, nullable=False)  # duración estimada
    precio = Column(Float, nullable=False)

    # Relaciones
    turnos = relationship("TurnoServicio", back_populates="servicio")