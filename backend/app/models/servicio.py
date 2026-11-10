from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, object_session
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
    # `empleados` lo define Empleado.servicios con backref (M2M empleado_servicios)

    @property
    def empleado_ids(self):
        return [e.id for e in self.empleados]

    @property
    def horas_limite(self):
        """{empleado_id: hora} de los profesionales con hora tope para este servicio."""
        from app.models.empleado_servicio import empleado_servicios

        db = object_session(self)
        if db is None or self.id is None:
            return {}
        rows = db.execute(
            empleado_servicios.select().where(
                empleado_servicios.c.servicio_id == self.id,
                empleado_servicios.c.hora_limite.isnot(None),
            )
        ).all()
        return {r.empleado_id: r.hora_limite for r in rows}

    # Las fechas no son del servicio sino de la jornada: un servicio es "de fecha
    # especial" cuando pertenece a una categoría marcada como evento. Se exponen
    # igual acá para que el contrato de la API pública no cambie.
    @property
    def fechas_especiales(self):
        """Fechas en las que se dicta. Vacío = disponible siempre."""
        return self.categoria.fechas_especiales if self.categoria else []

    @property
    def es_evento_especial(self):
        """True si solo se puede reservar en fechas puntuales."""
        return bool(self.categoria and self.categoria.es_evento)