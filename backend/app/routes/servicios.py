from fastapi import APIRouter

router = APIRouter(prefix="/servicios", tags=["Servicios"])

@router.get("/")

def test_servicios():

    return []
