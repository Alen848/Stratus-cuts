# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Turnera Villan** is an appointment management system for a hair salon (peluquería). It has three parts:
- **Backend**: FastAPI + SQLAlchemy + MySQL
- **frontend/**: Admin/staff dashboard (React + TypeScript + Vite)
- **frontend-user/**: Public-facing customer booking app (React + Vite, plain JS)

## Development Commands

### Backend
```bash
cd backend
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### Admin Frontend
```bash
cd frontend
pnpm install
pnpm dev
# Runs on http://localhost:5173
```

### Customer Booking Frontend
```bash
cd frontend-user
pnpm install
pnpm dev
# Runs on http://localhost:5174
```

### Using devenv (Nix)
```bash
backend-dev    # uvicorn backend
frontend-dev   # pnpm dev in frontend/
db-start       # starts PostgreSQL via Docker
```

### Build
```bash
cd frontend && pnpm build       # TypeScript check + Vite build
cd frontend-user && pnpm build  # Vite build only (no TS)
```

## Architecture

### Backend (`backend/app/`)
- `main.py` — FastAPI app, CORS config, router registration
- `database/` — SQLAlchemy engine and session setup
- `models/` — ORM table definitions (auto-created on startup via `Base.metadata.create_all`)
- `routes/` — One file per router (turns, clientes, empleados, servicios, pagos, gastos, caja, horarios-empleado, bloqueos-agenda, usuarios)
- `schemas/` — Pydantic request/response models
- `services/` — Business logic (keep fat logic here, thin routes)

**Database**: MySQL via PyMySQL. Connection string in `backend/.env` as `DATABASE_URL`. A `turnera.db` SQLite file also exists locally.

**Key domain concepts**:
- `turnos` — appointments linking a cliente, empleado, and one or more servicios
- `cierres_caja` — daily cash closing records with totals by payment method and a cash difference
- `horarios_empleado` / `bloqueos_agenda` — employee schedules and blocked slots (used to compute availability)

### Admin Frontend (`frontend/src/`)
- `App.tsx` — routes wrapped in `<Layout>`
- `context/` — `AppContext` holds global state (clientes, empleados, servicios, turnos)
- `api/axios.js` — Axios instance pointing at `VITE_API_URL`
- `pages/` — TurnosPage, ClientesPage, EmpleadosPage, ServiciosPage, CajaPage, Dashboard
- `components/turnos/` — TurnoModal (create/edit), TurnoCard, TableroSemanal (weekly board)
- `components/caja/` — CajaDiaria, CierreModal, ComisionesEmpleados

Uses React Query for server state and plain Context for shared lookups.

### Customer Frontend (`frontend-user/src/`)
- `App.jsx` — three routes: Home → Booking → Confirmation
- `services/api.js` — Axios instance from `VITE_API_URL`
- `pages/Booking.jsx` — service selector, date/time picker, customer form, sends POST to create cliente then turno

## Environment Variables

`backend/.env`:
```
DATABASE_URL=mysql+pymysql://user:password@localhost/peluqueria
```

`frontend-user/.env`:
```
VITE_API_URL=http://localhost:8000
```

Admin frontend reads `VITE_API_URL` from environment (no `.env` file committed).

## API Surface

Base URL: `http://localhost:8000`

| Prefix | Purpose |
|--------|---------|
| `/turns` | Appointments CRUD + `GET /turns/disponibilidad-semanal/{empleado_id}` |
| `/clientes` | Customer CRUD |
| `/empleados` | Staff CRUD |
| `/servicios` | Service catalog CRUD |
| `/pagos` | Payment records |
| `/gastos` | Expense records |
| `/caja` | Cash summaries (`/caja/diaria`, `/caja/mensual`, `/caja/cierre`) and `POST /caja/cerrar` |
| `/horarios-empleado` | Employee schedules |
| `/bloqueos-agenda` | Calendar blocks |
| `/usuarios` | User accounts |

CORS is open to all origins (development config).
