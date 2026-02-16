import type { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import type { ICreateCreditRequestUseCaseInput } from '../ports/use-cases/create-credit-request';
import type { CreditRequest, NewCreditRequest } from '../entities/credit-request';
import type { IJobManager } from '../ports/jobs';
import type { CountryStrategyRegistry } from '../strategies/country/country-strategy.registry';
import { RequestStatusCodes } from '../entities';
import { AppError } from '../errors/app-error';

/**
 * Create Credit Request Use Case
 *
 * This use case handles the creation of new credit requests with country-specific validation.
 *
 * Flow:
 * 1. Validates country is supported
 * 2. Validates document ID using country-specific validator
 * 3. Validates basic fields (name, amount)
 * 4. Checks amount is within country limit
 * 5. Creates credit request with CREATED status
 * 6. Emits job for status transition (which will fetch bank data)
 *
 * Country-specific logic is delegated to CountryStrategy pattern - no conditionals!
 */
export class CreateCreditRequestUseCase {
  private readonly initialRequestStatusCode: RequestStatusCodes = RequestStatusCodes.CREATED;

  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly jobManager: IJobManager
  ) {}

  async execute(input: ICreateCreditRequestUseCaseInput): Promise<CreditRequest> {
    if (!this.countryStrategyRegistry.isSupported(input.country)) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Country '${input.country}' is not supported. Available countries: ${this.countryStrategyRegistry.getSupportedCountries().join(', ')}`,
        { country: input.country }
      );
    }

    const countryStrategy = this.countryStrategyRegistry.get(input.country);
    const config = countryStrategy.getConfig();

    const documentValidator = countryStrategy.getDocumentValidator();
    const documentValidation = await documentValidator.validate(input.documentId);

    if (!documentValidation.isValid) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Invalid ${documentValidator.getDocumentType()}: ${documentValidation.errors?.join(', ')}`,
        { documentId: input.documentId, errors: documentValidation.errors }
      );
    }

    this.validateName(input.fullName);
    this.validateMonthlyIncome(input.monthlyIncome);

    if (input.requestedAmount < 1 || input.requestedAmount > config.amountLimit) {
      throw new AppError(
        'VALIDATION_FAILED',
        `Requested amount must be between 1 and ${config.amountLimit} ${config.currency}`,
        {
          requestedAmount: input.requestedAmount,
          amountLimit: config.amountLimit,
          currency: config.currency,
        }
      );
    }

    const requestStatus = await this.requestStatusRepository.getStatusByCode(
      this.initialRequestStatusCode
    );

    const newCreditRequest: NewCreditRequest = {
      ...input,
      statusId: requestStatus.id,
      requestedAt: new Date(),
    };

    const createdCreditRequest = await this.creditRequestRepository.create(newCreditRequest);

    await this.jobManager.emit('credit_request_status_change', {
      credit_request_id: createdCreditRequest.id,
      request_status_id: requestStatus.id,
      request_status_code: this.initialRequestStatusCode,
    });

    return createdCreditRequest;
  }

  private validateName(name: string): void {
    if (!name || name.length < 2 || name.length > 100) {
      throw new AppError(
        'VALIDATION_FAILED',
        'Full name must be between 2 and 100 characters',
        { fullName: name }
      );
    }
  }

  private validateMonthlyIncome(income: number): void {
    if (!income || income < 0) {
      throw new AppError(
        'VALIDATION_FAILED',
        'Monthly income must be a positive number',
        { monthlyIncome: income }
      );
    }
  }
}
