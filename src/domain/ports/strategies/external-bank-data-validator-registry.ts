import { AppError } from "../../errors";
import { IExternalBankDataValidator } from "./external-bank-data-validator";

export class ExternalBankDataValidatorRegistry implements Omit<IExternalBankDataValidator,'supports'> {
  constructor(private readonly providers: IExternalBankDataValidator[]) {}

  validate(country: string, payload: any): Promise<boolean> {
    const validator = this.get(country)

    return validator.validate(country,payload);
  }

  get(country: string): IExternalBankDataValidator {
    const validator = this.providers.find(p => p.supports(country));

    if (!validator) {
      throw new AppError('VALIDATION_FAILED', `No Validator of external bank data for ${country}`);
    }

    return validator;
  }
}
