import type { ICountryStrategy } from '../../country-strategy.interface';
import type { IDocumentValidator } from '../../document-validator.interface';
import type { ICreditEvaluator } from '../../credit-evaluator.interface';
import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { CountryConfig } from '../../types';
import { COLOMBIA_CONFIG } from './config';
import { ColombiaDocumentValidator } from './document-validator';
import { ColombiaCreditEvaluator } from './credit-evaluator';
import { ColombiaBankDataProvider } from './bank-data-provider';
import { ColombiaExternalDataValidator } from './external-data-validator';

export class ColombiaStrategy implements ICountryStrategy {
  private readonly documentValidator: IDocumentValidator;
  private readonly creditEvaluator: ICreditEvaluator;
  private readonly bankDataProvider: IBankDataProvider;
  private readonly externalDataValidator: IExternalDataValidator;

  constructor(callbackUrl: string) {
    this.documentValidator = new ColombiaDocumentValidator();
    this.creditEvaluator = new ColombiaCreditEvaluator();
    this.bankDataProvider = new ColombiaBankDataProvider(callbackUrl);
    this.externalDataValidator = new ColombiaExternalDataValidator();
  }

  getConfig(): CountryConfig {
    return COLOMBIA_CONFIG;
  }

  getDocumentValidator(): IDocumentValidator {
    return this.documentValidator;
  }

  getCreditEvaluator(): ICreditEvaluator {
    return this.creditEvaluator;
  }

  getBankDataProvider(): IBankDataProvider {
    return this.bankDataProvider;
  }

  getExternalDataValidator(): IExternalDataValidator {
    return this.externalDataValidator;
  }
}
