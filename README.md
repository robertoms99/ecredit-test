# eCredit

Sistema de gestión de solicitudes de crédito. Monorepo con backend, frontend y simulador de proveedores bancarios.

## Stack

| | Bun (default) | Elixir (alternativo) |
|---|---|---|
| **Runtime** | Bun | Erlang/OTP |
| **Backend** | Hono + Drizzle + pg-boss | Phoenix + Ecto + Oban |
| **Frontend** | React + Vite + TailwindCSS | ← mismo |
| **Tiempo real** | Socket.IO | Phoenix Channels |
| **Puerto** | 3000 | 4000 |

> Solo uno de los backends se ejecuta a la vez. Comparten la misma base de datos PostgreSQL.

## Estructura

```
apps/
├── backend/          # API REST con Bun (puerto 3000)
├── backend-ex/       # API REST con Elixir/Phoenix (puerto 4000)
├── frontend/         # SPA React (puerto 5173 dev / 8080 prod)
└── provider-sim/     # Simulador de proveedores (puerto 3001)
```

---

## Variables de Entorno

Hay dos niveles de `.env`:

| Archivo | Propósito |
|---------|-----------|
| `.env` (raíz) | Docker Compose — puertos, DB, Redis, API URLs |
| `apps/*/.env` | Desarrollo local sin Docker — config específica por app |

Para empezar, solo necesitas el de la raíz:

```bash
cp .env.example .env
```

El `.env` viene preconfigurado para el backend **Bun**. Para usar **Elixir**, cambia estas dos líneas:

```bash
VITE_API_URL=http://localhost:4000
VITE_REALTIME_PROVIDER=phoenix
```

---

## Despliegue Local con Docker Compose

> Requiere [Docker](https://docs.docker.com/get-docker/) y [just](https://github.com/casey/just#installation) (o `mise install just`).

### Con Bun (default)

```bash
just start
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| API Docs | http://localhost:3000/docs |
| Provider Sim | http://localhost:3001 |

### Con Elixir

Antes, edita `.env`:
```bash
VITE_API_URL=http://localhost:4000
VITE_REALTIME_PROVIDER=phoenix
```

Luego:
```bash
just start-elixir
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Oban Dashboard | http://localhost:4000/oban |
| Provider Sim | http://localhost:3001 |

### Comandos Docker

```bash
just down              # Detener servicios
just clean             # Detener y limpiar volumes
just logs backend      # Ver logs de un servicio
just ps                # Estado de servicios
just db-shell          # Shell de PostgreSQL
```

---

## Credenciales de Prueba

```
Email: admin1@ecredit.com
Pass:  admin123456
```

### Usuarios de prueba para solicitudes

**Mexico (MX)**

| CURP | Score | Resultado |
|------|-------|-----------|
| `GOMC860101HDFRRA09` | 750 | ✅ Aprobado |
| `BAPC901215MDFRRS03` | 450 | ❌ Rechazado |

**Colombia (CO)**

| Cédula | Score | Resultado |
|--------|-------|-----------|
| `1234567890` | 680 | ✅ Aprobado |
| `9876543210` | 400 | ❌ Rechazado |

---

## Desarrollo Local

Para desarrollo necesitas Docker solo para la infraestructura (DB, Redis). Las apps corren directamente en tu máquina.

### Con Bun

```bash
just dev
```

Esto levanta PostgreSQL + Redis con Docker y arranca backend, frontend y provider-sim en paralelo.

### Con Elixir

```bash
just dev-elixir
```

Levanta PostgreSQL con Docker y arranca backend-ex, frontend y provider-sim.

> **Primera vez con Elixir?** Necesitas instalar dependencias y crear la DB:
> ```bash
> cd apps/backend-ex
> mix deps.get
> mix ecto.setup    # create + migrate + seed
> cd ../..
> just dev-elixir
> ```

### Guías detalladas por app

Cada aplicación tiene su propio README con documentación específica de desarrollo:

- [Backend Bun](apps/backend/README.md) — Hono, Drizzle, pg-boss, Socket.IO
- [Backend Elixir](apps/backend-ex/README.md) — Phoenix, Ecto, Oban, Channels
- [Frontend](apps/frontend/README.md) — React, Vite, TailwindCSS
- [Provider Simulator](apps/provider-sim/README.md)

---

## Documentación

- [MVP y Visión del Producto](docs/mvp.md)
- [Arquitectura](docs/architecture.md)
- [Evaluación de Riesgo](docs/evaluation.md)
- [Migración entre Backends](docs/backend-migration.md)
