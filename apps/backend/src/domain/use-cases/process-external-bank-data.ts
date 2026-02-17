import type { IBankInfoRepository } from '../ports/repositories/bank-info-repository';
import type { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import type { IStatusTransitionRepository } from '../ports/repositories/status-transition-repository';
import type { IProcessExternalBankDataUseCaseInput } from '../ports/use-cases/process-external-bank-data';
import type { CountryStrategyRegistry } from '../strategies/country/country-strategy.registry';
import { RequestStatusCodes } from '../entities';
import { AppError } from '../errors/app-error';

export class ProcessExternalBankDataUseCase {
  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly statusTransitionRepository: IStatusTransitionRepository
  ) {}

  async execute(input: IProcessExternalBankDataUseCaseInput): Promise<void> {
    const bankInfoRecord = await this.bankInfoRepository.findByExternalId(
      input.externalRequestId
    );

    if (!bankInfoRecord) {
      throw new AppError(
        'NOT_FOUND',
        'Bank info not found for external request ID',
        { externalRequestId: input.externalRequestId }
      );
    }

    const creditRequest = await this.creditRequestRepository.findById(
      bankInfoRecord.creditRequestId
    );

    if (!creditRequest) {
      throw new AppError(
        'NOT_FOUND',
        'Credit request not found for banking info',
        { creditRequestId: bankInfoRecord.creditRequestId }
      );
    }

    const countryStrategy = this.countryStrategyRegistry.get(creditRequest.country);
    const externalDataValidator = countryStrategy.getExternalDataValidator();

    await externalDataValidator.validate({
      externalRequestId: input.externalRequestId,
      payload: input.payload,
    });

    const evaluatingStatus = await this.requestStatusRepository.getStatusByCode(
      RequestStatusCodes.EVALUATING
    );

    await this.bankInfoRepository.update(bankInfoRecord.id, {
      ...bankInfoRecord,
      financialData: input.payload,
      fetchStatus: 'COMPLETED',
      updatedAt: new Date(),
    });

    const currentStatus = await this.requestStatusRepository.findById(
      creditRequest.statusId
    );

    await this.creditRequestRepository.update(creditRequest.id, {
      statusId: evaluatingStatus.id,
      updatedAt: new Date()
    });

    try {
      await this.statusTransitionRepository.create({
        creditRequestId: creditRequest.id,
        fromStatusId: currentStatus?.id ?? null,
        toStatusId: evaluatingStatus.id,
        reason: 'Transición automática: Datos bancarios recibidos del proveedor',
        triggeredBy: 'webhook',
        metadata: {
          externalRequestId: input.externalRequestId,
          provider: countryStrategy.getConfig().providerName,
          fetchStatus: 'COMPLETED',
          dataReceived: true
        }
      });

      console.log(
        `[ProcessExternalBankDataUseCase] Logged transition for credit request ${creditRequest.id}: ${currentStatus?.code ?? 'NULL'} → EVALUATING`
      );
    } catch (transitionError) {
      console.error(
        `[ProcessExternalBankDataUseCase] Failed to log transition for credit request ${creditRequest.id}:`,
        transitionError
      );
    }
  }
}
