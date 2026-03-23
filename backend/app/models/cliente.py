from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Cliente(Base):
    __tablename__ = "clientes"
    __table_args__ = (
        UniqueConstraint("salon_id", "email", name="uq_cliente_salon_email"),
        UniqueConstraint("salon_id", "telefono", name="uq_cliente_salon_telefono"),
    )

    id             = Column(Integer, primary_key=True, index=True)
    salon_id       = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    nombre         = Column(String(100), nullable=False)
    apellido       = Column(String(100), nullable=True)
    telefono       = Column(String(20))
    email          = Column(String(100), index=True)
    direccion      = Column(String(200))
    fecha_registro = Column(DateTime, server_default=func.now())

    # Relaciones
    turnos = relationship("Turno", back_populates="cliente")