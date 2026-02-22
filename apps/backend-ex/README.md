# Backend Elixir - eCredit

API REST construida con Elixir, Phoenix y arquitectura idiomática de contextos.

> Reimplementación alternativa del [backend Bun](../backend/README.md). Misma funcionalidad, misma base de datos PostgreSQL.

## Tecnologías

- **Phoenix 1.8** - Framework web
- **Ecto** - ORM para PostgreSQL
- **Oban** - Cola de trabajos (reemplaza pg-boss)
- **Guardian** - Autenticación JWT
- **Phoenix Channels** - WebSockets (reemplaza Socket.IO)
- **Req** - Cliente HTTP

## Desarrollo

> **Requisito:** PostgreSQL debe estar corriendo. Desde la raíz del monorepo: `docker compose up -d db`

```bash
# Instalar dependencias
mix deps.get

# Setup completo (crear DB + migraciones + seed)
mix ecto.setup

# Iniciar servidor
mix phx.server
```

El servidor inicia en http://localhost:4000

## Arquitectura

```
lib/
├── ecredit/
│   ├── accounts/         # Autenticación y usuarios
│   ├── credits/          # Solicitudes de crédito
│   ├── banking/          # Información bancaria
│   ├── countries/        # Estrategias por país (MX, CO)
│   ├── jobs/             # Workers de Oban
│   ├── guardian.ex        # Configuración JWT
│   └── status_transition_listener.ex
└── ecredit_web/
    ├── controllers/      # Endpoints HTTP
    ├── channels/         # WebSockets (Phoenix Channels)
    ├── plugs/            # Middlewares (auth pipeline)
    └── router.ex         # Rutas
```

## Variables de Entorno

```bash
DATABASE_URL=ecto://test:test@localhost:5432/test_db
PORT=4000
FRONTEND_URL=http://localhost:5173
MEXICO_PROVIDER_URL=http://localhost:3001/providers/mx
COLOMBIA_PROVIDER_URL=http://localhost:3001/providers/co
JWT_SECRET=secret
```

## Scripts

```bash
mix phx.server                   # Servidor con hot reload
iex -S mix phx.server            # Servidor con shell interactivo
mix ecto.setup                   # Setup completo (create + migrate + seed)
mix ecto.reset                   # Reset DB (drop + setup)
mix ecto.migrate                 # Ejecutar migraciones
mix ecto.rollback                # Revertir última migración
mix ecto.gen.migration nombre    # Generar nueva migración
mix run priv/repo/seeds.exs      # Poblar datos de prueba
mix test                         # Ejecutar tests
mix precommit                    # Compilar + format + tests
```

## API Endpoints

Todos los endpoints son compatibles con el backend Bun.

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |

### Países

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/countries` | Listar países disponibles |

### Solicitudes de Crédito

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/credit-requests` | Listar solicitudes |
| POST | `/api/credit-requests` | Crear solicitud |
| GET | `/api/credit-requests/:id` | Obtener detalle |
| PATCH | `/api/credit-requests/:id/status` | Actualizar estado |
| GET | `/api/credit-requests/:id/history` | Historial de estados |

### Estados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/request-statuses` | Listar estados disponibles |

### Webhooks

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/webhook/process-bank-data` | Recibir datos bancarios |

### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |

## Autenticación

Usa JWT Bearer tokens:

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@ecredit.com","password":"admin123456"}'

# Usar token en peticiones
curl http://localhost:4000/api/credit-requests \
  -H "Authorization: Bearer <token>"
```

## WebSockets (Phoenix Channels)

Endpoint: `ws://localhost:4000/ws`

| Canal | Descripción |
|-------|-------------|
| `credit_requests:lobby` | Broadcast general de cambios |
| `credit_requests:{user_id}` | Canal privado por usuario |

```javascript
import { Socket } from "phoenix";

const socket = new Socket("/ws", { params: { token: "jwt_token" } });
socket.connect();

const channel = socket.channel("credit_requests:lobby", {});
channel.on("credit-request-updated", (payload) => {
  console.log("Actualización:", payload);
});
channel.join();
```

## Oban (Jobs)

Dashboard disponible en http://localhost:4000/oban

Workers implementados:
- **StatusTransitionWorker** - Procesa transiciones automáticas de estado (solicitar datos bancarios, evaluar crédito)

## Docker

```bash
# Build
docker build -t ecredit-backend-ex:latest .

# Run (requiere DB)
docker run -d \
  --name ecredit-backend-ex \
  -p 4000:4000 \
  -e DATABASE_URL="ecto://user:pass@host:5432/ecredit" \
  -e JWT_SECRET="your-secret-key" \
  -e SECRET_KEY_BASE="$(mix phx.gen.secret)" \
  -e PHX_SERVER=true \
  ecredit-backend-ex:latest
```

## Requisitos de Instalación

```bash
# Con mise (recomendado)
mise install    # Lee .tool-versions automáticamente

# Manual
# Erlang 28.3.1+ y Elixir 1.19.5+
```
