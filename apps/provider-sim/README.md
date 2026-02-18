# Provider Simulator

Simulador de proveedores bancarios externos. Simula el comportamiento asíncrono de bureaus de crédito reales.

## Flujo

1. El backend solicita datos bancarios vía POST
2. El simulador responde `202 Accepted` con un `correlation_id`
3. Después de 2-8 segundos, envía los datos al webhook del backend

## Desarrollo

```bash
# Desde la raíz del monorepo
bun run dev:provider

# O desde este directorio
bun dev
```

El servidor inicia en http://localhost:3001

## Documentación

Swagger UI disponible en http://localhost:3001/docs

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/providers/mx` | Proveedor México |
| POST | `/providers/co` | Proveedor Colombia |
| GET | `/health` | Estado del servicio |
| GET | `/test-users` | Usuarios de prueba |

### Request

```json
{
  "document_id": "GOMC860101HDFRRA09",
  "credit_request_id": "uuid",
  "callback_url": "http://localhost:3000/api/webhook/process-bank-data"
}
```

### Response (202 Accepted)

```json
{
  "correlation_id": "uuid-generado",
  "status": "PENDING",
  "estimated_time_seconds": 5
}
```

## Usuarios de Prueba

El simulador solo responde a documentos predefinidos. Otros IDs retornan `404`.

### México

| CURP | Nombre | Score | Resultado |
|------|--------|-------|-----------|
| `GOMC860101HDFRRA09` | Good Mexico User | 750 | Aprobado |
| `BAPC901215MDFRRS03` | Bad Mexico User | 450 | Rechazado |

### Colombia

| Cédula | Nombre | Score | Resultado |
|--------|--------|-------|-----------|
| `1234567890` | Good Colombia User | 680 | Aprobado |
| `9876543210` | Bad Colombia User | 400 | Rechazado |

## Variables de Entorno

```bash
PORT=3001
```

## Docker

```bash
# Build
docker build -t ecredit-provider-sim:latest .

# Run
docker run -d \
  --name ecredit-provider-sim \
  -p 3001:3001 \
  ecredit-provider-sim:latest
```
