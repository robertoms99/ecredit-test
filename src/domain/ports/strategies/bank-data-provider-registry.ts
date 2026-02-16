import { AppError } from "../../errors";
import { IBankDataProvider } from "./bank-data-provider";

export class BankDataProviderRegistry {
  constructor(private readonly providers: IBankDataProvider[]) {}

  get(country: string): IBankDataProvider {
    const provider = this.providers.find(p => p.supports(country));

    if (!provider) {
      throw new AppError('VALIDATION_FAILED', `No bank provider for ${country}`);
    }

    return provider;
  }
}
