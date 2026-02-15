import { RequestStatus } from "../../entities/request-status";

export interface IRequestStatusRepository {
  getStatusByCode(code: string): Promise<RequestStatus>;
}
