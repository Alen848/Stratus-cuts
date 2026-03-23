from sqlalchemy import Column, Integer, String, Boolean
from app.database.connection import Base


class Salon(Base):
    __tablename__ = "salones"

    id     = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    slug   = Column(String(50), unique=True, nullable=False, index=True)
    activo = Column(Boolean, default=True)
