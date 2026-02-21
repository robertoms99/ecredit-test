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

---

# 🚀 Despliegue Local

## Paso 0: Preparación Inicial

### 1. Configurar Variables de Entorno (OBLIGATORIO)

```bash
# Copiar plantilla de ejemplo (si no existe)
cp .env.example .env

# Editar si necesitas cambiar valores (opcional)
nano .env  # o tu editor favorito
```

**Variables por Backend:**

| Variable | Backend Bun (default) | Backend Elixir |
|----------|---|---|
| `VITE_API_URL` | `http://localhost:3000` | `http://localhost:4000` |
| `API_URL` | `http://localhost:3000` | `http://localhost:4000` |
| `JWT_SECRET` | ✅ Requerido | ✅ Requerido |
| `SECRET_KEY_BASE` | ❌ No requerido | ⚠️ **REQUERIDO** |

El `.env` viene preconfigurado para **Backend Bun** (default). Si usarás Elixir, solo cambia `VITE_API_URL` y `API_URL` de `3000` a `4000`.

---

## Opción 1: Desplegar con Justfile (RECOMENDADO) ⭐

### Instalar Justfile

Si no tienes `just` instalado:

```bash
# macOS (Homebrew)
brew install just

# Linux (apt)
sudo apt install just

# Otros sistemas
# Ver: https://github.com/casey/just#installation
```

O instala `mise` (que incluye Justfile):
```bash
curl https://mise.jdx.dev/install.sh | sh
mise install just
```

### Desplegar con Bun Backend (Default)

```bash
just start
```

**Acceso a servicios:**

| Servicio | URL |
|----------|-----|
| 🌐 Frontend | http://localhost:8080 |
| 🔌 Backend | http://localhost:3000 |
| 📄 Backend Docs | http://localhost:3000/docs |
| 🏦 Provider Sim | http://localhost:3001 |

### Desplegar con Elixir Backend (Alternativo)

⚠️ **Importante:** Antes de ejecutar, edita `.env` y cambia:
```bash
# En .env, cambiar de:
VITE_API_URL=http://localhost:3000
API_URL=http://localhost:3000

# A:
VITE_API_URL=http://localhost:4000
API_URL=http://localhost:4000

```

Luego ejecuta:
```bash
just start-elixir
```

El comando valida automáticamente la configuración:

```
🚀 Starting eCredit with Elixir backend...

⚠️  WARNING: VITE_API_URL is not set to Elixir port (4000)
   Current: http://localhost:3000
   Expected: http://localhost:4000

   Please edit .env and change:
   VITE_API_URL=http://localhost:4000
   API_URL=http://localhost:4000

(No continúa hasta que corrijas .env)
```

Una vez corregido:

```
✅ System ready!

📱 Frontend:      http://localhost:5173
🔌 Backend:       http://localhost:4000
📊 Oban UI:       http://localhost:4000/oban
🏦 Provider Sim:  http://localhost:3001

🔐 Credentials:
   Email: admin1@ecredit.com
   Pass:  admin123456
```

### Comandos Útiles

```bash
just down              # Detener servicios
just clean             # Detener y limpiar volumes
just logs backend      # Ver logs del backend
just logs frontend     # Ver logs del frontend
just ps                # Ver estado de servicios
```

---

## Opción 2: Desplegar con Docker Compose (Sin Justfile)

Si prefieres no usar `just`, puedes usar `docker compose` directamente.

### Bun Backend (Default)

```bash
# Asegúrate de tener .env configurado
cp .env.example .env

# Iniciar TODO
docker compose up -d --build

# Ver servicios
docker compose ps

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

**Acceso a servicios:**

| Servicio | URL |
|----------|-----|
| 🌐 Frontend | http://localhost:8080 |
| 🔌 Backend | http://localhost:3000 |
| 🏦 Provider Sim | http://localhost:3001 |

### Elixir Backend (Alternativo)

```bash
# 1. Editar .env para puerto 4000
nano .env
# Cambiar VITE_API_URL=http://localhost:4000

# 2. Iniciar con perfil elixir
docker compose --profile elixir up -d --build

# 3. Ver servicios
docker compose --profile elixir ps

# 4. Ver logs
docker compose --profile elixir logs -f

