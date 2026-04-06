from sqlalchemy import Column, Integer, Time, Boolean, ForeignKey, UniqueConstraint
from app.database.connection import Base


class HorarioSalon(Base):
    __tablename__ = "horarios_salon"

    id             = Column(Integer, primary_key=True, index=True)
    salon_id       = Column(Integer, ForeignKey("salones.id"), nullable=False)
    dia_semana     = Column(Integer, nullable=False)  # 0=Lunes … 6=Domingo (weekday())
    hora_apertura  = Column(Time, nullable=False)
    hora_cierre    = Column(Time, nullable=False)
    activo         = Column(Boolean, default=True)    # False = día cerrado

    __table_args__ = (
        UniqueConstraint("salon_id", "dia_semana", name="uq_horario_salon_dia"),
    )
