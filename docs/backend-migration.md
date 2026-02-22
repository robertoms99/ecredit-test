# Guía de Migración entre Backends

Esta guía explica cómo cambiar del backend de Bun al de Elixir/Phoenix (o viceversa) para desarrollo o producción.

## Resumen Rápido

| Aspecto | Bun | Elixir |
|---------|-----|--------|
| Instalación | `bun install` | `mix deps.get` |
| Desarrollo | `bun dev` | `mix phx.server` |
| Puerto | 3000 | 3000 |
| DB | PostgreSQL + Redis | PostgreSQL (sin Redis) |
| Migraciones | `bun run db:migrate` | `mix ecto.migrate` |

## 1. Cambiar en Desarrollo Local

### De Bun a Elixir

#### Paso 1: Detener Bun

```bash
# Detener todos los servicios Bun
Ctrl+C
```

#### Paso 2: Iniciar Elixir

```bash
cd apps/backend-ex
mix deps.get
mix phx.server

# En otra terminal
cd apps/frontend
npm run dev
```

#### Paso 3: Configurar Frontend

En `apps/frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:3000
```

Reiniciar frontend si es necesario.

#### Paso 4: Verificar Base de Datos

```bash
# Asegurar que PostgreSQL esté corriendo
docker compose --env-file .env.docker up -d db

# Ejecutar migraciones de Elixir
cd apps/backend-ex
mix ecto.create
mix ecto.migrate
mix run priv/repo/seeds.exs
```

**Listo.** El frontend debería conectarse a `http://localhost:3000`.

### De Elixir a Bun

#### Paso 1: Detener Elixir

```bash
# En la terminal donde corre Elixir
Ctrl+C
```

#### Paso 2: Iniciar Bun

```bash
# Desde raíz del monorepo
docker compose --env-file .env.docker up -d db redis
bun install
bun run dev
```

#### Paso 3: Configurar Frontend

En `apps/frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:3000
```

O simplemente remover el archivo `.env.local` para usar el default (3000).

**Listo.** El frontend conectará a `http://localhost:3000`.

## 2. Base de Datos Compartida

### ¿Los backends pueden coexistir?

**Sí**, pueden compartir la misma PostgreSQL sin problemas porque:

1. Usan las mismas tablas y esquema
2. Las migraciones son idénticas (ambos generan el mismo schema)
3. Los datos se leen/escriben igual desde ambos

**Sin embargo**, en producción **solo uno debería correr** para evitar:
- Múltiples workers (Oban en Elixir, pg-boss en Bun) procesando los mismos jobs
- Conflictos en transiciones de estado

### Sincronizar Base de Datos

Si cambias de backend y la BD tiene cambios pendientes:

```bash
# Para Bun
bun run db:migrate

# Para Elixir
cd apps/backend-ex
mix ecto.migrate
```

Ambos comandos aplicarán las migraciones pendientes al mismo schema.

## 3. Cambiar en Docker/Producción

### De Bun a Elixir (Docker)

#### Paso 1: Actualizar docker-compose.yml

Reemplazar:

```yaml
backend:
  build:
    context: ./apps/backend
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
  # ...
```

Con:

```yaml
backend-ex:
  build:
    context: ./apps/backend-ex
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
  environment:
    MIX_ENV: prod
    DATABASE_URL: ecto://postgres:ecredit123@db:5432/ecredit
    JWT_SECRET: ${JWT_SECRET}
    SECRET_KEY_BASE: ${SECRET_KEY_BASE}
  depends_on:
    - db
  # ...
```

#### Paso 2: Generar secretos

```bash
mix phx.gen.secret  # Para SECRET_KEY_BASE
```

Guardar ambos en `.env.docker`.

#### Paso 3: Ejecutar migraciones

```bash
docker compose --env-file .env.docker run backend-ex mix ecto.migrate
```

#### Paso 4: Actualizar frontend

En el Dockerfile del frontend, cambiar:

```dockerfile
ARG VITE_API_URL=http://backend:3000
```

A:

