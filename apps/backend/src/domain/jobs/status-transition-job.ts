import type { ICreditRequestRepository } from '../ports/repositories/credit-request-repository';
import type { StatusTransitionRegistry } from '../strategies/transitions/status-transition.registry';
import type { IJob, JobOptions, JobTypeMapping } from '../ports/jobs';
import { AppError } from '../errors/app-error';

export type StatusTransitionJobPayload = JobTypeMapping['credit_request_status_change'];

export class StatusTransitionJob implements IJob<'credit_request_status_change'> {
  private readonly type = 'credit_request_status_change' as const;
  private readonly options = { retryLimit: 5, retryDelay: 5 };

  constructor(
    private readonly creditRequestRepository: ICreditRequestRepository,
    private readonly statusTransitionRegistry: StatusTransitionRegistry
  ) { }

  getType() {
    return this.type
  }

  getOptions() {
    return this.options
  }

  async work(payload: StatusTransitionJobPayload): Promise<void> {
    const { credit_request_id, request_status_id, request_status_code } = payload;
    try {
      const creditRequest = await this.creditRequestRepository.findById(credit_request_id);

      if (!creditRequest) {
        throw new AppError('NOT_FOUND', 'Credit request not found', {
          creditRequestId: credit_request_id,
        });
      }

      if (creditRequest.statusId !== request_status_id) {
        console.log(
          `Status mismatch for credit request ${credit_request_id}: expected ${request_status_id}, got ${creditRequest.statusId}. Skipping transition.`
        );
        return;
      }

      if (!this.statusTransitionRegistry.has(request_status_code)) {
        console.log(
          `No transition strategy for status ${request_status_code}, skipping job`
        );
        return;
      }

      const transitionStrategy = this.statusTransitionRegistry.get(request_status_code);
      await transitionStrategy.execute(creditRequest);

      console.log(
        `Successfully processed status transition for credit request ${credit_request_id} (${request_status_code})`
      );
    } catch (error) {
      console.error(
        `Error processing status transition for credit request ${credit_request_id}:`,
        error
      );
      throw error;
    }
  }
}
