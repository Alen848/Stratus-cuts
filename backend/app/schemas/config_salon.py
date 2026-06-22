from pydantic import BaseModel
from typing import Optional


class ConfigSalonUpdate(BaseModel):
    nombre_salon:         Optional[str] = None
    telefono:             Optional[str] = None
    direccion:            Optional[str] = None
    url_reserva:          Optional[str] = None
    reservas_online:      Optional[bool] = True
    max_dias_anticipacion: Optional[int] = 60
    min_hs_anticipacion:  Optional[int] = 1

    # ── Mercado Pago ─────────────────────────────────────────────────────────
    mp_activo:        Optional[bool] = None
    mp_access_token:  Optional[str]  = None   # write-only: solo se envía al guardar
    mp_public_key:    Optional[str]  = None
    sena_porcentaje:  Optional[int]  = None
    sena_obligatoria: Optional[bool] = None


class ConfigSalonOut(BaseModel):
    salon_id:             int
    nombre_salon:         str
    slug:                 str
    telefono:             Optional[str]
    direccion:            Optional[str]
    url_reserva:          Optional[str]
    reservas_online:      bool
    max_dias_anticipacion: int
    min_hs_anticipacion:  int

    # ── Mercado Pago (NUNCA se devuelve el access token) ─────────────────────
    mp_activo:        bool
    mp_configurado:   bool            # True si hay un access token guardado
    mp_public_key:    Optional[str]
    sena_porcentaje:  int
    sena_obligatoria: bool

    class Config:
        from_attributes = True
