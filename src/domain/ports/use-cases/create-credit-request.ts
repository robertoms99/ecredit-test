import { CreditRequest, NewCreditRequest } from "../../entities/credit-request";

export type ICreateCreditRequestUseCaseInput = Omit<NewCreditRequest, 'statusId'>;

export interface CreateCreditRequestUseCase {
  execute(request: ICreateCreditRequestUseCaseInput): Promise<CreditRequest>;
}
