import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.usuario import Usuario
from app.models.salon import Salon
from app.auth.security import verify_password, create_access_token, hash_password
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

SUPERADMIN_SETUP_SECRET = os.getenv("SUPERADMIN_SETUP_SECRET", "")


class SetupPayload(BaseModel):
    salon_nombre: str
    slug: str
    username: str
    password: str


class SuperadminSetupPayload(BaseModel):
    secret: str
    username: str
    password: str


@router.post("/login")
def login(
    slug: str,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # Buscar usuario por username
    user = db.query(Usuario).filter(
        Usuario.username == form_data.username,
        or_(Usuario.activo == True, Usuario.activo == None),
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Si no es superadmin, validar salón
    if user.rol != "superadmin":
        # Buscar el salón por el slug
        salon = db.query(Salon).filter(
            Salon.slug == slug,
            Salon.activo == True
        ).first()

        if not salon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El salón especificado no existe o no está activo",
            )

        # Validar que el usuario pertenezca a ese salón
        if user.salon_id != salon.id:
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

    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user.rol,
        "debe_cambiar_password": user.debe_cambiar_password,
        "salon_id": user.salon_id,
    }


@router.get("/me")
def me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "rol": current_user.rol,
        "salon_id": current_user.salon_id,
        "empleado_id": current_user.empleado_id,
        "debe_cambiar_password": current_user.debe_cambiar_password,
    }


# ─── Setup inicial: crea un salón + usuario admin ─────────────────────────────
@router.post("/setup", status_code=201)
def setup_inicial(payload: SetupPayload, db: Session = Depends(get_db)):
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

    return {
        "mensaje": "Configuración inicial completada.",
        "salon_id": salon.id,
        "slug": salon.slug
    }


# ─── Crear superadmin (protegido por secret en variable de entorno) ────────────
@router.post("/superadmin/setup", status_code=201, include_in_schema=False)
def crear_superadmin(payload: SuperadminSetupPayload, db: Session = Depends(get_db)):
    """
    Crea el usuario superadmin. Solo funciona si SUPERADMIN_SETUP_SECRET está
    definido en el .env y el secret en el body coincide.
    No aparece en la documentación de la API.
    """
    if not SUPERADMIN_SETUP_SECRET or payload.secret != SUPERADMIN_SETUP_SECRET:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    existe = db.query(Usuario).filter(Usuario.rol == "superadmin").first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un superadmin.")

    sa = Usuario(
        salon_id=None,
        username=payload.username,
        password_hash=hash_password(payload.password),
        rol="superadmin",
        activo=True,
        debe_cambiar_password=False,
    )
    db.add(sa)
    db.commit()
    return {"mensaje": "Superadmin creado correctamente."}