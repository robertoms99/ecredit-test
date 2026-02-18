import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { ExternalBankData } from '../../types';
import { AppError } from '../../../../errors/app-error';

export class ColombiaExternalDataValidator implements IExternalDataValidator {
  async validate(data: ExternalBankData): Promise<boolean> {
    const { externalRequestId, payload } = data;

    if (!externalRequestId || typeof externalRequestId !== 'string') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'ID de solicitud externa es requerido y debe ser una cadena de texto',
        { externalRequestId }
      );
    }

    if (!payload || typeof payload !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Payload es requerido y debe ser un objeto',
        { payload }
      );
    }

    if (!payload.datacredito || typeof payload.datacredito !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Falta datacredito en el payload del proveedor de Colombia',
        { payload }
      );
    }

    if (!payload.datos_financieros || typeof payload.datos_financieros !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Falta datos_financieros en el payload del proveedor de Colombia',
        { payload }
      );
    }

    const datacredito = payload.datacredito;
    const datosFinancieros = payload.datos_financieros;

    if (typeof datacredito.score !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'datacredito.score debe ser un número',
        { score: datacredito.score }
      );
    }

    if (typeof datosFinancieros.ingresos_mensuales !== 'number' || datosFinancieros.ingresos_mensuales < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'ingresos_mensuales debe ser un número no negativo',
        { ingresos_mensuales: datosFinancieros.ingresos_mensuales }
      );
    }

    if (typeof datosFinancieros.obligaciones_mensuales !== 'number' || datosFinancieros.obligaciones_mensuales < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'obligaciones_mensuales debe ser un número no negativo',
        { obligaciones_mensuales: datosFinancieros.obligaciones_mensuales }
      );
    }

    if (typeof datosFinancieros.balance_cuentas !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'balance_cuentas debe ser un número',
        { balance_cuentas: datosFinancieros.balance_cuentas }
      );
    }

    return true;
  }
}
