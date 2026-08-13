from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.database.connection import Base


class WebhookEntrega(Base):
    """
    Registro de cada webhook saliente: si salió, qué contestó el receptor y
    cuánto tardó.

    Existe porque el envío es best-effort y sin reintentos: si el endpoint del
    otro sistema falla, el evento se pierde. Sin este registro nadie —ni el
    dueño ni nosotros— tenía forma de saber si algo se envió o qué respondió,
    y la integración se depuraba a ciegas.

    Es una tabla nueva (no columnas en otra) porque el arranque usa
    `create_all`, que crea tablas faltantes pero no altera las existentes.
    """
    __tablename__ = "webhook_entregas"

    id          = Column(Integer, primary_key=True, index=True)
    salon_id    = Column(Integer, ForeignKey("salones.id"), nullable=False, index=True)
    evento      = Column(String(50), nullable=False, index=True)
    url         = Column(String(300), nullable=False)
    # Código HTTP del receptor. NULL = no hubo respuesta (timeout, DNS, conexión).
    http_status = Column(Integer, nullable=True)
    # Motivo del fallo cuando no hubo respuesta o el status no fue 2xx
    error       = Column(Text, nullable=True)
    duracion_ms = Column(Integer, nullable=True)
    turno_id    = Column(Integer, nullable=True, index=True)  # sin FK: el turno puede haberse borrado
    enviado_en  = Column(DateTime, nullable=False, index=True)

    @property
    def ok(self):
        return self.http_status is not None and 200 <= self.http_status < 300
