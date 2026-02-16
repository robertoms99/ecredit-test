import { IExternalBankDataValidator } from "../../ports/strategies/external-bank-data-validator";
import { SupportedCountries } from "../supported-countries";

export class ExternalBankDataValidatorColombia implements IExternalBankDataValidator {
  supports(country: string): boolean {
    return country === SupportedCountries.CO;
  }

  async validate(country:string,payload: any): Promise<boolean> {
    console.log(payload,"colombia")

    return true;
  }
}
