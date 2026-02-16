# API Endpoints

## Credit Requests

### 1. Create Credit Request
**POST** `/api/credit-requests`

Crea una nueva solicitud de crédito. El sistema automáticamente:
- Valida reglas de negocio según el país
- Solicita datos bancarios al proveedor correspondiente
- Inicia el flujo de evaluación automática

**Request Body:**
```json
{
  "country": "MX",
  "fullName": "Juan Pérez",
  "documentId": "GOMC860101HDFRRA09",
  "requestedAmount": 50000,
  "monthlyIncome": 30000,
  "userId": "uuid-del-usuario"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-generado",
  "country": "MX",
  "fullName": "Juan Pérez",
  "documentId": "GOMC860101HDFRRA09",
  "requestedAmount": 50000,
  "monthlyIncome": 30000,
  "userId": "uuid-del-usuario",
  "statusId": "uuid-del-status",
  "requestedAt": "2026-02-16T10:00:00Z",
  "createdAt": "2026-02-16T10:00:00Z",
  "updatedAt": "2026-02-16T10:00:00Z"
}
```

---

### 2. Get Credit Request by ID
**GET** `/api/credit-requests/:id`

Obtiene los detalles completos de una solicitud específica, incluyendo id y nombre del status.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "country": "MX",
  "fullName": "Juan Pérez",
  "documentId": "GOMC860101HDFRRA09",
  "requestedAmount": 50000,
  "monthlyIncome": 30000,
  "userId": "uuid-del-usuario",
  "statusId": "uuid-del-status",
  "status": {
    "id": "uuid-del-status",
    "name": "Aprobada"
  },
  "requestedAt": "2026-02-16T10:00:00Z",
  "createdAt": "2026-02-16T10:00:00Z",
  "updatedAt": "2026-02-16T10:05:30Z"
}
```

**Errors:**
- `404 Not Found` - Solicitud no encontrada

---

### 3. List Credit Requests
**GET** `/api/credit-requests`

Lista solicitudes de crédito con filtros opcionales y paginación.

**Query Parameters:**
- `country` (optional) - Filtrar por país: `MX`, `CO`, etc.
- `status` (optional) - Filtrar por status ID
- `from` (optional) - Fecha inicial (ISO 8601): `2026-02-01T00:00:00Z`
- `to` (optional) - Fecha final (ISO 8601): `2026-02-16T23:59:59Z`
- `limit` (optional) - Cantidad de resultados (1-100, default: 50)
- `offset` (optional) - Desplazamiento para paginación (default: 0)

**Examples:**
```
GET /api/credit-requests?country=MX
GET /api/credit-requests?country=CO&limit=20&offset=0
GET /api/credit-requests?from=2026-02-01T00:00:00Z&to=2026-02-16T23:59:59Z
GET /api/credit-requests?status=uuid-del-status-approved
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "country": "MX",
      "fullName": "Juan Pérez",
      "documentId": "GOMC860101HDFRRA09",
      "requestedAmount": 50000,
      "monthlyIncome": 30000,
      "userId": "uuid-del-usuario",
      "statusId": "uuid-del-status",
      "status": {
        "id": "uuid-del-status",
        "name": "Aprobada"
      },
      "requestedAt": "2026-02-16T10:00:00Z",
      "createdAt": "2026-02-16T10:00:00Z",
      "updatedAt": "2026-02-16T10:05:30Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Validation Errors:**
- `limit` debe estar entre 1 y 100
- `offset` debe ser no negativo
- `from` debe ser anterior o igual a `to`

---

### 4. Update Credit Request Status
**PUT** `/api/credit-requests/:id/status`

Actualiza manualmente el status de una solicitud.

