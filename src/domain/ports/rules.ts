export interface CountryRules {
  getAmountLimit(): Promise<number>
  getCountryCode(): string
  validateDocumentId(documentId: string): Promise<void>
}
