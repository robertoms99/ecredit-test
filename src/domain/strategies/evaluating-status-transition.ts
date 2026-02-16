import { CreditRequest, RequestStatusCodes } from "../entities";
import { AppError } from "../errors";
import { IBankInfoRepository } from "../ports/repositories/bank-info-repository";
import { ICreditRequestRepository } from "../ports/repositories/credit-request-repository";
import { IRequestStatusRepository } from "../ports/repositories/request-status-repository";
import { IStatusTransitionStrategy } from "../ports/strategies/status-transition";

export class EvaluatingStatusTransition implements IStatusTransitionStrategy {
  public constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly bankInfoRepository: IBankInfoRepository,
  ) { }

  supports(country: string, requestStatus: RequestStatusCodes): boolean {
    return requestStatus === RequestStatusCodes.EVALUATING;
  }

  async execute(creditRequest: CreditRequest): Promise<void> {
    const bankInfo = await this.bankInfoRepository.findByCreditRequestId(creditRequest.id)

    if (!bankInfo) {
      throw new AppError('VALIDATION_FAILED','Bank info not found to credit request');
    }

    const financialData = bankInfo.financialData as object


    const newRequestStatus = await this.requestStatusRepository.getStatusByCode(RequestStatusCodes.APPROVED)

    //pensar en transacciones
    await this.creditRequestRepository.update(creditRequest.id, { statusId: newRequestStatus.id})
  }
}
