"""
API de integración para sistemas externos (ej. sistema de gestión).

Dos partes:
  1. Lectura máquina-a-máquina (header `X-API-Key`): endpoints de SOLO lectura,
     scopeados automáticamente al salón dueño de la clave.
  2. Gestión de las API Keys (auth normal de admin del salón): crear/listar/revocar.
  3. Sincronización con Google Sheets (auth de admin): configurar, probar e
     importar el histórico. Ver sheets_service.

Todo es aditivo: no modifica ninguna ruta existente ni afecta a otros salones.
"""
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as DateType

from app.database.connection import get_db
from app.auth.dependencies import require_admin
from app.models.usuario import Usuario
from app.services import (
    api_key_service, turno_service, cliente_service,
    servicio_service, empleado_service, sheets_service,
)
from app.models.config_salon import ConfigSalon
from app.schemas.integracion import (
    ApiKeyCreate, ApiKeyCreated, ApiKeyOut, SheetsConfigIn, SheetsEstado,
)
from app.schemas.turno import Turno
from app.schemas.cliente import Cliente
from app.schemas.servicio import Servicio
from app.schemas.empleado import Empleado

router = APIRouter(prefix="/integracion", tags=["Integración (API externa)"])


# ─── Autenticación por API Key ────────────────────────────────────────────────

def get_salon_from_api_key(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> int:
    """Resuelve el salon_id a partir del header X-API-Key. 401 si es inválida."""
    salon_id = api_key_service.resolver_salon(db, x_api_key or "")
    if salon_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida o inactiva.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return salon_id


# ─── Lectura para el sistema externo (solo GET) ───────────────────────────────

@router.get("/turnos", response_model=List[Turno])
def api_turnos(
    skip: int = 0, limit: int = 100,
    salon_id: int = Depends(get_salon_from_api_key),
    db: Session = Depends(get_db),
):
    return turno_service.get_turnos(db, salon_id=salon_id, skip=skip, limit=limit)


@router.get("/turnos/{turno_id}", response_model=Turno)
def api_turno(
    turno_id: int,
    salon_id: int = Depends(get_salon_from_api_key),
    db: Session = Depends(get_db),
):
    turno = turno_service.get_turno(db, turno_id, salon_id=salon_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.get("/clientes", response_model=List[Cliente])
def api_clientes(
    salon_id: int = Depends(get_salon_from_api_key),
    db: Session = Depends(get_db),
):
    return cliente_service.get_clientes(db, salon_id=salon_id)


@router.get("/servicios", response_model=List[Servicio])
def api_servicios(
    salon_id: int = Depends(get_salon_from_api_key),
    db: Session = Depends(get_db),
):
    return servicio_service.get_servicios(db, salon_id=salon_id)


@router.get("/empleados", response_model=List[Empleado])
def api_empleados(
    salon_id: int = Depends(get_salon_from_api_key),
    db: Session = Depends(get_db),
):
    return empleado_service.get_empleados(db, salon_id=salon_id)


# ─── Gestión de API Keys (admin del salón, auth normal) ───────────────────────

@router.post("/keys", response_model=ApiKeyCreated, status_code=201)
def crear_key(
    data: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    clave = api_key_service.generar_api_key(db, current_user.salon_id, data.nombre)
    keys = api_key_service.listar_api_keys(db, current_user.salon_id)
    creada = keys[0]  # la más reciente
    return ApiKeyCreated(id=creada.id, nombre=creada.nombre, prefix=creada.prefix, clave=clave)


@router.get("/keys", response_model=List[ApiKeyOut])
def listar_keys(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return api_key_service.listar_api_keys(db, current_user.salon_id)


@router.delete("/keys/{key_id}")
def revocar_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    ok = api_key_service.revocar_api_key(db, current_user.salon_id, key_id)
    if not ok:
        raise HTTPException(status_code=404, detail="API Key no encontrada")
    return {"detail": "API Key revocada"}


# ─── Google Sheets (admin del salón) ──────────────────────────────────────────

@router.get("/sheets", response_model=SheetsEstado)
def estado_sheets(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return sheets_service.estado(db, current_user.salon_id)


@router.put("/sheets", response_model=SheetsEstado)
def configurar_sheets(
    data: SheetsConfigIn,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == current_user.salon_id).first()
    if not cfg:
        cfg = ConfigSalon(salon_id=current_user.salon_id)
        db.add(cfg)
    if data.spreadsheet is not None:
        cfg.sheets_spreadsheet_id = sheets_service.extraer_spreadsheet_id(data.spreadsheet) or None
    if data.activo is not None:
        if data.activo and not cfg.sheets_spreadsheet_id:
            raise HTTPException(status_code=400, detail="Primero cargá el Sheet.")
        cfg.sheets_activo = data.activo
    db.commit()
    return sheets_service.estado(db, current_user.salon_id)


@router.post("/sheets/probar")
def probar_sheets(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Verifica acceso y pestañas, y deja escritos los encabezados."""
    return sheets_service.probar(db, current_user.salon_id)


@router.post("/sheets/importar", status_code=202)
def importar_sheets(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """
    Vuelca todos los turnos del salón al Sheet (upsert por ID) en segundo plano.
    Se puede repetir sin duplicar filas. El resultado se ve en GET /sheets.
    """
    est = sheets_service.estado(db, current_user.salon_id)
    if not est["activo"]:
        raise HTTPException(status_code=400, detail="La sincronización con Sheets no está activa.")
    sheets_service.encolar_sync_completa(current_user.salon_id)
    return {"detail": "Importación en curso"}
