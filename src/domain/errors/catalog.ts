export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ErrorCatalogEntry {
  status: number;
  defaultMessage: string;
  requireDetails?: boolean;
}

const CATALOG: Record<ErrorCode, ErrorCatalogEntry> = {
  VALIDATION_FAILED: { status: 400, defaultMessage: 'Validation failed', requireDetails: true },
  NOT_FOUND: { status: 404, defaultMessage: 'Resource not found' },
  AUTH_REQUIRED: { status: 401, defaultMessage: 'Authentication required' },
  FORBIDDEN: { status: 403, defaultMessage: 'Forbidden' },
  CONFLICT: { status: 409, defaultMessage: 'Conflict' },
  RATE_LIMITED: { status: 429, defaultMessage: 'Too many requests' },
  INTERNAL_ERROR: { status: 500, defaultMessage: 'Internal server error' },
};

export function resolveError(code: ErrorCode): ErrorCatalogEntry {
  return CATALOG[code] ?? CATALOG.INTERNAL_ERROR;
}

export function isServerError(status: number) {
  return status >= 500;
}
