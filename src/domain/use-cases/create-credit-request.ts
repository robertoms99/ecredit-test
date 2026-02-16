import { request } from "node:https";
import { ICreditRequestRepository } from "../ports/repositories/credit-request-repository";
import { IRequestStatusRepository } from "../ports/repositories/request-status-repository";
import { ICreateCreditRequestUseCase } from "../ports/use-cases/create-credit-request";
import { CreditRequest, NewCreditRequest } from "../entities/credit-request";
import { IValidator } from "../ports/validator";
import { RequestStatusCodes } from "../entities";

export class CreateCreditRequestUseCase {
  private readonly initialRequestStatusCode: RequestStatusCodes = RequestStatusCodes.PENDING

    constructor(
      private readonly creditRequestRepository: ICreditRequestRepository,
      private readonly requestStatusRepository: IRequestStatusRepository,
      private readonly creditRequestValidator: IValidator<ICreateCreditRequestUseCase>,
    ) { }

  async execute(input: ICreateCreditRequestUseCase): Promise<CreditRequest> {
    await this.creditRequestValidator.validate(input);

    const requestStatus = await this.requestStatusRepository.getStatusByCode(this.initialRequestStatusCode);

    const newCreditRequest: NewCreditRequest = {
      ...input,
      statusId: requestStatus.id,
      requestedAt: new Date()
    }

    const createdCreditRequest = await this.creditRequestRepository.create(newCreditRequest);

    //enivar el evento de creacion

    return createdCreditRequest
    }
}
