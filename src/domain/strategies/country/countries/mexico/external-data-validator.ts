import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { ExternalBankData } from '../../types';
import { AppError } from '../../../../errors/app-error';

export class MexicoExternalDataValidator implements IExternalDataValidator {
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

    if (!payload.informacion_crediticia || typeof payload.informacion_crediticia !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Missing informacion_crediticia in Mexico provider payload',
        { payload }
      );
    }

    if (!payload.informacion_financiera || typeof payload.informacion_financiera !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Missing informacion_financiera in Mexico provider payload',
        { payload }
      );
    }

    const creditInfo = payload.informacion_crediticia;
    const finInfo = payload.informacion_financiera;

    if (typeof creditInfo.calificacion_buro !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'calificacion_buro must be a number',
        { calificacion_buro: creditInfo.calificacion_buro }
      );
    }

    if (typeof finInfo.ingreso_mensual_mxn !== 'number' || finInfo.ingreso_mensual_mxn < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'ingreso_mensual_mxn must be a non-negative number',
        { ingreso_mensual_mxn: finInfo.ingreso_mensual_mxn }
      );
    }

    if (typeof finInfo.deuda_mensual_mxn !== 'number' || finInfo.deuda_mensual_mxn < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'deuda_mensual_mxn must be a non-negative number',
        { deuda_mensual_mxn: finInfo.deuda_mensual_mxn }
      );
    }

    if (typeof finInfo.saldo_cuenta_mxn !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'saldo_cuenta_mxn must be a number',
        { saldo_cuenta_mxn: finInfo.saldo_cuenta_mxn }
      );
    }

    return true;
  }
}
