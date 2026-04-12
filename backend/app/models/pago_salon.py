from sqlalchemy import Column, Integer, Numeric, Boolean, Date, Text, String, ForeignKey, UniqueConstraint
from app.database.connection import Base


class PagoSalon(Base):
    __tablename__ = "pagos_salon"
    __table_args__ = (
        UniqueConstraint("salon_id", "anio", "mes", name="uq_pago_salon_mes"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    salon_id   = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    anio       = Column(Integer, nullable=False)
    mes        = Column(Integer, nullable=False)   # 1–12
    monto      = Column(Numeric(10, 2), default=0)
    pagado     = Column(Boolean, default=False)
    fecha_pago = Column(Date, nullable=True)
    metodo     = Column(String(50), nullable=True)  # transferencia, efectivo, otro
    notas      = Column(Text, nullable=True)
