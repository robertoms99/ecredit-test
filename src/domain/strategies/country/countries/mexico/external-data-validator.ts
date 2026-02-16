import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { ExternalBankData } from '../../types';
import { AppError } from '../../../../errors/app-error';

export class MexicoExternalDataValidator implements IExternalDataValidator {
  async validate(data: ExternalBankData): Promise<boolean> {
    const { externalRequestId, payload } = data;

    if (!externalRequestId || typeof externalRequestId !== 'string') {
      throw new AppError(
        'VALIDATION_FAILED',
        'External request ID is required and must be a string',
        { externalRequestId }
      );
    }

    if (!payload || typeof payload !== 'object') {
      throw new AppError(
        'VALIDATION_FAILED',
        'Payload is required and must be an object',
        { payload }
      );
    }

    const requiredFields = ['debt', 'balance', 'risk_score'];
    const missingFields = requiredFields.filter(field => !(field in payload));

    if (missingFields.length > 0) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Missing required fields in Mexico provider payload: ${missingFields.join(', ')}`,
        { missingFields, payload }
      );
    }

    if (typeof payload.debt !== 'number' || payload.debt < 0) {
      throw new AppError(
        'VALIDATION_FAILED',
        'Debt must be a non-negative number',
        { debt: payload.debt }
      );
    }

    if (typeof payload.balance !== 'number') {
      throw new AppError(
        'VALIDATION_FAILED',
        'Balance must be a number',
        { balance: payload.balance }
      );
    }

    if (
      typeof payload.risk_score !== 'number' ||
      payload.risk_score < 0 ||
      payload.risk_score > 1000
    ) {
      throw new AppError(
        'VALIDATION_FAILED',
        'Risk score must be a number between 0 and 1000',
        { risk_score: payload.risk_score }
      );
    }

    if ('account_status' in payload && typeof payload.account_status !== 'string') {
      throw new AppError(
        'VALIDATION_FAILED',
        'Account status must be a string if provided',
        { account_status: payload.account_status }
      );
    }

    return true;
  }
}
