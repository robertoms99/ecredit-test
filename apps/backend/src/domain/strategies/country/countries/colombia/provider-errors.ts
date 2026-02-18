export const COLOMBIA_PROVIDER_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'Cédula no encontrada en el sistema del proveedor',
    shouldCatch: true,
  },
} as const;

export type ColombiaProviderErrorCode = keyof typeof COLOMBIA_PROVIDER_ERRORS;

export function isColombiaProviderError(errorCode: string): errorCode is ColombiaProviderErrorCode {
  return errorCode in COLOMBIA_PROVIDER_ERRORS;
}
