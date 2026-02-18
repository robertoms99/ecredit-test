/**
 * Configuration for credit request statuses
 * Maps status codes to Spanish names and colors
 */

export interface StatusConfig {
  code: string;
  name: string;
  color: string;
}

/**
 * Status code constants (must match backend RequestStatusCodes)
 */
export const STATUS_CODES = {
  CREATED: 'CREATED',
  PENDING_FOR_BANK_DATA: 'PENDING_FOR_BANK_DATA',
  EVALUATING: 'EVALUATING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FAILED_FROM_PROVIDER: 'FAILED_FROM_PROVIDER',
} as const;

/**
 * Map of status codes to display configuration
 */
export const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  [STATUS_CODES.CREATED]: {
    code: STATUS_CODES.CREATED,
    name: 'Creada',
    color: 'bg-gray-100 text-gray-800',
  },
  [STATUS_CODES.PENDING_FOR_BANK_DATA]: {
    code: STATUS_CODES.PENDING_FOR_BANK_DATA,
    name: 'Pendiente de datos bancarios',
    color: 'bg-blue-100 text-blue-800',
  },
  [STATUS_CODES.EVALUATING]: {
    code: STATUS_CODES.EVALUATING,
    name: 'En evaluación',
    color: 'bg-yellow-100 text-yellow-800',
  },
  [STATUS_CODES.APPROVED]: {
    code: STATUS_CODES.APPROVED,
    name: 'Aprobada',
    color: 'bg-green-100 text-green-800',
  },
  [STATUS_CODES.REJECTED]: {
    code: STATUS_CODES.REJECTED,
    name: 'Rechazada',
    color: 'bg-red-100 text-red-800',
  },
  [STATUS_CODES.FAILED_FROM_PROVIDER]: {
    code: STATUS_CODES.FAILED_FROM_PROVIDER,
    name: 'Error del proveedor',
    color: 'bg-orange-100 text-orange-800',
  },
};

/**
 * Get status configuration by code
 * Falls back to a default config if code is not found
 */
export function getStatusConfig(code: string): StatusConfig {
  return STATUS_CONFIG_MAP[code] || {
    code,
    name: code,
    color: 'bg-gray-100 text-gray-800',
  };
}

/**
 * Get status name by code
 */
export function getStatusName(code: string): string {
  return getStatusConfig(code).name;
}

/**
 * Get status color classes by code
 */
export function getStatusColor(code: string): string {
  return getStatusConfig(code).color;
}
