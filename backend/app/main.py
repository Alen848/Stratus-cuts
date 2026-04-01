from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import Base, engine

# Importar todos los modelos para que SQLAlchemy los reconozca
from app.models import (
    salon, cliente, empleado, servicio, turno,
    turno_servicio, pago, gasto, cierre_caja,
    horario_empleado, bloqueo_agenda, usuario,
)

from app.routes.auth            import router as auth_router
from app.routes.clientes        import router as clientes_router
from app.routes.empleados       import router as empleados_router
from app.routes.servicios       import router as servicios_router
from app.routes.turnos          import router as turns_router
from app.routes.pagos           import pagos_router, gastos_router, caja_router
from app.routes.horarios_empleado import router as horarios_empleado_router
from app.routes.bloqueos_agenda import router as bloqueos_agenda_router
from app.routes.usuarios        import router as usuarios_router
from app.routes.public          import router as public_router

# Crear tablas en la base de datos (si no existen)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Turnera Peluquería API", version="2.0.0")

# Configuración CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas públicas (sin auth)
app.include_router(auth_router)
app.include_router(public_router)

# Rutas protegidas
app.include_router(clientes_router)
app.include_router(empleados_router)
app.include_router(servicios_router)
app.include_router(turns_router)
app.include_router(pagos_router)
app.include_router(gastos_router)
app.include_router(caja_router)
app.include_router(horarios_empleado_router)
app.include_router(bloqueos_agenda_router)
app.include_router(usuarios_router)


@app.get("/")
def root():
    return {"message": "API Turnera funcionando v2"}
