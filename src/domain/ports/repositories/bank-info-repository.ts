import { BankingInfo, CreditRequest, NewBankingInfo, NewCreditRequest } from "../../entities";

export interface IBankInfoRepository {
  create(bankInfo: NewBankingInfo): Promise<BankingInfo>;
  update(id: string, bankInfo: Partial<BankingInfo>): Promise<BankingInfo>;
  findByExternalId(externalId: string): Promise<BankingInfo | null>;
  findByCreditRequestId(creditRequestId: string): Promise<BankingInfo | null>;
}
