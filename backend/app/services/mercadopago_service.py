"""
Envoltorio del SDK de Mercado Pago.

El import del SDK es perezoso (dentro de las funciones) para que la app
levante aunque el paquete `mercadopago` no esté instalado todavía; solo se
necesita cuando un salón realmente usa la integración.

Cada llamada usa el Access Token del salón (descifrado), nunca uno global.
"""
from typing import Optional


def _sdk(access_token: str):
    import mercadopago  # import perezoso
    return mercadopago.SDK(access_token)


def crear_preferencia(
    access_token: str,
    *,
    titulo: str,
    monto: float,
    external_reference: str,
    notification_url: Optional[str] = None,
    success_url: Optional[str] = None,
    failure_url: Optional[str] = None,
    pending_url: Optional[str] = None,
) -> dict:
    """
    Crea una preferencia de Checkout Pro para cobrar la seña.
    Solo métodos instantáneos (excluye ticket/efectivo y cajero).
    binary_mode=True => el pago es aprobado o rechazado, nunca queda 'pending'.
    """
    pref: dict = {
        "items": [{
            "title": titulo,
            "quantity": 1,
            "unit_price": round(float(monto), 2),
            "currency_id": "ARS",
        }],
        "external_reference": external_reference,
        "binary_mode": True,
        "payment_methods": {
            "excluded_payment_types": [{"id": "ticket"}, {"id": "atm"}],
            "installments": 1,
        },
    }

    back_urls = {}
    if success_url:
        back_urls["success"] = success_url
    if failure_url:
        back_urls["failure"] = failure_url
    if pending_url:
        back_urls["pending"] = pending_url
    if back_urls:
        pref["back_urls"] = back_urls
        if success_url:
            pref["auto_return"] = "approved"
    if notification_url:
        pref["notification_url"] = notification_url

    resp = _sdk(access_token).preference().create(pref)
    if resp.get("status") not in (200, 201):
        raise RuntimeError(f"Error creando preferencia MP: {resp.get('status')} {resp.get('response')}")

    r = resp["response"]
    return {
        "id": r["id"],
        "init_point": r.get("init_point"),
        "sandbox_init_point": r.get("sandbox_init_point"),
    }


def obtener_pago(access_token: str, payment_id: str) -> Optional[dict]:
    """Consulta el estado real de un pago en Mercado Pago. None si no existe."""
    resp = _sdk(access_token).payment().get(payment_id)
    if resp.get("status") != 200:
        return None
    return resp.get("response")
