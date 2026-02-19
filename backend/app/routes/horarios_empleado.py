from fastapi import APIRouter

router = APIRouter(prefix="/horarios-empleado", tags=["Horarios Empleado"])

@router.get("/")
def test_horarios():
    return {"message": "Router de horarios de empleado funcionando"}