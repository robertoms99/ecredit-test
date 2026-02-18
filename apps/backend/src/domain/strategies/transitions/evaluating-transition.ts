import type { IStatusTransitionStrategy } from './status-transition.interface';
import type { CreditRequest } from '../../entities/credit-request';
import type { RequestStatusCodes } from '../../entities/request-status';
import type { CountryStrategyRegistry } from '../country/country-strategy.registry';
import type { IBankInfoRepository } from '../../ports/repositories/bank-info-repository';
import type { ICreditRequestRepository } from '../../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../../ports/repositories/request-status-repository';
import type { IStatusTransitionRepository } from '../../ports/repositories/status-transition-repository';
import { RequestStatusCodes as StatusCodes } from '../../entities/request-status';
import { AppError } from '../../errors/app-error';

export class EvaluatingStatusTransition implements IStatusTransitionStrategy {
  constructor(
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly statusTransitionRepository: IStatusTransitionRepository
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
        `Información bancaria no encontrada para solicitud de crédito ${creditRequest.id}`,
        { creditRequestId: creditRequest.id }
      );
    }

    if (!bankingInfo.financialData) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Datos financieros aún no recibidos para solicitud de crédito ${creditRequest.id}`,
        { creditRequestId: creditRequest.id }
      );
    }

    const countryStrategy = this.countryStrategyRegistry.get(creditRequest.country);
    const creditEvaluator = countryStrategy.getCreditEvaluator();

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
      updatedAt: new Date()
    });

    console.log(
      `Credit request ${creditRequest.id} ${finalStatusCode}: ${evaluationResult.reason}`
    );

    try {
      const currentStatus = await this.requestStatusRepository.getStatusByCode(
        StatusCodes.EVALUATING
      );

      await this.statusTransitionRepository.create({
        creditRequestId: creditRequest.id,
        fromStatusId: currentStatus.id,
        toStatusId: finalStatus.id,
        reason: `Transición automática: ${evaluationResult.reason}`,
        triggeredBy: 'system',
        metadata: {
          approved: evaluationResult.approved,
          score: evaluationResult.score,
          riskLevel: evaluationResult.riskLevel,
          recommendedAmount: evaluationResult.recommendedAmount,
          evaluationMetadata: evaluationResult.metadata
        }
      });

      console.log(
        `[EvaluatingStatusTransition] Logged transition for credit request ${creditRequest.id}: EVALUATING → ${finalStatusCode}`
      );
    } catch (transitionError) {
      console.error(
        `[EvaluatingStatusTransition] Failed to log transition for credit request ${creditRequest.id}:`,
        transitionError
      );
    }
  }
}
