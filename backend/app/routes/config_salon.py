from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.services import config_salon_service, webhook_service
from app.schemas.config_salon import (
    ConfigSalonOut, ConfigSalonUpdate, ConfigPasswordSet, ConfigPasswordVerify,
    WebhookEntregaOut,
)

router = APIRouter(prefix="/config-salon", tags=["Config Salón"])


@router.get("/", response_model=ConfigSalonOut)
def read_config(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return config_salon_service.get_config(db, current_user.salon_id)


@router.put("/", response_model=ConfigSalonOut)
def update_config(
    data: ConfigSalonUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return config_salon_service.update_config(db, current_user.salon_id, data)


@router.post("/verify-password")
def verify_config_password(
    data: ConfigPasswordVerify,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Verifica la clave de Configuración (para desbloquear la sección)."""
    ok = config_salon_service.verify_config_password(db, current_user.salon_id, data.password)
    return {"ok": ok}


@router.get("/webhook/entregas", response_model=List[WebhookEntregaOut])
def listar_entregas_webhook(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Historial de webhooks enviados: qué evento, cuándo y qué contestaron."""
    return webhook_service.listar_entregas(db, current_user.salon_id, limit)


@router.post("/webhook/probar")
def probar_webhook(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """
    Manda un evento de prueba a la URL configurada y devuelve qué respondió.
    Es sincrónico: lo dispara el dueño desde el panel y espera el resultado.
    """
    return webhook_service.probar(db, current_user.salon_id)


@router.post("/password", response_model=ConfigSalonOut)
def set_config_password(
    data: ConfigPasswordSet,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Setea, cambia o quita (nueva vacía) la clave de acceso a Configuración."""
    return config_salon_service.set_config_password(
        db, current_user.salon_id, data.current_password, data.nueva_password
    )
