import { CreditRequest } from "../../entities/credit-request";

export type ICreateCreditRequestUseCase = Omit<CreditRequest, 'id' | 'status'>;

export interface CreateCreditRequestUseCase {
  execute(request: ICreateCreditRequestUseCase): Promise<CreditRequest>;
}
