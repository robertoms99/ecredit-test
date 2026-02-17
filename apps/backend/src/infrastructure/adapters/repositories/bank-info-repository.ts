import { schema } from "../../db/client";
import { DBClient } from "../../db/types";
import { IBankInfoRepository } from "../../../domain/ports/repositories/bank-info-repository";
import { BankingInfo, NewBankingInfo } from "../../../domain/entities";
import { eq } from "drizzle-orm";
import { AppError } from "../../../domain/errors/app-error";

export class BankInfoRepository implements IBankInfoRepository{
  public constructor(private readonly db: DBClient) { }

  async create(bankingInfo: NewBankingInfo): Promise<BankingInfo> {
    try {
      const result = await this.db.insert(schema.bankingInfo).values(bankingInfo).returning();
      if (!result[0]) {
        throw new AppError('DATABASE_ERROR', 'Failed to create banking info', { bankingInfo });
      }
      return result[0];
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === '23505') {
        throw new AppError('DATABASE_CONSTRAINT_VIOLATION', 'Banking info already exists', {
          constraint: error.constraint,
          detail: error.detail,
        });
      }

      if (error.code === '23503') {
        throw new AppError('DATABASE_CONSTRAINT_VIOLATION', 'Foreign key constraint violation', {
          constraint: error.constraint,
          detail: error.detail,
        });
      }

      throw new AppError('DATABASE_ERROR', 'Failed to create banking info', {
        error: error.message,
        code: error.code,
      });
    }
  }

  async findByExternalId(externalId: string): Promise<BankingInfo | null> {
    try {
      const result = await this.db.select().from(schema.bankingInfo).where(eq(schema.bankingInfo.externalRequestId, externalId));
      return result[0] || null;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to find banking info by external ID', {
        externalId,
        error: error.message,
      });
    }
  }

  async update(id: string, bankInfo: Partial<BankingInfo>): Promise<BankingInfo> {
    try {
      const result = await this.db.update(schema.bankingInfo).set(bankInfo).where(eq(schema.bankingInfo.id, id)).returning();
      if (!result[0]) {
        throw new AppError('NOT_FOUND', 'Banking info not found for update', { id });
      }
      return result[0];
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('DATABASE_ERROR', 'Failed to update banking info', {
        id,
        error: error.message,
        code: error.code,
      });
    }
  }

  async findByCreditRequestId(creditRequestId: string): Promise<BankingInfo | null> {
    try {
      const result = await this.db.select().from(schema.bankingInfo).where(eq(schema.bankingInfo.creditRequestId, creditRequestId));
      return result[0] || null;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to find banking info by credit request ID', {
        creditRequestId,
        error: error.message,
      });
    }
  }

}
