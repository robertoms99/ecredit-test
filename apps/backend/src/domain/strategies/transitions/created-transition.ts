import type { IStatusTransitionStrategy } from './status-transition.interface';
import type { CreditRequest } from '../../entities/credit-request';
import type { RequestStatusCodes } from '../../entities/request-status';
import type { CountryStrategyRegistry } from '../country/country-strategy.registry';
import type { IBankInfoRepository } from '../../ports/repositories/bank-info-repository';
import type { ICreditRequestRepository } from '../../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../../ports/repositories/request-status-repository';
import type { IStatusTransitionRepository } from '../../ports/repositories/status-transition-repository';
import { RequestStatusCodes as StatusCodes } from '../../entities/request-status';

export class CreatedStatusTransition implements IStatusTransitionStrategy {
  constructor(
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly transitionRepository: IStatusTransitionRepository
  ) {}

  getStatusCode(): RequestStatusCodes {
    return StatusCodes.CREATED;
  }

  async execute(creditRequest: CreditRequest): Promise<void> {
    const countryStrategy = this.countryStrategyRegistry.get(creditRequest.country);
    const bankDataProvider = countryStrategy.getBankDataProvider();
    const bankingInfo = await bankDataProvider.fetchBankData(
      creditRequest.documentId,
      creditRequest.id
    );

    await this.bankInfoRepository.create({
      ...bankingInfo,
      creditRequestId: creditRequest.id,
    });

    const newStatus = await this.requestStatusRepository.getStatusByCode(
      StatusCodes.PENDING_FOR_BANK_DATA
    );

    const currentStatus = await this.requestStatusRepository.findById(creditRequest.statusId);

    await this.creditRequestRepository.update(creditRequest.id, {
      statusId: newStatus.id,
      updatedAt: new Date()
    });

    try {
      console.log('[CreatedTransition] Logging automatic transition to PENDING_FOR_BANK_DATA');
      await this.transitionRepository.create({
        creditRequestId: creditRequest.id,
        fromStatusId: creditRequest.statusId,
        toStatusId: newStatus.id,
        reason: 'Transición automática: Datos bancarios solicitados al proveedor',
        triggeredBy: 'system',
        metadata: {
          fromStatusCode: currentStatus?.code,
          toStatusCode: newStatus.code,
          fromStatusName: currentStatus?.name,
          toStatusName: newStatus.name,
          providerName: bankingInfo.providerName,
        },
      });
      console.log('[CreatedTransition] Transition logged successfully');
    } catch (error) {
      console.error('[CreatedTransition] Failed to log transition:', error);
    }
  }
}
