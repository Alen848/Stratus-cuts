from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database.connection import Base


class ConfigSalon(Base):
    __tablename__ = "config_salon"

    id                    = Column(Integer, primary_key=True, index=True)
    salon_id              = Column(Integer, ForeignKey("salones.id"), unique=True, nullable=False)
    telefono              = Column(String(30),  nullable=True)
    direccion             = Column(String(200), nullable=True)
    url_reserva           = Column(String(300), nullable=True)
    reservas_online       = Column(Boolean, default=True)
    max_dias_anticipacion = Column(Integer, default=60)
    min_hs_anticipacion   = Column(Integer, default=1)
