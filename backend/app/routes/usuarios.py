from fastapi import APIRouter

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/")
def test_usuarios():
    return {"message": "Router de usuarios funcionando"}