⚠️ **Importante:** Este endpoint permite cambios manuales excepcionales. El flujo normal usa transiciones automáticas vía eventos.

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "country": "MX",
  "fullName": "Juan Pérez",
  "documentId": "GOMC860101HDFRRA09",
  "requestedAmount": 50000,
  "monthlyIncome": 30000,
  "userId": "uuid-del-usuario",
  "statusId": "nuevo-uuid-del-status",
  "requestedAt": "2026-02-16T10:00:00Z",
  "createdAt": "2026-02-16T10:00:00Z",
  "updatedAt": "2026-02-16T10:10:00Z"
}
```

**Errors:**
- `404 Not Found` - Solicitud o status no encontrado
- `400 Bad Request - INVALID_STATUS_TRANSITION` - No se puede cambiar desde un estado final

---

## Status Codes

Los estados disponibles en el sistema son:

| Code | Name | Description | Is Final? | Order |
|------|------|-------------|-----------|-------|
| `CREATED` | Creada | Solicitud creada | No | 1 |
| `PENDING_FOR_BANK_DATA` | Pendiente de datos bancarios | Esperando respuesta del proveedor | No | 2 |
| `EVALUATING` | En evaluación | En revisión | No | 3 |
| `APPROVED` | Aprobada | Aprobada | **Sí** | 4 |
| `REJECTED` | Rechazada | Rechazada | **Sí** | 5 |

**Estados finales:** Una vez que la solicitud llega a `APPROVED` o `REJECTED`, no puede cambiar de estado.

---

## Response Format

### Status Object (Minimizado)

Todos los endpoints que retornan credit requests incluyen un objeto `status` **minimizado** con solo los campos esenciales para el frontend:

```json
{
  "status": {
    "id": "uuid-del-status",
    "name": "Aprobada"
  }
}
```

**Campos incluidos:**
- `id` - UUID del status (para uso interno/filtros)
- `name` - Nombre legible para mostrar al usuario

**Campos NO incluidos (disponibles solo en tabla `request_statuses`):**
- `code` - Código interno del sistema
- `description` - Descripción detallada
- `isFinal` - Si es un estado terminal
- `displayOrder` - Orden de visualización

**Razón:** Optimización de payload y claridad para el frontend.

---

## Webhook (Internal)

### Process External Bank Data
**POST** `/api/webhook/process-bank-data`

Este webhook recibe datos bancarios de proveedores externos. **No está destinado para uso público.**

**Request Body:**
```json
{
  "external_request_id": "uuid-del-request-externo",
  "...resto-del-payload": "..."
}
```

El sistema valida automáticamente según el país y procesa la evaluación crediticia.

---

## Error Responses

Todos los endpoints pueden devolver errores en el siguiente formato:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid query parameters",
    "details": {
      "fieldErrors": {
        "limit": ["Number must be less than or equal to 100"]
      }
    }
  }
}
```

### Common Error Codes:
- `VALIDATION_FAILED` (400) - Datos de entrada inválidos
- `NOT_FOUND` (404) - Recurso no encontrado
- `DATABASE_ERROR` (500) - Error de base de datos
- `INVALID_STATUS_TRANSITION` (400) - Transición de estado no permitida
- `COUNTRY_NOT_SUPPORTED` (400) - País no soportado

---

## Pagination

Para paginar resultados en el endpoint de listado:

**Página 1 (primeros 20):**
```
GET /api/credit-requests?limit=20&offset=0
```

**Página 2 (siguientes 20):**
```
GET /api/credit-requests?limit=20&offset=20
```

**Página 3 (siguientes 20):**
```
GET /api/credit-requests?limit=20&offset=40
```

El campo `total` en la respuesta indica el número total de registros que cumplen con los filtros.

---

## Real-time Updates

Para recibir actualizaciones en tiempo real de los cambios de estado, el frontend debe implementar:

1. **Socket.IO** o **WebSockets** conectándose al servidor
2. Escuchar eventos de tipo `credit-request-updated`
3. El evento contendrá el ID de la solicitud actualizada

*(Documentación de WebSockets pendiente)*
