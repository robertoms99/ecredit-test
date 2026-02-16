import { NewBankingInfo } from "../../entities";

export interface IBankDataProvider {
  supports(country: string): boolean;
  fetchBankDataByDocumentId(documentId: string): Promise<Omit<NewBankingInfo,"creditRequestId">>
}
