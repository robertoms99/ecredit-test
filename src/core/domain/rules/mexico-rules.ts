import { CountryRules } from "../ports/rules";

export class MexicoRules implements CountryRules {
  async getAmountLimit(): Promise<number> {
    return 500000;
  }

  getCountryCode(): string {
    return 'MX';
  }

  async validateDocumentId(documentId: string): Promise<void> {
   //validate curp

  }
}
