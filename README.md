# eCredit

Sistema de gestión de solicitudes de crédito. Monorepo con backend, frontend y simulador de proveedores bancarios.

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Runtime | Bun |
| Backend | Hono + Drizzle ORM + pg-boss |
| Frontend | React + Vite + TailwindCSS |
| Base de datos | PostgreSQL |
| Cache/Pub-Sub | Redis |
| Tiempo real | Socket.io |

## Estructura

```
apps/
├── backend/       # API REST (puerto 3000)
├── frontend/      # SPA React (puerto 5173 dev, 8080 prod)
└── provider-sim/  # Simulador de proveedores (puerto 3001)
```

## Desarrollo Local

### Requisitos

- [Bun](https://bun.sh/docs/installation) >= 1.1.0 (o usar [mise](https://mise.jdx.dev/getting-started.html) para gestionar versiones automáticamente)
- Docker y Docker Compose

### 1. Levantar servicios de infraestructura

```bash
docker compose up -d db redis
```

### 2. Instalar dependencias

```bash
bun install
```

### 3. Configurar variables de entorno

```bash
cp .env.docker.example .env.docker
```

### 4. Ejecutar migraciones y seed

```bash
bun run db:migrate
bun run db:seed
```

### 5. Iniciar aplicaciones

```bash
# Todos los servicios en paralelo
bun run dev

# O individualmente
bun run dev:backend
bun run dev:frontend
bun run dev:provider
```

### URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Backend Swagger | http://localhost:3000/docs |
| Provider Sim | http://localhost:3001 |
| Provider Sim Swagger | http://localhost:3001/docs |

### Credenciales de prueba

- Email: `admin1@ecredit.com`
- Password: `admin123456`

## Despliegue Local con Docker

Para ejecutar todo el sistema containerizado:

```bash
# Copiar variables de entorno
cp .env.docker.example .env.docker

# Levantar todos los servicios
docker compose up -d --build
```

Esto levanta: PostgreSQL, Redis, Backend, Frontend y Provider Simulator.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:3000 |
| Provider Sim | http://localhost:3001 |

### Verificar estado

```bash
docker compose ps
docker compose logs -f backend
```

### Detener servicios

```bash
docker compose down
```

## Scripts Principales

```bash
bun run dev              # Desarrollo (todos los servicios)
bun run build            # Compilar para producción
bun run db:migrate       # Ejecutar migraciones
bun run db:seed          # Poblar datos de prueba
bun run worker           # Iniciar worker de jobs
```

## Documentación

- [Backend](apps/backend/README.md)
- [Frontend](apps/frontend/README.md)
- [Provider Simulator](apps/provider-sim/README.md)
