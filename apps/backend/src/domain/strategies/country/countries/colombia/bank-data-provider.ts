import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import type { IHttpClient } from '../../../../ports/http-client';
import { COLOMBIA_CONFIG } from './config';
import { COLOMBIA_PROVIDER_ERRORS, isColombiaProviderError } from './provider-errors';
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
      });

      if (!data.correlation_id) {
        throw new AppError('PROVIDER_INVALID_RESPONSE', 'El proveedor no retornó correlation_id', {
          country: COLOMBIA_CONFIG.code,
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

      if (error.response?.body?.error_code) {
        const providerErrorCode = error.response.body.error_code;
        if (isColombiaProviderError(providerErrorCode)) {
          const providerError = COLOMBIA_PROVIDER_ERRORS[providerErrorCode];
          throw new AppError('PROVIDER_KNOWN_ERROR', providerError.message, {
            country: COLOMBIA_CONFIG.code,
            documentId,
            creditRequestId,
            providerErrorCode,
            shouldCatch: providerError.shouldCatch,
            providerName: COLOMBIA_CONFIG.providerName,
            details: error.response.body.details,
          });
        }
      }

      if (error.timeout) {
        throw new AppError('EXTERNAL_SERVICE_TIMEOUT', 'Timeout del proveedor de Colombia', {
          country: COLOMBIA_CONFIG.code,
          documentId,
          creditRequestId,
          timeout: 10000,
        });
      }

      if (error.status) {
        throw new AppError('PROVIDER_REQUEST_FAILED', `El proveedor de Colombia retornó estado ${error.status}`, {
          country: COLOMBIA_CONFIG.code,
          documentId,
          creditRequestId,
          status: error.status,
          message: error.message,
        });
      }

      throw new AppError('EXTERNAL_SERVICE_UNAVAILABLE', 'Proveedor de Colombia no disponible', {
        country: COLOMBIA_CONFIG.code,
        documentId,
        creditRequestId,
        error: error.message,
      });
    }
  }
}
