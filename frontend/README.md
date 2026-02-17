# Frontend - Sistema de Solicitudes de Crédito en Tiempo Real

Frontend React + TypeScript + Tailwind con actualizaciones en tiempo real usando Socket.IO.

## Características

### ✅ Operaciones CRUD Completas
- **Crear** - Formulario completo para crear nuevas solicitudes de crédito
- **Leer** - Lista paginada con todas las solicitudes
- **Ver Detalles** - Modal con información completa de cada solicitud
- **Actualizar Estado** - Cambiar manualmente el estado de una solicitud

### ✅ Tecnologías y Herramientas
- ✅ **Vite + React + TypeScript** para desarrollo rápido y type-safe
- ✅ **Tailwind CSS** para estilos modernos y responsivos
- ✅ **Socket.IO Client** para comunicación bidireccional en tiempo real
- ✅ **Actualizaciones automáticas** - Las tarjetas se actualizan sin refrescar cuando cambia el estado
- ✅ **Filtros por país** - México 🇲🇽, Colombia 🇨🇴, o ver todas
- ✅ **Indicador de conexión** - Punto verde/rojo que muestra el estado de Socket.IO
- ✅ **Animación visual** - Ring azul pulsante cuando una tarjeta se actualiza
- ✅ **Manejo de errores** - Mensajes claros para todos los errores de API

## Requisitos Previos

- Node.js 18+ o Bun
- Backend corriendo (ver DEPLOYMENT.md en raíz del proyecto)
- Base de datos PostgreSQL con migraciones aplicadas

## Configuración

### 1. Variables de Entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Contenido del `.env`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# Environment
VITE_NODE_ENV=development
```

**Importante**: En producción, cambia `VITE_API_URL` a la URL real de tu backend.

### 2. Instalación

```bash
# Instalar dependencias
pnpm install
# o con npm/yarn/bun
npm install
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev
```

El frontend estará disponible en http://localhost:5173

## Build para Producción

```bash
# Construir para producción
pnpm build

# Los archivos optimizados se generan en dist/

# Preview del build (opcional)
pnpm preview
```

## Funcionalidades Detalladas

### 1. Crear Solicitud de Crédito

- Click en botón "Nueva Solicitud" (esquina superior derecha)
- Modal con formulario completo
- Campos validados:
  - País (México/Colombia)
  - Nombre completo (requerido)
  - Documento de identidad (requerido)
  - Monto solicitado (> 0)
  - Ingreso mensual (> 0)
- La nueva solicitud aparece instantáneamente en la lista
- Animación de ring azul por 3 segundos

### 2. Ver Lista de Solicitudes

- Grid responsivo (1/2/3 columnas según pantalla)
- Cada tarjeta muestra:
  - Nombre y documento
  - País con bandera
  - Monto solicitado e ingreso mensual
  - Estado actual con badge de color
  - Fecha de solicitud
  - Última actualización (timestamp)
- Paginación automática (límite: 100 solicitudes)

### 3. Ver Detalles

- Click en "Ver Detalles" en cualquier tarjeta
- Modal con información completa:
  - **Información Personal**: Nombre, documento, país, usuario ID
  - **Información Financiera**: Monto, ingreso, relación deuda/ingreso
  - **Historial**: Fecha de solicitud, creación, última actualización
- Timestamps con formato dd/MM/yyyy HH:mm:ss

### 4. Actualizar Estado

- Click en "Actualizar Estado" en cualquier tarjeta
- Modal con selector de estado:
  - Created (Creado)
  - Evaluating (Evaluando)
  - Pending_info (Información Pendiente)
  - Approved (Aprobado)
  - Rejected (Rechazado)
- Vista previa del estado seleccionado
- Actualización inmediata en la lista
- Animación de ring azul por 3 segundos

### 5. Filtros

- Botones de filtro por país:
  - "Todos" - Ver todas las solicitudes
  - "🇲🇽 México" - Solo solicitudes de México
  - "🇨🇴 Colombia" - Solo solicitudes de Colombia
- Los filtros se aplican instantáneamente
- El contador de total se actualiza según el filtro

### 6. Tiempo Real

- Conexión Socket.IO persistente
- Indicador visual (punto verde = conectado, rojo = desconectado)
- Cuando el backend emite un cambio de estado:
  1. El frontend recibe el evento automáticamente
  2. La tarjeta correspondiente se actualiza
  3. Aparece un ring azul pulsante por 3 segundos
  4. El timestamp de "última actualización" se actualiza
- No requiere refrescar la página

### 7. Manejo de Errores

- Mensajes de error claros y descriptivos
- Errores de API se muestran en banner rojo
- Errores de formulario se muestran bajo cada campo
- Los modales muestran spinners durante operaciones async
- Botones deshabilitados durante loading

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── App.tsx                           # ⭐ Componente principal con toda la lógica
│   ├── main.tsx                          # Entry point de React
│   ├── index.css                         # Estilos globales + Tailwind
│   ├── types.ts                          # TypeScript interfaces
│   ├── api/
│   │   └── creditRequests.ts            # 🔌 Cliente REST API (list, getById, create, updateStatus)
│   ├── hooks/
│   │   └── useSocket.ts                 # 🔌 Hooks de Socket.IO (useSocket, useCreditRequestUpdates)
│   └── components/
│       ├── CreditRequestCard.tsx        # 📄 Tarjeta individual con botones de acción
│       ├── CountryFilter.tsx            # 🔍 Filtros por país
│       ├── CreateCreditRequestForm.tsx  # ➕ Modal: Formulario de creación
│       ├── CreditRequestDetailsModal.tsx # 👁️ Modal: Ver detalles completos
│       └── UpdateStatusModal.tsx        # ✏️ Modal: Actualizar estado
├── .env                                  # Variables de entorno (NO commitear)
├── .env.example                          # Ejemplo de variables
├── package.json                          # Dependencias y scripts
├── vite.config.ts                        # Config de Vite con proxy
├── tailwind.config.js                    # Config de Tailwind
├── tsconfig.json                         # Config de TypeScript
└── README.md                             # Este archivo
```

