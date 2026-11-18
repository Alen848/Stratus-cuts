# Stratus Cuts

**Sistema de gestión y reservas online para peluquerías, barberías y salones de belleza.**
Plataforma SaaS multi-tenant desarrollada por **Stratus Industries** (Mar del Plata, Argentina).

Un mismo backend atiende a varios salones a la vez. Cada salón tiene su propio panel de administración, su página pública de reservas y sus datos aislados del resto.

---

## Funcionalidades

### Para el salón (panel de administración)
- **Agenda de turnos**: tablero semanal por profesional, alta y edición de turnos con uno o más servicios.
- **Clientes**: ficha de cada cliente con su historial.
- **Empleados y horarios**: horarios por profesional, horarios del salón y bloqueos de agenda (vacaciones, francos, etc.).
- **Servicios**: catálogo con precios y duración.
- **Caja**: caja diaria y mensual, registro de pagos y gastos, comisiones por empleado y cierre de caja por medio de pago.
- **Análisis**: métricas del negocio.
- **Recordatorios por WhatsApp** a los clientes.
- **Configuración** del salón y gestión de usuarios del staff.
- **API Keys** para que sistemas externos lean turnos, clientes, servicios y empleados (solo lectura y limitado al salón).

### Para el cliente (reservas online)
- Reserva de turnos 24/7 desde la web del salón: elige servicio, profesional, día y horario disponible.
- **Pago online con Mercado Pago**: cada salón usa sus propias credenciales, que se guardan cifradas.
- **Confirmación del turno por email**.

### Para Stratus Industries (super-admin)
- Alta, baja y activación de salones.
- Gestión de usuarios de cada salón (reset de contraseña, habilitar/deshabilitar).
- Facturación mensual de cada salón.

---

## Arquitectura

```
                    ┌──────────────────────┐
  frontend/  ──────▶│                      │
  (admin del salón) │                      │
                    │   backend/ (FastAPI) │──────▶  MySQL 8
  frontend-user/ ──▶│   API REST única     │
  (reservas)        │   multi-tenant       │──────▶  Mercado Pago · SMTP
                    │                      │
  super-admin/ ────▶│                      │
  (interno)         └──────────────────────┘
```

**Multi-tenancy:** cada salón es una fila en la tabla `salones` con un `slug` único. El backend identifica el salón:
- por el **JWT** (claim `salon_id`) en las rutas del panel,
- por el **slug en la URL** (`/public/{slug}/...`) en las rutas públicas de reserva,
- por la **API Key** (`X-API-Key`) en las rutas de integración.

---

## Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Pydantic, JWT (python-jose), passlib/bcrypt, SlowAPI (rate limiting), cryptography (Fernet) |
| Base de datos | MySQL 8 |
| Panel admin | React 19, TypeScript, Vite, React Query, Zustand, React Router, Axios |
| Reservas / Super-admin | React 19, Vite, Axios |
| Integraciones | Mercado Pago (pagos + webhooks), SMTP (emails), WhatsApp |
| Infraestructura | Docker, Docker Compose, Nginx, devenv (Nix) |

---

## Estructura del repositorio

```
stratus-cuts/
├── backend/               # API FastAPI
│   └── app/
│       ├── auth/          # JWT, hashing y dependencias de autenticación
│       ├── database/      # Conexión y mini-migraciones
│       ├── models/        # Modelos ORM
│       ├── routes/        # Un router por recurso
│       ├── schemas/       # Modelos Pydantic
│       └── services/      # Lógica de negocio
├── frontend/              # Panel de administración del salón (React + TS)
├── frontend-user/         # App pública de reservas (React)
├── frontend-blue-moon/    # Frontend de reservas personalizado para un salón cliente
├── super-admin/           # Panel interno de Stratus Industries (React)
├── docker-compose.yml
├── docker-compose.staging.yml
└── .env.example
```

---

## Equipo

**Stratus Industries**, Mar del Plata, Argentina.

- **Bruno Sosa Villamón**: Co-founder & CEO
- **Alen** ([@Alen848](https://github.com/Alen848)): Co-founder · Desarrollo e infraestructura