# 5. Detener
docker compose --profile elixir down
```

**Acceso a servicios:**

| Servicio | URL |
|----------|-----|
| 🌐 Frontend | http://localhost:8080 |
| 🔌 Backend Elixir | http://localhost:4000 |
| 📊 Oban UI | http://localhost:4000/oban |
| 🏦 Provider Sim | http://localhost:3001 |

---

## 🔐 Credenciales de Prueba

Después de desplegar, accede con:

```
Email: admin1@ecredit.com
Password: admin123456
```

O:

```
Email: admin2@ecredit.com
Password: admin123456
```

---

## 👥 Usuarios de Prueba para Solicitudes

Estos documentos predefinidos están en el simulador de proveedores:

### Mexico (MX)

| CURP | Nombre | Score Buro | Resultado Esperado |
|------|--------|------------|-------------------|
| `GOMC860101HDFRRA09` | Good Mexico User | 750 | ✅ APROBADO |
| `BAPC901215MDFRRS03` | Bad Mexico User | 450 | ❌ RECHAZADO |

### Colombia (CO)

| Cedula | Nombre | Score Datacredito | Resultado Esperado |
|--------|--------|-------------------|-------------------|
| `1234567890` | Good Colombia User | 680 | ✅ APROBADO |
| `9876543210` | Bad Colombia User | 400 | ❌ RECHAZADO |

---

# 🛠️ Cómo Contribuir

## Estructura de Desarrollo

Este es un **monorepo** con múltiples aplicaciones independientes:

```
apps/
├── backend/          # API Bun (Node.js/Bun runtime)
├── backend-ex/       # API Elixir (Erlang/OTP runtime)
├── frontend/         # React + Vite (Node.js/Bun runtime)
└── provider-sim/     # Simulador Bun (Node.js/Bun runtime)
```

Cada aplicación tiene su propio `README.md` con documentación específica:

- [Backend Bun](apps/backend/README.md)
- [Backend Elixir](apps/backend-ex/README.md)
- [Frontend](apps/frontend/README.md)
- [Provider Simulator](apps/provider-sim/README.md)

---

## Flujo de Desarrollo Recomendado

### 1. Clonar y Preparar

```bash
git clone https://github.com/robertoms99/ecredit-test.git
cd ecredit-bun

# Configurar variables de entorno
cp .env.example .env

# Instalar dependencias de la raíz (Bun)
bun install
```

### 2. Elegir Backend y Levantar Infraestructura

#### Opción A: Desarrollo con Backend Bun

```bash
# Levantar DB y Redis
docker compose up -d db redis

# Ejecutar migraciones
bun run db:migrate

# Poblar datos de prueba
bun run db:seed

# Iniciar TODO en paralelo desde la raíz
bun run dev
```

**Servicios disponibles:**

| Servicio | URL | Comando |
|----------|-----|---------|
| Frontend | http://localhost:5173 | `bun run dev:frontend` |
| Backend | http://localhost:3000 | `bun run dev:backend` |
| Backend Docs | http://localhost:3000/docs | - |
| Provider Sim | http://localhost:3001 | `bun run dev:provider` |

#### Opción B: Desarrollo con Backend Elixir

Primero, edita `.env`:
```bash
VITE_API_URL=http://localhost:4000
API_URL=http://localhost:4000
```

Luego:

```bash
# Levantar solo base de datos
docker compose up -d db

# Instalar dependencias Elixir
cd apps/backend-ex
mix deps.get

# Crear DB y ejecutar migraciones
mix ecto.create
mix ecto.migrate
mix run priv/repo/seeds.exs
cd ../..

# Terminal 1: Backend Elixir
cd apps/backend-ex
mix phx.server

# Terminal 2: Frontend
cd apps/frontend
bun run dev

# Terminal 3 (opcional): Provider Sim
cd apps/provider-sim
bun run dev
```

O más simple desde la raíz:
```bash
bun run dev:elixir
```

**Servicios disponibles:**

| Servicio | URL | Comando |
|----------|-----|---------|
| Frontend | http://localhost:5173 | `bun run dev:frontend` |
| Backend Elixir | http://localhost:4000 | `bun run dev:backend-ex` |
| Oban UI | http://localhost:4000/oban | - |
| Provider Sim | http://localhost:3001 | `bun run dev:provider` |

---

## 📝 Scripts Principales desde la Raíz

### Backend Bun

```bash
bun run dev                # ⭐ Todos los servicios en paralelo
bun run dev:backend        # Solo backend
bun run dev:frontend       # Solo frontend
bun run dev:provider       # Solo proveedor
bun run build              # Compilar para producción
bun run db:migrate         # Ejecutar migraciones
bun run db:seed            # Poblar datos de prueba
bun run worker             # Iniciar worker de jobs
```

### Backend Elixir

```bash
bun run dev:elixir         # ⭐ Backend Elixir + Frontend + Provider
bun run dev:backend-ex     # Solo backend Elixir
bun run dev:frontend       # Solo frontend
bun run dev:provider       # Solo proveedor

