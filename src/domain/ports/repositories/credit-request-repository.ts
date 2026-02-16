import { CreditRequest, NewCreditRequest } from "../../entities";

export interface ICreditRequestRepository {
  create(request: NewCreditRequest): Promise<CreditRequest>;

  findById(id: string): Promise<CreditRequest | null>;
}
