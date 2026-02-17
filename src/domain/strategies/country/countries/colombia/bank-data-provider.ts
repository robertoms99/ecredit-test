import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import { COLOMBIA_CONFIG } from './config';
import superagent from 'superagent';
import { AppError } from '../../../../errors';


export class ColombiaBankDataProvider implements IBankDataProvider {
  private readonly callbackUrl: string;

  constructor(callbackUrl: string) {
    this.callbackUrl = callbackUrl;
  }

  async fetchBankData(
    documentId: string,
    creditRequestId: string
  ): Promise<Omit<NewBankingInfo, 'creditRequestId'>> {
    try {
      const response = await superagent
        .post(COLOMBIA_CONFIG.providerUrl)
        .send({
          document_id: documentId,
          credit_request_id: creditRequestId,
          callback_url: this.callbackUrl,
        })
        .timeout(10000);

      const data = response.body;

      if (!data.correlation_id) {
        throw new AppError('PROVIDER_INVALID_RESPONSE', 'Provider did not return correlation_id', {
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
        throw new AppError('EXTERNAL_SERVICE_TIMEOUT', 'Colombia provider timeout', {
          country: 'CO',
          documentId,
          creditRequestId,
          timeout: 10000,
        });
      }

      if (error.status) {
        throw new AppError('PROVIDER_REQUEST_FAILED', `Colombia provider returned status ${error.status}`, {
          country: 'CO',
          documentId,
          creditRequestId,
          status: error.status,
          message: error.message,
        });
      }

      throw new AppError('EXTERNAL_SERVICE_UNAVAILABLE', 'Colombia provider unavailable', {
        country: 'CO',
        documentId,
        creditRequestId,
        error: error.message,
      });
    }
  }
}
