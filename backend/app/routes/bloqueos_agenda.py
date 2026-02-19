from fastapi import APIRouter

router = APIRouter(prefix="/bloqueos-agenda", tags=["Bloqueos Agenda"])

@router.get("/")
def test_bloqueos():
    return {"message": "Router de bloqueos de agenda funcionando"}