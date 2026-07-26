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

    # ── Seña por transferencia ───────────────────────────────────────────────
    transferencia_activa:  Optional[bool] = None
    transferencia_cbu:     Optional[str]  = None
    transferencia_alias:   Optional[str]  = None
    transferencia_titular: Optional[str]  = None

    # ── Webhooks salientes (integración externa) ─────────────────────────────
    webhook_url:    Optional[str]  = None
    webhook_secret: Optional[str]  = None   # write-only
    webhook_activo: Optional[bool] = None

    # Clave de Configuración: si hay candado activo, se exige para guardar
    config_password: Optional[str] = None   # write-only, se verifica y no se guarda como campo


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

    # ── Seña por transferencia (los datos bancarios sí se muestran) ──────────
    transferencia_activa:  bool
    transferencia_cbu:     Optional[str]
    transferencia_alias:   Optional[str]
    transferencia_titular: Optional[str]

    # ── Webhooks (NUNCA se devuelve el secreto) ──────────────────────────────
    webhook_url:        Optional[str]
    webhook_configurado: bool         # True si hay un secreto guardado
    webhook_activo:     bool

    # Candado de Configuración (nunca se devuelve el hash, solo si está activo)
    config_lock_activo: bool          # True si hay una clave de configuración seteada

    class Config:
        from_attributes = True


class ConfigPasswordSet(BaseModel):
    """Setear/cambiar/quitar la clave de Configuración."""
    current_password: Optional[str] = None   # requerida si ya hay una clave activa
    nueva_password:   Optional[str] = None    # vacía/None = quitar el candado


class ConfigPasswordVerify(BaseModel):
    password: str
