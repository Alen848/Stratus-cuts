from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import date as DateType

from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.models.comprobante import Comprobante
from app.models.turno import Turno as TurnoModel
from app.services import turno_service
from app.schemas.turno import Turno, TurnoCreate, TurnoUpdate

router = APIRouter(prefix="/turns", tags=["Turns"])


# ── Rutas estáticas PRIMERO (antes de las paramétricas /{id}) ─────────────────

@router.get("/recordatorios")
def get_recordatorios(
    horas_pre: int = 24,
    dias_retorno_desde: int = 20,
    dias_retorno_hasta: int = 25,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.get_recordatorios(
        db,
        salon_id=current_user.salon_id,
        horas_pre=horas_pre,
        dias_retorno_desde=dias_retorno_desde,
        dias_retorno_hasta=dias_retorno_hasta,
    )


@router.get("/disponibilidad-semanal/{empleado_id}")
def get_disponibilidad_semanal(
    empleado_id: int,
    fecha_inicio: DateType,
    duracion: int = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.get_horarios_semanales(
        db, empleado_id, fecha_inicio, salon_id=current_user.salon_id, duracion=duracion
    )


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[Turno])
def read_turnos(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.get_turnos(db, salon_id=current_user.salon_id, skip=skip, limit=limit)


@router.post("/", response_model=Turno)
def create_turno(
    turno: TurnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.create_turno(db, turno, salon_id=current_user.salon_id)


@router.get("/{turno_id}", response_model=Turno)
def read_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    turno = turno_service.get_turno(db, turno_id, salon_id=current_user.salon_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.put("/{turno_id}", response_model=Turno)
def update_turno(
    turno_id: int, turno: TurnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    updated = turno_service.update_turno(db, turno_id, turno, salon_id=current_user.salon_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return updated


@router.delete("/{turno_id}")
def delete_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    deleted = turno_service.delete_turno(db, turno_id, salon_id=current_user.salon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return {"detail": "Turno eliminado correctamente"}


@router.get("/{turno_id}/comprobante")
def get_comprobante(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Devuelve el comprobante de transferencia adjuntado al turno (imagen o PDF)."""
    comp = db.query(Comprobante).filter(
        Comprobante.turno_id == turno_id,
        Comprobante.salon_id == current_user.salon_id,
    ).first()
    if not comp:
        raise HTTPException(status_code=404, detail="No hay comprobante para este turno.")
    return Response(
        content=comp.data,
        media_type=comp.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{comp.filename or "comprobante"}"'},
    )


MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/{turno_id}/comprobante")
async def subir_comprobante(
    turno_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    El salón adjunta el comprobante de la transferencia.

    Sirve para el caso habitual: el cliente manda el comprobante por WhatsApp
    (que es lo que le pide la pantalla de confirmación) y no lo sube al sitio,
    así que la secretaria lo carga desde el panel para que quede en el turno.
    """
    turno = db.query(TurnoModel).filter(
        TurnoModel.id == turno_id,
        TurnoModel.salon_id == current_user.salon_id,
    ).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado.")

    ct = (file.content_type or "").lower()
    if not (ct.startswith("image/") or ct == "application/pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen o un PDF.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if len(data) > MAX_COMPROBANTE_BYTES:
        raise HTTPException(status_code=400, detail="El archivo supera los 5 MB.")

    # Upsert: un comprobante por turno (si se vuelve a subir, se reemplaza)
    comp = db.query(Comprobante).filter(Comprobante.turno_id == turno.id).first()
    if not comp:
        comp = Comprobante(turno_id=turno.id, salon_id=current_user.salon_id)
        db.add(comp)
    comp.filename     = (file.filename or "comprobante")[:255]
    comp.content_type = ct[:100]
    comp.data         = data
    turno.comprobante_subido = True
    db.commit()
    return {"ok": True}


@router.post("/{turno_id}/confirmar-sena", response_model=Turno)
def confirmar_sena_transferencia(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Confirma manualmente la seña por transferencia de un turno (secretaria)."""
    turno = turno_service.confirmar_sena_transferencia(db, turno_id, salon_id=current_user.salon_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.patch("/{turno_id}/reminder-sent")
def mark_reminder_sent(
    turno_id: int,
    tipo: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return turno_service.mark_reminder_sent(db, turno_id, tipo, salon_id=current_user.salon_id)
