import { CountryRules } from "../ports/rules";

export class ColombiaRules implements CountryRules {
  async getAmountLimit(): Promise<number> {
    return 1000000;
  }

  getCountryCode(): string {
    return 'CO';
  }

  async validateDocumentId(documentId: string): Promise<void> {
    //validate cc
  }

}
