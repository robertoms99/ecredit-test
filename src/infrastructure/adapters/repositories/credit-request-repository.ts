import { CreditRequest } from "../../../core/domain/entities/credit-request";
import { ICreditRequestRepository } from "../../../core/domain/ports/repositories/credit-request-repository";

export class CreditRequestRepository implements ICreditRequestRepository{
  async create(request: any): Promise<CreditRequest> {
    // Implementation for creating a credit request
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<CreditRequest | null> {
    // Implementation for finding a credit request by ID
      throw new Error('Method not implemented.');

  }
}
