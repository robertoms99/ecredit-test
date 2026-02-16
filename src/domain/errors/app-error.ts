import { ErrorCode, resolveError, isServerError } from './catalog';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    const entry = resolveError(code);
    super(message || entry.defaultMessage);
    this.code = code;
    this.status = entry.status;
    this.details = details;
  }

  toResponse() {
    if (isServerError(this.status)) {
      return { code: this.code, message: resolveError(this.code).defaultMessage };
    }
    const base: any = { code: this.code, message: this.message };
    if (this.details !== undefined) base.details = this.details;
    return base;
  }
}

export function validationError(message: string, details?: unknown) {
  return new AppError('VALIDATION_FAILED', message, details);
}

export function notFoundError(message = 'Not found') {
  return new AppError('NOT_FOUND', message);
}

export function internalError(message = 'Internal error') {
  return new AppError('INTERNAL_ERROR', message);
}
