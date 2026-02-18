import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import type { IHttpClient } from '../../../../ports/http-client';
import { MEXICO_CONFIG } from './config';
import { MEXICO_PROVIDER_ERRORS, isMexicoProviderError } from './provider-errors';
import { AppError } from '../../../../errors/app-error';

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

      if (error.response?.body?.error_code) {
        const providerErrorCode = error.response.body.error_code;
        if (isMexicoProviderError(providerErrorCode)) {
          const providerError = MEXICO_PROVIDER_ERRORS[providerErrorCode];
          throw new AppError('PROVIDER_KNOWN_ERROR', providerError.message, {
            country: 'MX',
            documentId,
            creditRequestId,
            providerErrorCode,
            shouldCatch: providerError.shouldCatch,
            providerName: MEXICO_CONFIG.providerName,
            details: error.response.body.details,
          });
        }
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
