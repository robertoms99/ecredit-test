import { CreditRequest, RequestStatusCodes } from "../entities";
import { IBankInfoRepository } from "../ports/repositories/bank-info-repository";
import { ICreditRequestRepository } from "../ports/repositories/credit-request-repository";
import { IRequestStatusRepository } from "../ports/repositories/request-status-repository";
import { BankDataProviderRegistry } from "../ports/strategies/bank-data-provider-registry";
import { IStatusTransitionStrategy } from "../ports/strategies/status-transition";

export class CreatedStatusWorkFlow implements IStatusTransitionStrategy {
  public constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly requestStatusRepository: IRequestStatusRepository,
    private readonly bankInfoRepository: IBankInfoRepository,
    private readonly bankDataProviderRegistry: BankDataProviderRegistry
  ) { }

  supports(country: string, requestStatus: RequestStatusCodes): boolean {
    return requestStatus === RequestStatusCodes.CREATED;
  }

  async execute(creditRequest: CreditRequest): Promise<void> {
    const bankDataProvider = this.bankDataProviderRegistry.get(creditRequest.country)

    const bankInfo = await bankDataProvider.fetchBankDataByDocumentId(creditRequest.documentId)

    const newRequestStatus = await this.requestStatusRepository.getStatusByCode(RequestStatusCodes.PENDING_FOR_BANK_DATA)

    //pensar en transacciones
    await this.bankInfoRepository.create({...bankInfo, creditRequestId: creditRequest.id})

    await this.creditRequestRepository.update(creditRequest.id, { statusId: newRequestStatus.id})
  }
}
