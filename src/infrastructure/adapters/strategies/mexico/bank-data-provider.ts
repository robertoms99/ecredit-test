import superagent from 'superagent';
import { IBankDataProvider } from '../../../../domain/ports/strategies/bank-data-provider';

export class BankDataProviderMexico implements IBankDataProvider {
  private urlBankProvider = 'http://localhost:5000/providers/mx';

  supports(country: string): boolean {
    return country === 'MX';
  }

  async fetchBankDataByDocumentId(documentId: string): Promise<void> {
    await
      superagent.post(this.urlBankProvider)
      .send({
        curp: documentId,
      });
  }
}
