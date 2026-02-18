import type { ICreditRequestRepository, ListCreditRequestsFilters } from '../../../../domain/ports/repositories/credit-request-repository';
import type { CreditRequest } from '../../../../domain/entities/credit-request';
import type { Cache } from '../../../cache/redis-cache';

function makeKey(prefix: string, obj: Record<string, any>): string {
  return `${prefix}:${JSON.stringify(obj, Object.keys(obj).sort())}`;
}

export class CachedCreditRequestRepository implements ICreditRequestRepository {
  constructor(
    private readonly inner: ICreditRequestRepository,
    private readonly cache: Cache,
    private readonly ttlSeconds = 30,
  ) {}

  async create(request: any): Promise<CreditRequest> {
    const created = await this.inner.create(request);
    await this.invalidateForCreditRequest(created);
    return created;
  }

  async update(id: string, request: Partial<CreditRequest>): Promise<CreditRequest> {
    const updated = await this.inner.update(id, request);
    await this.invalidateForCreditRequest(updated);
    return updated;
  }

  async findById(id: string): Promise<CreditRequest | null> {
    return this.inner.findById(id);
  }

  async list(filters: ListCreditRequestsFilters): Promise<CreditRequest[]> {
    const key = makeKey('credit_requests:list', filters);
    const cached = await this.cache.get<CreditRequest[]>(key);
    if (cached) return cached;

    const data = await this.inner.list(filters);
    await this.cache.set(key, data, this.ttlSeconds);
    return data;
  }

  async count(filters: Omit<ListCreditRequestsFilters, 'limit' | 'offset'>): Promise<number> {
    const key = makeKey('credit_requests:count', filters as any);
    const cached = await this.cache.get<number>(key);
    if (cached !== null) return cached;

    const data = await this.inner.count(filters);
    await this.cache.set(key, data, this.ttlSeconds);
    return data;
  }

  private async invalidateForCreditRequest(request: CreditRequest) {
    const candidates: Array<Record<string, any>> = [
      { country: request.country },
      { status: request.statusId },
      { userId: request.userId },
      {},
    ];

    for (const f of candidates) {
      const listKey = makeKey('credit_requests:list', f);
      const countKey = makeKey('credit_requests:count', f);
      await this.cache.del(listKey);
      await this.cache.del(countKey);
    }
  }
}
