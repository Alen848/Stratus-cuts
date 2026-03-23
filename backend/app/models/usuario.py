from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        UniqueConstraint("salon_id", "username", name="uq_usuario_salon_username"),
    )

    id            = Column(Integer, primary_key=True, index=True)
    salon_id      = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    username      = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol           = Column(String(50), default="empleado")  # admin, empleado
    empleado_id   = Column(Integer, ForeignKey("empleados.id"), nullable=True)

    # Relaciones
    empleado = relationship("Empleado", back_populates="usuario")