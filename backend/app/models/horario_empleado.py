from sqlalchemy import Column, Integer, String, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class HorarioEmpleado(Base):
    __tablename__ = "horarios_empleado"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0=lunes, 6=domingo (o como prefieras)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)

    # Relaciones
    empleado = relationship("Empleado", back_populates="horarios")