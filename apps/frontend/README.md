# Frontend - eCredit

Aplicación web para gestión de solicitudes de crédito.

## Tecnologías

- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **TailwindCSS** - Framework CSS
- **React Router** - Enrutamiento
- **Socket.io Client** - WebSockets

## Desarrollo

> **Requisito:** El backend debe estar corriendo en http://localhost:3000

```bash
# Desde la raíz del monorepo
bun run dev:frontend

# O desde este directorio
bun dev
```

Abre http://localhost:5173

## Variables de Entorno

```bash
VITE_API_URL=http://localhost:3000
```

## Scripts

```bash
bun dev      # Servidor de desarrollo
bun build    # Compilar para producción
bun start    # Preview del build
```

## Estructura

```
src/
├── api/           # Llamadas al backend
├── components/    # Componentes React
├── contexts/      # React Context (Auth)
├── hooks/         # Custom hooks
├── constants/     # Configuración de estados
├── App.tsx        # Componente raíz
└── main.tsx       # Entry point
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Login |
| `/dashboard` | Panel principal (requiere autenticación) |

## WebSockets

La aplicación recibe actualizaciones en tiempo real mediante Socket.io:

- Cambios de estado en solicitudes
- Notificaciones de nuevos datos bancarios

## Docker

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

Abre http://localhost:8080
