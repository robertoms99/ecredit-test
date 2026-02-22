# eCredit

Sistema de gestión de solicitudes de crédito.
Monorepo con backend, frontend y simulador de proveedores bancarios.

---

## Stack

| | Bun (default) | Elixir (alternativo) |
|---|---|---|
| Runtime | Bun | Erlang/OTP |
| Backend | Hono + Drizzle + pg-boss | Phoenix + Ecto + Oban |
| Frontend | React + Vite + TailwindCSS | ← mismo |
| Tiempo real | Socket.IO | Phoenix Channels |
| Puerto | 3000 | 3000 |

⚠️ Solo uno de los backends se ejecuta a la vez.
Bun y Elixir no corren simultáneamente pero comparten la misma base de datos PostgreSQL.

---

## Requisitos

Para despliegue local con Docker Compose:

-  **[Docker](https://docs.docker.com/get-docker/)** (incluye Docker Compose v2)
- **[just](https://github.com/casey/just#installation)** (o `mise install just`)

---

## Variables de Entorno

Existen dos niveles de configuración:

| Archivo | Propósito |
|-------|-----------|
| .env (raíz) | Docker Compose / despliegue local |
| apps/*/.env | Desarrollo local (por aplicación) |

### .env (raíz)

Es el único archivo requerido para usar Docker Compose:

```
cp .env.example .env
```

Este archivo define:
- Puertos
- Base de datos
- Redis
- URLs del backend
- Variables VITE_* usadas en el build del frontend

El .env viene preconfigurado para Bun.

---

## Despliegue Local con Docker Compose

El frontend se construye en tiempo de build,
por lo que las variables VITE_* deben existir
antes de levantar los contenedores.

Aunque Esto lo gestiona automáticamente just.

---

### Bun (default)

```bash
just start
```

Internamente:
- Activa el profile bun
- Exporta:
  - VITE_REALTIME_PROVIDER=socketio
  - VITE_API_URL=http://localhost:3000

Servicios:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/docs
- Provider Sim: http://localhost:3001

---

### Elixir

```bash
just start-elixir
```

Internamente:
- Activa el profile elixir
- Exporta automáticamente:
  - VITE_REALTIME_PROVIDER=phoenix
  - VITE_API_URL=http://localhost:3000

Servicios:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Oban Dashboard: http://localhost:3000/oban
- Provider Sim: http://localhost:3001

⚠️ No es necesario editar .env manualmente para cambiar de backend.

---

## Comandos Docker
```bash
just down        — Detener servicios  
just clean       — Detener y limpiar volumes  
just logs <svc>  — Ver logs  
just ps          — Estado de servicios  
just db-shell    — Shell de PostgreSQL  
```

---

## Credenciales de Prueba  (Tanto desplegado como desarrollo)

```
Email: admin1@ecredit.com  
Pass:  admin123456  
```

```
Email: admin2@ecredit.com
Pass:  admin123456  
```

---

## Usuarios de Prueba  (Tanto desplegado como desarrollo)

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

En desarrollo:

- Docker se usa solo para infraestructura
- Las apps corren localmente
- Las variables de entorno son por aplicación (mira los .env.example)

```
apps/backend/.env  
apps/backend-ex/.env  
apps/frontend/.env  
apps/provider-sim/.env  
```

---

### Desarrollo con Bun

```bash
just dev
```


Levanta:
- PostgreSQL + Redis
- Backend Bun
- Frontend
- Provider simulator

---

### Desarrollo con Elixir

```bash
just dev-elixir
```

Levanta:
- PostgreSQL
- Backend Elixir
- Frontend
- Provider simulator

✔ No requiere comandos adicionales  
✔ No requiere setear variables manualmente  
✔ Funciona directamente si Elixir está instalado  

just dev-elixir debe funcionar out-of-the-box.

---

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
