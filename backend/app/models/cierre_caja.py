from sqlalchemy import Column, Integer, Float, Date, DateTime, String, ForeignKey, UniqueConstraint, func
from app.database.connection import Base

class CierreCaja(Base):
    __tablename__ = "cierres_caja"
    __table_args__ = (
        UniqueConstraint("salon_id", "fecha", name="uq_cierre_salon_fecha"),
    )

    id                     = Column(Integer, primary_key=True, index=True)
    salon_id               = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    fecha                  = Column(Date,    nullable=False, index=True)
    
    saldo_anterior         = Column(Float,   default=0.0) # lo que quedó de ayer
    
    # Totales Teóricos (Calculados al momento del cierre)
    total_efectivo_teorico = Column(Float,   default=0.0)
    total_transferencia    = Column(Float,   default=0.0)
    total_debito           = Column(Float,   default=0.0)
    total_gastos           = Column(Float,   default=0.0)
    
    # Ingreso Manual
    efectivo_real          = Column(Float,   nullable=False)
    transferencia_real     = Column(Float,   default=0.0)
    tarjeta_real           = Column(Float,   default=0.0)
    
    # Resultado
    diferencia             = Column(Float,   default=0.0) # real - teorico
    observaciones          = Column(String(500))
    fecha_cierre           = Column(DateTime, server_default=func.now())
