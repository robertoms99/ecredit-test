import type { IDocumentValidator } from './document-validator.interface';
import type { ICreditEvaluator } from './credit-evaluator.interface';
import type { IBankDataProvider } from './bank-data-provider.interface';
import type { IExternalDataValidator } from './external-data-validator.interface';
import type { CountryConfig } from './types';

export interface ICountryStrategy {
  getConfig(): CountryConfig;
  getDocumentValidator(): IDocumentValidator;
  getCreditEvaluator(): ICreditEvaluator;
  getBankDataProvider(): IBankDataProvider;
  getExternalDataValidator(): IExternalDataValidator;
}
