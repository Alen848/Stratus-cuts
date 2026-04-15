import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import Base, engine

# Importar todos los modelos para que SQLAlchemy los reconozca
from app.models import (
    salon, cliente, empleado, servicio, turno,
    turno_servicio, pago, gasto, cierre_caja,
    horario_empleado, horario_salon, config_salon, bloqueo_agenda, usuario,
    pago_salon,
)

from app.routes.auth            import router as auth_router
from app.routes.clientes        import router as clientes_router
from app.routes.empleados       import router as empleados_router
from app.routes.servicios       import router as servicios_router
from app.routes.turnos          import router as turns_router
from app.routes.pagos           import pagos_router, gastos_router, caja_router
from app.routes.horarios_empleado import router as horarios_empleado_router
from app.routes.horarios_salon    import router as horarios_salon_router
from app.routes.config_salon      import router as config_salon_router
from app.routes.bloqueos_agenda import router as bloqueos_agenda_router
from app.routes.usuarios        import router as usuarios_router
from app.routes.public          import router as public_router
from app.routes.superadmin      import router as superadmin_router
from app.routes.pagos_superadmin import router as pagos_superadmin_router

# Crear tablas en la base de datos (si no existen)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Turnera Peluquería API", version="2.0.0")

# Configuración CORS
# ─── Orígenes de desarrollo ────────────────────────────────────────────────────
DEV_ORIGINS = [
    "http://localhost:5173",   # admin frontend
    "http://127.0.0.1:5173",
    "http://localhost:5174",   # user frontend
    "http://127.0.0.1:5174",
    "http://localhost:5175",   # super-admin
    "http://127.0.0.1:5175",
]

# ─── Dominio de producción (configurar en .env) ────────────────────────────────
# Ejemplo: PRODUCTION_DOMAIN=stratusapp.com
# Eso permitirá *.stratusapp.com (subdominio por salón) y el dominio raíz
PRODUCTION_DOMAIN = os.getenv("PRODUCTION_DOMAIN", "")

allowed_origins = list(DEV_ORIGINS)
origin_regex = None

if PRODUCTION_DOMAIN:
    # Permite: https://stratusapp.com  y  https://cualquier-salon.stratusapp.com
    escaped = PRODUCTION_DOMAIN.replace(".", r"\.")
    origin_regex = rf"https://({escaped}|[a-z0-9-]+\.{escaped})"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
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
app.include_router(horarios_salon_router)
app.include_router(config_salon_router)
app.include_router(bloqueos_agenda_router)
app.include_router(usuarios_router)
app.include_router(superadmin_router)
app.include_router(pagos_superadmin_router)


@app.get("/")
def root():
    return {"message": "API Turnera funcionando v2"}
