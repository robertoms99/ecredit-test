import type { IRequestStatusRepository } from '../../../../domain/ports/repositories/request-status-repository';
import type { RequestStatus } from '../../../../domain/entities/request-status';
import type { Cache } from '../../../cache/redis-cache';

export class CachedRequestStatusRepository implements IRequestStatusRepository {
  constructor(
    private readonly inner: IRequestStatusRepository,
    private readonly cache: Cache,
    private readonly ttlSeconds = 300, // 5 minutes
  ) {}

  async getStatusByCode(code: any): Promise<RequestStatus> {
    const key = `request_status:code:${code}`;
    const cached = await this.cache.get<RequestStatus>(key);
    if (cached) return cached;
    const status = await this.inner.getStatusByCode(code);
    await this.cache.set(key, status, this.ttlSeconds);
    return status;
  }

  async findByCode(code: string): Promise<RequestStatus | null> {
    const key = `request_status:findByCode:${code}`;
    const cached = await this.cache.get<RequestStatus>(key);
    if (cached) return cached;
    const status = await this.inner.findByCode(code);
    if (status) await this.cache.set(key, status, this.ttlSeconds);
    return status;
  }

  async findById(id: string): Promise<RequestStatus | null> {
    const key = `request_status:findById:${id}`;
    const cached = await this.cache.get<RequestStatus>(key);
    if (cached) return cached;
    const status = await this.inner.findById(id);
    if (status) await this.cache.set(key, status, this.ttlSeconds);
    return status;
  }

  async listAll(): Promise<RequestStatus[]> {
    const key = `request_status:listAll`;
    const cached = await this.cache.get<RequestStatus[]>(key);
    if (cached) return cached;
    const statuses = await this.inner.listAll();
    await this.cache.set(key, statuses, this.ttlSeconds);
    return statuses;
  }
}
