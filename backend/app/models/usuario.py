from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        UniqueConstraint("salon_id", "username", name="uq_usuario_salon_username"),
    )

    id                    = Column(Integer, primary_key=True, index=True)
    salon_id              = Column(Integer, ForeignKey("salones.id"), nullable=True, index=True)
    username              = Column(String(50), nullable=False)
    password_hash         = Column(String(255), nullable=False)
    rol                   = Column(String(50), default="empleado")  # superadmin, admin, empleado
    empleado_id           = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    debe_cambiar_password = Column(Boolean, default=False)
    activo                = Column(Boolean, default=True)

    # Relaciones
    empleado = relationship("Empleado", back_populates="usuario")