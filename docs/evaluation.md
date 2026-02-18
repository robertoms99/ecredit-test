# Evaluación de Riesgo Crediticio

## Visión General

El sistema de evaluación de riesgo está diseñado para ser completamente configurable por país, respetando las regulaciones locales y los patrones de validación específicos de cada región. Cada país implementa sus propias reglas de validación de documentos y criterios de evaluación crediticia.

## Flujo de Evaluación

Cuando se crea una solicitud de crédito, el sistema ejecuta el siguiente flujo:

 1. Validación de documento 
2. Solicitud de datos bancarios 
3. Recepción  vía Webhook 
4. Evaluación de riesgo
5. Decisión final         

```

## Ejemplo: México

A continuación se describe cómo funciona la evaluación para solicitudes de México, como ejemplo representativo del sistema.

### Configuración del País

Cada país define su configuración en un archivo `config.ts`:

```typescript
export const MEXICO_CONFIG: CountryConfig = {
  code: 'MX',
  name: 'México',
  currency: 'MXN',
  amountLimit: 500_000,              // Límite máximo de crédito
  minCreditScore: 600,               // Puntaje mínimo requerido
  maxDebtToIncomeRatio: 0.4,         // Máximo 40% de relación deuda/ingreso
  documentIdPattern: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/,
  providerUrl: 'http://provider/mx',
  providerName: 'Mexico Bank Data Provider',
  documentIdLabel: 'CURP'
};
```

### Validación de Documentos

El sistema valida que el CURP cumpla con el formato oficial mexicano:

- Longitud exacta de 18 caracteres
- Estructura: 4 letras + 6 dígitos (fecha) + 1 letra (género) + 5 letras + 2 caracteres
- El carácter de género debe ser 'H' (hombre) o 'M' (mujer)

Si la validación falla, la solicitud es rechazada inmediatamente con un mensaje descriptivo del error.

### Datos Bancarios

Una vez validado el documento, el sistema solicita datos bancarios al proveedor correspondiente. Para México, los datos incluyen:

- **Información crediticia**: Calificación del buró de crédito
- **Información financiera**: Ingresos mensuales, deuda actual, saldo en cuenta

### Criterios de Evaluación

La evaluación considera múltiples factores:

| Criterio | Descripción | Umbral México |
|----------|-------------|---------------|
| Puntaje crediticio | Score del buró de crédito | >= 600 |
| Relación deuda/ingreso | Deuda mensual / Ingreso mensual | <= 40% |
| Monto dentro del límite | Monto solicitado vs límite país | <= 500,000 MXN |
| Ingreso suficiente | Ingreso >= 15% del monto solicitado | >= 15% |
| Saldo positivo | Balance de cuenta bancaria | >= 0 |

### Clasificación de Riesgo

Basado en el puntaje crediticio y la relación deuda/ingreso, se asigna un nivel de riesgo:

- **BAJO**: Puntaje >= 750 y relación deuda/ingreso < 30%
- **MEDIO**: Puntaje >= 600 y relación deuda/ingreso < 40%
- **ALTO**: Cualquier otro caso

### Decisión Final

La solicitud es **aprobada** si:
- Todos los criterios de evaluación pasan
- El nivel de riesgo no es ALTO

En caso de rechazo, el sistema:
1. Indica claramente las razones del rechazo
2. Calcula un monto recomendado que podría ser aprobado
3. Registra todos los detalles en los metadatos de la transición

### Ejemplo de Resultado

**Aprobación:**
```
Crédito aprobado. Nivel de riesgo: MEDIO, 
Puntaje crediticio: 680, 
Relación deuda/ingreso: 25.5%
```

**Rechazo:**
```
Crédito rechazado: puntaje crediticio muy bajo (520 < 600), 
relación deuda/ingreso muy alta (45.2% > 40%)
```

## Extensibilidad

El diseño basado en estrategias permite:

1. **Añadir nuevos países** con sus propias reglas sin modificar código existente
2. **Ajustar umbrales** por país de forma independiente
3. **Integrar nuevas fuentes de datos** implementando las interfaces correspondientes
4. **Modificar criterios** de evaluación sin afectar otros países

## Trazabilidad

Cada evaluación queda registrada con:

- Resultado de cada criterio evaluado
- Datos financieros utilizados
- Nivel de riesgo calculado
- Monto recomendado (en caso de rechazo)
- Timestamp y metadatos completos

Esta información la registre en el historial de transiciones de cada solicitud, proporcionando una auditoría completa del proceso de decisión.
