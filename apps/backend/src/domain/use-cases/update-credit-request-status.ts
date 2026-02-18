import { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import { IStatusTransitionRepository } from '../ports/repositories/status-transition-repository';
import { CreditRequest } from '../entities/credit-request';
import { AppError } from '../errors/app-error';

export interface UpdateCreditRequestStatusInput {
  creditRequestId: string;
  statusCode: string;
  reason?: string;
  triggeredBy?: 'user' | 'system' | 'webhook' | 'provider';
  userId?: string;
  metadata?: Record<string, any>;
}

export class UpdateCreditRequestStatusUseCase {
  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly statusRepository: IRequestStatusRepository,
    private readonly transitionRepository: IStatusTransitionRepository
  ) {}

  async execute(input: UpdateCreditRequestStatusInput): Promise<CreditRequest> {
    const {
      creditRequestId,
      statusCode,
      reason,
      triggeredBy = 'user',
      userId,
      metadata = {}
    } = input;

    const creditRequest = await this.creditRequestRepository.findById(creditRequestId);

    if (!creditRequest) {
      throw new AppError(
        'NOT_FOUND',
        `Solicitud de crédito con ID ${creditRequestId} no encontrada`,
        { creditRequestId }
      );
    }

    const status = await this.statusRepository.findByCode(statusCode);

    if (!status) {
      throw new AppError(
        'NOT_FOUND',
        `Estado con código ${statusCode} no encontrado`,
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
        `No se puede cambiar el estado desde el estado final ${currentStatus.code}`,
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

    try {
      console.log('[UpdateStatus] Creating transition log:', {
        creditRequestId,
        fromStatusId: creditRequest.statusId,
        toStatusId: status.id,
        reason: reason || null,
        triggeredBy,
        userId,
      });

      const transition = await this.transitionRepository.create({
        creditRequestId,
        fromStatusId: creditRequest.statusId,
        toStatusId: status.id,
        reason: reason || null,
        triggeredBy,
        metadata: {
          ...metadata,
          userId,
          fromStatusCode: currentStatus?.code,
          toStatusCode: status.code,
          fromStatusName: currentStatus?.name,
          toStatusName: status.name,
        },
      });

      console.log('[UpdateStatus] Transition created successfully:', transition.id);
    } catch (error) {
      console.error('[UpdateStatus] Failed to create transition log:', error);
    }

    return updated;
  }
}
