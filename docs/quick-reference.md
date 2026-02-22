# Comandos Rápidos - eCredit

Referencia rápida de comandos más usados para ambos backends.

## 📍 Navegación

```bash
# Raíz del monorepo
cd /home/robertie/Projects/ecredit-bun

# Backend de Bun
cd apps/backend

# Backend de Elixir
cd apps/backend-ex

# Frontend
cd apps/frontend

# Simulador de proveedores
cd apps/provider-sim
```

## 🚀 Desarrollo Local

### Backend de Bun

```bash
# Todos los servicios
bun run dev

# Solo backend
bun run dev:backend

# Con logs
bun run dev:backend --inspect

# Tests
bun test
```

### Backend de Elixir

```bash
# Servidor de desarrollo
cd apps/backend-ex
mix phx.server

# Con IEx (consola interactiva)
iex -S mix phx.server

# Tests
mix test

# Tests de un archivo específico
mix test test/ecredit/credits_test.exs

# Tests que fallaron
mix test --failed
```

### Frontend

```bash
cd apps/frontend

# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm run test
```

## 🗄️ Base de Datos

### Levantar servicios

```bash
# PostgreSQL (necesario para ambos backends)
docker compose --env-file .env.docker up -d db

# Redis (solo para backend Bun)
docker compose --env-file .env.docker up -d redis

# Ambos
docker compose --env-file .env.docker up -d db redis
```

### Migraciones - Bun

```bash
bun run db:migrate          # Ejecutar migraciones pendientes
bun run db:seed             # Poblar datos de prueba
bun run db:migrations:generate  # Generar nueva migración
```

### Migraciones - Elixir

```bash
cd apps/backend-ex

mix ecto.create             # Crear base de datos
mix ecto.migrate            # Ejecutar migraciones
mix ecto.rollback           # Revertir última migración
mix ecto.reset              # Drop + Create + Migrate
mix run priv/repo/seeds.exs # Poblar datos

# Generar nueva migración
mix ecto.gen.migration migration_name
```

## 📝 Formateo y Linting

### Bun

```bash
bun run format              # Formatear código
bun run lint               # Linter (si existe)
```

### Elixir

```bash
cd apps/backend-ex

mix format                  # Formatear código
mix format --check-formatted  # Solo verificar
mix compile --warnings-as-errors  # Compilar strict
mix precommit              # Compile + Format + Tests
```

### Frontend

```bash
cd apps/frontend

npm run format              # Formatear (Prettier)
npm run lint               # Lint (ESLint)
```

## 🐛 Debugging

### Logs - Bun

```bash
# Con Docker
docker compose --env-file .env.docker logs -f backend

# En desarrollo
# Los logs aparecen en la terminal donde corres `bun dev:backend`
```

### Logs - Elixir

```bash
# Con Docker
docker compose --env-file .env.docker logs -f backend-ex

# En desarrollo
# Los logs aparecen en la terminal donde corres `mix phx.server`

# Más verbose
MIX_ENV=dev iex -S mix phx.server
```

### Base de Datos - Psql

```bash
# Conectar a la BD
psql -h localhost -U postgres -d ecredit_dev

# Comandos útiles en psql
\dt                 # Listar tablas
\d banking_info     # Ver estructura de tabla
SELECT * FROM banking_info;  # Consultar

# Ver jobs pendientes (Bun, si usas pg-boss)
SELECT * FROM pgboss.job;

# Ver jobs pendientes (Elixir, si usas Oban)
SELECT * FROM oban_jobs;
```

## 🔧 Configuración

### Variables de Entorno - Setup Inicial

```bash
# Bun
cp .env.docker.example .env.docker
# Editar .env.docker con valores si es necesario

# Elixir
cd apps/backend-ex
cp .env.example .env
# Editar .env si es necesario

# Frontend
cd apps/frontend
# .env.local es ignorado por git, crear si necesitas VITE_API_URL diferente
```

## 🐳 Docker

### Levantar/Detener

```bash
# Todos los servicios
docker compose --env-file .env.docker up -d

# Solo algunos
docker compose --env-file .env.docker up -d db redis backend frontend

# Rebuild y reiniciar
docker compose --env-file .env.docker up -d --build

# Detener
docker compose --env-file .env.docker down

# Ver estado
docker compose --env-file .env.docker ps

# Ver logs
docker compose --env-file .env.docker logs -f backend
```

## 🔐 Credenciales de Prueba

### Login

- Email: `admin1@ecredit.com`
- Password: `admin123456`

### Documentos de Prueba

#### México

| CURP | Nombre | Resultado |
|------|--------|-----------|
| `GOMC860101HDFRRA09` | Good Mexico User | APROBADO |
| `BAPC901215MDFRRS03` | Bad Mexico User | RECHAZADO |

#### Colombia

| Cédula | Nombre | Resultado |
|--------|--------|-----------|
| `1234567890` | Good Colombia User | APROBADO |
| `9876543210` | Bad Colombia User | RECHAZADO |

## 📊 URLs de Desarrollo

### Bun (Default)

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Provider Sim | http://localhost:3001 |

### Elixir (Alternativo)

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Oban UI | http://localhost:3000/oban |
| Provider Sim | http://localhost:3001 |

## 🧪 Testing

### Bun

```bash
# Todos los tests
bun test

# Test específico
bun test test/auth.test.ts

# Con coverage
bun test --coverage
```

### Elixir

```bash
cd apps/backend-ex

# Todos
mix test

# Específico
mix test test/ecredit/credits_test.exs:42

# Que fallaron
mix test --failed

# Sin randomizar
mix test --randomize false

# Con timeout mayor (para tests lentos)
mix test --timeout 10000
```

### Frontend

```bash
cd apps/frontend

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🚢 Despliegue Producción

### Bun

```bash
# Build
bun run build

# Run
node dist/index.js
```

### Elixir

```bash
cd apps/backend-ex

# Release
MIX_ENV=prod mix ecto.migrate
MIX_ENV=prod mix release

# Run
PHX_SERVER=true _build/prod/rel/ecredit/bin/ecredit start
```

### Frontend

```bash
cd apps/frontend

# Build
npm run build

# Servir
# Los archivos están en dist/
npm run preview
```

## 🆘 Problemas Comunes

### "Port already in use"

```bash
# Encontrar proceso
lsof -i :3000  # Para Bun y elixir
lsof -i :5173  # Para Frontend

# Matar proceso
kill -9 <PID>
```

### "Cannot connect to database"

```bash
# Iniciar DB
docker compose --env-file .env.docker up -d db

# Crear BD (si es necesario)
# Bun: bun run db:migrate
# Elixir: cd apps/backend-ex && mix ecto.create && mix ecto.migrate
```

### "CORS error"

Verificar `FRONTEND_URL` en backend:
- Bun: `apps/backend/.env` → `FRONTEND_URL`
- Elixir: `apps/backend-ex/.env` → `FRONTEND_URL`

Debe coincidir con URL donde corre el frontend (ej: `http://localhost:5173`).

### "JWT token invalid"

Cambiar en `.env`:
- `JWT_SECRET` - debe ser el mismo si migras entre backends

### "Tests failing randomly"

```bash
# Intentar sin randomizar
mix test --randomize false

# O con timeout mayor
mix test --timeout 15000
```

## 📚 Links Útiles

- [README Bun Backend](apps/backend/README.md)
- [README Elixir Backend](apps/backend-ex/README.md)
- [Migración entre Backends](docs/backend-migration.md)
- [AGENTS.md (Elixir guidelines)](apps/backend-ex/AGENTS.md)
- [Arquitectura](docs/architecture.md)