```dockerfile
ARG VITE_API_URL=http://backend-ex:3000
```

#### Paso 5: Levantar servicios

```bash
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d --build
```

### De Elixir a Bun (Docker)

Inverso del anterior: cambiar los servicios en `docker-compose.yml` para usar `backend` en lugar de `backend-ex`.

## 4. Diferencias Operacionales

### Monitoreo

#### Bun

- Logs: `docker compose logs -f backend`
- Health: `GET /health`

#### Elixir

- Logs: `docker compose logs -f backend-ex`
- Health: `GET /health`
- Oban UI: `GET /oban` (en desarrollo)
- IEx interactivo: `iex -S mix phx.server`

### Performance

#### Bun

- Startup: ~100ms
- Memory: ~150MB
- CPU: Ligero
- Escalabilidad: Single-process (usar PM2/clustering)

#### Elixir

- Startup: ~2-3s
- Memory: ~100-150MB
- CPU: Ligero (pero más robusto bajo carga)
- Escalabilidad: Nativa con BEAM (clustering, distribución)

### Debugging

#### Bun

```bash
# Logs del worker (pg-boss)
SELECT * FROM pgboss.job;
```

#### Elixir

```elixir
# En IEx
iex(1)> Oban.Job |> Ecredit.Repo.all()
iex(2)> Oban.Web.PlugRouter  # Dashboard de Oban
```

## 5. Checklist de Migración

### Antes de cambiar

- [ ] Backup de base de datos
- [ ] Verificar que todas las migraciones estén aplicadas
- [ ] Revisar logs de errores recientes
- [ ] Comunicar a team sobre downtime (si aplica)

### Durante el cambio

- [ ] Detener backend anterior
- [ ] Ejecutar migraciones del nuevo backend
- [ ] Verificar que frontend pueda conectar (verificar CORS)
- [ ] Ejecutar tests del nuevo backend
- [ ] Verificar webhooks si aplica

### Después del cambio

- [ ] Verificar login funciona
- [ ] Crear una solicitud de prueba
- [ ] Verificar que webhooks se reciben
- [ ] Revisar logs del nuevo backend
- [ ] Comunicar que todo está funcionando

## 6. Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar que DB existe y está corriendo
docker compose --env-file .env.docker up -d db

# Para Elixir
cd apps/backend-ex
mix ecto.create
mix ecto.migrate

# Bun
lsof -i :3000
kill -9 <PID>

# Elixir
lsof -i :3000
kill -9 <PID>
```

### Error: "CORS blocked request"

Verificar `FRONTEND_URL` en variables de entorno del backend:

```bash
# Bun (.env)
FRONTEND_URL=http://localhost:5173

# Elixir (.env)
FRONTEND_URL=http://localhost:5173
```

### Error: "JWT token invalid"

Asegurar que `JWT_SECRET` sea el mismo si migras de un backend a otro (para no invalidar tokens existentes).

### WebSocket no conecta

#### Bun

Socket.IO conecta a `/socket.io/`. Verificar URL en frontend: `io('http://localhost:3000')`

#### Elixir

Phoenix Channels conecta a `/ws`. Verificar URL en frontend: `new Socket('/ws')`

## 7. Variables de Entorno Críticas

### Bun

```bash
DATABASE_URL=ecto://...
REDIS_URL=redis://...
JWT_SECRET=...
FRONTEND_URL=...
```

### Elixir

```bash
DATABASE_URL=ecto://...
JWT_SECRET=...
SECRET_KEY_BASE=...  # Generado con `mix phx.gen.secret`
FRONTEND_URL=...
```

> **Nota:** Elixir no requiere Redis porque Oban está integrado en PostgreSQL.

## 8. Contacto y Soporte

- Documentación de Bun: [apps/backend/README.md](../apps/backend/README.md)
- Documentación de Elixir: [apps/backend-ex/README.md](../apps/backend-ex/README.md)
- Pautas de desarrollo: [apps/backend-ex/AGENTS.md](../apps/backend-ex/AGENTS.md)
