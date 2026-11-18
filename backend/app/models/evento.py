from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Evento(Base):
    """
    Marca una categoría como "evento especial": una jornada que se hace solo
    ciertos días (ej: "Depilación láser", una vez al mes).

    Los servicios de la categoría son las variantes que se pueden reservar ese
    día (completa, solo piernas, ...). Las fechas y el intervalo entre turnos
    son de la jornada, no de cada variante: por eso viven acá y no en Servicio.

    Es una tabla aparte (1:1 con la categoría) y no columnas nuevas en
    `categorias_servicio` porque el arranque usa `Base.metadata.create_all`,
    que crea tablas faltantes pero nunca altera las existentes. Así se despliega
    sin migración manual.
    """
    __tablename__ = "eventos"
    __table_args__ = (
        UniqueConstraint("categoria_id", name="uq_evento_categoria"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    salon_id     = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias_servicio.id"), nullable=False, index=True)
    # Cada cuántos minutos se ofrece un turno de arranque. Los servicios normales
    # usan 60 fijo; un evento puede bajarlo para entrar más gente en el día.
    intervalo_minutos = Column(Integer, nullable=False, default=60)

    categoria = relationship("CategoriaServicio", back_populates="evento")
    fechas    = relationship(
        "EventoFecha",
        back_populates="evento",
        cascade="all, delete-orphan",
        order_by="EventoFecha.fecha",
    )


class EventoFecha(Base):
    """Un día concreto en el que se realiza el evento."""
    __tablename__ = "evento_fechas"
    __table_args__ = (
        UniqueConstraint("evento_id", "fecha", name="uq_evento_fecha"),
    )

    id        = Column(Integer, primary_key=True, index=True)
    salon_id  = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    evento_id = Column(Integer, ForeignKey("eventos.id"), nullable=False, index=True)
    fecha     = Column(Date, nullable=False, index=True)

    evento = relationship("Evento", back_populates="fechas")
