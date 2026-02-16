import type { ExternalBankData } from './types';

export interface IExternalDataValidator {
  validate(data: ExternalBankData): Promise<boolean>;
}
