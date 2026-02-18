export const MEXICO_PROVIDER_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'CURP no encontrado en el sistema del proveedor',
    shouldCatch: true,
  },
} as const;

export type MexicoProviderErrorCode = keyof typeof MEXICO_PROVIDER_ERRORS;

export function isMexicoProviderError(errorCode: string): errorCode is MexicoProviderErrorCode {
  return errorCode in MEXICO_PROVIDER_ERRORS;
}
