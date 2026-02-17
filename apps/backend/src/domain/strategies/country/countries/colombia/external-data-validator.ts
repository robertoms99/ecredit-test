import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { ExternalBankData } from '../../types';
import { AppError } from '../../../../errors/app-error';

export class ColombiaExternalDataValidator implements IExternalDataValidator {
  async validate(data: ExternalBankData): Promise<boolean> {
    const { externalRequestId, payload } = data;

    if (!externalRequestId || typeof externalRequestId !== 'string') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'External request ID is required and must be a string',
        { externalRequestId }
      );
    }

    if (!payload || typeof payload !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Payload is required and must be an object',
        { payload }
      );
    }

    if (!payload.datacredito || typeof payload.datacredito !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Missing datacredito in Colombia provider payload',
        { payload }
      );
    }

    if (!payload.datos_financieros || typeof payload.datos_financieros !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Missing datos_financieros in Colombia provider payload',
        { payload }
      );
    }

    const datacredito = payload.datacredito;
    const datosFinancieros = payload.datos_financieros;

    if (typeof datacredito.score !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'datacredito.score must be a number',
        { score: datacredito.score }
      );
    }

    if (typeof datosFinancieros.ingresos_mensuales !== 'number' || datosFinancieros.ingresos_mensuales < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'ingresos_mensuales must be a non-negative number',
        { ingresos_mensuales: datosFinancieros.ingresos_mensuales }
      );
    }

    if (typeof datosFinancieros.obligaciones_mensuales !== 'number' || datosFinancieros.obligaciones_mensuales < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'obligaciones_mensuales must be a non-negative number',
        { obligaciones_mensuales: datosFinancieros.obligaciones_mensuales }
      );
    }

    if (typeof datosFinancieros.balance_cuentas !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'balance_cuentas must be a number',
        { balance_cuentas: datosFinancieros.balance_cuentas }
      );
    }

    return true;
  }
}
