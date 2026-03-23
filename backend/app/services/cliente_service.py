from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate


def get_cliente(db: Session, cliente_id: int, salon_id: int):
    return db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.salon_id == salon_id,
    ).first()


def get_clientes(db: Session, salon_id: int, skip: int = 0, limit: int = 100):
    return db.query(Cliente).filter(
        Cliente.salon_id == salon_id
    ).offset(skip).limit(limit).all()


def create_cliente(db: Session, cliente: ClienteCreate, salon_id: int):
    # Si viene email, buscar si ya existe en este salón
    if cliente.email:
        existing = db.query(Cliente).filter(
            Cliente.salon_id == salon_id,
            Cliente.email == cliente.email,
        ).first()
        if existing:
            return existing

    # Si viene teléfono, buscar si ya existe en este salón
    if cliente.telefono:
        existing = db.query(Cliente).filter(
            Cliente.salon_id == salon_id,
            Cliente.telefono == cliente.telefono,
        ).first()
        if existing:
            return existing

    db_cliente = Cliente(salon_id=salon_id, **cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


def update_cliente(db: Session, cliente_id: int, cliente: ClienteUpdate, salon_id: int):
    db_cliente = get_cliente(db, cliente_id, salon_id)
    if db_cliente:
        for key, value in cliente.model_dump(exclude_unset=True).items():
            setattr(db_cliente, key, value)
        db.commit()
        db.refresh(db_cliente)
    return db_cliente


def delete_cliente(db: Session, cliente_id: int, salon_id: int):
    from app.models.turno import Turno
    db_cliente = get_cliente(db, cliente_id, salon_id)
    if not db_cliente:
        return None
    tiene_turnos = db.query(Turno).filter(Turno.cliente_id == cliente_id).first()
    if tiene_turnos:
        raise HTTPException(status_code=400, detail="No se puede eliminar un cliente que tiene turnos asociados")
    db.delete(db_cliente)
    db.commit()
    return db_cliente
