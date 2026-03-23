from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.usuario import Usuario
from app.models.salon import Salon
from app.auth.security import verify_password, create_access_token, hash_password
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


class SetupPayload(BaseModel):
    salon_nombre: str
    slug: str
    username: str
    password: str


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({
        "sub": str(user.id),
        "salon_id": user.salon_id,
        "rol": user.rol,
    })
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(current_user: Usuario = Depends(get_current_user)):
    salon = None
    return {
        "id": current_user.id,
        "username": current_user.username,
        "rol": current_user.rol,
        "salon_id": current_user.salon_id,
        "empleado_id": current_user.empleado_id,
    }


# ─── Setup inicial: crea un salón + usuario admin ─────────────────────────────
# Solo funciona si no existe ningún salón en la base de datos.
@router.post("/setup", status_code=201)
def setup_inicial(payload: SetupPayload, db: Session = Depends(get_db)):
    """
    Crea el primer salón y usuario admin.
    Body: { "salon_nombre": "...", "slug": "...", "username": "...", "password": "..." }
    Solo disponible si la base de datos está vacía.
    """
    if db.query(Salon).first():
        raise HTTPException(status_code=400, detail="El sistema ya está configurado.")

    salon = Salon(nombre=payload.salon_nombre, slug=payload.slug)
    db.add(salon)
    db.flush()

    admin = Usuario(
        salon_id=salon.id,
        username=payload.username,
        password_hash=hash_password(payload.password),
        rol="admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(salon)

    return {"mensaje": "Configuración inicial completada.", "salon_id": salon.id, "slug": salon.slug}
