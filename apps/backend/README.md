Esta app backend expone una REST API y esta construida con Bun (con typescript), Hono (framework HTTP) siguiendo arquitectura hexagonal. Ademas de la inclusion de algunas librerias utiles que soportan la infraestructura tales como JWT, PGBoss (cliente para colas), ioredis, socket.io, zod (validador de schemas), drizzle (ORM), entre otros.

La aplicacion backend es dependiente de una base de datos Postgresql tanto para datos relacionales como para manejo de colas, ademas de un cliente de Redis para el manejo de caching.

## 🚀 Quick Start

### Local Development

```bash
# Desde la raíz del monorepo
bun run dev:backend

# O desde este directorio
bun dev
```

### Docker

```bash
# Run (requiere PostgreSQL corriendo)
docker run -d \
  --name ecredit-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://ecredit:ecredit123@host.docker.internal:5432/ecredit \
  -e JWT_SECRET=tu-secreto-seguro \
  -e PROVIDER_SIM_URL=http://host.docker.internal:3001 \
  ecredit-backend:latest
  
  # Build
  docker build -t ecredit-backend:latest .
```

## 🐳 Docker Build

### Build desde la raíz del monorepo

```bash
docker build -t ecredit-backend:latest -f apps/backend/Dockerfile apps/backend/
```

### Build desde este directorio

```bash
cd apps/backend
docker build -t ecredit-backend:latest .
```

### Variables de Entorno Requeridas

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-change-in-production
PROVIDER_SIM_URL=http://provider-sim:3001
PORT=3000                    # Opcional, default 3000
NODE_ENV=production          # Opcional, default production
```

### Ejemplo Completo

```bash
# 1. Iniciar PostgreSQL (ver apps/database/README.md)
docker run -d --name ecredit-db -p 5432:5432 ecredit-db:latest

# 2. Ejecutar migraciones y seeds
DATABASE_URL=postgresql://ecredit:ecredit123@localhost:5432/ecredit bun db:migrate
DATABASE_URL=postgresql://ecredit:ecredit123@localhost:5432/ecredit bun db:seed

# 3. Build backend
docker build -t ecredit-backend:latest .

# 4. Run backend
docker run -d \
  --name ecredit-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://ecredit:ecredit123@host.docker.internal:5432/ecredit \
  -e JWT_SECRET=mi-secreto-super-seguro-cambiar-en-produccion \
  -e PROVIDER_SIM_URL=http://host.docker.internal:3001 \
  ecredit-backend:latest

# 5. Verificar logs
docker logs -f ecredit-backend

# 6. Health check
curl http://localhost:3000/health
```

## 🏗️ Arquitectura

### Domain Layer (Dominio)
- **Entities:** Modelos de negocio puros
- **Use Cases:** Lógica de aplicación
- **Ports:** Interfaces (repositorios, servicios externos)

### Infrastructure Layer (Infraestructura)
- **Adapters:** Implementaciones de puertos (DB, HTTP, etc.)
- **DB:** Cliente PostgreSQL + Drizzle ORM
- **Presentation:** Controllers, routers, middlewares
- **Jobs:** Background jobs con pg-boss

## ⚙️ Configuración

Copiar `.env.example` a `.env`:

```bash
# Database
DATABASE_URL=postgresql://ecredit:ecredit123@localhost:5432/ecredit

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Provider Simulator
PROVIDER_SIM_URL=http://localhost:3001
```

## 📝 Scripts

```bash
# Desarrollo
bun dev                      # Hot reload
bun worker                   # Background jobs worker

# Base de datos
bun db:migrate              # Ejecutar migraciones
bun db:seed                 # Poblar datos de prueba
bun db:migrations:generate  # Generar nueva migración

# Producción
bun build                   # Compilar
bun start                   # Ejecutar en producción
```

## 📚 Endpoints Principales

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (futuro)

### Credit Requests
- `GET /api/credit-requests` - Listar solicitudes (con filtros)
- `GET /api/credit-requests/:id` - Detalle de solicitud
- `POST /api/credit-requests` - Crear solicitud
- `PUT /api/credit-requests/:id/status` - Actualizar estado

### Webhooks
- `POST /api/webhooks/:country/bank-data` - Recibir datos bancarios

### Health
- `GET /health` - Healthcheck

## 🔐 Autenticación

El API usa JWT Bearer tokens:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@ecredit.com",
    "password": "admin123456"
  }'

# Usar token
curl http://localhost:3000/api/credit-requests \
  -H "Authorization: Bearer <token>"
```

**Usuarios por defecto:**
- Email: `admin1@ecredit.com`, Password: `admin123456`
- Email: `admin2@ecredit.com`, Password: `admin123456`

## 🧪 Testing

### Test Manual con curl

```bash
# Health check
curl http://localhost:3000/health

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@ecredit.com","password":"admin123456"}' \
  | jq -r '.token')

# Crear solicitud
curl -X POST http://localhost:3000/api/credit-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Juan Pérez",
    "nationalId": "GOMC860101HDFRRA09",
    "country": "MX",
    "amount": 10000,
    "currency": "MXN",
    "termMonths": 12,
    "email": "juan@example.com",
    "phoneNumber": "+525512345678"
  }'

# Listar solicitudes
curl http://localhost:3000/api/credit-requests?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

## 🔄 Background Jobs

El sistema usa pg-boss para jobs asíncronos:

- **status-transition:** Transiciones automáticas de estado
- **webhook-notification:** Notificaciones a webhooks

### Ejecutar Worker

```bash
# Local
bun worker

# Docker
docker run -d \
  --name ecredit-worker \
  -e DATABASE_URL=postgresql://... \
  ecredit-backend:latest \
  bun src/infrastructure/jobs/worker.ts
```

## 🐛 Debug & Logs

### Local
```bash
bun dev
# Los logs aparecen en consola
```

### Docker
```bash
# Ver logs
docker logs -f ecredit-backend

# Logs en tiempo real con timestamps
docker logs -f --timestamps ecredit-backend

# Últimas 100 líneas
docker logs --tail 100 ecredit-backend

# Shell interactivo dentro del contenedor
docker exec -it ecredit-backend sh
```

## 📦 Especificaciones Docker

- **Base Image:** oven/bun:1-alpine
- **Multi-stage build:** deps → builder → runner
- **Tamaño final:** ~150MB
- **Puerto:** 3000
- **User:** bunuser (non-root)
- **Healthcheck:** /health endpoint cada 15s

## 🛑 Detener y Limpiar

```bash
# Detener
docker stop ecredit-backend

# Eliminar contenedor
docker rm ecredit-backend

# Eliminar imagen
docker rmi ecredit-backend:latest

# Ver logs antes de eliminar
docker logs ecredit-backend > backend.log
```

## 📖 Más Información

- [Arquitectura Hexagonal](../../docs/architecture.md)
- [Database Schema](./src/infrastructure/db/README.md)
- [API Documentation](../../docs/api.md)
