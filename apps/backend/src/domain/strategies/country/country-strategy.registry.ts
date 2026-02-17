import type { ICountryStrategy } from './country-strategy.interface';
import { AppError } from '../../errors/app-error';

export class CountryStrategyRegistry {
  private strategies: Map<string, ICountryStrategy> = new Map();

  register(countryCode: string, strategy: ICountryStrategy): void {
    this.strategies.set(countryCode.toUpperCase(), strategy);
  }

  get(countryCode: string): ICountryStrategy {
    const strategy = this.strategies.get(countryCode.toUpperCase());

    if (!strategy) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Country '${countryCode}' is not supported. Available countries: ${this.getSupportedCountries().join(', ')}`,
        { countryCode, availableCountries: this.getSupportedCountries() }
      );
    }

    return strategy;
  }

  isSupported(countryCode: string): boolean {
    return this.strategies.has(countryCode.toUpperCase());
  }

  getSupportedCountries(): string[] {
    return Array.from(this.strategies.keys());
  }

  getAll(): ICountryStrategy[] {
    return Array.from(this.strategies.values());
  }
}
