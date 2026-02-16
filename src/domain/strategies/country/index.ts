export type { ICountryStrategy } from './country-strategy.interface';
export type { IDocumentValidator } from './document-validator.interface';
export type { ICreditEvaluator } from './credit-evaluator.interface';
export type { IBankDataProvider } from './bank-data-provider.interface';
export type { IExternalDataValidator } from './external-data-validator.interface';

export type {
  CountryConfig,
  DocumentValidationResult,
  CreditEvaluationResult,
  ExternalBankData,
} from './types';

export { CountryStrategyRegistry } from './country-strategy.registry';

export { createCountryStrategies } from './countries';
