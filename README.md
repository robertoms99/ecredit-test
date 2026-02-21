# eCredit

Sistema de gestión de solicitudes de crédito. Monorepo con backend, frontend y simulador de proveedores bancarios.

## Documentación

- [MVP y Visión del Producto](docs/mvp.md) - Contexto, alcance y limitaciones del MVP
- [Arquitectura](docs/architecture.md) - Diseño del sistema, patrones y estructura
- [Evaluación de Riesgo](docs/evaluation.md) - Cómo funciona la evaluación crediticia
- [Migración entre Backends](docs/backend-migration.md) - Cómo cambiar entre Bun y Elixir
- [Comandos Rápidos](docs/quick-reference.md) - Referencia de comandos más usados

## Stack Tecnológico

### Default (Bun)

| Componente | Tecnología |
|------------|------------|
| Runtime | Bun |
| Backend | Hono + Drizzle ORM + pg-boss |
| Frontend | React + Vite + TailwindCSS |
| Base de datos | PostgreSQL |
| Cache/Pub-Sub | Redis |
| Tiempo real | Socket.io |

### Alternativo (Elixir)

| Componente | Tecnología |
|------------|------------|
| Runtime | Erlang/OTP |
| Backend | Phoenix + Ecto + Oban |
| Frontend | React + Vite + TailwindCSS (igual) |
| Base de datos | PostgreSQL (compartida) |
| Tiempo real | Phoenix Channels |

## Estructura

```
apps/
├── backend/          # API REST con Bun (puerto 3000)
├── backend-ex/       # API REST con Elixir/Phoenix (puerto 4000) [ALTERNATIVO]
├── frontend/         # SPA React (puerto 5173 dev, 8080 prod)
└── provider-sim/     # Simulador de proveedores (puerto 3001)
```

> **Nota:** Solo uno de los backends (Bun o Elixir) se ejecuta en un momento dado. Comparten la misma base de datos PostgreSQL.

## Desarrollo Local

### Opción 1: Backend de Bun (Default)

#### Requisitos

