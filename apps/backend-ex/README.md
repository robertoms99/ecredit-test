# Backend - eCredit (Elixir/Phoenix)

API REST construida con Elixir, Phoenix Framework y arquitectura idiomática de Elixir.

Esta es una **reimplementación alternativa** del backend original de Bun/TypeScript, manteniendo la misma funcionalidad y compatibilidad con la misma base de datos PostgreSQL.

## Tecnologías

- **Phoenix Framework 1.8** - Framework web rápido y robusto
- **Ecto** - ORM para PostgreSQL
- **Oban** - Cola de trabajos distribuida (reemplaza pg-boss)
- **Guardian** - Autenticación con JWT
- **Phoenix Channels** - WebSockets tiempo real (reemplaza Socket.IO)
- **Req** - Cliente HTTP moderno y eficiente
- **PostgreSQL** - Base de datos relacional

## Inicio Rápido

### Requisitos

- Elixir >= 1.15 (recomendado usar [mise](https://mise.jdx.dev/) o [asdf](https://asdf-vm.com/))
- PostgreSQL 14+
- Opcional: Redis (solo si usas backend de Bun en paralelo)

### 1. Clonar y preparar

```bash
# Desde la raíz del monorepo
cd apps/backend-ex
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo .env de ejemplo
cp .env.example .env

# Editar .env con tus valores (ver sección de Variables de Entorno)
```

### 3. Instalar dependencias

```bash
mix deps.get
```

### 4. Crear base de datos y ejecutar migraciones

```bash
# Crear base de datos (si no existe)
mix ecto.create

# Ejecutar migraciones
mix ecto.migrate

# Opcional: Poblar datos de prueba
mix run priv/repo/seeds.exs
```

### 5. Iniciar servidor de desarrollo

```bash
# Con auto-reload
mix phx.server

# O simplemente
mix ecto.setup   # Setup completo
mix phx.server
```

El servidor estará disponible en **http://localhost:4000**

## Desarrollo

> **Tip:** Desde la raíz del monorepo puedes usar `bun run dev:backend-ex` (cuando esté implementado) o `cd apps/backend-ex && mix phx.server`

### Estructura del Proyecto

```
lib/
├── ecredit/
│   ├── accounts/           # Dominio de autenticación y usuarios
│   │   ├── user.ex         # Schema del usuario
│   │   └── accounts.ex     # Contexto: autenticación
│   ├── credits/            # Dominio de solicitudes de crédito
│   │   ├── credit_request.ex
│   │   ├── credits.ex      # Contexto: solicitudes de crédito
│   │   └── status_transition.ex
│   ├── countries/          # Estrategias por país
│   │   ├── strategy.ex     # Interfaz
│   │   ├── colombia.ex
│   │   ├── mexico.ex
│   │   └── countries.ex    # Registry
│   ├── banking/            # Dominio de información bancaria
│   │   ├── banking_info.ex # Schema
│   │   └── banking.ex      # Contexto
│   ├── jobs/               # Colas de trabajos
│   │   └── status_transition_worker.ex
│   ├── status_transition_listener.ex  # Escucha cambios de estado
│   └── guardian.ex         # Configuración de JWT
├── ecredit_web/
│   ├── controllers/        # Endpoints HTTP
│   ├── plugs/              # Middlewares
│   ├── channels/           # WebSockets
│   └── router.ex           # Rutas
└── ecredit.ex             # Supervisor y aplicación
```

### Scripts Principales

```bash
# Servidor de desarrollo
mix phx.server

# IEx con aplicación cargada
iex -S mix phx.server

# Tests
mix test
mix test --failed          # Reejecutar tests que fallaron
mix test path/to/test.exs  # Test específico

# Database
mix ecto.create            # Crear base de datos
mix ecto.migrate           # Ejecutar migraciones
mix ecto.rollback          # Revertir última migración
mix ecto.reset             # Resetear base de datos
mix ecto.gen.migration migration_name  # Generar nueva migración
mix run priv/repo/seeds.exs  # Ejecutar seed

# Linting y formatting
mix compile --warnings-as-errors  # Compilar con warnings como errores
mix format                 # Formatear código
mix format --check-formatted  # Verificar formato sin cambiar

# Precommit (compile + format + tests)
mix precommit

# Producción
MIX_ENV=prod mix ecto.migrate
MIX_ENV=prod mix release
PHX_SERVER=true _build/prod/rel/ecredit/bin/ecredit start
```

## API Endpoints

Todos los endpoints mantienen compatibilidad con el backend de Bun.

### Autenticación (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario autenticado |

### Países (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/countries` | Listar países disponibles |

### Estados (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/request-statuses` | Listar estados de solicitud |

### Solicitudes de Crédito (Protegido)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/credit-requests` | Listar solicitudes del usuario |
| POST | `/api/credit-requests` | Crear nueva solicitud |
| GET | `/api/credit-requests/:id` | Obtener detalle de solicitud |
| PATCH | `/api/credit-requests/:id/status` | Actualizar estado (admin) |
| GET | `/api/credit-requests/:id/history` | Historial de transiciones |

### Webhooks (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/webhook/process-bank-data` | Recibir datos bancarios del proveedor |

### Health Check

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |

## Autenticación

### Usando JWT

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@ecredit.com","password":"admin123456"}'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "...",
#     "email": "admin1@ecredit.com",
#     "fullName": "Admin",
#     "role": "admin"
#   }
# }

# 2. Usar token en peticiones
curl http://localhost:4000/api/credit-requests \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Variables de Entorno

Crear archivo `.env` en la raíz del proyecto con:

```bash
# Base de datos
DATABASE_URL=ecto://postgres:postgres@localhost:5432/ecredit_dev

# Servidor
PORT=4000
NODE_ENV=development

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
ORIGIN_API=http://localhost:4000

# Proveedores bancarios
MEXICO_PROVIDER_URL=http://localhost:3001/providers/mx
COLOMBIA_PROVIDER_URL=http://localhost:3001/providers/co

# JWT (IMPORTANTE: cambiar en producción)
JWT_SECRET=change-me-in-production-very-secret-key
JWT_EXPIRES_IN=7d
```

### Variables requeridas para producción

En producción (con `MIX_ENV=prod`) se requiere además:

```bash
# Phoenix - secreto para sesiones y tokens
SECRET_KEY_BASE=<valor aleatorio de 64+ caracteres>

# Otros
MIX_ENV=prod
PHX_SERVER=true
```

Generar `SECRET_KEY_BASE` seguro:
```bash
mix phx.gen.secret
```

## WebSocket en Tiempo Real

Phoenix Channels proporciona una forma robusta y eficiente de comunicación en tiempo real, totalmente integrada con el backend.

### Configuración del Frontend

El frontend debe configurar Phoenix como proveedor de tiempo real. En `apps/frontend/.env.local`:

```bash
# Apuntar a este backend (Puerto 4000)
VITE_API_URL=http://localhost:4000

# Usar Phoenix Channels (no Socket.IO)
VITE_REALTIME_PROVIDER=phoenix
```

### Conectar desde JavaScript/TypeScript

El frontend incluye un cliente `PhoenixClient` que maneja automáticamente la conexión. Si quieres hacerlo manualmente:

```javascript
import { Socket } from "phoenix";

// Crear socket - se conecta automáticamente a ws://localhost:4000/ws
const socket = new Socket("/ws", {
  params: { token: "your_jwt_token_here" }
});

// Conectar
socket.connect();

// Escuchar estado del socket
socket.onOpen(() => console.log("✅ Conectado"));
socket.onClose(() => console.log("❌ Desconectado"));
socket.onError((error) => console.error("🔴 Error:", error));

// Unirse a canal para recibir actualizaciones de solicitudes
const channel = socket.channel("credit_requests:lobby", {});

channel.on("credit-request-updated", (payload) => {
  console.log("📢 Solicitud actualizada:", payload);
  // payload contiene: { id, status, updatedAt, ... }
});

channel.join()
  .receive("ok", () => console.log("Unido al canal"))
  .receive("error", (error) => console.error("Error al unirse:", error));

// Enviar evento (ej: actualizar estado manualmente)
channel.push("update_credit", { credit_id: "123", status: "APPROVED" })
  .receive("ok", (response) => console.log("Actualización recibida:", response))
  .receive("error", (error) => console.error("Error:", error));

// Desconectar cuando termines
socket.disconnect();
```

### Canales Disponibles

| Canal | Descripción |
|-------|-------------|
| `credit_requests:lobby` | Broadcast general - todos los cambios de solicitudes |
| `credit_requests:{user_id}` | Canal privado - solo cambios del usuario específico |

### Flujo de Eventos

1. **Usuario crea solicitud** → Backend envia evento a `credit_requests:lobby`
2. **Proveedor envía datos** → Backend envia evento en webhook
3. **Sistema cambia estado** → Backend broadcast en `credit_requests:lobby` + canal privado
4. **Frontend recibe evento** → Actualiza UI en tiempo real

### Diferencia con Socket.IO (Backend Bun)

| Aspecto | Phoenix Channels | Socket.IO (Bun) |
|--------|------------------|-----------------|
| **Endpoint** | `/ws` | `/socket.io/` |
| **Protocolo** | WebSocket nativo | WebSocket + fallback |
| **Librería frontend** | `phoenix` | `socket.io-client` |
| **Canales** | Nativos | Rooms/Namespaces |
| **Autenticación** | Parámetro `token` | Handshake |
| **Integración** | Phoenix Framework | Agnóstica |

Ambos funcionan igual desde la perspectiva del negocio, pero Phoenix Channels es más eficiente y está totalmente integrado.

## Colas de Trabajos (Oban)

Los trabajos se procesan con Oban de forma automática. Puedes monitorear en:

```bash
# En desarrollo, Oban UI está disponible en:
http://localhost:4000/oban

# Ver estado de jobs
iex> Oban.Job |> Ecredit.Repo.all()
```

Trabajos implementados:

- **StatusTransitionWorker** - Procesa transiciones de estado automáticas
  - Solicita datos al proveedor bancario cuando estado = CREATED
  - Evalúa crédito cuando estado = EVALUATING
  - Reintentos automáticos con backoff exponencial

## Docker

### Build

```bash
docker build -t ecredit-backend-ex:latest .
```

### Run

```bash
docker run -d \
  --name ecredit-backend-ex \
  -p 4000:4000 \
  -e DATABASE_URL="ecto://user:pass@host:5432/ecredit" \
  -e JWT_SECRET="your-secret-key" \
  -e SECRET_KEY_BASE="your-secret-base" \
  -e MIX_ENV=prod \
  -e PHX_SERVER=true \
  ecredit-backend-ex:latest
```

## Docker Compose

Ver archivo `docker-compose.yml` en la raíz del monorepo para levantar todo integrado:

```bash
# Desde la raíz del monorepo
docker compose --env-file .env.docker up -d --build backend-ex
```

## Tests

### Ejecutar todos los tests

```bash
mix test
```

### Tests específicos

```bash
# Un archivo
mix test test/ecredit/credits_test.exs

# Una línea específica
mix test test/ecredit/credits_test.exs:42

# Con palabra clave
mix test --only unit
```

### Tests fallidos

```bash
# Reejecutar solo tests que fallaron
mix test --failed

# Con más detalle
mix test --failed --trace
```

### Coverage

```bash
# Requiere: `{:excoveralls, "~> 0.16", only: :test}`
mix coveralls
```

## Comparación con Backend de Bun

| Aspecto | Bun Backend | Phoenix Backend |
|---------|------------|-----------------|
| **Runtime** | Bun | Erlang/OTP |
| **Framework** | Hono | Phoenix |
| **ORM** | Drizzle | Ecto |
| **Jobs** | pg-boss | Oban |
| **WebSockets** | Socket.IO | Phoenix Channels |
| **Autenticación** | JWT nativo | Guardian |
| **HTTP Client** | Fetch | Req |
| **Puerto por defecto** | 3000 | 4000 |
| **Arquitectura** | Hexagonal | Phoenix Contexts |
| **Escalabilidad** | Single-node | Distribuida (BEAM) |
| **Performance** | Muy rápida | Muy confiable |
| **Curva de aprendizaje** | Baja (TS) | Moderada (Elixir) |

## Switching entre Backends

### Usar backend de Phoenix en lugar de Bun

En desarrollo local, editar el frontend (`.env` o `vite.config.ts`):

```javascript
// vite.config.ts
const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';
```

O en archivo `.env.local`:

```bash
VITE_API_URL=http://localhost:4000
```

Luego ejecutar frontend normalmente:

```bash
cd apps/frontend
npm run dev
```

## Troubleshooting

### Error: "cannot find mix"

Instalar Elixir:
```bash
# Con mise
mise install elixir

# Con asdf
asdf install elixir 1.19.5
asdf install otp 28
```

### Error: "Connection refused" en base de datos

Asegurar que PostgreSQL esté corriendo:
```bash
docker compose --env-file .env.docker up -d db
```

O verificar URL en `.env`:
```bash
DATABASE_URL=ecto://postgres:postgres@localhost:5432/ecredit_dev
```

### Error: "exited abnormally" en Oban

Oban necesita PostgreSQL corriendo. Verificar:
```bash
mix ecto.create
mix ecto.migrate
```

### Tests fallan aleatoriamente

Algunos tests pueden tener race conditions. Ejecutar:
```bash
mix test --randomize false
```

## Recursos

- [Phoenix Documentation](https://hexdocs.pm/phoenix/Phoenix.html)
- [Ecto Guide](https://hexdocs.pm/ecto/Ecto.html)
- [Oban Documentation](https://hexdocs.pm/oban/Oban.html)
- [Guardian Documentation](https://hexdocs.pm/guardian/Guardian.html)
- [Elixir Guide](https://elixir-lang.org/learning.html)

## Contributing

Ver [AGENTS.md](AGENTS.md) para pautas de desarrollo.

### Pre-commit

Antes de hacer commit:

```bash
mix precommit
```

Esto verifica:
- Compilación sin warnings
- Formato de código
- Todos los tests pasan

## Licencia

MIT
