import superagent from 'superagent';
import { IBankDataProvider } from '../../../../domain/ports/strategies/bank-data-provider';

export class BankDataProviderColombia implements IBankDataProvider {
  private urlBankProvider = 'http://localhost:5000/providers/co';

  supports(country: string): boolean {
    return country === 'CO';
  }

  async fetchBankDataByDocumentId(documentId: string): Promise<void> {
    await
      superagent.post(this.urlBankProvider)
      .send({
        cc: documentId,
      });
  }
}