# Comandos específicos (dentro de apps/backend-ex)
cd apps/backend-ex
mix phx.server             # Iniciar servidor
mix ecto.create            # Crear base de datos
mix ecto.migrate           # Ejecutar migraciones
mix ecto.rollback          # Deshacer migración anterior
mix run priv/repo/seeds.exs  # Poblar datos
mix test                   # Ejecutar tests
```

---

## 🔄 Cambiar Entre Backends

### En Desarrollo Local

Si necesitas probar ambos backends:

```bash
# Opción 1: Editar .env y reiniciar
nano .env
# Cambiar VITE_API_URL entre 3000 (Bun) y 4000 (Elixir)

# Luego reiniciar servicios
# Ctrl+C para detener actual
bun run dev         # o bun run dev:elixir
```

### En Docker Compose

```bash
# Parar servicios actuales
docker compose down

# Actualizar .env con las URLs correctas
nano .env

# Iniciar con el otro backend
docker compose up -d --build              # Para Bun
docker compose --profile elixir up -d --build  # Para Elixir
```

---

## 📚 Documentación de Apps

- [Backend Bun](apps/backend/README.md) - API con Hono, Drizzle y pg-boss
- [Backend Elixir](apps/backend-ex/README.md) - API con Phoenix, Ecto y Oban
- [Frontend](apps/frontend/README.md) - SPA React
- [Provider Simulator](apps/provider-sim/README.md) - Simulador de proveedores bancarios

---

## 🧪 Testing

### Backend Bun

```bash
cd apps/backend
bun test
```

### Backend Elixir

```bash
cd apps/backend-ex
mix test
```

### Frontend

```bash
cd apps/frontend
bun test
```

---

## 🐛 Debugging

### Backend Bun (Node Inspector)

```bash
# Iniciar backend con inspector
node --inspect apps/backend/src/index.ts
# Luego abrir: chrome://inspect
```

### Backend Elixir (IEx)

```bash
cd apps/backend-ex
iex -S mix phx.server
```

---

## 📊 Comparación de Backends

| Característica | Bun | Elixir |
|---|---|---|
| **Runtime** | Bun | Erlang/OTP |
| **Framework** | Hono | Phoenix |
| **ORM** | Drizzle | Ecto |
| **Jobs** | pg-boss | Oban |
| **WebSockets** | Socket.IO | Phoenix Channels |
| **Puerto** | 3000 | 4000 |
| **Startup** | ⚡ Muy rápido | Moderado |
| **Confiabilidad** | ✅ Buena | 🏆 Excelente |
| **Escalabilidad** | Single-node | Distribuida |
| **Ecosistema** | JavaScript | Elixir |

**Recomendación:** Usa Bun para desarrollo ágil. Usa Elixir para aplicaciones críticas que necesitan máxima confiabilidad y escalabilidad.

---

## ❓ FAQ

### P: ¿Qué debo hacer si Docker no está instalado?

R: Tienes dos opciones:
1. **Instalar Docker** siguiendo https://docs.docker.com/get-docker/
2. **Usar PostgreSQL local**: Instala PostgreSQL directamente en tu máquina y configura `DATABASE_URL` en `.env`

### P: ¿Puedo cambiar los puertos?

R: Sí, edita `.env` y cambia `BACKEND_PORT`, `FRONTEND_PORT`, etc. Los cambios se reflejarán automáticamente en los mensajes de `just start`.

### P: ¿Qué pasa si ejecuto `bun run dev` y ya hay servicios en los puertos?

R: Verás un error de puerto en uso. Detén los servicios previos o cambia los puertos en `.env`.

### P: ¿Los backends comparten la misma base de datos?

R: Sí, ambos usan la misma PostgreSQL. Los esquemas son idénticos. Puedes cambiar entre ellos sin perder datos.

### P: ¿Cómo accedo a Oban UI (Elixir)?

R: Solo disponible con backend Elixir. Una vez ejecutando, visita http://localhost:4000/oban

---

## 📞 Soporte

- 📖 Lee la [documentación](docs/)
- 🐛 Abre un [issue](https://github.com/robertoms99/ecredit-test/issues)
- 💬 Contacta al equipo
