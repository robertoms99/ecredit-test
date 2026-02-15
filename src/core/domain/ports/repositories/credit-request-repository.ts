import { CreditRequest } from "../../entities/credit-request";

export interface ICreditRequestRepository {
  create(request: any): Promise<CreditRequest>;

  findById(id: string): Promise<CreditRequest | null>;
}
