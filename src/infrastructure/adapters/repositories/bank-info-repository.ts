import { schema } from "../../db/client";
import { DBClient } from "../../db/types";
import { IBankInfoRepository } from "../../../domain/ports/repositories/bank-info-repository";
import { BankingInfo, NewBankingInfo } from "../../../domain/entities";
import { eq } from "drizzle-orm";

export class BankInfoRepository implements IBankInfoRepository{
  public constructor(private readonly db: DBClient) { }

  async create(bankingInfo: NewBankingInfo): Promise<BankingInfo> {
    return await this.db.insert(schema.bankingInfo).values(bankingInfo).returning().then((result) => result[0]);
  }

  async findByExternalId(externalId: string): Promise<BankingInfo | null> {
    return await this.db.select().from(schema.bankingInfo).where(eq(schema.bankingInfo.externalRequestId, externalId)).then((result) => result[0]);
  }

  async update(id: string, bankInfo: Partial<BankingInfo>): Promise<BankingInfo> {
    return await this.db.update(schema.bankingInfo).set(bankInfo).where(eq(schema.bankingInfo.id, id)).returning().then((result) => result[0]);
  }

  async findByCreditRequestId(creditRequestId: string): Promise<BankingInfo | null> {
    return await this.db.select().from(schema.bankingInfo).where(eq(schema.bankingInfo.creditRequestId, creditRequestId)).then((result) => result[0]);
  }

}
