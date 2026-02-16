import { RequestStatus, RequestStatusCodes } from "../../entities/request-status";

export interface IRequestStatusRepository {
  getStatusByCode(code: RequestStatusCodes): Promise<RequestStatus>;
}
