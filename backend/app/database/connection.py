import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()  # Cargar variables de entorno desde .env

DATABASE_URL = os.getenv("DATABASE_URL")

# echo=True solo en modo DEBUG (evita loggear queries en producción)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

engine = create_engine(DATABASE_URL, echo=DEBUG)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()