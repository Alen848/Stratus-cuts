from fastapi import APIRouter

router = APIRouter(prefix="/empleados", tags=["Empleados"])

@router.get("/")
def test_empleados():
    return {"message": "Router de empleados funcionando"}