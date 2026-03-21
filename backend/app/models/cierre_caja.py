from sqlalchemy import Column, Integer, Float, Date, DateTime, String, func
from app.database.connection import Base

class CierreCaja(Base):
    __tablename__ = "cierres_caja"

    id                     = Column(Integer, primary_key=True, index=True)
    fecha                  = Column(Date,    unique=True, nullable=False, index=True)
    
    saldo_anterior         = Column(Float,   default=0.0) # lo que quedó de ayer
    
    # Totales Teóricos (Calculados al momento del cierre)
    total_efectivo_teorico = Column(Float,   default=0.0)
    total_transferencia    = Column(Float,   default=0.0)
    total_debito           = Column(Float,   default=0.0)
    total_gastos           = Column(Float,   default=0.0)
    
    # Ingreso Manual
    efectivo_real          = Column(Float,   nullable=False)
    
    # Resultado
    diferencia             = Column(Float,   default=0.0) # real - teorico
    observaciones          = Column(String(500))
    fecha_cierre           = Column(DateTime, server_default=func.now())
