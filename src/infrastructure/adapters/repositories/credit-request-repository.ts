import { eq, and, gte, lte, sql } from "drizzle-orm";
import { CreditRequest, NewCreditRequest } from "../../../domain/entities/credit-request"
import { ICreditRequestRepository, ListCreditRequestsFilters } from "../../../domain/ports/repositories/credit-request-repository"
import { schema } from "../../db/client";
import { DBClient } from "../../db/types";
import { AppError } from "../../../domain/errors/app-error";

export class CreditRequestRepository implements ICreditRequestRepository{
  public constructor(private readonly db: DBClient) { }

  async create(creditRequest: NewCreditRequest): Promise<CreditRequest> {
    try {
      const result = await this.db.insert(schema.creditRequests).values(creditRequest).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to create credit request', {
        error: error.message,
        code: error.code,
      });
    }
  }

  async findById(id: string): Promise<CreditRequest | null> {
      const result = await this.db
        .select({
          creditRequest: schema.creditRequests,
          statusId: schema.requestStatuses.id,
          statusName: schema.requestStatuses.name,
        })
        .from(schema.creditRequests)
        .leftJoin(schema.requestStatuses, eq(schema.creditRequests.statusId, schema.requestStatuses.id))
        .where(eq(schema.creditRequests.id, id));
      
      if (!result[0]) return null;

      return {
        ...result[0].creditRequest,
        status: result[0].statusId && result[0].statusName ? {
          id: result[0].statusId,
          name: result[0].statusName,
        } : null,
      } as any;
  }

  async update(id: string, request: Partial<CreditRequest>): Promise<CreditRequest> {
    try {
      const result = await this.db.update(schema.creditRequests).set(request).where(eq(schema.creditRequests.id, id)).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to update credit request', {
        id,
        error: error.message,
        code: error.code,
      });
    }
  }

  async list(filters: ListCreditRequestsFilters): Promise<CreditRequest[]> {
    try {
      const conditions = [];

      if (filters.country) {
        conditions.push(eq(schema.creditRequests.country, filters.country));
      }

      if (filters.status) {
        conditions.push(eq(schema.creditRequests.statusId, filters.status));
      }

      if (filters.from) {
        conditions.push(gte(schema.creditRequests.createdAt, new Date(filters.from)));
      }

      if (filters.to) {
        conditions.push(lte(schema.creditRequests.createdAt, new Date(filters.to)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await this.db
        .select({
          creditRequest: schema.creditRequests,
          statusId: schema.requestStatuses.id,
          statusName: schema.requestStatuses.name,
        })
        .from(schema.creditRequests)
        .leftJoin(schema.requestStatuses, eq(schema.creditRequests.statusId, schema.requestStatuses.id))
        .where(whereClause)
        .orderBy(sql`${schema.creditRequests.createdAt} DESC`)
        .limit(filters.limit ?? 50)
        .offset(filters.offset ?? 0);

      return results.map(r => ({
        ...r.creditRequest,
        status: r.statusId && r.statusName ? {
          id: r.statusId,
          name: r.statusName,
        } : null,
      })) as any;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to list credit requests', {
        filters,
        error: error.message,
        code: error.code,
      });
    }
  }

  async count(filters: Omit<ListCreditRequestsFilters, 'limit' | 'offset'>): Promise<number> {
    try {
      const conditions = [];

      if (filters.country) {
        conditions.push(eq(schema.creditRequests.country, filters.country));
      }

      if (filters.status) {
        conditions.push(eq(schema.creditRequests.statusId, filters.status));
      }

      if (filters.from) {
        conditions.push(gte(schema.creditRequests.createdAt, new Date(filters.from)));
      }

      if (filters.to) {
        conditions.push(lte(schema.creditRequests.createdAt, new Date(filters.to)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.creditRequests)
        .where(whereClause);

      return result[0]?.count ?? 0;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Failed to count credit requests', {
        filters,
        error: error.message,
        code: error.code,
      });
    }
  }
}
