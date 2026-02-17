import type { PgBoss, SendOptions, Job as PGBossJob } from 'pg-boss';
import type { CreditRequestRepository } from '../../infrastructure/adapters/repositories/credit-request-repository';
import type { StatusTransitionRegistry } from '../strategies/transitions/status-transition.registry';
import type { JobTypeMapping } from '../ports/jobs';
import { BaseJob } from './base-job';
import { RequestStatusCodes } from '../entities';
import { AppError } from '../errors/app-error';

export class StatusTransitionJob extends BaseJob<{
  credit_request_id: string;
  request_status_id: string;
  request_status_code: RequestStatusCodes;
}> {
  readonly type: keyof JobTypeMapping = 'credit_request_status_change';
  readonly options: SendOptions = {
    retryLimit: 5,
    retryDelay: 5,
  };

  constructor(
    boss: PgBoss,
    private readonly creditRequestRepository: CreditRequestRepository,
    private readonly statusTransitionRegistry: StatusTransitionRegistry
  ) {
    super(boss);
  }

  work = async (
    jobs: PGBossJob<{
      credit_request_id: string;
      request_status_id: string;
      request_status_code: RequestStatusCodes;
    }>[]
  ): Promise<void> => {
    for (const job of jobs) {
      let creditRequestId!:string;
      try {
        const { credit_request_id, request_status_id, request_status_code } = job.data;
        creditRequestId=credit_request_id
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
          continue;
        }

        if (!this.statusTransitionRegistry.has(request_status_code)) {
          console.log(
            `No transition strategy for status ${request_status_code}, skipping job`
          );
          continue;
        }

        const transitionStrategy = this.statusTransitionRegistry.get(request_status_code);
        await transitionStrategy.execute(creditRequest);

        console.log(
          `Successfully processed status transition for credit request ${credit_request_id} (${request_status_code})`
        );
      } catch (error) {
        console.error(`Error processing status transition for credit request ${creditRequestId}:`, error);
        throw error
      }
    }
  };
}
