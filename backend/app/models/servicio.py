from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Servicio(Base):
    __tablename__ = "servicios"
    __table_args__ = (
        UniqueConstraint("salon_id", "nombre", name="uq_servicio_salon_nombre"),
    )

    id               = Column(Integer, primary_key=True, index=True)
    salon_id         = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    categoria_id     = Column(Integer, ForeignKey("categorias_servicio.id"), nullable=True, index=True)
    nombre           = Column(String(100), nullable=False)
    descripcion      = Column(String(1000))
    duracion_minutos = Column(Integer, nullable=False)
    precio           = Column(Float, nullable=False)

    # Relaciones
    turnos    = relationship("TurnoServicio", back_populates="servicio")
    categoria = relationship("CategoriaServicio", back_populates="servicios")
    # Fechas puntuales en las que se dicta (servicios tipo "evento especial")
    fechas_especiales_rel = relationship(
        "ServicioFechaEspecial",
        back_populates="servicio",
        cascade="all, delete-orphan",
        order_by="ServicioFechaEspecial.fecha",
    )
    # `empleados` lo define Empleado.servicios con backref (M2M empleado_servicios)

    @property
    def empleado_ids(self):
        return [e.id for e in self.empleados]

    @property
    def fechas_especiales(self):
        """Fechas en las que se dicta. Vacío = disponible siempre."""
        return [f.fecha for f in self.fechas_especiales_rel]

    @property
    def es_evento_especial(self):
        """True si solo se puede reservar en fechas puntuales."""
        return len(self.fechas_especiales_rel) > 0