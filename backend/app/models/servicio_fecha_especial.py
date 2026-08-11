from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base


class ServicioFechaEspecial(Base):
    """
    Fecha puntual en la que se dicta un servicio de tipo "evento".

    Sirve para servicios que no están disponibles todos los días sino una vez
    cada tanto (ej: una jornada de depilación láser al mes). La regla es:

      - Servicio SIN fechas cargadas  → disponible siempre (comportamiento normal).
      - Servicio CON fechas cargadas  → SOLO reservable en esas fechas.

    Es una tabla aparte y no una columna en `servicios` a propósito: el arranque
    de la app usa `Base.metadata.create_all`, que crea tablas faltantes pero no
    altera las existentes. Así la feature se despliega sin migración manual.
    """
    __tablename__ = "servicio_fechas_especiales"
    __table_args__ = (
        UniqueConstraint("servicio_id", "fecha", name="uq_servicio_fecha_especial"),
    )

    id          = Column(Integer, primary_key=True, index=True)
    salon_id    = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False, index=True)
    fecha       = Column(Date, nullable=False, index=True)

    servicio = relationship("Servicio", back_populates="fechas_especiales_rel")
