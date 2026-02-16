import type { IStatusTransitionStrategy } from './status-transition.interface';
import type { CreditRequest } from '../../entities/credit-request';
import type { RequestStatusCodes } from '../../entities/request-status';
import type { CountryStrategyRegistry } from '../country/country-strategy.registry';
import type { IBankInfoRepository } from '../../ports/repositories/bank-info-repository';
import type { ICreditRequestRepository } from '../../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../../ports/repositories/request-status-repository';
import type { IJobManager } from '../../ports/jobs';
import { RequestStatusCodes as StatusCodes } from '../../entities/request-status';
import { AppError } from '../../errors/app-error';

export class EvaluatingStatusTransition implements IStatusTransitionStrategy {
  constructor(
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly jobManager: IJobManager
  ) {}

  getStatusCode(): RequestStatusCodes {
    return StatusCodes.EVALUATING;
  }

  async execute(creditRequest: CreditRequest): Promise<void> {
    const bankingInfo = await this.bankInfoRepository.findByCreditRequestId(
      creditRequest.id
    );

    if (!bankingInfo) {
      throw new AppError(
        'NOT_FOUND',
        `Banking info not found for credit request ${creditRequest.id}`,
        { creditRequestId: creditRequest.id }
      );
    }

    if (!bankingInfo.financialData) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Financial data not yet received for credit request ${creditRequest.id}`,
        { creditRequestId: creditRequest.id }
      );
    }

    const countryStrategy = this.countryStrategyRegistry.get(creditRequest.country);
    const creditEvaluator = countryStrategy.getCreditEvaluator();

    try {
      const evaluationResult = await creditEvaluator.evaluate(
        creditRequest,
        bankingInfo
      );

      const finalStatusCode = evaluationResult.approved
        ? StatusCodes.APPROVED
        : StatusCodes.REJECTED;

      const finalStatus = await this.requestStatusRepository.getStatusByCode(
        finalStatusCode
      );

      await this.creditRequestRepository.update(creditRequest.id, {
        statusId: finalStatus.id,
      });

      await this.jobManager.emit('credit_request_status_change', {
        credit_request_id: creditRequest.id,
        request_status_id: finalStatus.id,
        request_status_code: finalStatusCode,
      });

      console.log(
        `Credit request ${creditRequest.id} ${finalStatusCode}: ${evaluationResult.reason}`
      );
    } catch (error: any) {
      throw new AppError(
        'INTERNAL_ERROR',
        `Failed to evaluate credit request ${creditRequest.id}: ${error.message}`,
        {
          creditRequestId: creditRequest.id,
          country: creditRequest.country,
          error: error.message,
        }
      );
    }
  }
}
