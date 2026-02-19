from fastapi import APIRouter

router = APIRouter(prefix="/turns", tags=["Turns"])

@router.get("/")
def test_turns():
    return {"message": "Router de turns funcionando"}