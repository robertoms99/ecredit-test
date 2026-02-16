import { CreditRequest, NewCreditRequest } from "../../entities";

export interface ListCreditRequestsFilters {
  country?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface ICreditRequestRepository {
  create(request: NewCreditRequest): Promise<CreditRequest>;

  update(id: string, request: Partial<CreditRequest>): Promise<CreditRequest>;

  findById(id: string): Promise<CreditRequest | null>;

  list(filters: ListCreditRequestsFilters): Promise<CreditRequest[]>;

  count(filters: Omit<ListCreditRequestsFilters, 'limit' | 'offset'>): Promise<number>;
}
