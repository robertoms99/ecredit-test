import { request } from "node:https";
import { ICreditRequestRepository } from "../ports/repositories/credit-request-repository";
import { IRequestStatusRepository } from "../ports/repositories/request-status-repository";
import { ICreateCreditRequestUseCase } from "../ports/use-cases/create-credit-request";
import { CreditRequest, NewCreditRequest } from "../entities/credit-request";
import { IValidator } from "../ports/validator";
import { RequestStatusCodes } from "../entities";
import { IJobManager } from "../ports/jobs";

export class CreateCreditRequestUseCase {
  private readonly initialRequestStatusCode: RequestStatusCodes = RequestStatusCodes.PENDING

    constructor(
      private readonly creditRequestRepository: ICreditRequestRepository,
      private readonly requestStatusRepository: IRequestStatusRepository,
      private readonly creditRequestValidator: IValidator<ICreateCreditRequestUseCase>,
      private readonly jobManager: IJobManager,
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

    await this.jobManager.emit("credit_request_status_change", {
      credit_request_id: createdCreditRequest.id,
      request_status_id: requestStatus.id,
      request_status_code: this.initialRequestStatusCode
    });

    return createdCreditRequest
    }
}
