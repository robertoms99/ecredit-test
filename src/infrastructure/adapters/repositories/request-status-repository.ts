import { eq } from "drizzle-orm";
import { RequestStatus, RequestStatusCodes } from "../../../domain/entities/request-status";
import { IRequestStatusRepository } from "../../../domain/ports/repositories/request-status-repository";
import { requestStatuses } from "../../db/schemas";
import { DBClient } from "../../db/types";

export class RequestStatusRepository implements IRequestStatusRepository {
  public constructor(private readonly db: DBClient) { }

  async getStatusByCode(code:RequestStatusCodes ): Promise<RequestStatus> {
    return await this.db.select().from(requestStatuses).where(eq(requestStatuses.code, code))
  }
}
