import { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import { CreditRequest } from '../entities/credit-request';
import { AppError } from '../errors/app-error';

export interface UpdateCreditRequestStatusInput {
  creditRequestId: string;
  statusCode: string;
}

export class UpdateCreditRequestStatusUseCase {
  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly statusRepository: IRequestStatusRepository
  ) {}

  async execute(input: UpdateCreditRequestStatusInput): Promise<CreditRequest> {
    const { creditRequestId, statusCode } = input;

    const creditRequest = await this.creditRequestRepository.findById(creditRequestId);

    if (!creditRequest) {
      throw new AppError(
        'NOT_FOUND',
        `Credit request with ID ${creditRequestId} not found`,
        { creditRequestId }
      );
    }

    const status = await this.statusRepository.findByCode(statusCode);

    if (!status) {
      throw new AppError(
        'NOT_FOUND',
        `Status with code ${statusCode} not found`,
        { statusCode }
      );
    }

    if (creditRequest.statusId === status.id) {
      return creditRequest;
    }

    const currentStatus = await this.statusRepository.findById(creditRequest.statusId);

    if (currentStatus?.isFinal) {
      throw new AppError(
        'INVALID_STATUS_TRANSITION',
        `Cannot change status from final state ${currentStatus.code}`,
        {
          currentStatus: currentStatus.code,
          requestedStatus: statusCode,
          creditRequestId
        }
      );
    }

    const updated = await this.creditRequestRepository.update(creditRequestId, {
      statusId: status.id,
      updatedAt: new Date()
    });

    return updated;
  }
}
