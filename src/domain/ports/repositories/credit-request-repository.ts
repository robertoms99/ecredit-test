import { CreditRequest, NewCreditRequest } from "../../entities";

export interface ICreditRequestRepository {
  create(request: NewCreditRequest): Promise<CreditRequest>;

  update(id: string, request: Partial<CreditRequest>): Promise<CreditRequest>;

  findById(id: string): Promise<CreditRequest | null>;
}
