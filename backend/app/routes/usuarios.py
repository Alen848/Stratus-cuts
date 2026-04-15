from fastapi import APIRouter, Depends
from app.auth.dependencies import require_admin
from app.models.usuario import Usuario

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/")
def test_usuarios(current_user: Usuario = Depends(require_admin)):
    return {"message": "Router de usuarios funcionando"}
