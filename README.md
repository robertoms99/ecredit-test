# ecredit-bun

MVP de solicitudes de crédito multi-país (ES, MX) usando Bun + TypeScript, Hono, Postgres, Redis (caché), y WebSocket.

## Requisitos
- Bun >= 1.0
- Postgres >= 14
- Redis >= 6

## Configuración rápida
1. Configura env:
   - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/ecredit`
   - `JWT_SECRET=change-me`
2. Ejecuta migraciones:
   - `bun run scripts/migrate.ts`
3. Levanta el server:
   - `bun run src/server.ts`
4. Levanta el worker:
   - `bun run src/jobs/worker.ts`

## Endpoints (protegidos por JWT)
- POST `/api/requests`
- GET `/api/requests/:id`
- GET `/api/requests?country=ES&status=submitted`
- PUT `/api/requests/:id/status`

## Modelo de datos
- Tabla `credit_requests` con campos requeridos y `bank_info` (sanitizado).
- Tabla `jobs` para trabajos asíncronos.

Indices recomendados:
- `CREATE INDEX ON credit_requests (country, status, requested_at DESC);`
- `CREATE INDEX ON jobs (created_at);`

Particionamiento sugerido:
- Particionar `credit_requests` por país y rango de fechas (mensual) para mejorar consultas y mantenimiento.

Consultas críticas y cuellos de botella:
- Listas por país y estado: asegurar índices compuestos.
- Evitar `SELECT *`; usar columnas necesarias.

Archivado:
- Mover solicitudes cerradas (> 1 año) a tablas de archivo particionadas para reducir tamaño.

## Colas y procesamiento
- Se usa tabla `jobs` y polling simple del worker. Puede escalar horizontalmente corriendo múltiples instancias del worker (DELETE ... RETURNING actúa como claim). Se puede mejorar con `LISTEN/NOTIFY` para wake-up.

## Cache
- Redis para cachear listados por filtros comunes (pendiente: middleware de caché). Invalidación por NOTIFY en cambios de estado.

## Webhooks
- Pendiente: endpoint `/api/webhooks/provider` para recibir confirmaciones y actualizar estado.

## Seguridad
- JWT, sanitización de `bank_info`, evitar PII sensible en respuestas y logs.

## Observabilidad
- Logs estructurados via Hono logger. Manejo de errores consistente.

## Kubernetes (k8s)
- Pendiente: manifests para backend, worker, Postgres y Redis.

## Justfile
- Pendiente: comandos `dev`, `migrate`, `worker`.

## Supuestos
- Proveedores bancarios son simulados y synchronos.
- Reglas por país simplificadas.
