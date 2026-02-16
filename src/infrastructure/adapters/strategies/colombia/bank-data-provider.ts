import superagent from 'superagent';
import { IBankDataProvider } from '../../../../domain/ports/strategies/bank-data-provider';
import { SupportedCountries } from '../../../../domain/strategies/supported-countries';
import { NewBankingInfo } from '../../../../domain/entities';

export class BankDataProviderColombia implements IBankDataProvider {
  private urlBankProvider = 'http://localhost:5000/providers/co';

  supports(country: string): boolean {
    return country === SupportedCountries.CO;
  }

  async fetchBankDataByDocumentId(documentId: string): Promise<Omit<NewBankingInfo,"creditRequestId">> {
    const response = await
      superagent.post(this.urlBankProvider)
      .send({
        cc: documentId,
      });

    const { data } = response.body;

    return ({
      externalRequestId: data.external_request_id,
      providerName: "Colombia Fake",
      fetchStatus: "Pending",
    })
  }
}
