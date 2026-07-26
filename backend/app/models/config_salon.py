from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from app.database.connection import Base


class ConfigSalon(Base):
    __tablename__ = "config_salon"

    id                    = Column(Integer, primary_key=True, index=True)
    salon_id              = Column(Integer, ForeignKey("salones.id"), unique=True, nullable=False)
    telefono              = Column(String(30),  nullable=True)
    direccion             = Column(String(200), nullable=True)
    url_reserva           = Column(String(300), nullable=True)
    reservas_online       = Column(Boolean, default=True)
    max_dias_anticipacion = Column(Integer, default=60)
    min_hs_anticipacion   = Column(Integer, default=1)

    # ── Integración Mercado Pago (credenciales propias del salón) ────────────
    mp_activo         = Column(Boolean, default=False, nullable=False)  # interruptor maestro
    mp_access_token   = Column(Text, nullable=True)        # 🔒 cifrado (Fernet), nunca se expone
    mp_public_key     = Column(String(255), nullable=True)
    sena_porcentaje   = Column(Integer, default=0, nullable=False)      # 0-100 (% del total)
    sena_obligatoria  = Column(Boolean, default=False, nullable=False)  # si exige seña para reservar

    # ── Seña por transferencia bancaria (confirmación manual de la secretaria) ─
    transferencia_activa  = Column(Boolean, default=False, nullable=False)  # ofrecer transferencia como método de seña
    transferencia_cbu     = Column(String(30),  nullable=True)   # CBU/CVU (se muestra al cliente)
    transferencia_alias   = Column(String(100), nullable=True)   # alias bancario
    transferencia_titular = Column(String(120), nullable=True)   # nombre del titular de la cuenta

    # ── Webhooks salientes (integración con sistemas externos) ───────────────
    webhook_url    = Column(String(300), nullable=True)   # a dónde se notifican los eventos
    webhook_secret = Column(String(80),  nullable=True)   # secreto compartido para firmar (HMAC)
    webhook_activo = Column(Boolean, default=False, nullable=False)
