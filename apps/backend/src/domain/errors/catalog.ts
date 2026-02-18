export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'DATABASE_CONSTRAINT_VIOLATION'
  | 'DATABASE_CONNECTION_FAILED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'EXTERNAL_SERVICE_TIMEOUT'
  | 'EXTERNAL_SERVICE_UNAVAILABLE'
  | 'PROVIDER_REQUEST_FAILED'
  | 'PROVIDER_INVALID_RESPONSE'
  | 'WEBHOOK_VALIDATION_FAILED'
  | 'DOCUMENT_VALIDATION_FAILED'
  | 'CREDIT_EVALUATION_FAILED'
  | 'INVALID_STATUS_TRANSITION'
  | 'STATUS_MISMATCH'
  | 'COUNTRY_NOT_SUPPORTED'
  | 'STRATEGY_NOT_FOUND'
  | 'JOB_NOT_REGISTERED'
  | 'JOB_EXECUTION_FAILED'
  | 'CONFIGURATION_ERROR';

export interface ErrorCatalogEntry {
  status: number;
  defaultMessage: string;
  requireDetails?: boolean;
}

const CATALOG: Record<ErrorCode, ErrorCatalogEntry> = {
  VALIDATION_FAILED: { status: 400, defaultMessage: 'Error de validación', requireDetails: true },
  NOT_FOUND: { status: 404, defaultMessage: 'Recurso no encontrado' },
  AUTH_REQUIRED: { status: 401, defaultMessage: 'Autenticación requerida' },
  AUTH_FAILED: { status: 401, defaultMessage: 'Autenticación fallida' },
  FORBIDDEN: { status: 403, defaultMessage: 'Acceso prohibido' },
  CONFLICT: { status: 409, defaultMessage: 'Conflicto' },
  RATE_LIMITED: { status: 429, defaultMessage: 'Demasiadas solicitudes' },
  INTERNAL_ERROR: { status: 500, defaultMessage: 'Error interno del servidor' },
  DATABASE_ERROR: { status: 500, defaultMessage: 'Error en operación de base de datos', requireDetails: true },
  DATABASE_CONSTRAINT_VIOLATION: { status: 409, defaultMessage: 'Violación de restricción de base de datos', requireDetails: true },
  DATABASE_CONNECTION_FAILED: { status: 503, defaultMessage: 'Fallo en conexión a base de datos' },
  EXTERNAL_SERVICE_ERROR: { status: 502, defaultMessage: 'Error en servicio externo', requireDetails: true },
  EXTERNAL_SERVICE_TIMEOUT: { status: 504, defaultMessage: 'Tiempo de espera agotado en servicio externo' },
  EXTERNAL_SERVICE_UNAVAILABLE: { status: 503, defaultMessage: 'Servicio externo no disponible' },
  PROVIDER_REQUEST_FAILED: { status: 502, defaultMessage: 'Solicitud al proveedor fallida', requireDetails: true },
  PROVIDER_INVALID_RESPONSE: { status: 502, defaultMessage: 'El proveedor retornó una respuesta inválida', requireDetails: true },
  WEBHOOK_VALIDATION_FAILED: { status: 400, defaultMessage: 'Validación de datos del webhook fallida', requireDetails: true },
  DOCUMENT_VALIDATION_FAILED: { status: 400, defaultMessage: 'Validación de documento fallida', requireDetails: true },
  CREDIT_EVALUATION_FAILED: { status: 500, defaultMessage: 'Evaluación de crédito fallida', requireDetails: true },
  INVALID_STATUS_TRANSITION: { status: 409, defaultMessage: 'Transición de estado inválida', requireDetails: true },
  STATUS_MISMATCH: { status: 409, defaultMessage: 'Inconsistencia de estado detectada', requireDetails: true },
  COUNTRY_NOT_SUPPORTED: { status: 400, defaultMessage: 'País no soportado', requireDetails: true },
  STRATEGY_NOT_FOUND: { status: 500, defaultMessage: 'Estrategia no encontrada', requireDetails: true },
  JOB_NOT_REGISTERED: { status: 500, defaultMessage: 'Trabajo no registrado', requireDetails: true },
  JOB_EXECUTION_FAILED: { status: 500, defaultMessage: 'Ejecución de trabajo fallida', requireDetails: true },
  CONFIGURATION_ERROR: { status: 500, defaultMessage: 'Error de configuración', requireDetails: true },
};

export function resolveError(code: ErrorCode): ErrorCatalogEntry {
  return CATALOG[code] ?? CATALOG.INTERNAL_ERROR;
}

export function isServerError(status: number) {
  return status >= 500;
}
