import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import type { IHttpClient } from '../../../../ports/http-client';
import { COLOMBIA_CONFIG } from './config';
import { AppError } from '../../../../errors';


export class ColombiaBankDataProvider implements IBankDataProvider {
  constructor(
    private readonly callbackUrl: string,
    private readonly httpClient: IHttpClient
  ) {}

  async fetchBankData(
    documentId: string,
    creditRequestId: string
  ): Promise<Omit<NewBankingInfo, 'creditRequestId'>> {
    try {
      const data = await this.httpClient.post<any>(COLOMBIA_CONFIG.providerUrl, {
        document_id: documentId,
        credit_request_id: creditRequestId,
        callback_url: this.callbackUrl,
      })

      if (!data.correlation_id) {
        throw new AppError('PROVIDER_INVALID_RESPONSE', 'El proveedor no retornó correlation_id', {
          country: 'CO',
          documentId,
          creditRequestId,
          response: data,
        });
      }

      return {
        externalRequestId: data.correlation_id,
        providerName: COLOMBIA_CONFIG.providerName,
        fetchStatus: 'PENDING',
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.timeout) {
        throw new AppError('EXTERNAL_SERVICE_TIMEOUT', 'Timeout del proveedor de Colombia', {
          country: 'CO',
          documentId,
          creditRequestId,
          timeout: 10000,
        });
      }

      if (error.status) {
        throw new AppError('PROVIDER_REQUEST_FAILED', `El proveedor de Colombia retornó estado ${error.status}`, {
          country: 'CO',
          documentId,
          creditRequestId,
          status: error.status,
          message: error.message,
        });
      }

      throw new AppError('EXTERNAL_SERVICE_UNAVAILABLE', 'Proveedor de Colombia no disponible', {
        country: 'CO',
        documentId,
        creditRequestId,
        error: error.message,
      });
    }
  }
}
