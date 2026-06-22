from sqlalchemy import Column, Integer, Float, DateTime, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Turno(Base):
    __tablename__ = "turnos"

    id            = Column(Integer, primary_key=True, index=True)
    salon_id      = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    fecha_hora    = Column(DateTime, nullable=False)
    duracion      = Column(Integer, default=30)
    # estados: pendiente, pendiente_pago, confirmado, completado, cancelado, no_show, expirado
    estado        = Column(String(20), default="pendiente")
    metodo_pago   = Column(String(50), nullable=True)        # efectivo, débito, transferencia
    observaciones = Column(String(500))
    cliente_id    = Column(Integer, ForeignKey("clientes.id"), nullable=True)  # None = walk-in
    empleado_id   = Column(Integer, ForeignKey("empleados.id"), nullable=False)

    # ── Seña / Mercado Pago ──────────────────────────────────────────────────
    monto_total      = Column(Float, nullable=True)   # total del turno al momento de reservar
    monto_sena       = Column(Float, nullable=True)   # cuánto se cobra de seña
    saldo_pendiente  = Column(Float, nullable=True)   # total - seña (se paga en el local)
    sena_estado      = Column(String(20), default="no_aplica")  # no_aplica, pendiente, pagada, anulada
    mp_payment_id    = Column(String(50), nullable=True, index=True)
    mp_preference_id = Column(String(80), nullable=True)
    expira_en        = Column(DateTime, nullable=True)  # vencimiento del bloqueo en pendiente_pago

    # Recordatorios WhatsApp
    reminder_pre_sent        = Column(Boolean, default=False, nullable=False)  # recordatorio previo al turno
    reminder_pre_sent_at     = Column(DateTime, nullable=True)
    reminder_retorno_sent    = Column(Boolean, default=False, nullable=False)  # recordatorio 20-25 días después
    reminder_retorno_sent_at = Column(DateTime, nullable=True)

    # Relaciones
    cliente   = relationship("Cliente",  back_populates="turnos")
    empleado  = relationship("Empleado", back_populates="turnos")
    servicios = relationship("TurnoServicio", back_populates="turno")
    pagos     = relationship("Pago", back_populates="turno")