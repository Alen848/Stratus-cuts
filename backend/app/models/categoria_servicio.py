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
    # Si existe, esta categoría es un "evento especial" (ver models/evento.py)
    evento = relationship(
        "Evento", back_populates="categoria",
        uselist=False, cascade="all, delete-orphan",
    )

    @property
    def es_evento(self):
        return self.evento is not None

    @property
    def fechas_especiales(self):
        """Días en los que se realiza. Vacío = no es un evento."""
        return [f.fecha for f in self.evento.fechas] if self.evento else []

    @property
    def intervalo_minutos(self):
        """Cada cuántos minutos se ofrece un turno. None = el default del salón."""
        return self.evento.intervalo_minutos if self.evento else None
