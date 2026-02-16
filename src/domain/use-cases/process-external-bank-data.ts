import type { IJobManager } from '../ports/jobs';
import type { IBankInfoRepository } from '../ports/repositories/bank-info-repository';
import type { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import type { IProcessExternalBankDataUseCaseInput } from '../ports/use-cases/process-external-bank-data';
import type { CountryStrategyRegistry } from '../strategies/country/country-strategy.registry';
import { RequestStatusCodes } from '../entities';
import { AppError } from '../errors/app-error';

/**
 * Process External Bank Data Use Case
 *
 * This use case handles webhook data from external banking providers.
 *
 * Flow:
 * 1. Find banking info by external request ID
 * 2. Find associated credit request
 * 3. Validate webhook data using country-specific validator
 * 4. Update banking info with financial data
 * 5. Update credit request status to EVALUATING
 * 6. Emit job for evaluation (which will approve/reject)
 *
 * Country-specific validation is delegated to CountryStrategy pattern - no conditionals!
 */
export class ProcessExternalBankDataUseCase {
  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly jobManager: IJobManager
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

    await this.creditRequestRepository.update(creditRequest.id, {
      statusId: evaluatingStatus.id,
    });

    await this.jobManager.emit('credit_request_status_change', {
      credit_request_id: creditRequest.id,
      request_status_code: RequestStatusCodes.EVALUATING,
      request_status_id: evaluatingStatus.id,
    });
  }
}
