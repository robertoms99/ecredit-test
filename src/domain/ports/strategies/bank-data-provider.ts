
export interface IBankDataProvider {
  supports(country: string): boolean;
  fetchBankDataByDocumentId(documentId: string): Promise<void>
}
