import { RequestStatus } from "../../../core/domain/entities/request-status";
import { IRequestStatusRepository } from "../../../core/domain/ports/repositories/request-status-repository";

export class RequestStatusRepository implements IRequestStatusRepository {
  async getStatusByCode(code: string): Promise<RequestStatus> {
    throw new Error('Method not implemented.');
  }
}
