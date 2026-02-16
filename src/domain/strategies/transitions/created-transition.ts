import type { IStatusTransitionStrategy } from './status-transition.interface';
import type { CreditRequest } from '../../entities/credit-request';
import type { RequestStatusCodes } from '../../entities/request-status';
import type { CountryStrategyRegistry } from '../country/country-strategy.registry';
import type { IBankInfoRepository } from '../../ports/repositories/bank-info-repository';
import type { ICreditRequestRepository } from '../../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../../ports/repositories/request-status-repository';
import { RequestStatusCodes as StatusCodes } from '../../entities/request-status';

export class CreatedStatusTransition implements IStatusTransitionStrategy {
  constructor(
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository
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

    await this.creditRequestRepository.update(creditRequest.id, {
      statusId: newStatus.id,
    });
  }
}
