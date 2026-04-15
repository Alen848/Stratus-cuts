from fastapi import APIRouter, Depends
from app.auth.dependencies import require_admin
from app.models.usuario import Usuario

router = APIRouter(prefix="/bloqueos-agenda", tags=["Bloqueos Agenda"])


@router.get("/")
def test_bloqueos(current_user: Usuario = Depends(require_admin)):
    return {"message": "Router de bloqueos de agenda funcionando"}
