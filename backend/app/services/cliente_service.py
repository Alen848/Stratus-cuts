from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate

def get_cliente(db: Session, cliente_id: int):
    return db.query(Cliente).filter(Cliente.id == cliente_id).first()

def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Cliente).offset(skip).limit(limit).all()

def create_cliente(db: Session, cliente: ClienteCreate):
    # Si viene email, buscar si ya existe
    if cliente.email:
        existing = db.query(Cliente).filter(Cliente.email == cliente.email).first()
        if existing:
            return existing

    # Si viene teléfono, buscar si ya existe
    if cliente.telefono:
        existing = db.query(Cliente).filter(Cliente.telefono == cliente.telefono).first()
        if existing:
            return existing

    # Si no existe, crear nuevo
    db_cliente = Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def update_cliente(db: Session, cliente_id: int, cliente: ClienteUpdate):
    db_cliente = get_cliente(db, cliente_id)
    if db_cliente:
        for key, value in cliente.model_dump(exclude_unset=True).items():
            setattr(db_cliente, key, value)
        db.commit()
        db.refresh(db_cliente)
    return db_cliente

def delete_cliente(db: Session, cliente_id: int):
    db_cliente = get_cliente(db, cliente_id)
    if db_cliente:
        db.delete(db_cliente)
        db.commit()
    return db_cliente