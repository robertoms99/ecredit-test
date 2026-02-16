import { CreditRequest, NewCreditRequest } from "../../../domain/entities/credit-request"
import { ICreditRequestRepository } from "../../../domain/ports/repositories/credit-request-repository"
import { schema } from "../../db/client";
import { DBClient } from "../../db/types";

export class CreditRequestRepository implements ICreditRequestRepository{
  public constructor(private readonly db: DBClient) { }

  async create(creditRequest: NewCreditRequest): Promise<CreditRequest> {
    return await this.db.insert(schema.creditRequests).values(creditRequest)
  }

  async findById(id: string): Promise<CreditRequest | null> {
    // Implementation for finding a credit request by ID
      throw new Error('Method not implemented.');
  }
}
