import type { NewBankingInfo } from '../../entities/banking-info';

export interface IBankDataProvider {
  fetchBankData(
    documentId: string,
    creditRequestId: string
  ): Promise<Omit<NewBankingInfo, 'creditRequestId'>>;
}
