import type { CreditRequest } from '../../entities/credit-request';
import type { RequestStatusCodes } from '../../entities/request-status';

export interface IStatusTransitionStrategy {
  getStatusCode(): RequestStatusCodes;
  execute(creditRequest: CreditRequest): Promise<void>;
}
