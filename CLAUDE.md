# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stratus Industries** is a multi-tenant SaaS platform for hair salons. It is not a single salon — it manages multiple salons (tenants), each identified by a unique `slug`.

The system has four parts:
- **backend/**: FastAPI + SQLAlchemy + MySQL — shared API for all tenants
- **frontend/**: Admin/staff dashboard per salon (React + TypeScript + Vite)
- **frontend-user/**: Public-facing customer booking app per salon (React + Vite, plain JS)
- **super-admin/**: Internal Stratus Industries panel to manage all salons and billing (React + Vite, plain JS)

## Development Commands

### Backend
```bash
cd backend
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### Admin Frontend (per salon)
```bash
cd frontend
pnpm install
pnpm dev
# Runs on http://localhost:5173
```

### Customer Booking Frontend (per salon)
```bash
cd frontend-user
pnpm install
pnpm dev
# Runs on http://localhost:5174
```

### Super-Admin Panel (Stratus Industries internal)
```bash
cd super-admin
npm install   # uses npm, not pnpm
npm run dev
# Runs on http://localhost:5175
```

### Database (Docker)
```bash
docker compose up -d   # starts MySQL on port 3306
```

### Build
```bash
cd frontend && pnpm build         # TypeScript check + Vite build
cd frontend-user && pnpm build    # Vite build only (no TS)
cd super-admin && npm run build   # Vite build only (no TS)
```

## Architecture

### Multi-Tenancy

Every salon is a row in the `salones` table with a unique `slug`. All protected routes resolve the salon via:
- **JWT**: `salon_id` claim in the token (for admin/staff routes)
- **URL slug**: `/public/{slug}/...` (for customer-facing routes)
- **Query param**: `?slug=...` on `/auth/login`

Users (staff/admin) belong to exactly one salon. Superadmin users have `salon_id = NULL` and access `/superadmin/...` routes.

### Backend (`backend/app/`)
- `main.py` — FastAPI app, CORS config, router registration
- `database/connection.py` — SQLAlchemy engine and session setup
- `auth/security.py` — JWT creation/verification, password hashing
- `auth/dependencies.py` — `get_current_user`, `require_superadmin` FastAPI dependencies
- `models/` — ORM table definitions (auto-created on startup via `Base.metadata.create_all`)
- `routes/` — One file per router (see API Surface below)
- `schemas/` — Pydantic request/response models
- `services/` — Business logic (keep fat logic here, thin routes)

**Database**: MySQL 8 via Docker Compose (`docker-compose.yml`). Connection string in `backend/.env` as `DATABASE_URL`.

**Key models**:
- `Salon` — tenant (nombre, slug, activo, plan)
- `Usuario` — staff/admin/superadmin; belongs to a salon (or null for superadmin)
- `Turno` — appointment linking a cliente, empleado, and one or more servicios
- `CierreCaja` — daily cash closing records with totals by payment method
- `HorarioEmpleado` / `BloqueoAgenda` — employee schedules and blocked slots (availability)
- `ConfigSalon` — per-salon configuration (nombre_salon, etc.)
- `HorarioSalon` — salon opening hours per day of week
- `PagoSalon` — billing records for each salon (managed by superadmin)

### Admin Frontend (`frontend/src/`)
- `App.tsx` — routes wrapped in `<Layout>`, protected by `AuthContext`
- `context/AppContext.jsx` — global state: salonName (from API), sidebar state, notifications
- `context/AuthContext.jsx` — JWT login/logout, token in localStorage
- `context/ThemeContext.jsx` — light/dark theme toggle
- `api/axios.js` — Axios instance pointing at `VITE_API_URL`, injects Bearer token
- `pages/` — DashboardPage, TurnosPage, ClientesPage, EmpleadosPage, ServiciosPage, CajaPage, AnalisisPage, RecordatoriosPage, ConfiguracionPage, LoginPage
- `components/layout/` — Layout, Header, SideBar
- `components/turnos/` — TurnoModal (create/edit), TurnoCard, TableroSemanal (weekly board)
- `components/caja/` — CajaDiaria, CierreModal, ComisionesEmpleados, GastoModal, etc.

Uses React Query for server state and plain Context for shared lookups.

### Customer Frontend (`frontend-user/src/`)
- `App.jsx` — three routes: Home → Booking → Confirmation
- `services/api.js` — Axios instance from `VITE_API_URL`
- `components/MiNavbar.jsx` — fetches salon name from `/public/{slug}/info`
- `components/Footer.jsx` — fetches salon name; shows "Powered by Stratus Industries"
- `pages/Booking.jsx` — service selector, date/time picker, customer form, POSTs to create cliente then turno

### Super-Admin Panel (`super-admin/src/`)
- `App.jsx` — routes: Login → Dashboard → Pagos; auth via `sa_token` in localStorage
- `services/api.js` — Axios instance, injects `sa_token`; auto-redirects to `/login` on 401
- `pages/Dashboard.jsx` — lists all salons, manage users, toggle salon active/inactive
- `pages/Pagos.jsx` — billing records per salon per month
- `pages/SalonDetalle.jsx` — salon detail view
- `components/Sidebar.jsx` — navigation sidebar for superadmin

## Environment Variables

`backend/.env`:
```
DATABASE_URL=mysql+pymysql://user:password@localhost/peluqueria
SUPERADMIN_SETUP_SECRET=your_secret_here
```

`frontend/.env` (committed):
```
VITE_API_URL=http://localhost:8000
VITE_SALON_SLUG=villan
```

`frontend-user/.env` (committed):
```
VITE_API_URL=http://localhost:8000
VITE_SALON_SLUG=villan
```

`super-admin/.env`:
```
VITE_API_URL=http://localhost:8000
```

## API Surface

Base URL: `http://localhost:8000`

| Prefix | Auth | Purpose |
|--------|------|---------|
| `/auth/login` | None | Login (form: username, password; query: slug) |
| `/auth/me` | Bearer | Current user info |
| `/auth/setup` | None | One-time initial salon + admin setup |
| `/auth/superadmin/setup` | Secret | One-time superadmin creation (hidden from docs) |
| `/public/{slug}/info` | None | Salon public info (nombre, etc.) |
| `/public/{slug}/servicios` | None | Service catalog |
| `/public/{slug}/empleados` | None | Staff list |
| `/public/{slug}/disponibilidad` | None | Available slots |
| `/public/{slug}/turnos` | None | Create appointment (customer booking) |
| `/turnos` | Bearer | Appointments CRUD |
| `/clientes` | Bearer | Customer CRUD |
| `/empleados` | Bearer | Staff CRUD |
| `/servicios` | Bearer | Service catalog CRUD |
| `/pagos` | Bearer | Payment records |
| `/gastos` | Bearer | Expense records |
| `/caja/diaria` `/caja/mensual` `/caja/cierre` | Bearer | Cash summaries |
| `/caja/cerrar` | Bearer | POST to close the day |
| `/horarios-empleado` | Bearer | Employee schedules |
| `/horarios-salon` | Bearer | Salon opening hours |
| `/config-salon` | Bearer | Salon configuration (nombre_salon, etc.) |
| `/bloqueos-agenda` | Bearer | Calendar blocks |
| `/usuarios` | Bearer | User account management |
| `/superadmin/salones` | Bearer (superadmin) | List/create/update salons |
| `/superadmin/salones/{id}/usuarios` | Bearer (superadmin) | Users of a salon |
| `/superadmin/usuarios/{id}/reset-password` | Bearer (superadmin) | Reset staff password |
| `/superadmin/usuarios/{id}/toggle-activo` | Bearer (superadmin) | Enable/disable user |
| `/superadmin/pagos/` | Bearer (superadmin) | Billing records |

CORS: allows `localhost:5173`, `5174`, `5175` in dev. Production regex placeholder in `main.py` needs updating.

## Branding Rules

- **Header / Sidebar top**: Shows the **salon's name** (fetched from API via `VITE_SALON_SLUG`) — this is the tenant's brand
- **Login page (admin)**: Shows salon name dynamically + "Powered by Stratus Industries" at bottom
- **Footer (user-facing)**: Salon name prominently + "Powered by Stratus Industries" in small subtle text
- **Sidebar footer (admin)**: "Stratus Industries © year"
- **Super-admin panel**: Stratus Industries branding throughout (it's internal tooling)
