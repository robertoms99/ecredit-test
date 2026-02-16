import { RequestStatusCodes } from "../entities";
import { AppError } from "../errors";
import { IJobManager } from "../ports/jobs";
import { IBankInfoRepository } from "../ports/repositories/bank-info-repository";
import { ICreditRequestRepository } from "../ports/repositories/credit-request-repository";
import { IRequestStatusRepository } from "../ports/repositories/request-status-repository";
import { IExternalBankDataValidator } from "../ports/strategies/external-bank-data-validator";
import { IProcessExternalBankDataUseCaseInput } from "../ports/use-cases/process-external-bank-data";

export class ProcessExternalBankDataUseCase {

    constructor(
      private readonly creditRequestRepository: ICreditRequestRepository,
      private readonly requestStatusRepository: IRequestStatusRepository,
      private readonly bankInfoRepository: IBankInfoRepository,
      private readonly externalDataValidator: Omit<IExternalBankDataValidator,"supports">,
      private readonly jobManager: IJobManager,
    ) { }

  async execute(input: IProcessExternalBankDataUseCaseInput): Promise<void> {
    const bankInfoRecord = await this.bankInfoRepository.findByExternalId(input.externalRequestId)

    if (!bankInfoRecord) throw new AppError('NOT_FOUND', 'Bank info not found for such externalId')

    const creditRequest = await this.creditRequestRepository.findById(bankInfoRecord.creditRequestId)

    if (!creditRequest) throw new AppError('NOT_FOUND', 'Credit request not found for such externalId')

    await this.externalDataValidator.validate(creditRequest.country, input.payload)

    const requestStatus = await this.requestStatusRepository.getStatusByCode(RequestStatusCodes.EVALUATING)

    //pensar en transacciones
    // corregir la actualizacion por el payload,
    await this.bankInfoRepository.update(bankInfoRecord.id, {...bankInfoRecord, financialData: input.payload})
    await this.creditRequestRepository.update(creditRequest.id, { statusId: requestStatus.id })

    await this.jobManager.emit("credit_request_status_change", {
      credit_request_id: input.externalRequestId,
      request_status_code: RequestStatusCodes.EVALUATING,
      request_status_id: requestStatus.id
    })
  }
}
