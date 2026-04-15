from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.services import config_salon_service
from app.schemas.config_salon import ConfigSalonOut, ConfigSalonUpdate

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
