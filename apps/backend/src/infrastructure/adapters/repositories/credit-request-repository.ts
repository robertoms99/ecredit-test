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
      const created = result[0];

      const completeRecord = await this.db
        .select({
          creditRequest: schema.creditRequests,
          statusId: schema.requestStatuses.id,
          statusName: schema.requestStatuses.name,
          statusCode: schema.requestStatuses.code,
        })
        .from(schema.creditRequests)
        .leftJoin(schema.requestStatuses, eq(schema.creditRequests.statusId, schema.requestStatuses.id))
        .where(eq(schema.creditRequests.id, created.id))
        .limit(1);

      if (!completeRecord[0]) {
        throw new AppError('DATABASE_ERROR', 'No se pudo obtener la solicitud de crédito creada', { id: created.id });
      }

      const record = completeRecord[0];

      return {
        ...record.creditRequest,
        // Ensure dates are Date objects (Drizzle should handle this)
        requestedAt: record.creditRequest.requestedAt instanceof Date
          ? record.creditRequest.requestedAt
          : new Date(record.creditRequest.requestedAt),
        createdAt: record.creditRequest.createdAt instanceof Date
          ? record.creditRequest.createdAt
          : new Date(record.creditRequest.createdAt),
        updatedAt: record.creditRequest.updatedAt instanceof Date
          ? record.creditRequest.updatedAt
          : new Date(record.creditRequest.updatedAt),
        status: record.statusId && record.statusName ? {
          id: record.statusId,
          name: record.statusName,
          code: record.statusCode,
        } : null,
      } as any;
    } catch (error: any) {
      throw new AppError('DATABASE_ERROR', 'Error al crear la solicitud de crédito', {
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
          statusCode: schema.requestStatuses.code,
        })
        .from(schema.creditRequests)
        .leftJoin(schema.requestStatuses, eq(schema.creditRequests.statusId, schema.requestStatuses.id))
        .where(eq(schema.creditRequests.id, id));

      if (!result[0]) return null;

      const record = result[0];

      return {
        ...record.creditRequest,
        requestedAt: record.creditRequest.requestedAt instanceof Date
          ? record.creditRequest.requestedAt
          : new Date(record.creditRequest.requestedAt),
        createdAt: record.creditRequest.createdAt instanceof Date
          ? record.creditRequest.createdAt
          : new Date(record.creditRequest.createdAt),
        updatedAt: record.creditRequest.updatedAt instanceof Date
          ? record.creditRequest.updatedAt
          : new Date(record.creditRequest.updatedAt),
        status: record.statusId && record.statusName ? {
          id: record.statusId,
          name: record.statusName,
          code: record.statusCode,
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
        conditions.push(gte(schema.creditRequests.requestedAt, new Date(filters.from)));
      }

      if (filters.to) {
        conditions.push(lte(schema.creditRequests.requestedAt, new Date(filters.to)));
      }

      if (filters.userId) {
        conditions.push(eq(schema.creditRequests.userId, filters.userId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await this.db
        .select({
          creditRequest: schema.creditRequests,
          statusId: schema.requestStatuses.id,
          statusName: schema.requestStatuses.name,
          statusCode: schema.requestStatuses.code,
        })
        .from(schema.creditRequests)
        .leftJoin(schema.requestStatuses, eq(schema.creditRequests.statusId, schema.requestStatuses.id))
        .where(whereClause)
        .orderBy(sql`${schema.creditRequests.createdAt} DESC`)
        .limit(filters.limit ?? 50)
        .offset(filters.offset ?? 0);

      return results.map(r => ({
        ...r.creditRequest,
        // Ensure dates are Date objects
        requestedAt: r.creditRequest.requestedAt instanceof Date
          ? r.creditRequest.requestedAt
          : new Date(r.creditRequest.requestedAt),
        createdAt: r.creditRequest.createdAt instanceof Date
          ? r.creditRequest.createdAt
          : new Date(r.creditRequest.createdAt),
        updatedAt: r.creditRequest.updatedAt instanceof Date
          ? r.creditRequest.updatedAt
          : new Date(r.creditRequest.updatedAt),
        status: r.statusId && r.statusName ? {
          id: r.statusId,
          name: r.statusName,
          code: r.statusCode,
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
        conditions.push(gte(schema.creditRequests.requestedAt, new Date(filters.from)));
      }

      if (filters.to) {
        conditions.push(lte(schema.creditRequests.requestedAt, new Date(filters.to)));
      }

      if (filters.userId) {
        conditions.push(eq(schema.creditRequests.userId, filters.userId));
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
