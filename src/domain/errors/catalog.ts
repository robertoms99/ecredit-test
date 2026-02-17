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
  VALIDATION_FAILED: { status: 400, defaultMessage: 'Validation failed', requireDetails: true },
  NOT_FOUND: { status: 404, defaultMessage: 'Resource not found' },
  AUTH_REQUIRED: { status: 401, defaultMessage: 'Authentication required' },
  AUTH_FAILED: { status: 401, defaultMessage: 'Authentication failed' },
  FORBIDDEN: { status: 403, defaultMessage: 'Forbidden' },
  CONFLICT: { status: 409, defaultMessage: 'Conflict' },
  RATE_LIMITED: { status: 429, defaultMessage: 'Too many requests' },
  INTERNAL_ERROR: { status: 500, defaultMessage: 'Internal server error' },
  DATABASE_ERROR: { status: 500, defaultMessage: 'Database operation failed', requireDetails: true },
  DATABASE_CONSTRAINT_VIOLATION: { status: 409, defaultMessage: 'Database constraint violation', requireDetails: true },
  DATABASE_CONNECTION_FAILED: { status: 503, defaultMessage: 'Database connection failed' },
  EXTERNAL_SERVICE_ERROR: { status: 502, defaultMessage: 'External service error', requireDetails: true },
  EXTERNAL_SERVICE_TIMEOUT: { status: 504, defaultMessage: 'External service timeout' },
  EXTERNAL_SERVICE_UNAVAILABLE: { status: 503, defaultMessage: 'External service unavailable' },
  PROVIDER_REQUEST_FAILED: { status: 502, defaultMessage: 'Provider request failed', requireDetails: true },
  PROVIDER_INVALID_RESPONSE: { status: 502, defaultMessage: 'Provider returned invalid response', requireDetails: true },
  WEBHOOK_VALIDATION_FAILED: { status: 400, defaultMessage: 'Webhook data validation failed', requireDetails: true },
  DOCUMENT_VALIDATION_FAILED: { status: 400, defaultMessage: 'Document validation failed', requireDetails: true },
  CREDIT_EVALUATION_FAILED: { status: 500, defaultMessage: 'Credit evaluation failed', requireDetails: true },
  INVALID_STATUS_TRANSITION: { status: 409, defaultMessage: 'Invalid status transition', requireDetails: true },
  STATUS_MISMATCH: { status: 409, defaultMessage: 'Status mismatch detected', requireDetails: true },
  COUNTRY_NOT_SUPPORTED: { status: 400, defaultMessage: 'Country not supported', requireDetails: true },
  STRATEGY_NOT_FOUND: { status: 500, defaultMessage: 'Strategy not found', requireDetails: true },
  JOB_NOT_REGISTERED: { status: 500, defaultMessage: 'Job not registered', requireDetails: true },
  JOB_EXECUTION_FAILED: { status: 500, defaultMessage: 'Job execution failed', requireDetails: true },
  CONFIGURATION_ERROR: { status: 500, defaultMessage: 'Configuration error', requireDetails: true },
};

export function resolveError(code: ErrorCode): ErrorCatalogEntry {
  return CATALOG[code] ?? CATALOG.INTERNAL_ERROR;
}

export function isServerError(status: number) {
  return status >= 500;
}
