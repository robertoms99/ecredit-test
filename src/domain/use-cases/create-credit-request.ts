import type { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import type { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import type { IStatusTransitionRepository } from '../ports/repositories/status-transition-repository';
import type { ICreateCreditRequestUseCaseInput } from '../ports/use-cases/create-credit-request';
import type { CreditRequest, NewCreditRequest } from '../entities/credit-request';
import type { CountryStrategyRegistry } from '../strategies/country/country-strategy.registry';
import { RequestStatusCodes } from '../entities';
import { AppError } from '../errors/app-error';

export class CreateCreditRequestUseCase {
  private readonly initialRequestStatusCode: RequestStatusCodes = RequestStatusCodes.CREATED;

  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly countryStrategyRegistry: CountryStrategyRegistry,
    private readonly transitionRepository: IStatusTransitionRepository
  ) {}

  async execute(input: ICreateCreditRequestUseCaseInput): Promise<CreditRequest> {
    await this.validate(input)

    const requestStatus = await this.requestStatusRepository.getStatusByCode(
      this.initialRequestStatusCode
    );

    const newCreditRequest: NewCreditRequest = {
      ...input,
      statusId: requestStatus.id,
      requestedAt: new Date(),
    };

    const createdCreditRequest = await this.creditRequestRepository.create(newCreditRequest);

    try {
      console.log('[CreateCreditRequest] Creating initial transition log');
      await this.transitionRepository.create({
        creditRequestId: createdCreditRequest.id,
        fromStatusId: null, // Initial state has no previous status
        toStatusId: requestStatus.id,
        reason: 'Solicitud creada',
        triggeredBy: 'user',
        metadata: {
          userId: input.userId,
          toStatusCode: requestStatus.code,
          toStatusName: requestStatus.name,
        },
      });
      console.log('[CreateCreditRequest] Initial transition logged');
    } catch (error) {
      console.error('[CreateCreditRequest] Failed to log initial transition:', error);
    }

    return createdCreditRequest;
  }

  private async validate(input: ICreateCreditRequestUseCaseInput): Promise<void> {
    if (!this.countryStrategyRegistry.isSupported(input.country)) {
      throw new AppError(
        'COUNTRY_NOT_SUPPORTED',
        `Country '${input.country}' is not supported. Available countries: ${this.countryStrategyRegistry.getSupportedCountries().join(', ')}`,
        { country: input.country, availableCountries: this.countryStrategyRegistry.getSupportedCountries() }
      );
    }

    const countryStrategy = this.countryStrategyRegistry.get(input.country);
    const config = countryStrategy.getConfig();

    const documentValidator = countryStrategy.getDocumentValidator();
    const documentValidation = await documentValidator.validate(input.documentId);

    if (!documentValidation.isValid) {
      throw new AppError(
        'DOCUMENT_VALIDATION_FAILED',
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
