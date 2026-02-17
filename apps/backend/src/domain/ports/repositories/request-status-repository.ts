import { RequestStatus, RequestStatusCodes } from "../../entities/request-status";

export interface IRequestStatusRepository {
  getStatusByCode(code: RequestStatusCodes): Promise<RequestStatus>;
  
  findByCode(code: string): Promise<RequestStatus | null>;
  
  findById(id: string): Promise<RequestStatus | null>;
}
