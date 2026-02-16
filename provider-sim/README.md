# Provider Simulator

Simulador de proveedores bancarios externos para el sistema de crédito. Este servicio simula el comportamiento de proveedores reales de datos bancarios que son llamados de forma asíncrona.

## 🎯 Propósito

Este simulador:
- Recibe solicitudes de datos bancarios (como un proveedor real)
- Genera un `externalRequestId` único (UUID) para cada solicitud
- Simula procesamiento asíncrono (2-8 segundos de delay)
- Envía datos financieros al webhook del sistema principal
- **Solo responde a usuarios de prueba predefinidos**

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
bun install

# Iniciar el simulador
bun run dev
```

El servidor estará disponible en `http://localhost:5000`

## 👥 Usuarios de Prueba

El simulador **solo acepta** los siguientes document IDs:

### México (MX)
| CURP | Nombre | Score | Resultado Esperado |
|------|--------|-------|-------------------|
| `GOMC860101HDFRRA09` | Good Mexico User | 750 | ✅ APPROVED |
| `BAPC901215MDFRRS03` | Bad Mexico User | 450 | ❌ REJECTED |

### Colombia (CO)
| CC | Nombre | Score | Resultado Esperado |
|----|--------|-------|-------------------|
| `1234567890` | Good Colombia User | 680 | ✅ APPROVED |
| `9876543210` | Bad Colombia User | 400 | ❌ REJECTED |

## 📡 Endpoints

### POST /providers/mx
Endpoint del proveedor de México.

**Request:**
```json
{
  "document_id": "GOMC860101HDFRRA09",
  "credit_request_id": "uuid-here",
  "callback_url": "http://localhost:3000/api/webhooks/external-bank-data"
}
```

**Response (202 Accepted):**
```json
{
  "request_id": "generated-uuid",
  "status": "PENDING",
  "message": "Request accepted, data will be sent to callback URL",
  "estimated_time_seconds": 5
}
```

**Callback enviado después del delay:**
```json
{
  "external_request_id": "generated-uuid",
  "document_id": "GOMC860101HDFRRA09",
  "full_name": "Good Mexico User",
  "credit_score": 750,
  "monthly_income": 50000,
  "monthly_debt": 15000,
  "account_balance": 100000,
  "employment_status": "EMPLOYED",
  "years_in_job": 5,
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

### POST /providers/co
Endpoint del proveedor de Colombia (mismo formato que MX).

### GET /health
Verificación de salud del servicio.

**Response:**
```json
{
  "status": "ok",
  "service": "Provider Simulator",
  "uptime": 123.45,
  "pending_requests": 2,
  "test_users": {
    "MX": ["GOMC860101HDFRRA09", "BAPC901215MDFRRS03"],
    "CO": ["1234567890", "9876543210"]
  }
}
```

### GET /test-users
Lista de usuarios de prueba disponibles.

## 🔄 Flujo de Trabajo

1. **Sistema principal** crea una solicitud de crédito
2. **Sistema principal** llama a `POST /providers/mx` (o `/co`)
3. **Provider-sim** responde inmediatamente con `202 Accepted` y un `request_id`
4. **Sistema principal** guarda el `externalRequestId` y marca status como `PENDING_FOR_BANK_DATA`
5. **Provider-sim** simula procesamiento (2-8 segundos)
6. **Provider-sim** envía callback al webhook con datos financieros
7. **Sistema principal** recibe webhook, valida datos y actualiza status a `EVALUATING`
8. **Sistema principal** evalúa crédito y aprueba/rechaza

## ⚠️ Importante

- El simulador **NO almacena datos** en base de datos
- Solo responde a los 4 document IDs predefinidos
- Si envías un document_id no válido, recibirás `404 Not Found`
- El `externalRequestId` es generado automáticamente (UUID v4)
- Los callbacks usan `fetch()` nativo de Bun

## 🧪 Testing Manual

```bash
# Crear solicitud para usuario bueno de México
curl -X POST http://localhost:5000/providers/mx \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "GOMC860101HDFRRA09",
    "credit_request_id": "test-123",
    "callback_url": "http://localhost:3000/api/webhooks/external-bank-data"
  }'

# Listar usuarios disponibles
curl http://localhost:5000/test-users

# Health check
curl http://localhost:5000/health
```

## 🔗 Integración con Sistema Principal

El sistema principal debe:
1. Configurar las URLs del provider en las configs:
   - `MEXICO_PROVIDER_URL=http://localhost:5000/providers/mx`
   - `COLOMBIA_PROVIDER_URL=http://localhost:5000/providers/co`

2. Tener un webhook endpoint en:
   - `http://localhost:3000/api/webhooks/external-bank-data`

3. Usar los usuarios del seed con los document IDs correctos:
   - `good.mexico@test.com` → CURP: `GOMC860101HDFRRA09`
   - `bad.mexico@test.com` → CURP: `BAPC901215MDFRRS03`
   - `good.colombia@test.com` → CC: `1234567890`
   - `bad.colombia@test.com` → CC: `9876543210`

## 📝 Logs

El simulador muestra logs detallados:
```
[MX Provider] Received request for CURP: GOMC860101HDFRRA09
[MX Provider] Generated external request ID: 550e8400-e29b-41d4-a716-446655440000
[MX Provider] Will callback to: http://localhost:3000/api/webhooks/external-bank-data

[MX Provider] Sending callback for request 550e8400-e29b-41d4-a716-446655440000
[MX Provider] Document: GOMC860101HDFRRA09
[MX Provider] Profile: Good Mexico User
[MX Provider] Credit Score: 750
[MX Provider] Callback URL: http://localhost:3000/api/webhooks/external-bank-data
[MX Provider] ✓ Callback successful (status 200)
```

## 🐛 Troubleshooting

**Error: "Document ID not found in test users"**
- Verifica que estás usando uno de los 4 document IDs válidos
- Lista disponible en `/test-users`

**Error: "Callback failed"**
- Verifica que el sistema principal esté corriendo
- Verifica que el webhook endpoint esté disponible
- Revisa los logs del sistema principal

**Callback nunca llega**
- Verifica el delay (2-8 segundos es normal)
- Revisa los logs del provider-sim
- Verifica que el `callback_url` sea accesible desde el simulador
