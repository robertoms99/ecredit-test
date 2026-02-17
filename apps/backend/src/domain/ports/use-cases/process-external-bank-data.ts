import { CreditRequest, NewCreditRequest } from "../../entities/credit-request";

export type IProcessExternalBankDataUseCaseInput = {
  externalRequestId: string;
  payload: any
};

export interface ProcessExternalBankDataUseCase {
  execute(input: IProcessExternalBankDataUseCaseInput): Promise<void>;
}
