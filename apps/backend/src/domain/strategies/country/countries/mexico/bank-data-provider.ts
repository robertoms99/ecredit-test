import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import { MEXICO_CONFIG } from './config';
import { AppError } from '../../../../errors/app-error';
import type { IHttpClient } from '../../../../ports/http-client';

export class MexicoBankDataProvider implements IBankDataProvider {
  constructor(
    private readonly callbackUrl: string,
    private readonly httpClient: IHttpClient
  ) {}

  async fetchBankData(
    documentId: string,
    creditRequestId: string
  ): Promise<Omit<NewBankingInfo, 'creditRequestId'>> {
    try {
      const data = await this.httpClient.post<any>(MEXICO_CONFIG.providerUrl, {
        document_id: documentId,
        credit_request_id: creditRequestId,
        callback_url: this.callbackUrl,
      });

      if (!data.correlation_id) {
        throw new AppError('PROVIDER_INVALID_RESPONSE', 'El proveedor no retornó correlation_id', {
          country: 'MX',
          documentId,
          creditRequestId,
          response: data,
        });
      }

      return {
        externalRequestId: data.correlation_id,
        providerName: MEXICO_CONFIG.providerName,
        fetchStatus: 'PENDING',
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.timeout) {
        throw new AppError('EXTERNAL_SERVICE_TIMEOUT', 'Timeout del proveedor de México', {
          country: 'MX',
          documentId,
          creditRequestId,
          timeout: 10000,
        });
      }

      if (error.status) {
        throw new AppError('PROVIDER_REQUEST_FAILED', `El proveedor de México retornó estado ${error.status}`, {
          country: 'MX',
          documentId,
          creditRequestId,
          status: error.status,
          message: error.message,
        });
      }

      throw new AppError('EXTERNAL_SERVICE_UNAVAILABLE', 'Proveedor de México no disponible', {
        country: 'MX',
        documentId,
        creditRequestId,
        error: error.message,
      });
    }
  }
}
