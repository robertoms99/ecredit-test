import type { ICountryStrategy } from '../../country-strategy.interface';
import type { IDocumentValidator } from '../../document-validator.interface';
import type { ICreditEvaluator } from '../../credit-evaluator.interface';
import type { IBankDataProvider } from '../../bank-data-provider.interface';
import type { IExternalDataValidator } from '../../external-data-validator.interface';
import type { CountryConfig } from '../../types';
import type { IHttpClient } from '../../../../ports/http-client';
import { MEXICO_CONFIG } from './config';
import { MexicoDocumentValidator } from './document-validator';
import { MexicoCreditEvaluator } from './credit-evaluator';
import { MexicoBankDataProvider } from './bank-data-provider';
import { MexicoExternalDataValidator } from './external-data-validator';

export class MexicoStrategy implements ICountryStrategy {
  private readonly documentValidator: IDocumentValidator;
  private readonly creditEvaluator: ICreditEvaluator;
  private readonly bankDataProvider: IBankDataProvider;
  private readonly externalDataValidator: IExternalDataValidator;

  constructor(callbackUrl: string, httpClient: IHttpClient) {
    this.documentValidator = new MexicoDocumentValidator();
    this.creditEvaluator = new MexicoCreditEvaluator();
    this.bankDataProvider = new MexicoBankDataProvider(callbackUrl, httpClient);
    this.externalDataValidator = new MexicoExternalDataValidator();
  }

  getConfig(): CountryConfig {
    return MEXICO_CONFIG;
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
