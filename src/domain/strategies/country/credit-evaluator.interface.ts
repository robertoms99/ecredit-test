import type { CreditRequest } from '../../entities/credit-request';
import type { BankingInfo } from '../../entities/banking-info';
import type { CreditEvaluationResult } from './types';

export interface ICreditEvaluator {
  evaluate(
    creditRequest: CreditRequest,
    bankingInfo: BankingInfo
  ): Promise<CreditEvaluationResult>;
}
