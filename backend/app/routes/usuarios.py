from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/")
def test_usuarios(current_user: Usuario = Depends(get_current_user)):
    return {"message": "Router de usuarios funcionando"}