- [Bun](https://bun.sh/docs/installation) >= 1.1.0 (o usar [mise](https://mise.jdx.dev/getting-started.html) para gestionar versiones automáticamente)
- Docker y Docker Compose

#### 1. Levantar servicios de infraestructura

```bash
docker compose --env-file .env.docker up -d db redis
```

#### 2. Instalar dependencias

```bash
bun install
```

#### 3. Configurar variables de entorno

```bash
cp .env.docker.example .env.docker
```

#### 4. Ejecutar migraciones y seed

```bash
bun run db:migrate
bun run db:seed
```

#### 5. Iniciar aplicaciones

```bash
# Todos los servicios en paralelo
bun run dev

# O individualmente
bun run dev:backend
bun run dev:frontend
bun run dev:provider
```

#### URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Backend Swagger | http://localhost:3000/docs |
| Provider Sim | http://localhost:3001 |
| Provider Sim Swagger | http://localhost:3001/docs |

---

### Opción 2: Backend de Elixir/Phoenix (Alternativo)

Para usar el backend de Elixir en lugar del de Bun, sigue estos pasos:

#### Requisitos

- Elixir >= 1.15 (usar [mise](https://mise.jdx.dev/) o [asdf](https://asdf-vm.com/))
- PostgreSQL 14+
- Docker (para PostgreSQL si lo prefieres)
- Node.js (solo para frontend)

#### 1. Levantar base de datos

```bash
# Opción A: Con Docker (recomendado)
docker compose --env-file .env.docker up -d db

# Opción B: PostgreSQL local
# Asegurar que PostgreSQL está corriendo en localhost:5432
```

#### 2. Instalar dependencias de Elixir

```bash
cd apps/backend-ex
mix deps.get
```

#### 3. Instalar dependencias de Frontend (si no se han instalado)

```bash
cd apps/frontend
npm install
```

#### 4. Crear base de datos y ejecutar migraciones

```bash
cd apps/backend-ex
mix ecto.create
mix ecto.migrate
mix run priv/repo/seeds.exs
```

#### 5. Iniciar servicios

En **Terminal 1** - Backend de Elixir:

```bash
cd apps/backend-ex
mix phx.server

# El backend estará en http://localhost:4000
```

En **Terminal 2** - Frontend:

```bash
cd apps/frontend
npm run dev

# El frontend estará en http://localhost:5173
```

En **Terminal 3** (opcional) - Simulador de proveedores:

```bash
cd apps/provider-sim
bun dev

# El simulador estará en http://localhost:3001
```

#### URLs de desarrollo (Elixir)

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend Elixir | http://localhost:4000 |
| Oban UI (jobs) | http://localhost:4000/oban |
| Provider Sim | http://localhost:3001 |

#### Credenciales de prueba

- Email: `admin1@ecredit.com`
- Password: `admin123456`

---

### Credenciales de prueba

- Email: `admin1@ecredit.com`
- Password: `admin123456`

### Usuarios de prueba para solicitudes

Los siguientes documentos de identidad pueden usarse para crear solicitudes de credito, tanto en desarrollo local como en produccion ([https://ecredit.robertomolina.dev/](https://ecredit.robertomolina.dev/)). Estos usuarios estan predefinidos en el simulador de proveedores bancarios.

#### Mexico (MX)

| CURP | Nombre | Score Buro | Resultado Esperado |
|------|--------|------------|-------------------|
| `GOMC860101HDFRRA09` | Good Mexico User | 750 | APROBADO |
| `BAPC901215MDFRRS03` | Bad Mexico User | 450 | RECHAZADO |

#### Colombia (CO)

| Cedula | Nombre | Score Datacredito | Resultado Esperado |
|--------|--------|-------------------|-------------------|
| `1234567890` | Good Colombia User | 680 | APROBADO |
| `9876543210` | Bad Colombia User | 400 | RECHAZADO |


## Despliegue Local con Docker

### Opción 1: Con Backend de Bun

```bash
# Copiar variables de entorno
cp .env.docker.example .env.docker

# Levantar todos los servicios
docker compose --env-file .env.docker up -d --build
```

Esto levanta: PostgreSQL, Redis, Backend (Bun), Frontend y Provider Simulator.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:3000 |
| Provider Sim | http://localhost:3001 |

### Opción 2: Con Backend de Elixir/Phoenix

> **Nota:** La imagen de Docker para el backend de Elixir aún no está incluida en `docker-compose.yml`. Para desarrollo local, ejecutar Elixir nativamente (ver sección anterior).

Para agregar soporte en el futuro, se agregaría una entrada en `docker-compose.yml`:

```yaml
backend-ex:
  build:
    context: ./apps/backend-ex
    dockerfile: Dockerfile
  ports:
    - "4000:4000"
  environment:
    MIX_ENV: prod
    DATABASE_URL: ecto://postgres:ecredit123@db:5432/ecredit
  depends_on:
    - db
```

### Verificar estado

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
```

### Detener servicios

```bash
docker compose --env-file .env.docker down
```

## Scripts Principales

### Backend de Bun (Default)

```bash
bun run dev              # Desarrollo (todos los servicios)
bun run build            # Compilar para producción
bun run db:migrate       # Ejecutar migraciones
bun run db:seed          # Poblar datos de prueba
bun run worker           # Iniciar worker de jobs
```

### Backend de Elixir (Alternativo)

```bash
cd apps/backend-ex

# Servidor de desarrollo
mix phx.server

# Base de datos
mix ecto.create          # Crear base de datos
mix ecto.migrate         # Ejecutar migraciones
mix run priv/repo/seeds.exs  # Poblar datos

# Testing
mix test                 # Ejecutar todos los tests

# Producción
MIX_ENV=prod mix ecto.migrate
MIX_ENV=prod mix release
PHX_SERVER=true _build/prod/rel/ecredit/bin/ecredit start
```

## Documentación de Aplicaciones

- [Backend Bun](apps/backend/README.md) - API con Hono, Drizzle y pg-boss
- [Backend Elixir](apps/backend-ex/README.md) - API con Phoenix, Ecto y Oban
- [Frontend](apps/frontend/README.md) - SPA React
- [Provider Simulator](apps/provider-sim/README.md) - Simulador de proveedores bancarios

## Comparación de Backends

| Característica | Bun | Elixir |
|---|---|---|
| **Runtime** | Bun | Erlang/OTP |
| **Framework** | Hono | Phoenix |
| **ORM** | Drizzle | Ecto |
| **Jobs** | pg-boss | Oban |
| **WebSockets** | Socket.IO | Phoenix Channels |
| **Puerto** | 3000 | 4000 |
| **Startup** | Muy rápido | Moderado |
| **Confiabilidad** | Buena | Excelente |
| **Escalabilidad** | Single-node | Distribuida |
| **Ecosistema** | JavaScript/TypeScript | Elixir |
| **Curva aprendizaje** | Baja | Moderada |

**Conclusión:** Elige Bun para desarrollo ágil con JavaScript. Elige Elixir para aplicaciones críticas que necesitan máxima confiabilidad y escalabilidad.

## Configuración del Frontend según Backend

El frontend se adapta automáticamente según qué backend uses. La clave está en las **variables de entorno**:

### Con Backend de Bun (Default)

En `apps/frontend/.env.local`:

```bash
# API REST
VITE_API_URL=http://localhost:3000

# Tiempo real con Socket.IO
VITE_REALTIME_PROVIDER=socket.io
```

**Cómo funciona:**
- REST API: `http://localhost:3000/api/...`
- WebSocket: `http://localhost:3000/socket.io/` (Socket.IO)
- Frontend conecta automáticamente a `localhost:3000`

### Con Backend de Elixir

En `apps/frontend/.env.local`:

```bash
# API REST
VITE_API_URL=http://localhost:4000

# Tiempo real con Phoenix Channels
VITE_REALTIME_PROVIDER=phoenix
```

**Cómo funciona:**
- REST API: `http://localhost:4000/api/...`
- WebSocket: `ws://localhost:4000/ws` (Phoenix Channels)
- Frontend conecta automáticamente a `localhost:4000/ws`

### Diferencia en Tiempo Real

| Aspecto | Bun (Socket.IO) | Elixir (Phoenix) |
|---------|-----------------|-----------------|
| **Librería** | `socket.io-client` | `phoenix` |
| **Endpoint** | `/socket.io/` | `/ws` |
| **Canales** | Rooms | Canales nativos |
| **Autenticación** | Handshake | Parámetro `token` |
| **Protocolo** | WebSocket + fallback | WebSocket nativo |
| **Integración** | Agnóstica | Phoenix nativa |

Ambos funcionan de igual manera desde la perspectiva del usuario - las actualizaciones llegan en tiempo real.

### Cambiar Rápidamente

Si necesitas probar ambos backends:

```bash
# Terminal 1: Backend Bun
bun run dev:backend

# Terminal 2: Frontend con Bun
cd apps/frontend
VITE_API_URL=http://localhost:3000 VITE_REALTIME_PROVIDER=socket.io npm run dev
```

O:

```bash
# Terminal 1: Backend Elixir
cd apps/backend-ex
mix phx.server

# Terminal 2: Frontend con Elixir
cd apps/frontend
VITE_API_URL=http://localhost:4000 VITE_REALTIME_PROVIDER=phoenix npm run dev
```

## Switching entre Backends

### En Desarrollo

El **frontend es agnóstico** respecto a qué backend uses. Solo necesitas cambiar la URL del API.

#### Opción A: Variable de entorno

En `apps/frontend/.env.local`:

```bash
# Para Bun (default)
VITE_API_URL=http://localhost:3000

# Para Elixir
VITE_API_URL=http://localhost:4000
```

Luego reinicia el servidor:

```bash
cd apps/frontend
npm run dev
```

#### Opción B: En el código

En `apps/frontend/src/api/client.ts` o similar, cambiar la URL base según necesites.

### Base de Datos Compartida

Ambos backends usan la **misma base de datos PostgreSQL** con la misma estructura. Pueden coexistir (aunque solo uno debería correr en un momento dado en producción).

Si cambias de backend:

1. Ambos backends comparten `DATABASE_URL`
2. No necesitas recrear la base de datos
3. Los datos se mantienen intactos
4. Solo asegúrate de ejecutar migraciones pendientes: `mix ecto.migrate` (Elixir) o `bun run db:migrate` (Bun)
