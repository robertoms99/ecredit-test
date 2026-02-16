import { CreditRequest, RequestStatusCodes } from "../../entities";

export interface IStatusTransitionStrategy {
  supports(country: string, requestStatusCode: RequestStatusCodes): boolean;
  execute(creditRequest: CreditRequest): Promise<void>
}
