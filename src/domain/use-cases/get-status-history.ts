import { IStatusTransitionRepository } from '../ports/repositories/status-transition-repository';
import { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import { AppError } from '../errors/app-error';

export interface StatusTransitionWithDetails {
  id: string;
  reason: string | null;
  triggeredBy: string;
  metadata: any;
  creditRequestId: string;
  fromStatusId: string | null;
  toStatusId: string;
  createdAt: Date;
  fromStatus: {
    id: string;
    name: string;
    code: string;
  } | null;
  toStatus: {
    id: string;
    name: string;
    code: string;
  };
}

export class GetStatusHistoryUseCase {
  constructor(
    private readonly transitionRepository: IStatusTransitionRepository,
    private readonly creditRequestRepository: ICreditRequestRepository
  ) {}

  async execute(creditRequestId: string, userId?: string): Promise<StatusTransitionWithDetails[]> {
    const creditRequest = await this.creditRequestRepository.findById(creditRequestId);

    if (!creditRequest) {
      throw new AppError(
        'NOT_FOUND',
        `Credit request with ID ${creditRequestId} not found`,
        { creditRequestId }
      );
    }

    if (userId && creditRequest.userId !== userId) {
      throw new AppError(
        'FORBIDDEN',
        'You can only view history for credit requests you created',
        { creditRequestId, userId }
      );
    }

    const transitions = await this.transitionRepository.findByCreditRequestId(creditRequestId);

    return transitions as StatusTransitionWithDetails[];
  }
}
