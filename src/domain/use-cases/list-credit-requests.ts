import { ICreditRequestRepository, ListCreditRequestsFilters } from '../ports/repositories/credit-request-repository';
import { CreditRequest } from '../entities/credit-request';

export interface ListCreditRequestsResult {
  data: CreditRequest[];
  total: number;
  limit: number;
  offset: number;
}

export class ListCreditRequestsUseCase {
  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository
  ) {}

  async execute(filters: ListCreditRequestsFilters): Promise<ListCreditRequestsResult> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const [data, total] = await Promise.all([
      this.creditRequestRepository.list({ ...filters, limit, offset }),
      this.creditRequestRepository.count({
        country: filters.country,
        status: filters.status,
        from: filters.from,
        to: filters.to,
      }),
    ]);

    return {
      data,
      total,
      limit,
      offset,
    };
  }
}
