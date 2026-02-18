# eCredit

Sistema de gestión de solicitudes de crédito. Monorepo con backend, frontend y simulador de proveedores bancarios.

## Documentación

- [MVP y Visión del Producto](docs/mvp.md) - Contexto, alcance y limitaciones del MVP
- [Arquitectura](docs/architecture.md) - Diseño del sistema, patrones y estructura
- [Evaluación de Riesgo](docs/evaluation.md) - Cómo funciona la evaluación crediticia

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
docker compose --env-file .env.docker up -d db redis
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

Para ejecutar todo el sistema containerizado:

```bash
# Copiar variables de entorno
cp .env.docker.example .env.docker

# Levantar todos los servicios
docker compose --env-file .env.docker up -d --build
```

Esto levanta: PostgreSQL, Redis, Backend, Frontend y Provider Simulator.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:3000 |
| Provider Sim | http://localhost:3001 |

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

```bash
bun run dev              # Desarrollo (todos los servicios)
bun run build            # Compilar para producción
bun run db:migrate       # Ejecutar migraciones
bun run db:seed          # Poblar datos de prueba
bun run worker           # Iniciar worker de jobs
```

## Documentación de Aplicaciones

- [Backend](apps/backend/README.md)
- [Frontend](apps/frontend/README.md)
- [Provider Simulator](apps/provider-sim/README.md)
