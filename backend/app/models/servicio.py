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
    # `empleados` lo define Empleado.servicios con backref (M2M empleado_servicios)

    @property
    def empleado_ids(self):
        return [e.id for e in self.empleados]