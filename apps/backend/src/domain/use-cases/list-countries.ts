import type { CountryStrategyRegistry } from '../strategies/country/country-strategy.registry';

export interface CountryInfo {
  code: string;
  name: string;
  icon: string;
  currency: string;
  documentIdLabel: string;
}

export class ListCountriesUseCase {
  constructor(
    private readonly countryStrategyRegistry: CountryStrategyRegistry
  ) {}

  execute(): CountryInfo[] {
    const strategies = this.countryStrategyRegistry.getAll();
    
    return strategies.map(strategy => {
      const config = strategy.getConfig();
      return {
        code: config.code,
        name: config.name,
        icon: config.icon,
        currency: config.currency,
        documentIdLabel: config.documentIdLabel,
      };
    });
  }
}
