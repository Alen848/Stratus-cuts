"""
Rutas exclusivas del superadmin.
Prefijo: /superadmin/...
Todas requieren rol=superadmin en el JWT.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database.connection import get_db
from app.auth.dependencies import require_superadmin
from app.auth.security import hash_password
from app.models.salon import Salon
from app.models.usuario import Usuario

router = APIRouter(prefix="/superadmin", tags=["Superadmin"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class SalonCreate(BaseModel):
    nombre: str
    slug: str
    plan: str = "basico"
    # Credenciales del admin del salón
    admin_username: str
    admin_password: str


class SalonUpdate(BaseModel):
    nombre: Optional[str] = None
    plan: Optional[str] = None
    activo: Optional[bool] = None


class UsuarioAdminCreate(BaseModel):
    salon_id: int
    username: str
    password: str
    rol: str = "admin"


class ResetPassword(BaseModel):
    nueva_password: str


class UsuarioRolUpdate(BaseModel):
    rol: str


# ── Salones ────────────────────────────────────────────────────────────────────

@router.get("/salones")
def listar_salones(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    salones = db.query(Salon).order_by(Salon.fecha_alta.desc()).all()
    result = []
    for s in salones:
        admin = db.query(Usuario).filter(
            Usuario.salon_id == s.id,
            Usuario.rol == "admin",
        ).first()
        result.append({
            "id": s.id,
            "nombre": s.nombre,
            "slug": s.slug,
            "activo": s.activo,
            "plan": s.plan,
            "fecha_alta": s.fecha_alta,
            "admin_username": admin.username if admin else None,
        })
    return result


@router.post("/salones", status_code=201)
def crear_salon(
    payload: SalonCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    if db.query(Salon).filter(Salon.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya está en uso.")

    salon = Salon(
        nombre=payload.nombre,
        slug=payload.slug,
        plan=payload.plan,
        activo=True,
    )
    db.add(salon)
    db.flush()

    admin = Usuario(
        salon_id=salon.id,
        username=payload.admin_username,
        password_hash=hash_password(payload.admin_password),
        rol="admin",
        activo=True,
        debe_cambiar_password=True,  # El admin DEBE cambiar la contraseña al entrar
    )
    db.add(admin)
    db.commit()
    db.refresh(salon)

    return {
        "mensaje": "Salón y admin creados correctamente.",
        "salon_id": salon.id,
        "slug": salon.slug,
    }


@router.patch("/salones/{salon_id}")
def actualizar_salon(
    salon_id: int,
    payload: SalonUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado.")

    if payload.nombre is not None:
        salon.nombre = payload.nombre
    if payload.plan is not None:
        salon.plan = payload.plan
    if payload.activo is not None:
        salon.activo = payload.activo

    db.commit()
    return {"mensaje": "Salón actualizado."}


# ── Usuarios de salones ────────────────────────────────────────────────────────

@router.get("/salones/{salon_id}/usuarios")
def listar_usuarios_salon(
    salon_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    usuarios = db.query(Usuario).filter(
        Usuario.salon_id == salon_id,
        Usuario.rol != "superadmin",
    ).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "rol": u.rol,
            "activo": u.activo,
            "debe_cambiar_password": u.debe_cambiar_password,
        }
        for u in usuarios
    ]


@router.post("/salones/{salon_id}/usuarios", status_code=201)
def crear_usuario_admin(
    salon_id: int,
    payload: UsuarioAdminCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado.")

    existe = db.query(Usuario).filter(
        Usuario.salon_id == salon_id,
        Usuario.username == payload.username,
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="El username ya existe en ese salón.")

    roles_validos = ("admin", "empleado")
    if payload.rol not in roles_validos:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Debe ser: {', '.join(roles_validos)}.")

    usuario = Usuario(
        salon_id=salon_id,
        username=payload.username,
        password_hash=hash_password(payload.password),
        rol=payload.rol,
        activo=True,
        debe_cambiar_password=True,
    )
    db.add(usuario)
    db.commit()
    return {"mensaje": "Usuario creado.", "usuario_id": usuario.id}


@router.patch("/usuarios/{usuario_id}/reset-password")
def reset_password(
    usuario_id: int,
    payload: ResetPassword,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.rol != "superadmin",
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.password_hash = hash_password(payload.nueva_password)
    usuario.debe_cambiar_password = True
    db.commit()
    return {"mensaje": "Contraseña reseteada. El usuario deberá cambiarla al ingresar."}


@router.patch("/usuarios/{usuario_id}/rol")
def actualizar_rol(
    usuario_id: int,
    payload: UsuarioRolUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    roles_validos = ("admin", "empleado")
    if payload.rol not in roles_validos:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Debe ser: {', '.join(roles_validos)}.")

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.rol != "superadmin",
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.rol = payload.rol
    db.commit()
    return {"rol": usuario.rol}


@router.patch("/usuarios/{usuario_id}/toggle-activo")
def toggle_activo(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_superadmin),
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.rol != "superadmin",
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.activo = not usuario.activo
    db.commit()
    return {"activo": usuario.activo}
