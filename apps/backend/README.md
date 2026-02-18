# Backend - eCredit

API REST construida con Bun, Hono y arquitectura hexagonal.

## Tecnologías

- **Hono** - Framework HTTP
- **Drizzle ORM** - ORM para PostgreSQL
- **pg-boss** - Cola de trabajos
- **ioredis** - Cliente Redis
- **Socket.io** - WebSockets
- **Zod** - Validación de schemas
- **JWT** - Autenticación

## Desarrollo

> **Requisito:** PostgreSQL y Redis deben estar corriendo. Desde la raíz del monorepo: `docker compose --env-file .env.docker up -d db redis`

```bash
# Desde la raíz del monorepo
bun run dev:backend

# O desde este directorio
bun dev
```

El servidor inicia en http://localhost:3000

## Arquitectura

```
src/
├── domain/           # Lógica de negocio
│   ├── entities/     # Modelos de dominio
│   ├── use-cases/    # Casos de uso
│   ├── ports/        # Interfaces (repositorios, servicios)
│   ├── strategies/   # Estrategias por país y transiciones
│   ├── jobs/         # Definiciones de jobs
│   └── errors/       # Errores de dominio
└── infrastructure/   # Implementaciones concretas
    ├── adapters/     # Implementaciones de puertos
    ├── db/           # Drizzle, migraciones, schemas
    ├── presentation/ # Controllers y middlewares
    ├── jobs/         # Workers de pg-boss
    └── websocket/    # Socket.io server
```

## Variables de Entorno

```bash
DATABASE_URL=postgresql://ecredit:ecredit123@localhost:5432/ecredit
REDIS_URL=redis://localhost:6379
JWT_SECRET=cambiar-en-produccion
MEXICO_PROVIDER_URL=http://localhost:3001/providers/mx
COLOMBIA_PROVIDER_URL=http://localhost:3001/providers/co
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## Scripts

```bash
bun dev                     # Desarrollo con hot reload
bun worker                  # Ejecutar worker de jobs
bun db:migrate              # Ejecutar migraciones
bun db:seed                 # Poblar datos de prueba
bun db:migrations:generate  # Generar nueva migración
bun build                   # Compilar
bun start                   # Ejecutar en producción
```

## API Endpoints

### Documentación interactiva

Swagger UI disponible en http://localhost:3000/docs

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
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@ecredit.com","password":"admin123456"}'

# Usar token en peticiones
curl http://localhost:3000/api/credit-requests \
  -H "Authorization: Bearer <token>"
```

## Docker

```bash
# Build
docker build -t ecredit-backend:latest .

# Run (requiere DB y Redis)
docker run -d \
  --name ecredit-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  ecredit-backend:latest
```
