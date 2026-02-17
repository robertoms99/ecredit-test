import { eq } from "drizzle-orm";
import { RequestStatus, RequestStatusCodes } from "../../../domain/entities/request-status";
import { IRequestStatusRepository } from "../../../domain/ports/repositories/request-status-repository";
import { requestStatuses } from "../../db/schemas";
import { DBClient } from "../../db/types";
import { AppError } from "../../../domain/errors/app-error";

export class RequestStatusRepository implements IRequestStatusRepository {
  public constructor(private readonly db: DBClient) { }

  async getStatusByCode(code: RequestStatusCodes): Promise<RequestStatus> {
    try {
      const result = await this.db.select().from(requestStatuses).where(eq(requestStatuses.code, code));
      return result[0];
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to fetch request status', {
        code,
        error: error.message,
      });
    }
  }

  async findByCode(code: string): Promise<RequestStatus | null> {
    try {
      const result = await this.db.select().from(requestStatuses).where(eq(requestStatuses.code, code));
      return result[0] || null;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to find request status by code', {
        code,
        error: error.message,
      });
    }
  }

  async findById(id: string): Promise<RequestStatus | null> {
    try {
      const result = await this.db.select().from(requestStatuses).where(eq(requestStatuses.id, id));
      return result[0] || null;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to find request status by id', {
        id,
        error: error.message,
      });
    }
  }
}
