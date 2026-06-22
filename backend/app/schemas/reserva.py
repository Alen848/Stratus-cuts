from typing import Optional
from app.schemas.turno import TurnoCreate


class ReservaPublicaCreate(TurnoCreate):
    """
    Reserva desde el frontend público. Extiende TurnoCreate con campos de pago.
    Como son opcionales, los payloads viejos (sin estos campos) siguen siendo válidos.
    """
    pagar_sena: bool = False           # cuando la seña es OPCIONAL, el cliente eligió pagarla
    return_url: Optional[str] = None   # URL del frontend a la que vuelve tras pagar (back_urls)
