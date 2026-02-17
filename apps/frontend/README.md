# Frontend - eCredit

Aplicación web React con Vite, TailwindCSS y React Router para gestión de solicitudes de crédito.

## 🚀 Quick Start

### Local Development

```bash
# Desde la raíz del monorepo
bun dev:frontend

# O desde este directorio
bun dev
```

Abre http://localhost:5173 en tu navegador.

### Docker

```bash
# Build
docker build -t ecredit-frontend:latest .

# Run
docker run -d \
  --name ecredit-frontend \
  -p 8080:80 \
  -e API_URL=http://localhost:3000 \
  ecredit-frontend:latest
```

Abre http://localhost:8080 en tu navegador.

## 🐳 Docker Build

### Build desde la raíz del monorepo

```bash
docker build -t ecredit-frontend:latest -f apps/frontend/Dockerfile apps/frontend/
```

### Build desde este directorio

```bash
cd apps/frontend
docker build -t ecredit-frontend:latest .
```

### Build con API URL personalizada

```bash
# Opción 1: Build-time (durante construcción)
docker build \
  --build-arg VITE_API_URL=http://api.ecredit.com \
  -t ecredit-frontend:latest .

# Opción 2: Run-time (durante ejecución)
docker run -d \
  -p 8080:80 \
  -e API_URL=http://api.ecredit.com \
  ecredit-frontend:latest
```

## ⚙️ Variables de Entorno

### Build-time (Durante construcción)

- `VITE_API_URL` - URL del backend API (default: http://localhost:3000)

### Run-time (Durante ejecución)

- `API_URL` - URL del backend API (sobrescribe el valor de build-time)

**Ejemplo:**

```bash
# La app puede leer window.__env.API_URL en runtime
docker run -d -p 8080:80 -e API_URL=http://backend:3000 ecredit-frontend:latest
```

## 📝 Scripts

```bash
# Desarrollo
bun dev          # Vite dev server con HMR

# Build
bun build        # Compilar para producción

# Preview
bun start        # Preview del build de producción
bun preview      # Alias de start
```

## 🏗️ Estructura

```
src/
├── components/          # Componentes React
│   ├── Dashboard.tsx    # Panel principal
│   ├── Login.tsx        # Formulario de login
│   ├── CreditRequestCard.tsx
│   ├── CreateCreditRequestForm.tsx
│   └── ...
├── contexts/           # React Context
│   └── AuthContext.tsx
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   └── useSocket.ts
├── api/                # API calls
│   ├── auth.ts
│   └── creditRequests.ts
├── types.ts            # TypeScript types
├── constants/          # Constantes
│   └── statusConfig.ts
├── App.tsx             # Componente raíz
└── main.tsx            # Entry point
```

## 🔐 Autenticación

La app usa JWT tokens almacenados en localStorage.

**Usuarios por defecto:**
- Email: `admin1@ecredit.com`, Password: `admin123456`
- Email: `admin2@ecredit.com`, Password: `admin123456`

## 🎨 Estilos

- **TailwindCSS** - Framework CSS utility-first
- **Custom theme** - Colores y estilos personalizados
- **Responsive** - Diseño adaptable a móviles y desktop

## 🌐 Rutas

- `/` - Login
- `/dashboard` - Panel principal (requiere auth)
- Redirección automática si no hay token

## 🔌 API Integration

### Configuración

El frontend se conecta al backend vía la variable `API_URL`.

**Local:**
```bash
# .env.local
VITE_API_URL=http://localhost:3000
```

**Docker:**
```bash
docker run -e API_URL=http://backend:3000 ecredit-frontend:latest
```

### Endpoints Usados

- `POST /api/auth/login` - Login
- `GET /api/credit-requests` - Listar solicitudes
- `POST /api/credit-requests` - Crear solicitud
- `GET /api/credit-requests/:id` - Detalle
- `PUT /api/credit-requests/:id/status` - Actualizar estado
- `GET /api/credit-requests/:id/status-history` - Historial

### WebSockets

El frontend usa Socket.io para actualizaciones en tiempo real:

```typescript
// Se conecta automáticamente al backend
const socket = io(API_URL);

// Escucha cambios de estado
socket.on('credit-request:status-changed', (data) => {
  // Actualizar UI
});
```

## 🧪 Testing

### Test Manual

1. **Iniciar backend:**
   ```bash
   # Ver apps/backend/README.md
   docker run -d -p 3000:3000 ecredit-backend:latest
   ```

2. **Build y ejecutar frontend:**
   ```bash
   docker build -t ecredit-frontend:latest .
   docker run -d -p 8080:80 -e API_URL=http://localhost:3000 ecredit-frontend:latest
   ```

3. **Abrir en navegador:**
   ```
   http://localhost:8080
   ```

4. **Login:**
   - Email: `admin1@ecredit.com`
   - Password: `admin123456`

5. **Probar funcionalidades:**
   - ✓ Ver lista de solicitudes
   - ✓ Crear nueva solicitud
   - ✓ Ver detalles
   - ✓ Actualizar estado
   - ✓ Ver historial de cambios

## 🐛 Debug

### Local

```bash
bun dev
# Los errores aparecen en consola del navegador y terminal
```

### Docker

```bash
# Ver logs de Nginx
docker logs -f ecredit-frontend

# Shell dentro del contenedor
docker exec -it ecredit-frontend sh

# Verificar archivos build
docker exec ecredit-frontend ls -la /usr/share/nginx/html

# Ver configuración de Nginx
docker exec ecredit-frontend cat /etc/nginx/conf.d/default.conf

# Verificar env-config.js (runtime config)
docker exec ecredit-frontend cat /usr/share/nginx/html/env-config.js
```

### Browser DevTools

1. Abrir DevTools (F12)
2. Console - Ver errores JavaScript
3. Network - Ver peticiones al backend
4. Application > Local Storage - Ver JWT token

## 📦 Especificaciones Docker

- **Base Image:** nginx:alpine
- **Multi-stage build:** deps → builder → runner
- **Tamaño final:** ~40MB
- **Puerto:** 80
- **Healthcheck:** /health endpoint cada 15s
- **Runtime config:** Soporta variables de entorno

## 🔧 Nginx Features

- ✓ Gzip compression habilitado
- ✓ Security headers
- ✓ SPA routing (todas las rutas → index.html)
- ✓ Cache estático (1 año para assets)
- ✓ No-cache para index.html
- ✓ Health check endpoint

## 🛑 Detener y Limpiar

```bash
# Detener
docker stop ecredit-frontend

# Eliminar contenedor
docker rm ecredit-frontend

# Eliminar imagen
docker rmi ecredit-frontend:latest
```

## 🚀 Deploy

### Variables importantes

```bash
# Producción
API_URL=https://api.ecredit.com

# Staging
API_URL=https://api.staging.ecredit.com

# Local
API_URL=http://localhost:3000
```

### Ejemplo completo

```bash
# Build
docker build \
  --build-arg VITE_API_URL=https://api.ecredit.com \
  -t ecredit-frontend:latest .

# Run
docker run -d \
  --name ecredit-frontend \
  -p 80:80 \
  --restart unless-stopped \
  -e API_URL=https://api.ecredit.com \
  ecredit-frontend:latest
```

## 📖 Tecnologías

- **React 18** - UI Library
- **Vite** - Build tool y dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **React Router** - Routing
- **Socket.io Client** - WebSockets
- **date-fns** - Date formatting

## 🔗 Links

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
