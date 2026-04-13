from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/bloqueos-agenda", tags=["Bloqueos Agenda"])


@router.get("/")
def test_bloqueos(current_user: Usuario = Depends(get_current_user)):
    return {"message": "Router de bloqueos de agenda funcionando"}
