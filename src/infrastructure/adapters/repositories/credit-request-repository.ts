import { eq } from "drizzle-orm";
import { CreditRequest, NewCreditRequest } from "../../../domain/entities/credit-request"
import { ICreditRequestRepository } from "../../../domain/ports/repositories/credit-request-repository"
import { schema } from "../../db/client";
import { DBClient } from "../../db/types";
import { AppError } from "../../../domain/errors/app-error";

export class CreditRequestRepository implements ICreditRequestRepository{
  public constructor(private readonly db: DBClient) { }

  async create(creditRequest: NewCreditRequest): Promise<CreditRequest> {
    try {
      const result = await this.db.insert(schema.creditRequests).values(creditRequest).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to create credit request', {
        error: error.message,
        code: error.code,
      });
    }
  }

  async findById(id: string): Promise<CreditRequest | null> {
      const result = await this.db.select().from(schema.creditRequests).where(eq(schema.creditRequests.id, id));
      return result[0] || null;
  }

  async update(id: string, request: Partial<CreditRequest>): Promise<CreditRequest> {
    try {
      const result = await this.db.update(schema.creditRequests).set(request).where(eq(schema.creditRequests.id, id)).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to update credit request', {
        id,
        error: error.message,
        code: error.code,
      });
    }
  }
}