## Cómo Funciona el Tiempo Real

### Flujo Completo

```
Usuario crea solicitud
    ↓
POST /api/credit-requests → Backend
    ↓
Backend guarda en PostgreSQL
    ↓
PostgreSQL Trigger dispara pg_notify()
    ↓
DatabaseNotificationListener captura notificación
    ↓ (emite a dos destinos)
    ├─→ pg-boss (Job Queue) → StatusTransitionJob → Provider Externo
    └─→ WebSocketServer.emitCreditRequestUpdate()
         ↓
         Socket.IO broadcast a todos los clientes conectados
         ↓
         Frontend recibe evento 'credit-request-updated'
         ↓
         useSocket hook actualiza estado React
         ↓
         Re-render con animación de ring azul
         ↓
         Usuario ve el cambio instantáneamente ✨
```

### Eventos Socket.IO

**Cliente Escucha:**
- `connect` - Cuando se establece la conexión
- `disconnect` - Cuando se pierde la conexión
- `credit-request-updated` - Cuando cambia el estado de una solicitud
  ```typescript
  {
    creditRequestId: string;
    statusId: string;
    statusName: string;
    updatedAt: string;
  }
  ```

## Proxy de Desarrollo

Vite está configurado para hacer proxy de:
- `/api/*` → `http://localhost:3000` (REST API)
- `/socket.io/*` → `http://localhost:3000` (WebSocket con upgrade)

Esto elimina problemas de CORS en desarrollo.

Ver `vite.config.ts` para más detalles.

## Tecnologías Utilizadas

- **React 18** - UI library con hooks
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server ultra-rápido
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time bidirectional communication
- **date-fns** - Date formatting library

## Testing del Sistema

### 1. Probar Creación

1. Iniciar backend y frontend
2. Click en "Nueva Solicitud"
3. Llenar formulario y enviar
4. Verificar que aparece en la lista con animación azul

### 2. Probar Ver Detalles

1. Click en "Ver Detalles" en cualquier tarjeta
2. Verificar que toda la información se muestra correctamente
3. Cerrar modal

### 3. Probar Actualizar Estado

1. Click en "Actualizar Estado" en cualquier tarjeta
2. Seleccionar nuevo estado
3. Click en "Actualizar Estado"
4. Verificar que la tarjeta se actualiza con el nuevo estado
5. Verificar animación azul

### 4. Probar Tiempo Real

1. Abrir dos ventanas del frontend
2. En ventana 1: Crear una solicitud
3. En ventana 2: Verificar que aparece automáticamente
4. Esperar ~10 segundos para que provider-sim responda
5. Ambas ventanas deben mostrar el cambio de estado simultáneamente

### 5. Probar Filtros

1. Crear solicitudes de México y Colombia
2. Click en filtro "🇲🇽 México" → Solo se muestran solicitudes de MX
3. Click en filtro "🇨🇴 Colombia" → Solo se muestran solicitudes de CO
4. Click en "Todos" → Se muestran todas las solicitudes

## Troubleshooting

### Error: "Cannot connect to Socket.IO"
- Verificar que el backend esté corriendo en puerto 3000
- Revisar la consola del navegador para errores de CORS
- Verificar `VITE_API_URL` en `.env`

### Las actualizaciones no aparecen
- Verificar que el trigger SQL esté aplicado: `bun run db:migrate` (en backend)
- Revisar logs del backend: `[DB Listener] Emitted WebSocket event...`
- Abrir DevTools → Network → WS para ver eventos WebSocket
- Verificar que el punto indicador esté verde (Socket.IO conectado)

### Errores de TypeScript
- Asegurarse de que las interfaces en `types.ts` coincidan con el backend
- Ejecutar `tsc --noEmit` para verificar tipos
- Reinstalar dependencias: `rm -rf node_modules && pnpm install`

### Errores de API (404, 500)
- Verificar que el backend esté corriendo
- Verificar `VITE_API_URL` en `.env`
- Verificar CORS en el backend (ver logs)
- Usar DevTools → Network para inspeccionar requests

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo en puerto 5173

# Producción
pnpm build            # Build optimizado para producción en dist/
pnpm preview          # Preview del build de producción

# Utilidades
pnpm type-check       # Verificar tipos de TypeScript (si está configurado)
```

## Despliegue en Producción

Ver el archivo `DEPLOYMENT.md` en la raíz del proyecto para instrucciones completas de despliegue.

### Resumen Rápido:

1. Configurar `.env` con la URL del backend en producción
2. Build: `pnpm build`
3. Los archivos en `dist/` están listos para servir
4. Opciones:
   - Nginx/Apache como servidor web estático
   - Vercel/Netlify para despliegue automático
   - Docker con servidor web

## Licencia

Parte del proyecto ecredit-bun - Evaluación Técnica

