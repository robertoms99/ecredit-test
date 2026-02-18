import { IRequestStatusRepository } from '../ports/repositories/request-status-repository';
import { RequestStatus } from '../entities/request-status';

export class ListRequestStatusesUseCase {
  constructor(
    private readonly requestStatusRepository: IRequestStatusRepository
  ) {}

  async execute(): Promise<RequestStatus[]> {
    return await this.requestStatusRepository.listAll();
  }
}
