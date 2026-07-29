from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base


class CategoriaServicio(Base):
    """
    Agrupador de servicios (ej: "Cosmetología" agrupa "Limpieza facial",
    "Peeling", etc.). No tiene precio ni duración: eso vive en cada servicio.
    """
    __tablename__ = "categorias_servicio"
    __table_args__ = (
        UniqueConstraint("salon_id", "nombre", name="uq_categoria_salon_nombre"),
    )

    id          = Column(Integer, primary_key=True, index=True)
    salon_id    = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    nombre      = Column(String(100), nullable=False)
    descripcion = Column(String(255))
    orden       = Column(Integer, nullable=False, default=0)

    # Relaciones
    servicios = relationship("Servicio", back_populates="categoria")
