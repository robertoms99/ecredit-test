import { IExternalBankDataValidator } from "../../ports/strategies/external-bank-data-validator";
import { SupportedCountries } from "../supported-countries";

export class ExternalBankDataValidatorMexico implements IExternalBankDataValidator {
  supports(country: string): boolean {
    return country === SupportedCountries.MX;
  }

  async validate(country:string,payload: any): Promise<boolean> {
    console.log(payload,"mexico")
    return true;
  }
}
