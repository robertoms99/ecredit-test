import { CreditRequest, NewCreditRequest } from "../../entities/credit-request";

export type ICreateCreditRequestUseCase = Omit<NewCreditRequest, 'statusId'>;

export interface CreateCreditRequestUseCase {
  execute(request: ICreateCreditRequestUseCase): Promise<CreditRequest>;
}
