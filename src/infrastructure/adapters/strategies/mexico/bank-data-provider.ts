import superagent from 'superagent';
import { IBankDataProvider } from '../../../../domain/ports/strategies/bank-data-provider';
import { SupportedCountries } from '../../../../domain/strategies/supported-countries';
import { NewBankingInfo } from '../../../../domain/entities';

export class BankDataProviderMexico implements IBankDataProvider {
  private urlBankProvider = 'http://localhost:5000/providers/mx';

  supports(country: string): boolean {
    return country === SupportedCountries.MX;
  }

  async fetchBankDataByDocumentId(documentId: string): Promise<Omit<NewBankingInfo,"creditRequestId">> {
    const response = await
      superagent.post(this.urlBankProvider)
      .send({
        cc: documentId,
      });

    const { data } = response.body;

    return ({
      externalRequestId: data.EXTERNAL_ID_PENDING,
      providerName: "Mexico Fake",
      fetchStatus: "Pending",
    })
  }
}
