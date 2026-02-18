import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { ExternalBankData } from '../../types';
import { AppError } from '../../../../errors/app-error';

export class MexicoExternalDataValidator implements IExternalDataValidator {
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

    if (!payload.informacion_crediticia || typeof payload.informacion_crediticia !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Falta informacion_crediticia en el payload del proveedor de México',
        { payload }
      );
    }

    if (!payload.informacion_financiera || typeof payload.informacion_financiera !== 'object') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'Falta informacion_financiera en el payload del proveedor de México',
        { payload }
      );
    }

    const creditInfo = payload.informacion_crediticia;
    const finInfo = payload.informacion_financiera;

    if (typeof creditInfo.calificacion_buro !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'calificacion_buro debe ser un número',
        { calificacion_buro: creditInfo.calificacion_buro }
      );
    }

    if (typeof finInfo.ingreso_mensual_mxn !== 'number' || finInfo.ingreso_mensual_mxn < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'ingreso_mensual_mxn debe ser un número no negativo',
        { ingreso_mensual_mxn: finInfo.ingreso_mensual_mxn }
      );
    }

    if (typeof finInfo.deuda_mensual_mxn !== 'number' || finInfo.deuda_mensual_mxn < 0) {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'deuda_mensual_mxn debe ser un número no negativo',
        { deuda_mensual_mxn: finInfo.deuda_mensual_mxn }
      );
    }

    if (typeof finInfo.saldo_cuenta_mxn !== 'number') {
      throw new AppError(
        'WEBHOOK_VALIDATION_FAILED',
        'saldo_cuenta_mxn debe ser un número',
        { saldo_cuenta_mxn: finInfo.saldo_cuenta_mxn }
      );
    }

    return true;
  }
}
