import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { NewBankingInfo } from '../../../../entities/banking-info';
import { MEXICO_CONFIG } from './config';
import superagent from 'superagent';

export class MexicoBankDataProvider implements IBankDataProvider {
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
        .post(MEXICO_CONFIG.providerUrl)
        .send({
          document_id: documentId,
          credit_request_id: creditRequestId,
          callback_url: this.callbackUrl,
        })
        .timeout(10000);

      const data = response.body;

      return {
        externalRequestId: data.request_id,
        providerName: MEXICO_CONFIG.providerName,
        fetchStatus: 'PENDING',
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch bank data from Mexico provider: ${error.message}`
      );
    }
  }
}
