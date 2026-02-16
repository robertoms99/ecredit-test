import { eq } from "drizzle-orm";
import { CreditRequest, NewCreditRequest } from "../../../domain/entities/credit-request"
import { ICreditRequestRepository } from "../../../domain/ports/repositories/credit-request-repository"
import { schema } from "../../db/client";
import { DBClient } from "../../db/types";

export class CreditRequestRepository implements ICreditRequestRepository{
  public constructor(private readonly db: DBClient) { }

  async create(creditRequest: NewCreditRequest): Promise<CreditRequest> {
    return await this.db.insert(schema.creditRequests).values(creditRequest).returning().then((result) => result[0]);
  }

  async findById(id: string): Promise<CreditRequest | null> {
    return await this.db.select().from(schema.creditRequests).where(eq(schema.creditRequests.id, id)).then((result) => result[0]);
  }

  async update(id: string, request: Partial<CreditRequest>): Promise<CreditRequest> {
    return await this.db.update(schema.creditRequests).set(request).where(eq(schema.creditRequests.id, id)).returning().then((result) => result[0]);
  }
}
