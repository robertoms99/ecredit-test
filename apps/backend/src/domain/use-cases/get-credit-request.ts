import { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import { CreditRequest } from '../entities/credit-request';
import { AppError } from '../errors/app-error';

export class GetCreditRequestUseCase {
  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository
  ) {}

  async execute(id: string): Promise<CreditRequest | null> {
    const creditRequest = await this.creditRequestRepository.findById(id);

    if (!creditRequest) {
      throw new AppError(
        'NOT_FOUND',
        `Solicitud de crédito con ID ${id} no encontrada`,
        { id }
      );
    }

    return creditRequest;
  }
}
