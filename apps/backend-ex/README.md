# eCredit Backend (Elixir/Phoenix)

Backend alternativo de eCredit implementado en Elixir con Phoenix Framework.

Esta es una reimplementación del backend original de Bun/TypeScript, manteniendo la misma funcionalidad y compartiendo la misma base de datos PostgreSQL.

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Framework | Phoenix 1.8 |
| ORM | Ecto |
| Jobs | Oban (reemplaza pg-boss) |
| WebSocket | Phoenix Channels (reemplaza Socket.IO) |
| Auth | Guardian (JWT) |
| HTTP Client | Req |

## Diferencias con el Backend de Bun

| Aspecto | Bun Backend | Phoenix Backend |
|---------|-------------|-----------------|
| Jobs | pg-boss | Oban |
| WebSocket | Socket.IO | Phoenix Channels |
| Arquitectura | Hexagonal | Phoenix Contexts (idiomatico) |
| Puerto por defecto | 3000 | 4000 |

## Desarrollo Local

### Requisitos

- Elixir >= 1.15 (recomendado usar [mise](https://mise.jdx.dev/) para gestionar versiones)
- PostgreSQL (compartido con el backend de Bun)
- Redis (solo para el backend de Bun)

### Configuracion

1. Asegurar que la base de datos este corriendo:

```bash
docker compose --env-file .env.docker up -d db
```

2. Instalar dependencias:

```bash
cd apps/backend_ex
mix deps.get
```

3. Ejecutar migraciones de Oban:

```bash
mix ecto.migrate
```

4. Iniciar el servidor:

```bash
mix phx.server
```

El servidor estara disponible en http://localhost:4000

## API Endpoints

Los endpoints son identicos al backend de Bun:

### Publicos
- `POST /api/auth/login` - Iniciar sesion
- `GET /api/countries` - Listar paises soportados
- `GET /api/request-statuses` - Listar estados de solicitud
- `POST /api/webhook/process-bank-data` - Webhook para datos bancarios

### Protegidos (requieren JWT)
- `GET /api/auth/me` - Usuario actual
- `GET /api/credit-requests` - Listar solicitudes
- `POST /api/credit-requests` - Crear solicitud
- `GET /api/credit-requests/:id` - Obtener solicitud
- `PATCH /api/credit-requests/:id/status` - Actualizar estado
- `GET /api/credit-requests/:id/history` - Historial de transiciones

### Health Check
- `GET /health` - Estado del servicio

## WebSocket

Conectar a `/ws` con un token JWT:

```javascript
const socket = new Phoenix.Socket("/ws", {
  params: { token: "jwt_token_here" }
});

socket.connect();

const channel = socket.channel("credit_requests:lobby", {});
channel.join();

channel.on("credit-request-updated", payload => {
  console.log("Status updated:", payload);
});
```

## Variables de Entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | - |
| `PORT` | Puerto HTTP | 4000 |
| `JWT_SECRET` | Secreto para JWT | - |
| `FRONTEND_URL` | URL del frontend para CORS | http://localhost:5173 |
| `PROVIDER_SIM_URL` | URL del simulador de proveedores | http://localhost:3001 |
| `SECRET_KEY_BASE` | Secreto para Phoenix (prod) | - |

## Tests

```bash
mix test
```

## Produccion

```bash
MIX_ENV=prod mix release
PHX_SERVER=true _build/prod/rel/ecredit/bin/ecredit start
```
